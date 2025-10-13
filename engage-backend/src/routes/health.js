const express = require('express');
const db = require('../db');

const router = express.Router();

/**
 * GET /healthz
 * Health check endpoint that verifies database connectivity
 */
router.get('/healthz', async (req, res) => {
  try {
    // Try to ping the database
    await db.query('SELECT 1');

    res.status(200).json({
      ok: true,
      db: 'up',
    });
  } catch (err) {
    console.error('[Health] Database check failed:', err.message);

    res.status(503).json({
      ok: false,
      error: {
        code: 'DB_DOWN',
        message: 'Database connection failed',
      },
    });
  }
});

module.exports = router;
