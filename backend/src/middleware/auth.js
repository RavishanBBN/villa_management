const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Secret key for JWT (should be in environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'halcyon_rest_secret_key_2025_secure';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days
const JWT_REFRESH_EXPIRES_IN = '30d'; // Refresh token expires in 30 days

/**
 * Verify JWT token middleware
 * Extracts and verifies the JWT token from Authorization header
 */
const verifyToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Please login to continue.'
      });
    }

    // Extract token
    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user from database
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] } // Exclude password from response
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Token is invalid.'
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: `Account is ${user.status}. Please contact administrator.`
      });
    }

    // Attach user to request object
    req.user = user;
    req.userId = user.id;
    req.userRole = user.role;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }

    console.error('Token verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed. Please try again.'
    });
  }
};

/**
 * Role-based access control middleware
 * Checks if user has required role(s) to access the route
 * @param {string|string[]} roles - Required role(s) for the route
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // Super admin has access to everything
    if (req.user.role === 'super_admin') {
      return next();
    }

    // Check if user has required role
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`
      });
    }

    next();
  };
};

/**
 * Permission-based access control middleware
 * Checks if user has specific permission
 * @param {string} permission - Required permission
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // Super admin has all permissions
    if (req.user.role === 'super_admin') {
      return next();
    }

    // Check if user has the required permission
    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required permission: ${permission}`
      });
    }

    next();
  };
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // No token, continue without user
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] }
    });

    if (user && user.status === 'active') {
      req.user = user;
      req.userId = user.id;
      req.userRole = user.role;
    }

    next();
  } catch (error) {
    // Token invalid or expired, continue without user
    next();
  }
};

/**
 * Generate JWT access token
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Generate JWT refresh token
 * @param {Object} user - User object
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      type: 'refresh'
    },
    JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );
};

/**
 * Verify refresh token
 * @param {string} token - Refresh token
 * @returns {Object} Decoded token payload
 */
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid refresh token');
    }
    
    return decoded;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  verifyToken,
  requireRole,
  requirePermission,
  optionalAuth,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN
};
