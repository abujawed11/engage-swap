const { verifyToken } = require('../utils/jwt');

/**
 * Middleware to require authentication via JWT Bearer token
 * Attaches decoded user to req.user
 */
async function authRequired(req, res, next) {
  // Extract token from Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
  }

  const token = authHeader.substring(7); // Remove "Bearer "

  // Verify token
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token',
      },
    });
  }

  // Attach user to request
  req.user = {
    id: decoded.sub,
    username: decoded.uname,
    email: decoded.email,
    role: decoded.role,
    is_admin: decoded.role === 'admin', // Add is_admin flag based on role
  };

  // Check if user account is disabled (fetch from DB)
  const db = require('../db');
  const [users] = await db.query(
    'SELECT is_disabled FROM users WHERE id = ? LIMIT 1',
    [req.user.id]
  );

  if (users.length > 0 && users[0].is_disabled) {
    return res.status(403).json({
      error: {
        code: 'ACCOUNT_DISABLED',
        message: 'Your account has been disabled. Please contact support.',
      },
    });
  }

  next();
}

module.exports = authRequired;
