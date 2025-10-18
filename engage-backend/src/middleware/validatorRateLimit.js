/**
 * Rate Limiting Middleware for URL Validator
 *
 * Implements per-user and per-IP rate limiting for URL validation requests.
 * Limits: 10 requests per minute per user, 50 requests per minute per IP
 */

const db = require('../db');

// Rate limit windows in milliseconds
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

// Rate limit thresholds
const LIMITS = {
  USER: 10,  // 10 requests per minute per authenticated user
  IP: 50     // 50 requests per minute per IP address
};

/**
 * Clean up old rate limit records (older than 2 minutes)
 */
async function cleanupOldRecords() {
  try {
    const cutoffTime = new Date(Date.now() - (2 * 60 * 1000)); // 2 minutes ago
    await db.query(
      'DELETE FROM url_validator_rate_limits WHERE window_start < ?',
      [cutoffTime]
    );
  } catch (error) {
    console.error('Failed to cleanup rate limit records:', error);
  }
}

/**
 * Check and update rate limit for a given identifier
 */
async function checkRateLimit(identifier, identifierType, limit) {
  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW);

  try {
    // Get current count for this identifier within the window
    const [rows] = await db.query(
      `SELECT id, request_count, window_start
       FROM url_validator_rate_limits
       WHERE identifier = ?
         AND identifier_type = ?
         AND window_start >= ?
       ORDER BY window_start DESC
       LIMIT 1`,
      [identifier, identifierType, windowStart]
    );

    if (rows.length === 0) {
      // No recent requests - create new record
      await db.query(
        `INSERT INTO url_validator_rate_limits (identifier, identifier_type, request_count, window_start)
         VALUES (?, ?, 1, ?)`,
        [identifier, identifierType, now]
      );
      return {
        allowed: true,
        current: 1,
        limit,
        resetAt: new Date(now.getTime() + RATE_LIMIT_WINDOW)
      };
    }

    const record = rows[0];
    const currentCount = record.request_count;

    // Check if limit exceeded
    if (currentCount >= limit) {
      const resetAt = new Date(record.window_start.getTime() + RATE_LIMIT_WINDOW);
      return {
        allowed: false,
        current: currentCount,
        limit,
        resetAt
      };
    }

    // Increment counter
    await db.query(
      'UPDATE url_validator_rate_limits SET request_count = request_count + 1 WHERE id = ?',
      [record.id]
    );

    return {
      allowed: true,
      current: currentCount + 1,
      limit,
      resetAt: new Date(record.window_start.getTime() + RATE_LIMIT_WINDOW)
    };

  } catch (error) {
    console.error('Rate limit check failed:', error);
    // On error, allow the request (fail open for availability)
    return {
      allowed: true,
      current: 0,
      limit,
      resetAt: new Date(now.getTime() + RATE_LIMIT_WINDOW)
    };
  }
}

/**
 * Express middleware for URL validator rate limiting
 */
async function validatorRateLimit(req, res, next) {
  const userId = req.user?.id;
  const ipAddress = req.ip || req.connection.remoteAddress;

  try {
    // Cleanup old records periodically (1% chance per request)
    if (Math.random() < 0.01) {
      cleanupOldRecords().catch(err => console.error('Cleanup failed:', err));
    }

    // Check user-based rate limit (if authenticated)
    if (userId) {
      const userLimit = await checkRateLimit(userId.toString(), 'USER', LIMITS.USER);

      if (!userLimit.allowed) {
        const retryAfter = Math.ceil((userLimit.resetAt - Date.now()) / 1000);
        return res.status(429).json({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Too many validation requests. Please try again in ${retryAfter} seconds.`,
            retry_after_seconds: retryAfter,
            limit: userLimit.limit,
            reset_at: userLimit.resetAt.toISOString()
          }
        });
      }

      // Add rate limit info to response headers
      res.set({
        'X-RateLimit-Limit': userLimit.limit.toString(),
        'X-RateLimit-Remaining': (userLimit.limit - userLimit.current).toString(),
        'X-RateLimit-Reset': userLimit.resetAt.toISOString()
      });
    }

    // Check IP-based rate limit (always)
    const ipLimit = await checkRateLimit(ipAddress, 'IP', LIMITS.IP);

    if (!ipLimit.allowed) {
      const retryAfter = Math.ceil((ipLimit.resetAt - Date.now()) / 1000);
      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Too many validation requests from this IP. Please try again in ${retryAfter} seconds.`,
          retry_after_seconds: retryAfter,
          limit: ipLimit.limit,
          reset_at: ipLimit.resetAt.toISOString()
        }
      });
    }

    // If user limit wasn't checked, add IP limit info to headers
    if (!userId) {
      res.set({
        'X-RateLimit-Limit': ipLimit.limit.toString(),
        'X-RateLimit-Remaining': (ipLimit.limit - ipLimit.current).toString(),
        'X-RateLimit-Reset': ipLimit.resetAt.toISOString()
      });
    }

    next();

  } catch (error) {
    console.error('Rate limit middleware error:', error);
    // On error, allow the request to proceed
    next();
  }
}

module.exports = validatorRateLimit;
