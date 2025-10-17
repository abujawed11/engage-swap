/**
 * @fileoverview Wallet Management Utilities
 *
 * This module provides core wallet operations including:
 * - Transaction creation with idempotency
 * - Balance updates (atomic operations)
 * - Audit log creation
 * - Balance recalculation
 * - Transaction queries
 *
 * All operations are designed to be concurrency-safe and maintain data integrity.
 */

const db = require('../db');
const crypto = require('crypto');

// ─── Constants ───────────────────────────────────────────────────────────

const TXN_TYPE = {
  EARNED: 'EARNED',
  SPENT: 'SPENT',
  BONUS: 'BONUS',
  REFUND: 'REFUND',
  ADMIN_CREDIT: 'ADMIN_CREDIT',
  ADMIN_DEBIT: 'ADMIN_DEBIT',
};

const TXN_STATUS = {
  SUCCESS: 'SUCCESS',
  PENDING: 'PENDING',
  FAILED: 'FAILED',
  REVERSED: 'REVERSED',
};

const TXN_SIGN = {
  PLUS: 'PLUS',
  MINUS: 'MINUS',
};

const ACTOR_TYPE = {
  SYSTEM: 'SYSTEM',
  ADMIN: 'ADMIN',
};

const AUDIT_ACTION = {
  CREATE_TXN: 'CREATE_TXN',
  REVERSE_TXN: 'REVERSE_TXN',
  ADJUST_BALANCE: 'ADJUST_BALANCE',
  RECALC_AGGREGATES: 'RECALC_AGGREGATES',
  CREATE_WALLET: 'CREATE_WALLET',
  LOCK_FUNDS: 'LOCK_FUNDS',
  UNLOCK_FUNDS: 'UNLOCK_FUNDS',
};

// ─── Helper Functions ────────────────────────────────────────────────────

/**
 * Generate a unique reference ID for idempotency
 * @param {string} prefix - Prefix for the reference ID (e.g., 'quiz', 'consolation')
 * @param {number} userId - User ID
 * @param {string} uniqueKey - A unique key for this transaction (e.g., visit_token)
 * @returns {string} Reference ID
 */
function generateReferenceId(prefix, userId, uniqueKey) {
  const hash = crypto
    .createHash('sha256')
    .update(`${prefix}-${userId}-${uniqueKey}`)
    .digest('hex')
    .substring(0, 32);

  return `${prefix}_${userId}_${hash}`;
}

/**
 * Format amount to 3 decimal places
 * @param {number|string} amount
 * @returns {string}
 */
function formatAmount(amount) {
  return Number(amount).toFixed(3);
}

/**
 * Ensure wallet exists for a user (create if missing)
 * @param {object} conn - Database connection (for transactions)
 * @param {number} userId - User ID
 */
async function ensureWalletExists(conn, userId) {
  const [existing] = await conn.query(
    'SELECT id FROM wallets WHERE user_id = ? LIMIT 1',
    [userId]
  );

  if (existing.length === 0) {
    // Create wallet
    await conn.query(
      `INSERT INTO wallets (user_id, available, locked, lifetime_earned, lifetime_spent)
       VALUES (?, 0.000, 0.000, 0.000, 0.000)`,
      [userId]
    );

    // Create audit log
    await conn.query(
      `INSERT INTO wallet_audit_logs (actor_type, user_id, action, reason)
       VALUES (?, ?, ?, ?)`,
      [ACTOR_TYPE.SYSTEM, userId, AUDIT_ACTION.CREATE_WALLET, 'Auto-created wallet on first transaction']
    );
  }
}

// ─── Core Wallet Operations ──────────────────────────────────────────────

/**
 * Get wallet balance for a user
 * @param {number} userId - User ID
 * @returns {Promise<object>} Wallet balance object
 */
async function getWalletBalance(userId) {
  const [wallets] = await db.query(
    `SELECT
      available,
      locked,
      lifetime_earned,
      lifetime_spent,
      updated_at
     FROM wallets
     WHERE user_id = ?
     LIMIT 1`,
    [userId]
  );

  if (wallets.length === 0) {
    // Return default empty wallet if not exists
    return {
      available: '0.000',
      locked: '0.000',
      lifetime_earned: '0.000',
      lifetime_spent: '0.000',
      updated_at: null,
    };
  }

  const wallet = wallets[0];
  return {
    available: formatAmount(wallet.available),
    locked: formatAmount(wallet.locked),
    lifetime_earned: formatAmount(wallet.lifetime_earned),
    lifetime_spent: formatAmount(wallet.lifetime_spent),
    updated_at: wallet.updated_at,
  };
}

/**
 * Create a wallet transaction (with idempotency and atomic balance update)
 *
 * @param {object} params - Transaction parameters
 * @param {number} params.userId - User ID
 * @param {string} params.type - Transaction type (EARNED, SPENT, etc.)
 * @param {string} params.sign - Transaction sign (PLUS or MINUS)
 * @param {number} params.amount - Amount (positive number)
 * @param {string} params.source - Source description
 * @param {string} params.referenceId - Unique reference ID for idempotency
 * @param {number} [params.campaignId] - Campaign ID (optional)
 * @param {object} [params.metadata] - Additional metadata (optional)
 * @param {string} [params.status] - Transaction status (default: SUCCESS)
 * @param {string} [params.actorType] - Actor type (default: SYSTEM)
 * @param {number} [params.actorId] - Actor ID (for ADMIN actions)
 *
 * @returns {Promise<object>} Created transaction
 */
async function createTransaction(params) {
  const {
    userId,
    type,
    sign,
    amount,
    source,
    referenceId,
    campaignId = null,
    metadata = null,
    status = TXN_STATUS.SUCCESS,
    actorType = ACTOR_TYPE.SYSTEM,
    actorId = null,
  } = params;

  // Validate amount
  if (amount <= 0) {
    throw new Error('Transaction amount must be positive');
  }

  // Validate sign
  if (![TXN_SIGN.PLUS, TXN_SIGN.MINUS].includes(sign)) {
    throw new Error('Invalid transaction sign');
  }

  // Get a connection for transaction
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // Check for existing transaction with same reference_id (idempotency)
    const [existing] = await conn.query(
      'SELECT id, amount, sign, status, created_at FROM wallet_transactions WHERE reference_id = ? LIMIT 1',
      [referenceId]
    );

    if (existing.length > 0) {
      // Transaction already exists, return it
      await conn.commit();
      return {
        id: existing[0].id,
        amount: formatAmount(existing[0].amount),
        sign: existing[0].sign,
        status: existing[0].status,
        created_at: existing[0].created_at,
        isExisting: true,
      };
    }

    // Ensure wallet exists
    await ensureWalletExists(conn, userId);

    // If MINUS and status is SUCCESS, check sufficient funds
    if (sign === TXN_SIGN.MINUS && status === TXN_STATUS.SUCCESS) {
      const [wallets] = await conn.query(
        'SELECT available FROM wallets WHERE user_id = ? LIMIT 1 FOR UPDATE',
        [userId]
      );

      if (wallets.length === 0) {
        throw new Error('Wallet not found');
      }

      const available = Number(wallets[0].available);
      if (available < amount) {
        throw new Error('Insufficient funds');
      }
    }

    // Insert transaction
    const [txnResult] = await conn.query(
      `INSERT INTO wallet_transactions
       (user_id, type, status, amount, sign, campaign_id, source, reference_id, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, type, status, formatAmount(amount), sign, campaignId, source, referenceId, metadata ? JSON.stringify(metadata) : null]
    );

    const txnId = txnResult.insertId;

    // Update wallet balance (only if status is SUCCESS)
    if (status === TXN_STATUS.SUCCESS) {
      if (sign === TXN_SIGN.PLUS) {
        // Increase available balance
        await conn.query(
          'UPDATE wallets SET available = available + ? WHERE user_id = ?',
          [formatAmount(amount), userId]
        );

        // Update lifetime earned for EARNED and BONUS types
        if ([TXN_TYPE.EARNED, TXN_TYPE.BONUS, TXN_TYPE.ADMIN_CREDIT, TXN_TYPE.REFUND].includes(type)) {
          await conn.query(
            'UPDATE wallets SET lifetime_earned = lifetime_earned + ? WHERE user_id = ?',
            [formatAmount(amount), userId]
          );
        }
      } else if (sign === TXN_SIGN.MINUS) {
        // Decrease available balance
        await conn.query(
          'UPDATE wallets SET available = available - ? WHERE user_id = ?',
          [formatAmount(amount), userId]
        );

        // Update lifetime spent for SPENT types
        if ([TXN_TYPE.SPENT, TXN_TYPE.ADMIN_DEBIT].includes(type)) {
          await conn.query(
            'UPDATE wallets SET lifetime_spent = lifetime_spent + ? WHERE user_id = ?',
            [formatAmount(amount), userId]
          );
        }
      }
    }

    // Create audit log entry
    await conn.query(
      `INSERT INTO wallet_audit_logs
       (actor_type, actor_id, user_id, action, txn_id, amount, reason)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        actorType,
        actorId,
        userId,
        AUDIT_ACTION.CREATE_TXN,
        txnId,
        formatAmount(amount),
        `${type} transaction via ${source}`,
      ]
    );

    await conn.commit();

    // Fetch and return the created transaction
    const [createdTxn] = await conn.query(
      'SELECT * FROM wallet_transactions WHERE id = ? LIMIT 1',
      [txnId]
    );

    return {
      id: createdTxn[0].id,
      amount: formatAmount(createdTxn[0].amount),
      sign: createdTxn[0].sign,
      status: createdTxn[0].status,
      type: createdTxn[0].type,
      created_at: createdTxn[0].created_at,
      isExisting: false,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Get transaction history for a user
 *
 * @param {object} params - Query parameters
 * @param {number} params.userId - User ID
 * @param {number} [params.limit] - Number of records to return (default: 50, max: 100)
 * @param {number} [params.offset] - Offset for pagination (default: 0)
 * @param {string[]} [params.types] - Filter by transaction types
 * @param {string[]} [params.statuses] - Filter by statuses
 * @param {number} [params.campaignId] - Filter by campaign ID
 * @param {string} [params.startDate] - Start date (ISO format)
 * @param {string} [params.endDate] - End date (ISO format)
 * @param {string} [params.search] - Search term (searches source, reference_id)
 * @param {string} [params.sortBy] - Sort field (default: created_at)
 * @param {string} [params.sortOrder] - Sort order (default: DESC)
 *
 * @returns {Promise<object>} Transactions and metadata
 */
async function getTransactionHistory(params) {
  const {
    userId,
    limit = 50,
    offset = 0,
    types = [],
    statuses = [],
    campaignId = null,
    startDate = null,
    endDate = null,
    search = null,
    sortBy = 'created_at',
    sortOrder = 'DESC',
  } = params;

  // Validate and sanitize limit
  const safeLimit = Math.min(Math.max(1, parseInt(limit) || 50), 100);
  const safeOffset = Math.max(0, parseInt(offset) || 0);

  // Build WHERE clause
  const whereClauses = ['user_id = ?'];
  const whereParams = [userId];

  if (types.length > 0) {
    whereClauses.push(`type IN (${types.map(() => '?').join(', ')})`);
    whereParams.push(...types);
  }

  if (statuses.length > 0) {
    whereClauses.push(`status IN (${statuses.map(() => '?').join(', ')})`);
    whereParams.push(...statuses);
  }

  if (campaignId) {
    whereClauses.push('campaign_id = ?');
    whereParams.push(campaignId);
  }

  if (startDate) {
    whereClauses.push('created_at >= ?');
    whereParams.push(startDate);
  }

  if (endDate) {
    whereClauses.push('created_at <= ?');
    whereParams.push(endDate);
  }

  if (search) {
    whereClauses.push('(source LIKE ? OR reference_id LIKE ?)');
    const searchTerm = `%${search}%`;
    whereParams.push(searchTerm, searchTerm);
  }

  const whereClause = whereClauses.join(' AND ');

  // Validate sortBy
  const validSortFields = ['created_at', 'amount'];
  const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
  const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  // Get total count
  const [countResult] = await db.query(
    `SELECT COUNT(*) as total FROM wallet_transactions WHERE ${whereClause}`,
    whereParams
  );

  const total = countResult[0].total;

  // Get transactions
  const [transactions] = await db.query(
    `SELECT
      id,
      type,
      status,
      amount,
      sign,
      campaign_id,
      source,
      reference_id,
      metadata,
      created_at
     FROM wallet_transactions
     WHERE ${whereClause}
     ORDER BY ${safeSortBy} ${safeSortOrder}
     LIMIT ? OFFSET ?`,
    [...whereParams, safeLimit, safeOffset]
  );

  // Format amounts
  const formattedTransactions = transactions.map((txn) => ({
    ...txn,
    amount: formatAmount(txn.amount),
    metadata: txn.metadata || null, // MySQL2 already parses JSON columns
  }));

  return {
    transactions: formattedTransactions,
    pagination: {
      total,
      limit: safeLimit,
      offset: safeOffset,
      hasMore: safeOffset + safeLimit < total,
    },
  };
}

/**
 * Get a single transaction by ID
 * @param {number} txnId - Transaction ID
 * @param {number} userId - User ID (for authorization)
 * @returns {Promise<object|null>} Transaction or null if not found
 */
async function getTransactionById(txnId, userId) {
  const [transactions] = await db.query(
    `SELECT
      wt.id,
      wt.user_id,
      wt.type,
      wt.status,
      wt.amount,
      wt.sign,
      wt.campaign_id,
      wt.source,
      wt.reference_id,
      wt.metadata,
      wt.created_at,
      c.title as campaign_title,
      c.public_id as campaign_public_id
     FROM wallet_transactions wt
     LEFT JOIN campaigns c ON wt.campaign_id = c.id
     WHERE wt.id = ? AND wt.user_id = ?
     LIMIT 1`,
    [txnId, userId]
  );

  if (transactions.length === 0) {
    return null;
  }

  const txn = transactions[0];
  return {
    ...txn,
    amount: formatAmount(txn.amount),
    metadata: txn.metadata || null, // MySQL2 already parses JSON columns
  };
}

/**
 * Recalculate wallet aggregates from transaction history
 * @param {number} userId - User ID
 * @param {string} [actorType] - Actor type (default: ADMIN)
 * @param {number} [actorId] - Actor ID (for admin actions)
 * @returns {Promise<object>} Recalculated balances
 */
async function recalculateWalletAggregates(userId, actorType = ACTOR_TYPE.ADMIN, actorId = null) {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // Ensure wallet exists
    await ensureWalletExists(conn, userId);

    // Calculate available balance from successful transactions
    const [balanceResult] = await conn.query(
      `SELECT
        SUM(CASE WHEN sign = 'PLUS' THEN amount ELSE -amount END) as calculated_available
       FROM wallet_transactions
       WHERE user_id = ? AND status = 'SUCCESS'`,
      [userId]
    );

    const calculatedAvailable = Number(balanceResult[0].calculated_available || 0);

    // Calculate lifetime earned (PLUS transactions with EARNED, BONUS, ADMIN_CREDIT, REFUND)
    const [earnedResult] = await conn.query(
      `SELECT SUM(amount) as calculated_earned
       FROM wallet_transactions
       WHERE user_id = ?
         AND status = 'SUCCESS'
         AND sign = 'PLUS'
         AND type IN ('EARNED', 'BONUS', 'ADMIN_CREDIT', 'REFUND')`,
      [userId]
    );

    const calculatedEarned = Number(earnedResult[0].calculated_earned || 0);

    // Calculate lifetime spent (MINUS transactions with SPENT, ADMIN_DEBIT)
    const [spentResult] = await conn.query(
      `SELECT SUM(amount) as calculated_spent
       FROM wallet_transactions
       WHERE user_id = ?
         AND status = 'SUCCESS'
         AND sign = 'MINUS'
         AND type IN ('SPENT', 'ADMIN_DEBIT')`,
      [userId]
    );

    const calculatedSpent = Number(spentResult[0].calculated_spent || 0);

    // Update wallet
    await conn.query(
      `UPDATE wallets
       SET available = ?,
           lifetime_earned = ?,
           lifetime_spent = ?
       WHERE user_id = ?`,
      [formatAmount(calculatedAvailable), formatAmount(calculatedEarned), formatAmount(calculatedSpent), userId]
    );

    // Create audit log
    await conn.query(
      `INSERT INTO wallet_audit_logs
       (actor_type, actor_id, user_id, action, reason, metadata)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        actorType,
        actorId,
        userId,
        AUDIT_ACTION.RECALC_AGGREGATES,
        'Wallet aggregates recalculated from transaction history',
        JSON.stringify({
          calculated_available: formatAmount(calculatedAvailable),
          calculated_earned: formatAmount(calculatedEarned),
          calculated_spent: formatAmount(calculatedSpent),
        }),
      ]
    );

    await conn.commit();

    return {
      available: formatAmount(calculatedAvailable),
      lifetime_earned: formatAmount(calculatedEarned),
      lifetime_spent: formatAmount(calculatedSpent),
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Get audit logs (admin only)
 *
 * @param {object} params - Query parameters
 * @param {number} [params.userId] - Filter by user ID
 * @param {string} [params.actorType] - Filter by actor type
 * @param {number} [params.actorId] - Filter by actor ID
 * @param {string} [params.action] - Filter by action
 * @param {string} [params.startDate] - Start date (ISO format)
 * @param {string} [params.endDate] - End date (ISO format)
 * @param {number} [params.limit] - Limit (default: 50, max: 100)
 * @param {number} [params.offset] - Offset (default: 0)
 *
 * @returns {Promise<object>} Audit logs and metadata
 */
async function getAuditLogs(params) {
  const {
    userId = null,
    actorType = null,
    actorId = null,
    action = null,
    startDate = null,
    endDate = null,
    limit = 50,
    offset = 0,
  } = params;

  const safeLimit = Math.min(Math.max(1, parseInt(limit) || 50), 100);
  const safeOffset = Math.max(0, parseInt(offset) || 0);

  // Build WHERE clause
  const whereClauses = [];
  const whereParams = [];

  if (userId) {
    whereClauses.push('user_id = ?');
    whereParams.push(userId);
  }

  if (actorType) {
    whereClauses.push('actor_type = ?');
    whereParams.push(actorType);
  }

  if (actorId) {
    whereClauses.push('actor_id = ?');
    whereParams.push(actorId);
  }

  if (action) {
    whereClauses.push('action = ?');
    whereParams.push(action);
  }

  if (startDate) {
    whereClauses.push('created_at >= ?');
    whereParams.push(startDate);
  }

  if (endDate) {
    whereClauses.push('created_at <= ?');
    whereParams.push(endDate);
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Get total count
  const [countResult] = await db.query(
    `SELECT COUNT(*) as total FROM wallet_audit_logs ${whereClause}`,
    whereParams
  );

  const total = countResult[0].total;

  // Get audit logs with user/actor info
  const [logs] = await db.query(
    `SELECT
      wal.id,
      wal.actor_type,
      wal.actor_id,
      wal.user_id,
      wal.action,
      wal.txn_id,
      wal.amount,
      wal.reason,
      wal.metadata,
      wal.created_at,
      u.username as user_username,
      a.username as actor_username
     FROM wallet_audit_logs wal
     LEFT JOIN users u ON wal.user_id = u.id
     LEFT JOIN users a ON wal.actor_id = a.id
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [...whereParams, safeLimit, safeOffset]
  );

  // Format logs
  const formattedLogs = logs.map((log) => ({
    ...log,
    amount: log.amount ? formatAmount(log.amount) : null,
    metadata: log.metadata || null, // MySQL2 already parses JSON columns
  }));

  return {
    logs: formattedLogs,
    pagination: {
      total,
      limit: safeLimit,
      offset: safeOffset,
      hasMore: safeOffset + safeLimit < total,
    },
  };
}

// ─── Exports ─────────────────────────────────────────────────────────────

module.exports = {
  // Constants
  TXN_TYPE,
  TXN_STATUS,
  TXN_SIGN,
  ACTOR_TYPE,
  AUDIT_ACTION,

  // Helper functions
  generateReferenceId,
  formatAmount,

  // Core operations
  getWalletBalance,
  createTransaction,
  getTransactionHistory,
  getTransactionById,
  recalculateWalletAggregates,
  getAuditLogs,
};
