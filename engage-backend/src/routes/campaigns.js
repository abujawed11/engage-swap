const express = require('express');
const db = require('../db');
const {
  sanitizeInput,
  validateUrl,
  validateCampaignTitle,
  validateCoinsPerVisit,
  validateDailyCap,
  validateWatchDuration,
  calculateTotalCampaignCost,
  roundCoins,
} = require('../utils/validation');
const { generatePublicId } = require('../utils/publicId');
const { validateCampaignQuestions } = require('../utils/questionValidation');

const router = express.Router();

/**
 * GET /campaigns
 * List all campaigns owned by authenticated user
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [campaigns] = await db.query(
      `SELECT id, public_id, title, url, coins_per_visit, watch_duration, total_clicks, clicks_served, is_paused, created_at
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
    const baseCoinsPerVisit = req.body.coins_per_visit;
    const watchDuration = req.body.watch_duration !== undefined ? req.body.watch_duration : 30; // Default to 30s
    const totalClicks = req.body.total_clicks;
    const questions = req.body.questions; // Array of 5 questions

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

    // Validate base coins per visit
    const coinsError = validateCoinsPerVisit(baseCoinsPerVisit);
    if (coinsError) {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: coinsError },
      });
    }

    // Validate watch duration
    const durationError = validateWatchDuration(watchDuration);
    if (durationError) {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: durationError },
      });
    }

    // Validate total clicks (reuse validateDailyCap function but rename conceptually)
    const capError = validateDailyCap(totalClicks);
    if (capError) {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: capError.replace('Daily cap', 'Total clicks') },
      });
    }

    // Validate questions (must be exactly 5 with valid configurations)
    const questionsError = validateCampaignQuestions(questions);
    if (questionsError) {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: questionsError },
      });
    }

    // Calculate total campaign cost using duration-based pricing
    // Total cost = (baseCoins × totalClicks) + (5 × steps), where steps = (duration - 30) / 15
    // The extra 5 coins per step is for the ENTIRE campaign, not per visit
    const totalCoinsNeeded = roundCoins(calculateTotalCampaignCost(baseCoinsPerVisit, watchDuration, totalClicks));

    // Start transaction to check balance and deduct coins atomically
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Check if user has enough coins (with row lock)
      const [users] = await connection.query(
        'SELECT coins FROM users WHERE id = ? FOR UPDATE',
        [userId]
      );

      if (users.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({
          error: { code: 'USER_NOT_FOUND', message: 'User not found' },
        });
      }

      const userCoins = users[0].coins;
      if (userCoins < totalCoinsNeeded) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          error: {
            code: 'INSUFFICIENT_COINS',
            message: `You need ${totalCoinsNeeded.toFixed(1)} coins to create this campaign. You have ${userCoins} coins.`,
          },
        });
      }

      // Deduct coins from user upfront
      await connection.query(
        'UPDATE users SET coins = coins - ? WHERE id = ?',
        [totalCoinsNeeded, userId]
      );

      // Insert campaign
      // Store the BASE coins_per_visit (not the total cost)
      // The total cost is calculated on-the-fly using base + duration pricing
      const [result] = await connection.query(
        `INSERT INTO campaigns (user_id, title, url, coins_per_visit, watch_duration, total_clicks)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, title, url, baseCoinsPerVisit, watchDuration, totalClicks]
      );

      const campaignId = result.insertId;

      // Generate and set public_id
      const publicId = generatePublicId('CMP', campaignId);
      await connection.query('UPDATE campaigns SET public_id = ? WHERE id = ?', [publicId, campaignId]);

      // Insert campaign questions
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await connection.query(
          `INSERT INTO campaign_questions (campaign_id, question_id, question_order, input_type, config)
           VALUES (?, ?, ?, ?, ?)`,
          [campaignId, q.question_id, i + 1, q.input_type, JSON.stringify(q.config)]
        );
      }

      // Fetch created campaign
      const [campaigns] = await connection.query(
        `SELECT id, public_id, title, url, coins_per_visit, watch_duration, total_clicks, clicks_served, is_paused, created_at
         FROM campaigns
         WHERE id = ?`,
        [campaignId]
      );

      // Commit transaction
      await connection.commit();
      connection.release();

      res.status(201).json({ campaign: campaigns[0] });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
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

    // Watch duration
    if (req.body.watch_duration !== undefined) {
      const durationError = validateWatchDuration(req.body.watch_duration);
      if (durationError) {
        return res.status(422).json({
          error: { code: 'VALIDATION_ERROR', message: durationError },
        });
      }
      // Note: Changing watch_duration on live campaigns affects cost dynamics
      // Frontend should warn user with confirmation dialog
      updates.push('watch_duration = ?');
      values.push(req.body.watch_duration);
    }

    // Total clicks (note: updating this won't adjust user balance - for simplicity we'll skip this field in updates)
    // Users should delete and recreate if they want different total_clicks

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
      `SELECT id, public_id, title, url, coins_per_visit, watch_duration, total_clicks, clicks_served, is_paused, created_at
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
 * Refunds unused coins to the user
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

    // Start transaction to calculate refund and delete atomically
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Fetch campaign details with lock
      const [campaigns] = await connection.query(
        `SELECT id, user_id, coins_per_visit, watch_duration, total_clicks, clicks_served
         FROM campaigns
         WHERE id = ? AND user_id = ?
         FOR UPDATE`,
        [campaignId, userId]
      );

      if (campaigns.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Campaign not found' },
        });
      }

      const campaign = campaigns[0];

      // Calculate refund based on clicks_served
      // Total paid = (baseCoins × totalClicks) + (5 × steps)
      // Coins used = baseCoins × clicks_served  (the extra duration fee is upfront, not per-visit)
      const totalPaid = roundCoins(calculateTotalCampaignCost(campaign.coins_per_visit, campaign.watch_duration, campaign.total_clicks));
      const coinsUsed = roundCoins(campaign.clicks_served * campaign.coins_per_visit);
      const refundAmount = roundCoins(totalPaid - coinsUsed);

      // Refund unused coins to user
      if (refundAmount > 0) {
        await connection.query(
          'UPDATE users SET coins = coins + ? WHERE id = ?',
          [refundAmount, userId]
        );
      }

      // Delete campaign (will cascade delete visits due to FK)
      await connection.query(
        'DELETE FROM campaigns WHERE id = ?',
        [campaignId]
      );

      await connection.commit();
      connection.release();

      res.status(200).json({
        ok: true,
        refunded: refundAmount
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
