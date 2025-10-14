const express = require('express');
const db = require('../db');
const { createVisitToken, verifyAndConsumeToken } = require('../utils/visitToken');
const { generatePublicId } = require('../utils/publicId');
const { roundCoins } = require('../utils/validation');
const { checkConsolationEligibility, issueConsolationReward, CONSOLATION_CONFIG } = require('../utils/consolationRewards');

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
      `SELECT id, public_id, title, url, coins_per_visit, watch_duration, total_clicks, clicks_served, created_at
       FROM campaigns
       WHERE user_id != ? AND is_paused = 0 AND clicks_served < total_clicks
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
      `SELECT id, user_id, is_paused, coins_per_visit, watch_duration, total_clicks, clicks_served
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

    // Check if campaign has reached total clicks limit
    if (campaign.clicks_served >= campaign.total_clicks) {
      return res.status(400).json({
        error: {
          code: 'CLICKS_LIMIT_REACHED',
          message: 'Campaign has reached its total clicks limit',
        },
      });
    }

    // Generate token
    const { token, expiresAt } = await createVisitToken(userId, campaignId);

    res.status(200).json({
      token,
      expires_at: expiresAt,
      coins_per_visit: campaign.coins_per_visit,
      watch_duration: campaign.watch_duration,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /earn/heartbeat
 * Receive engagement metrics during visit (non-critical, just logging)
 */
router.post('/heartbeat', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { token, activeTime, mouseMovements, verificationPassed } = req.body;

    // Optional: Store metrics in database for analytics
    // For now, just acknowledge receipt
    console.log(`[Heartbeat] User ${userId}: ${activeTime}s, ${mouseMovements} moves, verified: ${verificationPassed}`);

    res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /earn/claim
 * Claim visit reward with verification token and engagement metrics
 */
router.post('/claim', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const token = req.body.token;
    const activeTime = req.body.activeTime || 0;
    const mouseMovements = req.body.mouseMovements || 0;
    const verificationPassed = req.body.verificationPassed || false;
    const rewardTier = req.body.rewardTier; // 'passive' or 'active'

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
        `SELECT id, user_id, is_paused, coins_per_visit, watch_duration, total_clicks, clicks_served
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

      // Check if campaign has reached total clicks limit
      // Instead of failing immediately, we'll check for consolation eligibility
      const isExhausted = campaign.clicks_served >= campaign.total_clicks;
      let exhaustionReason = null;

      if (isExhausted) {
        exhaustionReason = CONSOLATION_CONFIG.REASON.EXHAUSTED_VISITS_CAP;
      }

      // ENFORCE WATCH DURATION REQUIREMENT
      // User must meet the campaign's required watch duration to earn coins
      const requiredDuration = campaign.watch_duration;
      if (activeTime < requiredDuration) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          error: {
            code: 'INSUFFICIENT_WATCH_TIME',
            message: `You must watch for at least ${requiredDuration} seconds. You only watched for ${activeTime} seconds.`,
          },
        });
      }

      // CHECK QUIZ COMPLETION REQUIREMENT
      // User must complete and pass the quiz to earn coins
      const [quizAttempts] = await connection.query(
        'SELECT passed, reward_amount FROM quiz_attempts WHERE visit_token = ?',
        [token]
      );

      if (quizAttempts.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          error: {
            code: 'QUIZ_NOT_COMPLETED',
            message: 'You must complete the quiz before claiming your reward.',
          },
        });
      }

      const quizResult = quizAttempts[0];

      if (!quizResult.passed) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          error: {
            code: 'QUIZ_NOT_PASSED',
            message: 'You must pass the quiz (minimum 3 correct answers) to earn coins.',
          },
        });
      }

      // === CAMPAIGN EXHAUSTION HANDLING WITH CONSOLATION ===

      // If campaign is exhausted, try to issue consolation reward
      if (isExhausted) {
        console.log('[Claim] Campaign exhausted, checking consolation eligibility...');

        // Check if user is eligible for consolation
        const eligibility = await checkConsolationEligibility(connection, userId, campaignId, token);

        if (eligibility.eligible) {
          // Issue platform-funded consolation reward
          const consolation = await issueConsolationReward(
            connection,
            userId,
            campaignId,
            token,
            exhaustionReason
          );

          console.log('[Claim] Consolation issued:', consolation);

          await connection.commit();
          connection.release();

          return res.status(200).json({
            success: true,
            is_consolation: true,
            coins_earned: consolation.amount,
            new_balance: consolation.newBalance,
            message: 'Campaign just filled up',
            description: `You completed the task, but the campaign reached its limit a moment ago. We've added a goodwill reward of ${consolation.amount} coin to your balance.`,
          });
        } else {
          // Not eligible for consolation - plain exhaustion
          console.log('[Claim] Not eligible for consolation:', eligibility.reason);

          await connection.rollback();
          connection.release();

          return res.status(400).json({
            error: {
              code: 'CAMPAIGN_EXHAUSTED',
              message: 'Campaign reached its limit. No reward available at this time.',
              reason: eligibility.reason,
            },
          });
        }
      }

      // === NORMAL REWARD FLOW (Campaign has capacity) ===

      // Calculate reward from quiz result
      // Use the reward_amount from quiz_attempts (already calculated with partial rewards)
      const coinsAwarded = roundCoins(quizResult.reward_amount);

      // Credit coins to visitor
      // Note: Campaign owner already paid upfront during campaign creation,
      // so we don't need to deduct from their balance here
      await connection.query(
        'UPDATE users SET coins = coins + ? WHERE id = ?',
        [coinsAwarded, userId]
      );

      // Increment clicks_served counter for the campaign
      await connection.query(
        'UPDATE campaigns SET clicks_served = clicks_served + 1 WHERE id = ?',
        [campaignId]
      );

      // Record visit with actual coins awarded and visit_token for quiz tracking
      const today = new Date().toISOString().slice(0, 10);
      const [visitResult] = await connection.query(
        `INSERT INTO visits (user_id, campaign_id, campaign_owner_id, coins_earned, is_consolation, visit_date, visit_token)
         VALUES (?, ?, ?, ?, 0, ?, ?)`,
        [userId, campaignId, campaign.user_id, coinsAwarded, today, token]
      );

      // Generate and set public_id for visit
      const visitId = visitResult.insertId;
      const visitPublicId = generatePublicId('VIS', visitId);
      await connection.query('UPDATE visits SET public_id = ? WHERE id = ?', [visitPublicId, visitId]);

      // Get updated user coins
      const [users] = await connection.query(
        'SELECT coins FROM users WHERE id = ?',
        [userId]
      );

      await connection.commit();
      connection.release();

      res.status(200).json({
        success: true,
        is_consolation: false,
        coins_earned: coinsAwarded,
        new_balance: users[0].coins,
        watch_duration_required: requiredDuration,
        active_time_recorded: activeTime,
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
