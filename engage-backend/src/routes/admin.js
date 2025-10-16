const express = require('express');
const db = require('../db');
const bcrypt = require('bcryptjs');
const { requireAdmin } = require('../middleware/adminAuth');

const router = express.Router();

// Apply admin auth to all routes in this router
router.use(requireAdmin);

/**
 * GET /admin/stats
 * Get dashboard statistics
 */
router.get('/stats', async (req, res, next) => {
  try {
    // Total users
    const [userStats] = await db.query(
      'SELECT COUNT(*) as total_users, SUM(coins) as total_coins FROM users WHERE is_admin = 0'
    );

    // Total campaigns
    const [campaignStats] = await db.query(
      'SELECT COUNT(*) as total_campaigns, SUM(clicks_served) as total_visits FROM campaigns'
    );

    // Active campaigns
    const [activeStats] = await db.query(
      'SELECT COUNT(*) as active_campaigns FROM campaigns WHERE is_paused = 0 AND is_finished = 0'
    );

    // Recent enforcement logs (last 24h)
    const [enforcementStats] = await db.query(
      `SELECT outcome, COUNT(*) as count FROM campaign_enforcement_logs
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
       GROUP BY outcome`
    );

    // Top earners (last 7 days)
    const [topEarners] = await db.query(
      `SELECT u.username, SUM(v.coins_earned) as total_earned
       FROM visits v
       JOIN users u ON v.user_id = u.id
       WHERE v.visit_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY v.user_id, u.username
       ORDER BY total_earned DESC
       LIMIT 5`
    );

    res.json({
      users: {
        total: userStats[0].total_users,
        total_coins: parseFloat(userStats[0].total_coins) || 0,
      },
      campaigns: {
        total: campaignStats[0].total_campaigns,
        active: activeStats[0].active_campaigns,
        total_visits: campaignStats[0].total_visits,
      },
      enforcement: enforcementStats,
      top_earners: topEarners,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /admin/users
 * Get list of users with filters and pagination
 */
router.get('/users', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'created_at';
    const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Build where clause
    let whereClause = 'WHERE is_admin = 0';
    const params = [];

    if (search) {
      whereClause += ' AND (username LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Get total count
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Get users
    const validSortColumns = ['username', 'email', 'coins', 'created_at'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';

    const [users] = await db.query(
      `SELECT id, public_id, username, email, coins, email_verified_at, created_at
       FROM users
       ${whereClause}
       ORDER BY ${sortColumn} ${sortOrder}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /admin/users/:id
 * Get detailed user information
 */
router.get('/users/:id', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);

    // Get user details
    const [users] = await db.query(
      `SELECT id, public_id, username, email, coins, is_admin, email_verified_at, created_at
       FROM users WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
    }

    const user = users[0];

    // Get user campaigns
    const [campaigns] = await db.query(
      `SELECT id, public_id, title, coins_per_visit, total_clicks, clicks_served, is_paused, is_finished, created_at
       FROM campaigns WHERE user_id = ? ORDER BY created_at DESC LIMIT 10`,
      [userId]
    );

    // Get user visits (earnings)
    const [visits] = await db.query(
      `SELECT v.id, v.public_id, c.title as campaign_title, v.coins_earned, v.is_consolation, v.visited_at
       FROM visits v
       LEFT JOIN campaigns c ON v.campaign_id = c.id
       WHERE v.user_id = ? ORDER BY v.visited_at DESC LIMIT 20`,
      [userId]
    );

    // Get enforcement logs for this user
    const [enforcementLogs] = await db.query(
      `SELECT el.*, c.title as campaign_title
       FROM campaign_enforcement_logs el
       LEFT JOIN campaigns c ON el.campaign_id = c.id
       WHERE el.user_id = ?
       ORDER BY el.created_at DESC LIMIT 20`,
      [userId]
    );

    res.json({
      user,
      campaigns,
      visits,
      enforcement_logs: enforcementLogs,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /admin/users/:id/adjust-coins
 * Adjust user's coin balance (add or subtract)
 */
router.post('/users/:id/adjust-coins', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const { amount, reason } = req.body;

    if (!amount || typeof amount !== 'number') {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: 'Valid amount is required' },
      });
    }

    if (!reason || typeof reason !== 'string') {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: 'Reason is required' },
      });
    }

    // Get current balance
    const [users] = await db.query('SELECT coins FROM users WHERE id = ?', [userId]);

    if (users.length === 0) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
    }

    const currentBalance = parseFloat(users[0].coins);
    const newBalance = currentBalance + amount;

    // Prevent negative balance
    if (newBalance < 0) {
      return res.status(400).json({
        error: {
          code: 'INVALID_AMOUNT',
          message: 'Adjustment would result in negative balance',
        },
      });
    }

    // Update balance
    await db.query('UPDATE users SET coins = ? WHERE id = ?', [newBalance, userId]);

    // Log the adjustment (you might want to create an admin_actions table for this)
    console.log(`[Admin] User ${userId} coins adjusted: ${amount} (Reason: ${reason}) by admin ${req.user.id}`);

    res.json({
      success: true,
      old_balance: currentBalance,
      new_balance: newBalance,
      adjustment: amount,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /admin/limits
 * Get current campaign limit configuration
 */
router.get('/limits', async (req, res, next) => {
  try {
    const [config] = await db.query(
      'SELECT config_key, config_value, description, updated_at FROM campaign_limit_config'
    );

    res.json({ config });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /admin/limits/:key
 * Update campaign limit configuration
 */
router.put('/limits/:key', async (req, res, next) => {
  try {
    const configKey = req.params.key;
    const { value } = req.body;

    if (!value) {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: 'Value is required' },
      });
    }

    // Validate config key exists
    const [existing] = await db.query(
      'SELECT id FROM campaign_limit_config WHERE config_key = ?',
      [configKey]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Config key not found' },
      });
    }

    // Update config
    await db.query(
      'UPDATE campaign_limit_config SET config_value = ? WHERE config_key = ?',
      [JSON.stringify(value), configKey]
    );

    console.log(`[Admin] Config '${configKey}' updated by admin ${req.user.id}`);

    res.json({ success: true, config_key: configKey, new_value: value });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /admin/enforcement-logs
 * Get campaign enforcement logs with filters
 */
router.get('/enforcement-logs', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = (page - 1) * limit;
    const outcome = req.query.outcome || '';
    const tier = req.query.tier || '';

    // Build where clause
    let whereClause = '';
    const params = [];

    const conditions = [];
    if (outcome) {
      conditions.push('outcome = ?');
      params.push(outcome);
    }
    if (tier) {
      conditions.push('value_tier = ?');
      params.push(tier);
    }

    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }

    // Get total count
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM campaign_enforcement_logs ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Get logs
    const [logs] = await db.query(
      `SELECT el.*, u.username, c.title as campaign_title
       FROM campaign_enforcement_logs el
       LEFT JOIN users u ON el.user_id = u.id
       LEFT JOIN campaigns c ON el.campaign_id = c.id
       ${whereClause}
       ORDER BY el.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /admin/campaigns
 * Get all campaigns with filters
 */
router.get('/campaigns', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status || ''; // 'active', 'paused', 'finished'

    let whereClause = '';
    if (status === 'active') {
      whereClause = 'WHERE c.is_paused = 0 AND c.is_finished = 0';
    } else if (status === 'paused') {
      whereClause = 'WHERE c.is_paused = 1';
    } else if (status === 'finished') {
      whereClause = 'WHERE c.is_finished = 1';
    }

    // Get total count
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM campaigns c ${whereClause}`
    );
    const total = countResult[0].total;

    // Get campaigns
    const [campaigns] = await db.query(
      `SELECT c.*, u.username as owner_username
       FROM campaigns c
       JOIN users u ON c.user_id = u.id
       ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    res.json({
      campaigns,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
