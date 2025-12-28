const jwt = require('jsonwebtoken');

/**
 * JWT Utility Functions
 * Handle token generation and verification
 */

/**
 * Generate Access Token (short-lived)
 * @param {Object} payload - User data to encode (userId, email, role)
 * @returns {String} JWT access token
 */
const generateAccessToken = (payload) => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '1h';

  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      role: payload.role
    },
    secret,
    { expiresIn }
  );
};

/**
 * Generate Refresh Token (long-lived)
 * @param {Object} payload - User data to encode
 * @returns {String} JWT refresh token
 */
const generateRefreshToken = (payload) => {
  const secret = process.env.JWT_REFRESH_SECRET;
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');
  }

  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      type: 'refresh' // Distinguish from access token
    },
    secret,
    { expiresIn }
  );
};

/**
 * Verify Access Token
 * @param {String} token - JWT access token
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
const verifyAccessToken = (token) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  try {
    return jwt.verify(token, secret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      const expiredError = new Error('Access token expired');
      expiredError.name = 'TokenExpiredError';
      throw expiredError;
    }
    if (error.name === 'JsonWebTokenError') {
      const invalidError = new Error('Invalid access token');
      invalidError.name = 'JsonWebTokenError';
      throw invalidError;
    }
    throw error;
  }
};

/**
 * Verify Refresh Token
 * @param {String} token - JWT refresh token
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
const verifyRefreshToken = (token) => {
  const secret = process.env.JWT_REFRESH_SECRET;

  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');
  }

  try {
    const decoded = jwt.verify(token, secret);
    
    // Ensure it's a refresh token
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      const expiredError = new Error('Refresh token expired');
      expiredError.name = 'TokenExpiredError';
      throw expiredError;
    }
    if (error.name === 'JsonWebTokenError') {
      const invalidError = new Error('Invalid refresh token');
      invalidError.name = 'JsonWebTokenError';
      throw invalidError;
    }
    throw error;
  }
};

/**
 * Generate both access and refresh tokens
 * @param {Object} user - User object with id, email, role
 * @returns {Object} { accessToken, refreshToken }
 */
const generateTokenPair = (user) => {
  const payload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role
  };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload)
  };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokenPair
};

