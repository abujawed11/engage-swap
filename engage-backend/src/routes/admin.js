const express = require('express');
const db = require('../db');
const bcrypt = require('bcryptjs');
const { requireAdmin } = require('../middleware/adminAuth');
const wallet = require('../utils/wallet');

const router = express.Router();

// Apply admin auth to all routes in this router
router.use(requireAdmin);

/**
 * GET /admin/stats
 * Get dashboard statistics
 */
router.get('/stats', async (req, res, next) => {
  try {
    // Total users and coins (from wallets table)
    const [userStats] = await db.query(
      `SELECT COUNT(DISTINCT u.id) as total_users, COALESCE(SUM(w.available), 0) as total_coins
       FROM users u
       LEFT JOIN wallets w ON u.id = w.user_id
       WHERE u.is_admin = 0`
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

    // Get users with wallet balance
    const validSortColumns = ['username', 'email', 'coins', 'created_at'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';

    const [users] = await db.query(
      `SELECT u.id, u.public_id, u.username, u.email,
              COALESCE(w.available, 0) as coins,
              u.email_verified_at, u.ip_address, u.created_at, u.updated_at
       FROM users u
       LEFT JOIN wallets w ON u.id = w.user_id
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

    // Get user details with wallet balance
    const [users] = await db.query(
      `SELECT u.id, u.public_id, u.username, u.email,
              COALESCE(w.available, 0) as coins,
              u.is_admin, u.is_disabled, u.disabled_at, u.disabled_reason,
              u.email_verified_at, u.ip_address, u.created_at, u.updated_at
       FROM users u
       LEFT JOIN wallets w ON u.id = w.user_id
       WHERE u.id = ?`,
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
 * POST /admin/users/:id/disable
 * Disable a user account
 */
router.post('/users/:id/disable', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const { reason } = req.body;

    if (!reason || typeof reason !== 'string') {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: 'Reason is required' },
      });
    }

    // Check if user exists
    const [users] = await db.query('SELECT id, username, is_admin FROM users WHERE id = ?', [userId]);

    if (users.length === 0) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
    }

    // Prevent disabling admin accounts
    if (users[0].is_admin) {
      return res.status(400).json({
        error: { code: 'INVALID_ACTION', message: 'Cannot disable admin accounts' },
      });
    }

    // Disable user
    await db.query(
      'UPDATE users SET is_disabled = 1, disabled_at = NOW(), disabled_reason = ? WHERE id = ?',
      [reason, userId]
    );

    console.log(`[Admin] User ${userId} (${users[0].username}) disabled by admin ${req.user.id}. Reason: ${reason}`);

    res.json({ success: true, message: 'User disabled successfully' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /admin/users/:id/enable
 * Enable a disabled user account
 */
router.post('/users/:id/enable', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);

    // Check if user exists
    const [users] = await db.query('SELECT id, username FROM users WHERE id = ?', [userId]);

    if (users.length === 0) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
    }

    // Enable user
    await db.query(
      'UPDATE users SET is_disabled = 0, disabled_at = NULL, disabled_reason = NULL WHERE id = ?',
      [userId]
    );

    console.log(`[Admin] User ${userId} (${users[0].username}) enabled by admin ${req.user.id}`);

    res.json({ success: true, message: 'User enabled successfully' });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /admin/users/:id
 * Permanently delete a user account
 */
router.delete('/users/:id', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const { confirm } = req.body;

    if (confirm !== 'DELETE') {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: 'Confirmation required. Send {"confirm": "DELETE"}' },
      });
    }

    // Check if user exists
    const [users] = await db.query('SELECT id, username, is_admin FROM users WHERE id = ?', [userId]);

    if (users.length === 0) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
    }

    // Prevent deleting admin accounts
    if (users[0].is_admin) {
      return res.status(400).json({
        error: { code: 'INVALID_ACTION', message: 'Cannot delete admin accounts' },
      });
    }

    // Delete user (cascading will handle related records)
    await db.query('DELETE FROM users WHERE id = ?', [userId]);

    console.log(`[Admin] User ${userId} (${users[0].username}) DELETED by admin ${req.user.id}`);

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /admin/users/:id/adjust-coins
 * DEPRECATED: Redirects to wallet system
 * Use /admin/wallet/:userId/adjust instead
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

    // Check if user exists
    const [users] = await db.query('SELECT id, username FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
    }

    // Determine type based on amount sign
    const type = amount >= 0 ? 'credit' : 'debit';
    const absoluteAmount = Math.abs(amount);

    // Create wallet transaction
    const txnType = type === 'credit' ? wallet.TXN_TYPE.ADMIN_CREDIT : wallet.TXN_TYPE.ADMIN_DEBIT;
    const sign = type === 'credit' ? wallet.TXN_SIGN.PLUS : wallet.TXN_SIGN.MINUS;

    const referenceId = wallet.generateReferenceId(
      'admin_adjust',
      userId,
      `${req.user.id}_${Date.now()}`
    );

    const transaction = await wallet.createTransaction({
      userId,
      type: txnType,
      sign,
      amount: absoluteAmount,
      source: 'admin_adjustment_legacy',
      referenceId,
      metadata: {
        admin_id: req.user.id,
        admin_username: req.user.username,
        reason: reason.trim(),
        adjustment_type: type,
        legacy_endpoint: true,
      },
      actorType: wallet.ACTOR_TYPE.ADMIN,
      actorId: req.user.id,
    });

    // Get updated balance
    const balance = await wallet.getWalletBalance(userId);

    console.log(`[Admin] User ${userId} (${users[0].username}) wallet ${type} of ${absoluteAmount} by admin ${req.user.id}. Reason: ${reason} (via legacy endpoint)`);

    // Return in old format for backwards compatibility
    res.json({
      success: true,
      old_balance: null, // Not tracked in new system
      new_balance: parseFloat(balance.available),
      adjustment: amount,
      _note: 'This endpoint is deprecated. Use /admin/wallet/:userId/adjust instead.',
    });
  } catch (err) {
    if (err.message === 'Insufficient funds') {
      return res.status(400).json({
        error: {
          code: 'INSUFFICIENT_FUNDS',
          message: 'User does not have sufficient funds for this debit',
        },
      });
    }
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

/**
 * GET /admin/wallet/audit-logs
 * Get wallet audit logs with filters
 */
router.get('/wallet/audit-logs', async (req, res, next) => {
  try {
    const {
      userId,
      actorType,
      actorId,
      action,
      startDate,
      endDate,
      limit,
      offset,
    } = req.query;

    const result = await wallet.getAuditLogs({
      userId: userId ? parseInt(userId) : null,
      actorType,
      actorId: actorId ? parseInt(actorId) : null,
      action,
      startDate,
      endDate,
      limit,
      offset,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /admin/wallet/:userId/adjust
 * Manually adjust a user's wallet balance (credit or debit)
 */
router.post('/wallet/:userId/adjust', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);
    const { amount, reason, type } = req.body;

    // Validation
    if (isNaN(userId)) {
      return res.status(400).json({
        error: { code: 'INVALID_USER_ID', message: 'Invalid user ID' },
      });
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: 'Valid positive amount is required' },
      });
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: 'Reason is required' },
      });
    }

    if (!type || !['credit', 'debit'].includes(type)) {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: 'Type must be "credit" or "debit"' },
      });
    }

    // Check if user exists
    const [users] = await db.query('SELECT id, username FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
    }

    // Create transaction
    const txnType = type === 'credit' ? wallet.TXN_TYPE.ADMIN_CREDIT : wallet.TXN_TYPE.ADMIN_DEBIT;
    const sign = type === 'credit' ? wallet.TXN_SIGN.PLUS : wallet.TXN_SIGN.MINUS;

    const referenceId = wallet.generateReferenceId(
      'admin_adjust',
      userId,
      `${req.user.id}_${Date.now()}`
    );

    const transaction = await wallet.createTransaction({
      userId,
      type: txnType,
      sign,
      amount,
      source: 'admin_adjustment',
      referenceId,
      metadata: {
        admin_id: req.user.id,
        admin_username: req.user.username,
        reason: reason.trim(),
        adjustment_type: type,
      },
      actorType: wallet.ACTOR_TYPE.ADMIN,
      actorId: req.user.id,
    });

    // Get updated balance
    const balance = await wallet.getWalletBalance(userId);

    console.log(
      `[Admin] User ${userId} (${users[0].username}) wallet ${type} of ${amount} by admin ${req.user.id}. Reason: ${reason}`
    );

    res.status(200).json({
      success: true,
      transaction,
      balance,
    });
  } catch (err) {
    if (err.message === 'Insufficient funds') {
      return res.status(400).json({
        error: {
          code: 'INSUFFICIENT_FUNDS',
          message: 'User does not have sufficient funds for this debit',
        },
      });
    }
    next(err);
  }
});

/**
 * POST /admin/wallet/:userId/recalculate
 * Recalculate wallet aggregates from transaction history
 */
router.post('/wallet/:userId/recalculate', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({
        error: { code: 'INVALID_USER_ID', message: 'Invalid user ID' },
      });
    }

    // Check if user exists
    const [users] = await db.query('SELECT id, username FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
    }

    const recalculatedBalance = await wallet.recalculateWalletAggregates(
      userId,
      wallet.ACTOR_TYPE.ADMIN,
      req.user.id
    );

    console.log(
      `[Admin] User ${userId} (${users[0].username}) wallet aggregates recalculated by admin ${req.user.id}`
    );

    res.status(200).json({
      success: true,
      balance: recalculatedBalance,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /admin/wallet/:userId/balance
 * Get a user's wallet balance (admin view)
 */
router.get('/wallet/:userId/balance', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({
        error: { code: 'INVALID_USER_ID', message: 'Invalid user ID' },
      });
    }

    const balance = await wallet.getWalletBalance(userId);

    res.status(200).json({
      balance,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /admin/wallet/:userId/transactions
 * Get a user's transaction history (admin view)
 */
router.get('/wallet/:userId/transactions', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({
        error: { code: 'INVALID_USER_ID', message: 'Invalid user ID' },
      });
    }

    const {
      limit,
      offset,
      types,
      statuses,
      campaignId,
      startDate,
      endDate,
      search,
      sortBy,
      sortOrder,
    } = req.query;

    const typesArray = types ? types.split(',').map((t) => t.trim().toUpperCase()) : [];
    const statusesArray = statuses ? statuses.split(',').map((s) => s.trim().toUpperCase()) : [];

    const result = await wallet.getTransactionHistory({
      userId,
      limit,
      offset,
      types: typesArray,
      statuses: statusesArray,
      campaignId: campaignId ? parseInt(campaignId) : null,
      startDate,
      endDate,
      search,
      sortBy,
      sortOrder,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /admin/coin-packs
 * Get all coin packs (including inactive)
 */
router.get('/coin-packs', async (req, res, next) => {
  try {
    const [packs] = await db.query(
      `SELECT id, tier_name, base_coins, bonus_percent, price_inr, price_usd,
              is_featured, is_popular, is_active, display_order, badge_text, description,
              created_at, updated_at
       FROM coin_packs
       ORDER BY display_order ASC`
    );

    res.json({ packs });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /admin/coin-packs/:id
 * Update a coin pack
 */
router.put('/coin-packs/:id', async (req, res, next) => {
  try {
    const packId = parseInt(req.params.id, 10);
    const {
      tier_name,
      base_coins,
      bonus_percent,
      price_inr,
      price_usd,
      is_featured,
      is_popular,
      is_active,
      display_order,
      badge_text,
      description,
    } = req.body;

    // Validate required fields
    if (!tier_name || base_coins === undefined || bonus_percent === undefined ||
        price_inr === undefined || price_usd === undefined) {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' },
      });
    }

    // Validate numeric values
    if (base_coins <= 0 || bonus_percent < 0 || bonus_percent > 100 ||
        price_inr <= 0 || price_usd <= 0) {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid numeric values' },
      });
    }

    // Check if pack exists
    const [existing] = await db.query('SELECT id FROM coin_packs WHERE id = ?', [packId]);
    if (existing.length === 0) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Coin pack not found' },
      });
    }

    // Update pack
    await db.query(
      `UPDATE coin_packs SET
        tier_name = ?,
        base_coins = ?,
        bonus_percent = ?,
        price_inr = ?,
        price_usd = ?,
        is_featured = ?,
        is_popular = ?,
        is_active = ?,
        display_order = ?,
        badge_text = ?,
        description = ?
       WHERE id = ?`,
      [
        tier_name,
        base_coins,
        bonus_percent,
        price_inr,
        price_usd,
        is_featured ? 1 : 0,
        is_popular ? 1 : 0,
        is_active ? 1 : 0,
        display_order || 0,
        badge_text || null,
        description || null,
        packId,
      ]
    );

    console.log(`[Admin] Coin pack ${packId} (${tier_name}) updated by admin ${req.user.id}`);

    res.json({ success: true, message: 'Coin pack updated successfully' });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /admin/campaigns/:id
 * Delete a campaign (admin only)
 */
router.delete('/campaigns/:id', async (req, res, next) => {
  try {
    const campaignId = parseInt(req.params.id, 10);
    const { confirm } = req.body;

    if (confirm !== 'DELETE') {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: 'Confirmation required. Send {"confirm": "DELETE"}' },
      });
    }

    if (isNaN(campaignId)) {
      return res.status(400).json({
        error: { code: 'INVALID_ID', message: 'Invalid campaign ID' },
      });
    }

    // Check if campaign exists
    const [campaigns] = await db.query(
      'SELECT id, public_id, title, user_id FROM campaigns WHERE id = ?',
      [campaignId]
    );

    if (campaigns.length === 0) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Campaign not found' },
      });
    }

    const campaign = campaigns[0];

    // Delete campaign (cascading will handle related records like visits, enforcement logs)
    await db.query('DELETE FROM campaigns WHERE id = ?', [campaignId]);

    console.log(`[Admin] Campaign ${campaignId} (${campaign.title}) DELETED by admin ${req.user.id}`);

    res.json({
      success: true,
      message: 'Campaign deleted successfully',
      deleted_campaign: {
        id: campaign.id,
        public_id: campaign.public_id,
        title: campaign.title,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
