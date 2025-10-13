const express = require('express');
const cors = require('cors');
const config = require('./src/config');
const db = require('./src/db');
const requestLogger = require('./src/middleware/requestLogger');
const { notFoundHandler, errorHandler } = require('./src/middleware/errorHandler');
const healthRouter = require('./src/routes/health');

const app = express();

// ─── Middleware ───
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(requestLogger);

// ─── Routes ───
app.use('/', healthRouter);

// ─── Error Handlers ───
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Server Startup ───
async function startServer() {
  try {
    // Initialize database pool
    console.log('[Server] Initializing database connection...');
    db.createPool(config);

    // Test database connectivity
    const dbUp = await db.pingDatabase();
    if (dbUp) {
      console.log('[Server] ✓ Database connected successfully');
    } else {
      console.warn('[Server] ⚠ Database ping failed (server will still start)');
    }

    // Start Express server
    app.listen(config.PORT, () => {
      console.log(`[Server] Running on port ${config.PORT}`);
      console.log(`[Server] Environment: ${config.NODE_ENV}`);
      console.log(`[Server] CORS allowed origins: ${config.CORS_ORIGIN.join(', ')}`);
    });
  } catch (err) {
    console.error('[Server] Failed to start:', err.message);
    process.exit(1);
  }
}

// Start the server
startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received, shutting down gracefully');
  process.exit(0);
});
