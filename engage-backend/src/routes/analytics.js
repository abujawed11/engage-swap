const express = require('express');
const {
  getEnforcementStatistics,
  getCampaignAnalytics,
  getUserAnalytics,
  getSystemHealthMetrics,
  getCampaignExposureBalance,
} = require('../utils/analytics');
const {
  getCampaignTotals,
  getCampaignDailySeries,
  getDeviceSplit,
  getCampaignInfo,
  checkCampaignOwnership,
  validateDateRange,
  getUserCampaignsSummary,
} = require('../services/campaignAnalytics');
const { getCurrentDateIST } = require('../utils/timezone');
const authRequired = require('../middleware/authRequired');

const router = express.Router();

/**
 * GET /analytics/enforcement
 * Get enforcement statistics for a date range
 * Query params: start_date, end_date (optional)
 */
router.get('/enforcement', async (req, res, next) => {
  try {
    const startDate = req.query.start_date ? new Date(req.query.start_date) : null;
    const endDate = req.query.end_date ? new Date(req.query.end_date) : null;

    const stats = await getEnforcementStatistics(startDate, endDate);

    res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /analytics/campaign/:id
 * Get analytics for a specific campaign
 */
router.get('/campaign/:id', async (req, res, next) => {
  try {
    const campaignId = parseInt(req.params.id, 10);

    if (!campaignId || campaignId < 1) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Invalid campaign ID',
        },
      });
    }

    const analytics = await getCampaignAnalytics(campaignId);

    res.status(200).json(analytics);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /analytics/user/:id
 * Get analytics for a specific user
 * Query params: limit (optional, default: 20)
 */
router.get('/user/:id', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const limit = parseInt(req.query.limit, 10) || 20;

    if (!userId || userId < 1) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Invalid user ID',
        },
      });
    }

    const analytics = await getUserAnalytics(userId, limit);

    res.status(200).json(analytics);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /analytics/health
 * Get system health metrics
 */
router.get('/health', async (req, res, next) => {
  try {
    const health = await getSystemHealthMetrics();

    res.status(200).json(health);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /analytics/exposure
 * Get campaign exposure balance report
 */
router.get('/exposure', async (req, res, next) => {
  try {
    const exposure = await getCampaignExposureBalance();

    res.status(200).json({ campaigns: exposure });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /analytics/me
 * Get analytics for the authenticated user
 */
router.get('/me', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit, 10) || 20;

    const analytics = await getUserAnalytics(userId, limit);

    res.status(200).json(analytics);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /analytics/my-earnings
 * Get earnings analytics for the authenticated user
 * Shows visit history, earnings summary, etc.
 */
router.get('/my-earnings', authRequired, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit, 10) || 50;

    const db = require('../db');

    // Get summary stats (count ALL quiz attempts, not just visits)
    const [summaryRows] = await db.query(
      `SELECT
        COUNT(DISTINCT qa.id) as total_visits,
        COUNT(DISTINCT CASE WHEN qa.passed = 1 THEN qa.id END) as successful_visits,
        COALESCE(SUM(CASE WHEN qa.passed = 1 THEN qa.reward_amount ELSE 0 END), 0) +
        COALESCE((SELECT SUM(amount) FROM consolation_rewards WHERE user_id = ?), 0) as total_earned
       FROM quiz_attempts qa
       WHERE qa.user_id = ?`,
      [userId, userId]
    );

    const summary = summaryRows[0] || {};
    const totalVisits = parseInt(summary.total_visits) || 0;
    const successfulVisits = parseInt(summary.successful_visits) || 0;
    const totalEarned = parseFloat(summary.total_earned) || 0;

    // Get recent visit history (including failed attempts and consolation rewards)
    // Use UNION to combine quiz attempts AND standalone consolation rewards (when quiz wasn't submitted)
    const [recentVisits] = await db.query(
      `(
        SELECT
          qa.id as quiz_attempt_id,
          v.id as visit_id,
          CAST(qa.visit_token AS CHAR(255)) COLLATE utf8mb4_unicode_ci as visit_token,
          COALESCE(v.visited_at, cr.created_at, qa.submitted_at) as visited_at,
          COALESCE(v.coins_earned, cr.amount, 0) as coins_earned,
          CASE WHEN cr.id IS NOT NULL OR v.is_consolation = 1 THEN 1 ELSE 0 END as is_consolation,
          COALESCE(v.campaign_id, cr.campaign_id, qa.campaign_id) as campaign_id,
          CAST(c.title AS CHAR(255)) COLLATE utf8mb4_unicode_ci as campaign_title,
          CAST(c.url AS CHAR(500)) COLLATE utf8mb4_unicode_ci as campaign_url,
          qa.passed as quiz_passed,
          qa.correct_count,
          qa.total_count,
          qa.reward_amount,
          CASE
            WHEN cr.id IS NOT NULL OR v.is_consolation = 1 THEN TRUE
            WHEN qa.passed = 1 THEN TRUE
            ELSE FALSE
          END as is_rewarded,
          CASE
            WHEN cr.id IS NOT NULL OR v.is_consolation = 1 THEN TRUE
            WHEN qa.passed = 1 THEN TRUE
            ELSE FALSE
          END as is_completed,
          CASE
            WHEN cr.id IS NOT NULL OR v.is_consolation = 1 THEN 'bonus'
            WHEN qa.passed = 1 THEN 'quiz'
            ELSE 'not_eligible'
          END as reward_type,
          CASE
            WHEN qa.total_count > 0 THEN ROUND((qa.correct_count / qa.total_count) * 100, 1)
            ELSE NULL
          END as quiz_score
        FROM quiz_attempts qa
        LEFT JOIN visits v ON qa.visit_token = v.visit_token COLLATE utf8mb4_unicode_ci
        LEFT JOIN consolation_rewards cr ON qa.visit_token = cr.visit_token COLLATE utf8mb4_unicode_ci
        LEFT JOIN campaigns c ON COALESCE(v.campaign_id, cr.campaign_id, qa.campaign_id) = c.id
        WHERE qa.user_id = ?
      )
      UNION
      (
        SELECT
          NULL as quiz_attempt_id,
          NULL as visit_id,
          CAST(cr.visit_token AS CHAR(255)) COLLATE utf8mb4_unicode_ci as visit_token,
          cr.created_at as visited_at,
          cr.amount as coins_earned,
          1 as is_consolation,
          cr.campaign_id as campaign_id,
          CAST(c.title AS CHAR(255)) COLLATE utf8mb4_unicode_ci as campaign_title,
          CAST(c.url AS CHAR(500)) COLLATE utf8mb4_unicode_ci as campaign_url,
          NULL as quiz_passed,
          NULL as correct_count,
          NULL as total_count,
          NULL as reward_amount,
          TRUE as is_rewarded,
          TRUE as is_completed,
          'bonus' as reward_type,
          NULL as quiz_score
        FROM consolation_rewards cr
        LEFT JOIN campaigns c ON cr.campaign_id = c.id
        WHERE cr.user_id = ?
          AND NOT EXISTS (
            SELECT 1 FROM quiz_attempts qa
            WHERE qa.visit_token = cr.visit_token COLLATE utf8mb4_unicode_ci
          )
      )
      ORDER BY visited_at DESC
      LIMIT ?`,
      [userId, userId, limit]
    );

    res.status(200).json({
      summary: {
        total_visits: totalVisits,
        successful_visits: successfulVisits,
        total_earned: totalEarned,
        avg_per_visit: successfulVisits > 0 ? totalEarned / successfulVisits : 0,
      },
      recent_visits: recentVisits.map(row => ({
        id: row.quiz_attempt_id ? `qa_${row.quiz_attempt_id}` : `cr_${row.visit_token}`, // Unique identifier
        quiz_attempt_id: row.quiz_attempt_id,
        visit_id: row.visit_id,
        visit_token: row.visit_token,
        visited_at: row.visited_at,
        campaign_id: row.campaign_id,
        campaign_title: row.campaign_title,
        campaign_url: row.campaign_url,
        coins_earned: parseFloat(row.coins_earned) || 0,
        is_rewarded: Boolean(row.is_rewarded),
        is_completed: Boolean(row.is_completed),
        reward_type: row.reward_type,
        quiz_score: row.quiz_score ? parseFloat(row.quiz_score) : null,
        quiz_passed: Boolean(row.quiz_passed),
      })),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /analytics/my-campaigns
 * Get summary analytics for all campaigns owned by the authenticated user
 * Query params: days (7, 14, or 30, default: 7)
 * Access: Authenticated users only
 */
router.get('/my-campaigns', authRequired, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const days = parseInt(req.query.days, 10) || 7;

    // Validate days parameter
    if (![7, 14, 30].includes(days)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_DAYS',
          message: 'Days parameter must be 7, 14, or 30',
        },
      });
    }

    // Calculate date range in IST using MySQL's timezone (consistent with visits table)
    const db = require('../db');
    const [[{ current_date_ist }]] = await db.query(
      `SELECT DATE_FORMAT(CONVERT_TZ(NOW(), '+00:00', '+05:30'), '%Y-%m-%d') as current_date_ist`
    );

    // This will now be a string in YYYY-MM-DD format
    const toDateIST = current_date_ist;

    // Calculate from date by subtracting days (staying in IST)
    const [year, month, day] = toDateIST.split('-').map(Number);
    const toDate = new Date(year, month - 1, day);
    toDate.setDate(toDate.getDate() - (days - 1));
    const fromDateIST = toDate.toISOString().split('T')[0];

    console.log('[Analytics] My Campaigns Request:', {
      userId,
      days,
      current_date_ist,
      toDateIST,
      fromDateIST,
      dateCalculation: { year, month, day }
    });

    // Get summary analytics
    const data = await getUserCampaignsSummary(userId, fromDateIST, toDateIST);

    console.log('[Analytics] Summary Data:', {
      summary: data.summary,
      campaignCount: data.campaigns.length,
      campaigns: data.campaigns.map(c => ({
        id: c.id,
        title: c.title,
        visits: c.visits,
        completions: c.completions
      }))
    });

    res.status(200).json({
      date_range: {
        from: fromDateIST,
        to: toDateIST,
        days: days,
        timezone: 'Asia/Kolkata (IST)',
      },
      ...data,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /analytics/campaigns/:campaignId
 * Get detailed analytics for a specific campaign
 * Query params: from (YYYY-MM-DD), to (YYYY-MM-DD)
 * Defaults to last 7 days in IST timezone
 * Access: Campaign owner or admin only
 */
router.get('/campaigns/:campaignId', authRequired, async (req, res, next) => {
  try {
    const campaignId = parseInt(req.params.campaignId, 10);
    const userId = req.user.id;
    const isAdmin = req.user.is_admin;

    if (!campaignId || campaignId < 1) {
      return res.status(400).json({
        error: {
          code: 'INVALID_CAMPAIGN_ID',
          message: 'Invalid campaign ID',
        },
      });
    }

    // Check campaign ownership (unless admin)
    if (!isAdmin) {
      const isOwner = await checkCampaignOwnership(campaignId, userId);
      if (!isOwner) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have access to this campaign analytics',
          },
        });
      }
    }

    // Get campaign info
    const campaignInfo = await getCampaignInfo(campaignId);

    // Parse date range (default to last 7 days in IST)
    const currentDateIST = getCurrentDateIST();
    const toDateIST = req.query.to || currentDateIST;

    let fromDateIST;
    if (req.query.from) {
      fromDateIST = req.query.from;
    } else {
      // Default: 7 days ago from toDateIST
      const toDate = new Date(toDateIST + 'T00:00:00');
      toDate.setDate(toDate.getDate() - 6); // 7 days including today
      fromDateIST = toDate.toISOString().split('T')[0];
    }

    // Validate date range
    try {
      validateDateRange(fromDateIST, toDateIST);
    } catch (validationError) {
      return res.status(400).json({
        error: {
          code: 'INVALID_DATE_RANGE',
          message: validationError.message,
        },
      });
    }

    // Fetch all analytics data in parallel
    const [totals, dailySeries, deviceSplit] = await Promise.all([
      getCampaignTotals(campaignId, fromDateIST, toDateIST),
      getCampaignDailySeries(campaignId, fromDateIST, toDateIST),
      getDeviceSplit(campaignId, fromDateIST, toDateIST),
    ]);

    res.status(200).json({
      campaign: {
        id: campaignInfo.id,
        title: campaignInfo.title,
        owner_id: campaignInfo.owner_id,
        coins_per_visit: parseFloat(campaignInfo.coins_per_visit),
        total_clicks: parseInt(campaignInfo.total_clicks),
        clicks_served: parseInt(campaignInfo.clicks_served),
        clicks_remaining: parseInt(campaignInfo.clicks_remaining),
        is_paused: Boolean(campaignInfo.is_paused),
        is_finished: Boolean(campaignInfo.is_finished),
        created_at: campaignInfo.created_at,
      },
      date_range: {
        from: fromDateIST,
        to: toDateIST,
        timezone: 'Asia/Kolkata (IST)',
      },
      totals: {
        total_visits: totals.total_visits,
        completed_visits: totals.completed_visits,
        completion_rate: parseFloat(totals.completion_rate.toFixed(2)),
        avg_watch_time_sec: parseFloat(totals.avg_watch_time_sec.toFixed(2)),
        avg_quiz_accuracy: parseFloat(totals.avg_quiz_accuracy.toFixed(2)),
        coins_spent: parseFloat(totals.coins_spent.toFixed(3)),
        coins_per_completion: parseFloat(totals.coins_per_completion.toFixed(3)),
      },
      daily_series: dailySeries,
      device_split: deviceSplit,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /analytics/campaigns/:campaignId/export
 * Export campaign analytics as CSV
 * Query params: from (YYYY-MM-DD), to (YYYY-MM-DD)
 * Access: Campaign owner or admin only
 */
router.get('/campaigns/:campaignId/export', authRequired, async (req, res, next) => {
  try {
    const campaignId = parseInt(req.params.campaignId, 10);
    const userId = req.user.id;
    const isAdmin = req.user.is_admin;

    if (!campaignId || campaignId < 1) {
      return res.status(400).json({
        error: {
          code: 'INVALID_CAMPAIGN_ID',
          message: 'Invalid campaign ID',
        },
      });
    }

    // Check campaign ownership (unless admin)
    if (!isAdmin) {
      const isOwner = await checkCampaignOwnership(campaignId, userId);
      if (!isOwner) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have access to this campaign analytics',
          },
        });
      }
    }

    // Get campaign info
    const campaignInfo = await getCampaignInfo(campaignId);

    // Parse date range (default to last 7 days in IST)
    const currentDateIST = getCurrentDateIST();
    const toDateIST = req.query.to || currentDateIST;

    let fromDateIST;
    if (req.query.from) {
      fromDateIST = req.query.from;
    } else {
      const toDate = new Date(toDateIST + 'T00:00:00');
      toDate.setDate(toDate.getDate() - 6);
      fromDateIST = toDate.toISOString().split('T')[0];
    }

    // Validate date range
    try {
      validateDateRange(fromDateIST, toDateIST);
    } catch (validationError) {
      return res.status(400).json({
        error: {
          code: 'INVALID_DATE_RANGE',
          message: validationError.message,
        },
      });
    }

    // Get daily series data
    const dailySeries = await getCampaignDailySeries(campaignId, fromDateIST, toDateIST);

    // Generate CSV
    const csvHeader = 'Date (IST),Visits,Completions,Completion Rate (%),Avg Watch Time (sec),Avg Quiz Accuracy (%),Coins Spent,Coins per Completion,Desktop,Mobile,Unknown\n';
    const csvRows = dailySeries.map(row => {
      return [
        row.date,
        row.visits,
        row.completions,
        row.completion_rate.toFixed(2),
        row.avg_watch_time.toFixed(2),
        row.avg_quiz_accuracy.toFixed(2),
        row.coins_spent.toFixed(3),
        row.coins_per_completion.toFixed(3),
        row.device_split.desktop,
        row.device_split.mobile,
        row.device_split.unknown,
      ].join(',');
    }).join('\n');

    const csv = csvHeader + csvRows;

    // Set response headers for CSV download
    const filename = `campaign_${campaignId}_analytics_${fromDateIST}_to_${toDateIST}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
