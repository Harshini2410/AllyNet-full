const { verifyAccessToken } = require('../utils/jwt');
const { User } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Authentication Middleware
 * Verifies JWT access token and attaches user to request object
 */

/**
 * Protect Routes - Verify JWT token
 * Attaches user to req.user if token is valid
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 401,
        message: 'Not authorized - No token provided'
      }
    });
  }

  try {
    // Verify token
    const decoded = verifyAccessToken(token);

    // Get user from database (excluding password)
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 401,
          message: 'User not found'
        }
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          code: 401,
          message: 'User account is inactive'
        }
      });
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        error: {
          code: 403,
          message: 'User account is blocked',
          details: user.blockedReason || 'Contact support for more information'
        }
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 401,
          message: 'Token expired'
        }
      });
    }

    return res.status(401).json({
      success: false,
      error: {
        code: 401,
        message: 'Not authorized - Invalid token'
      }
    });
  }
});

/**
 * Authorization Middleware - Role-based access control
 * @param {...String} roles - Allowed roles
 * @returns {Function} Middleware function
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 401,
          message: 'Not authorized - User not authenticated'
        }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 403,
          message: `User role '${req.user.role}' is not authorized to access this route`,
          requiredRoles: roles
        }
      });
    }

    next();
  };
};

/**
 * Optional Auth Middleware
 * Attaches user if token is present, but doesn't require it
 * Useful for routes that work both for authenticated and unauthenticated users
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive && !user.isBlocked) {
        req.user = user;
      }
    } catch (error) {
      // Silently fail - user will be undefined
    }
  }

  next();
});

module.exports = {
  protect,
  authorize,
  optionalAuth
};

