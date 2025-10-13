const express = require('express');
const db = require('../db');
const {
  sanitizeInput,
  validateUrl,
  validateCampaignTitle,
  validateCoinsPerVisit,
  validateDailyCap,
} = require('../utils/validation');
const { generatePublicId } = require('../utils/publicId');

const router = express.Router();

/**
 * GET /campaigns
 * List all campaigns owned by authenticated user
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [campaigns] = await db.query(
      `SELECT id, public_id, title, url, coins_per_visit, daily_cap, is_paused, created_at
       FROM campaigns
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    res.status(200).json({ campaigns });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /campaigns
 * Create a new campaign for authenticated user
 */
router.post('/', async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Sanitize inputs
    const title = sanitizeInput(req.body.title, 120);
    const url = sanitizeInput(req.body.url, 512);
    const coinsPerVisit = req.body.coins_per_visit;
    const dailyCap = req.body.daily_cap;

    // Validate title
    const titleError = validateCampaignTitle(title);
    if (titleError) {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: titleError },
      });
    }

    // Validate URL
    const urlError = validateUrl(url);
    if (urlError) {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: urlError },
      });
    }

    // Validate coins per visit
    const coinsError = validateCoinsPerVisit(coinsPerVisit);
    if (coinsError) {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: coinsError },
      });
    }

    // Validate daily cap
    const capError = validateDailyCap(dailyCap);
    if (capError) {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: capError },
      });
    }

    // Check if user has enough coins to afford at least one visit
    const [users] = await db.query(
      'SELECT coins FROM users WHERE id = ? LIMIT 1',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      });
    }

    const userCoins = users[0].coins;
    if (userCoins < coinsPerVisit) {
      return res.status(400).json({
        error: {
          code: 'INSUFFICIENT_COINS',
          message: `You need at least ${coinsPerVisit} coins to create this campaign. You have ${userCoins} coins.`,
        },
      });
    }

    // Insert campaign
    const [result] = await db.query(
      `INSERT INTO campaigns (user_id, title, url, coins_per_visit, daily_cap)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, title, url, coinsPerVisit, dailyCap]
    );

    const campaignId = result.insertId;

    // Generate and set public_id
    const publicId = generatePublicId('CMP', campaignId);
    await db.query('UPDATE campaigns SET public_id = ? WHERE id = ?', [publicId, campaignId]);

    // Fetch created campaign
    const [campaigns] = await db.query(
      `SELECT id, public_id, title, url, coins_per_visit, daily_cap, is_paused, created_at
       FROM campaigns
       WHERE id = ?`,
      [campaignId]
    );

    res.status(201).json({ campaign: campaigns[0] });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /campaigns/:id
 * Update campaign (only if owned by authenticated user)
 */
router.patch('/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const campaignId = parseInt(req.params.id, 10);

    if (!campaignId || campaignId < 1) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Campaign not found' },
      });
    }

    // Check ownership
    const [existing] = await db.query(
      'SELECT id FROM campaigns WHERE id = ? AND user_id = ? LIMIT 1',
      [campaignId, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Campaign not found' },
      });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    // Title
    if (req.body.title !== undefined) {
      const title = sanitizeInput(req.body.title, 120);
      const titleError = validateCampaignTitle(title);
      if (titleError) {
        return res.status(422).json({
          error: { code: 'VALIDATION_ERROR', message: titleError },
        });
      }
      updates.push('title = ?');
      values.push(title);
    }

    // URL
    if (req.body.url !== undefined) {
      const url = sanitizeInput(req.body.url, 512);
      const urlError = validateUrl(url);
      if (urlError) {
        return res.status(422).json({
          error: { code: 'VALIDATION_ERROR', message: urlError },
        });
      }
      updates.push('url = ?');
      values.push(url);
    }

    // Coins per visit
    if (req.body.coins_per_visit !== undefined) {
      const coinsError = validateCoinsPerVisit(req.body.coins_per_visit);
      if (coinsError) {
        return res.status(422).json({
          error: { code: 'VALIDATION_ERROR', message: coinsError },
        });
      }
      updates.push('coins_per_visit = ?');
      values.push(req.body.coins_per_visit);
    }

    // Daily cap
    if (req.body.daily_cap !== undefined) {
      const capError = validateDailyCap(req.body.daily_cap);
      if (capError) {
        return res.status(422).json({
          error: { code: 'VALIDATION_ERROR', message: capError },
        });
      }
      updates.push('daily_cap = ?');
      values.push(req.body.daily_cap);
    }

    // Is paused
    if (req.body.is_paused !== undefined) {
      const isPaused = req.body.is_paused ? 1 : 0;
      updates.push('is_paused = ?');
      values.push(isPaused);
    }

    // Nothing to update
    if (updates.length === 0) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'No valid fields to update',
        },
      });
    }

    // Execute update
    values.push(campaignId);
    await db.query(
      `UPDATE campaigns SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Fetch updated campaign
    const [campaigns] = await db.query(
      `SELECT id, public_id, title, url, coins_per_visit, daily_cap, is_paused, created_at
       FROM campaigns
       WHERE id = ?`,
      [campaignId]
    );

    res.status(200).json({ campaign: campaigns[0] });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /campaigns/:id
 * Delete campaign (only if owned by authenticated user)
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const campaignId = parseInt(req.params.id, 10);

    if (!campaignId || campaignId < 1) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Campaign not found' },
      });
    }

    // Delete (will only delete if owned by user)
    const [result] = await db.query(
      'DELETE FROM campaigns WHERE id = ? AND user_id = ?',
      [campaignId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Campaign not found' },
      });
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
