const config = require('../config');

/**
 * Simple request logger for development
 */
function requestLogger(req, res, next) {
  if (config.NODE_ENV !== 'development') {
    return next();
  }

  const start = Date.now();

  // Log after response is sent
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.url} - ${res.statusCode} (${duration}ms)`);
  });

  next();
}

module.exports = requestLogger;
