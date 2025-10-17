/**
 * @fileoverview Wallet API Routes
 *
 * User-facing endpoints for wallet operations:
 * - GET /wallet/balance - Get wallet balance
 * - GET /wallet/transactions - Get transaction history (with filters)
 * - GET /wallet/transactions/:id - Get transaction details
 */

const express = require('express');
const authRequired = require('../middleware/authRequired');
const wallet = require('../utils/wallet');

const router = express.Router();

/**
 * GET /wallet/balance
 * Get current user's wallet balance
 */
router.get('/balance', authRequired, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const balance = await wallet.getWalletBalance(userId);

    res.status(200).json({
      balance,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /wallet/transactions
 * Get transaction history with filtering, sorting, and pagination
 *
 * Query Parameters:
 * - limit: Number of records (default: 50, max: 100)
 * - offset: Offset for pagination (default: 0)
 * - types: Comma-separated transaction types (EARNED, SPENT, BONUS, etc.)
 * - statuses: Comma-separated statuses (SUCCESS, PENDING, FAILED, REVERSED)
 * - campaignId: Filter by campaign ID
 * - startDate: Start date (ISO format)
 * - endDate: End date (ISO format)
 * - search: Search term (searches source, reference_id)
 * - sortBy: Sort field (created_at or amount, default: created_at)
 * - sortOrder: Sort order (ASC or DESC, default: DESC)
 */
router.get('/transactions', authRequired, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Parse query parameters
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

    // Parse comma-separated arrays
    const typesArray = types ? types.split(',').map((t) => t.trim().toUpperCase()) : [];
    const statusesArray = statuses ? statuses.split(',').map((s) => s.trim().toUpperCase()) : [];

    // Validate types
    const validTypes = Object.values(wallet.TXN_TYPE);
    const invalidTypes = typesArray.filter((t) => !validTypes.includes(t));
    if (invalidTypes.length > 0) {
      return res.status(400).json({
        error: {
          code: 'INVALID_TYPE',
          message: `Invalid transaction types: ${invalidTypes.join(', ')}`,
        },
      });
    }

    // Validate statuses
    const validStatuses = Object.values(wallet.TXN_STATUS);
    const invalidStatuses = statusesArray.filter((s) => !validStatuses.includes(s));
    if (invalidStatuses.length > 0) {
      return res.status(400).json({
        error: {
          code: 'INVALID_STATUS',
          message: `Invalid statuses: ${invalidStatuses.join(', ')}`,
        },
      });
    }

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
 * GET /wallet/transactions/:id
 * Get detailed information about a specific transaction
 */
router.get('/transactions/:id', authRequired, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const txnId = parseInt(req.params.id);

    if (isNaN(txnId)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ID',
          message: 'Invalid transaction ID',
        },
      });
    }

    const transaction = await wallet.getTransactionById(txnId, userId);

    if (!transaction) {
      return res.status(404).json({
        error: {
          code: 'TRANSACTION_NOT_FOUND',
          message: 'Transaction not found',
        },
      });
    }

    res.status(200).json({
      transaction,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
