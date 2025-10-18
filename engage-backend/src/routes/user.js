const express = require('express');
const db = require('../db');
const authRequired = require('../middleware/authRequired');

const router = express.Router();

/**
 * GET /me
 * Get current authenticated user profile
 * Returns wallet balance (wallets.available) as coins - source of truth
 */
router.get('/me', authRequired, async (req, res, next) => {
  try {
    // Fetch user from database with wallet balance
    const [users] = await db.query(
      `SELECT
        u.id,
        u.public_id,
        u.username,
        u.email,
        u.is_admin,
        COALESCE(w.available, 0.000) as coins
       FROM users u
       LEFT JOIN wallets w ON u.id = w.user_id
       WHERE u.id = ?
       LIMIT 1`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    const user = users[0];

    res.status(200).json({
      id: user.id,
      public_id: user.public_id,
      username: user.username,
      email: user.email,
      coins: parseFloat(user.coins), // wallets.available is now the source of truth
      is_admin: user.is_admin === 1,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
