const { verifyToken } = require('../utils/jwt');

/**
 * Middleware to require authentication via JWT Bearer token
 * Attaches decoded user to req.user
 */
function authRequired(req, res, next) {
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
  };

  next();
}

module.exports = authRequired;
