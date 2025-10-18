/**
 * URL Validator API Routes
 *
 * Provides endpoints for validating URLs against EngageSwap policies.
 */

const express = require('express');
const { validateURL } = require('../utils/urlValidator');
const validatorRateLimit = require('../middleware/validatorRateLimit');

const router = express.Router();

/**
 * POST /api/validator/check-url
 *
 * Validates a URL against security and content policies.
 *
 * Request body:
 * {
 *   "url": "https://example.com"
 * }
 *
 * Response:
 * {
 *   "verdict": "VALID" | "INVALID" | "RETRY",
 *   "message": "...",
 *   "correlation_id": "uuid",
 *   "validation_time_ms": 1234
 * }
 */
router.post('/check-url', validatorRateLimit, async (req, res, next) => {
  try {
    const { url } = req.body;

    // Validate request body
    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'Missing or invalid "url" field in request body'
        }
      });
    }

    // Trim whitespace
    const urlToValidate = url.trim();

    if (urlToValidate.length === 0) {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'URL cannot be empty'
        }
      });
    }

    // Get request metadata
    const userId = req.user?.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Perform validation
    const result = await validateURL(urlToValidate, {
      userId,
      ipAddress,
      userAgent
    });

    // Return appropriate status code based on verdict
    const statusCode = result.verdict === 'VALID' ? 200 : 400;

    return res.status(statusCode).json(result);

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/validator/stats (optional - for debugging/monitoring)
 *
 * Returns validation statistics for the current user.
 * Requires authentication.
 */
router.get('/stats', async (req, res, next) => {
  try {
    const db = require('../db');

    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    const userId = req.user.id;

    // Get validation statistics
    const [stats] = await db.query(
      `SELECT
        COUNT(*) as total_validations,
        SUM(CASE WHEN verdict = 'VALID' THEN 1 ELSE 0 END) as valid_count,
        SUM(CASE WHEN verdict = 'INVALID' THEN 1 ELSE 0 END) as invalid_count,
        SUM(CASE WHEN verdict = 'RETRY' THEN 1 ELSE 0 END) as retry_count,
        AVG(validation_time_ms) as avg_validation_time_ms,
        MAX(created_at) as last_validation_at
       FROM url_validation_logs
       WHERE user_id = ?
       AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
      [userId]
    );

    // Get recent validations
    const [recent] = await db.query(
      `SELECT
        url,
        verdict,
        rejection_reason,
        validation_time_ms,
        created_at
       FROM url_validation_logs
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId]
    );

    return res.status(200).json({
      stats: stats[0] || {},
      recent_validations: recent
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
