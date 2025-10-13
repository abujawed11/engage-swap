const express = require('express');
const db = require('../db');
const { createVisitToken, verifyAndConsumeToken } = require('../utils/visitToken');
const { generatePublicId } = require('../utils/publicId');

const router = express.Router();

/**
 * GET /earn/queue
 * Get eligible campaigns for the authenticated user to visit
 * Returns campaigns that:
 * - Are not owned by the user
 * - Are not paused
 * - Limited to 10 items
 * - Ordered by created_at DESC (will add fair rotation later)
 */
router.get('/queue', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [campaigns] = await db.query(
      `SELECT id, public_id, title, url, coins_per_visit, daily_cap, created_at
       FROM campaigns
       WHERE user_id != ? AND is_paused = 0
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId]
    );

    res.status(200).json({ campaigns });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /earn/start
 * Start a visit - generate verification token
 */
router.post('/start', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const campaignId = parseInt(req.body.campaign_id, 10);

    if (!campaignId || campaignId < 1) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Valid campaign_id is required',
        },
      });
    }

    // Fetch campaign
    const [campaigns] = await db.query(
      `SELECT id, user_id, is_paused, coins_per_visit, daily_cap
       FROM campaigns
       WHERE id = ?
       LIMIT 1`,
      [campaignId]
    );

    if (campaigns.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Campaign not found',
        },
      });
    }

    const campaign = campaigns[0];

    // Cannot visit own campaign
    if (campaign.user_id === userId) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ACTION',
          message: 'Cannot visit your own campaign',
        },
      });
    }

    // Check if paused
    if (campaign.is_paused) {
      return res.status(400).json({
        error: {
          code: 'CAMPAIGN_PAUSED',
          message: 'Campaign is paused',
        },
      });
    }

    // Check daily cap
    const today = new Date().toISOString().slice(0, 10);
    const [visits] = await db.query(
      `SELECT COUNT(*) as count
       FROM visits
       WHERE campaign_id = ? AND visit_date = ?`,
      [campaignId, today]
    );

    const visitsToday = visits[0].count;
    if (visitsToday >= campaign.daily_cap) {
      return res.status(400).json({
        error: {
          code: 'DAILY_CAP_REACHED',
          message: 'Campaign has reached its daily cap',
        },
      });
    }

    // Generate token
    const { token, expiresAt } = await createVisitToken(userId, campaignId);

    res.status(200).json({
      token,
      expires_at: expiresAt,
      coins_per_visit: campaign.coins_per_visit,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /earn/claim
 * Claim visit reward with verification token
 */
router.post('/claim', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const token = req.body.token;

    if (!token || typeof token !== 'string') {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Token is required',
        },
      });
    }

    // Verify token
    const verification = await verifyAndConsumeToken(token, userId);

    if (!verification.valid) {
      return res.status(400).json({
        error: {
          code: 'INVALID_TOKEN',
          message: verification.error,
        },
      });
    }

    const campaignId = verification.campaignId;

    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Re-fetch campaign with FOR UPDATE lock
      const [campaigns] = await connection.query(
        `SELECT id, user_id, is_paused, coins_per_visit, daily_cap
         FROM campaigns
         WHERE id = ?
         FOR UPDATE`,
        [campaignId]
      );

      if (campaigns.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Campaign not found',
          },
        });
      }

      const campaign = campaigns[0];

      // Double-check ownership (shouldn't happen, but safety check)
      if (campaign.user_id === userId) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          error: {
            code: 'INVALID_ACTION',
            message: 'Cannot earn from your own campaign',
          },
        });
      }

      // Check if paused
      if (campaign.is_paused) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          error: {
            code: 'CAMPAIGN_PAUSED',
            message: 'Campaign is now paused',
          },
        });
      }

      // Check daily cap again
      const today = new Date().toISOString().slice(0, 10);
      const [visits] = await connection.query(
        `SELECT COUNT(*) as count
         FROM visits
         WHERE campaign_id = ? AND visit_date = ?`,
        [campaignId, today]
      );

      const visitsToday = visits[0].count;
      if (visitsToday >= campaign.daily_cap) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          error: {
            code: 'DAILY_CAP_REACHED',
            message: 'Campaign daily cap reached',
          },
        });
      }

      // Credit coins to user
      await connection.query(
        'UPDATE users SET coins = coins + ? WHERE id = ?',
        [campaign.coins_per_visit, userId]
      );

      // Record visit
      const [visitResult] = await connection.query(
        `INSERT INTO visits (user_id, campaign_id, campaign_owner_id, coins_earned, visit_date)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, campaignId, campaign.user_id, campaign.coins_per_visit, today]
      );

      // Generate and set public_id for visit
      const visitId = visitResult.insertId;
      const visitPublicId = generatePublicId('VIS', visitId);
      await connection.query('UPDATE visits SET public_id = ? WHERE id = ?', [visitPublicId, visitId]);

      // Deduct coins from campaign owner
      await connection.query(
        'UPDATE users SET coins = coins - ? WHERE id = ?',
        [campaign.coins_per_visit, campaign.user_id]
      );

      // Get updated user coins
      const [users] = await connection.query(
        'SELECT coins FROM users WHERE id = ?',
        [userId]
      );

      await connection.commit();
      connection.release();

      res.status(200).json({
        success: true,
        coins_earned: campaign.coins_per_visit,
        new_balance: users[0].coins,
      });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
