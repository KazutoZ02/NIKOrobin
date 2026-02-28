const asyncHandler = require('./asyncHandler');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, please login'
    });
  }
  next();
});

const adminOnly = asyncHandler(async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, please login'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied, admin only'
    });
  }
  next();
});

module.exports = { protect, adminOnly };
