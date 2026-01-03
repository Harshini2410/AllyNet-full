const { verifyAccessToken } = require('../utils/jwt');
const { User } = require('../models');

/**
 * Socket.IO Authentication Middleware
 * Verifies JWT token from socket handshake and attaches user to socket
 */
const socketAuth = async (socket, next) => {
  try {
    // Get token from handshake auth or query
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    if (!user.isActive || user.isBlocked) {
      return next(new Error('Authentication error: User account is inactive or blocked'));
    }

    // Attach user to socket
    socket.user = user;
    socket.userId = user._id.toString();
    socket.userRole = user.role;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new Error('Authentication error: Token expired'));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new Error('Authentication error: Invalid token'));
    }
    return next(new Error('Authentication error: ' + error.message));
  }
};

module.exports = socketAuth;

