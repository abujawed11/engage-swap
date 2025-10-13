const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for auth endpoints
 * 5 requests per minute per IP
 */
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per window
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  // Return 429 status code
  statusCode: 429,
});

/**
 * Rate limiter for campaigns write operations (POST/PATCH/DELETE)
 * 10 requests per minute per IP
 */
const campaignsWriteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many campaign operations, please slow down',
    },
  },
  statusCode: 429,
  // Only apply to POST/PATCH/DELETE
  skip: (req) => req.method === 'GET',
});

module.exports = {
  authLimiter,
  campaignsWriteLimiter,
};
