/**
 * Admin Authentication Middleware
 * Ensures that only users with is_admin = 1 can access admin routes
 */

function requireAdmin(req, res, next) {
  // Check if user is authenticated
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
  }

  // Check if user is admin
  if (!req.user.is_admin) {
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required',
      },
    });
  }

  // User is authenticated and is admin
  next();
}

module.exports = { requireAdmin };
