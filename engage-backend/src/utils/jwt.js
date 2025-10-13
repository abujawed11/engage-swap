const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Sign a JWT token with user claims
 * @param {Object} user - User object with id, username, email, is_admin
 * @returns {string} JWT token
 */
function signToken(user) {
  const payload = {
    sub: user.id,
    uname: user.username,
    email: user.email,
    role: user.is_admin ? 'admin' : 'user',
  };

  // Sign with HS256, expires in 7 days
  return jwt.sign(payload, config.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '7d',
  });
}

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded payload or null if invalid
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, config.JWT_SECRET, {
      algorithms: ['HS256'],
    });
  } catch (err) {
    // Token invalid or expired
    return null;
  }
}

module.exports = {
  signToken,
  verifyToken,
};
