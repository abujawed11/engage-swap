const config = require('../config');

/**
 * 404 handler for unknown routes
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
  });
}

/**
 * Global error handler
 */
function errorHandler(err, req, res, next) {
  // Log error in all environments
  console.error('[Error]', err);

  // Default to 500
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL';
  const message = err.message || 'Something went wrong';

  // In production, don't leak stack traces
  const response = {
    error: {
      code: errorCode,
      message: config.NODE_ENV === 'production' ? 'Something went wrong' : message,
    },
  };

  res.status(statusCode).json(response);
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
