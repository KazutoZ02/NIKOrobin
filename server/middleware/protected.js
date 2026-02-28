const asyncHandler = require('./asyncHandler');

const protect = asyncHandler(async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized, please login'
    });
  }
  next();
});

module.exports = protect;
