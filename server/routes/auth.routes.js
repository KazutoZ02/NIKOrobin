const express = require('express');
const router = express.Router();
const passport = require('passport');
const { authLimiter } = require('../middleware/rateLimiter');
const { protect } = require('../middleware/protected');
const asyncHandler = require('../middleware/asyncHandler');

// Discord OAuth routes
router.get('/discord', authLimiter, passport.authenticate('discord', { scope: ['identify'] }));

router.get('/discord/callback',
  authLimiter,
  passport.authenticate('discord', { 
    failureRedirect: '/?error=auth_failed',
    successRedirect: '/dashboard'
  })
);

// Get current user
router.get('/me', protect, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      discordId: req.user.discordId,
      username: req.user.username,
      avatar: req.user.avatar,
      role: req.user.role,
      isPremium: req.user.isPremium,
      premiumExpiresAt: req.user.premiumExpiresAt
    }
  });
}));

// Logout
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });
});

module.exports = router;
