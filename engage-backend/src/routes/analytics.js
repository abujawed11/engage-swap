const express = require('express');
const {
  getEnforcementStatistics,
  getCampaignAnalytics,
  getUserAnalytics,
  getSystemHealthMetrics,
  getCampaignExposureBalance,
} = require('../utils/analytics');

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

module.exports = router;
