const express = require('express');
const db = require('../db');
const authRequired = require('../middleware/authRequired');

const router = express.Router();

/**
 * GET /me
 * Get current authenticated user profile
 */
router.get('/me', authRequired, async (req, res, next) => {
  try {
    // Fetch user from database
    const [users] = await db.query(
      `SELECT id, username, email, coins, is_admin
       FROM users
       WHERE id = ?
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
      username: user.username,
      email: user.email,
      coins: user.coins,
      is_admin: user.is_admin === 1,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
