const express = require('express');
const router = express.Router();
const passport = require('passport');
const asyncHandler = require('../middleware/asyncHandler');

// Discord OAuth
router.get('/discord', passport.authenticate('discord'));

router.get(
  '/discord/callback',
  passport.authenticate('discord', { failureRedirect: '/' }),
  asyncHandler(async (req, res) => {
    // Successful authentication
    res.redirect(process.env.CLIENT_URL || 'http://localhost:5173');
  })
);

// Logout
router.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect(process.env.CLIENT_URL || 'http://localhost:5173');
  });
});

// Get current user
router.get('/me', asyncHandler(async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated'
    });
  }

  res.json({
    success: true,
    data: {
      id: req.user._id,
      discordId: req.user.discordId,
      username: req.user.username,
      avatar: req.user.avatar,
      discriminator: req.user.discriminator,
      role: req.user.role,
      isMember: req.user.isMember,
      memberSince: req.user.memberSince
    }
  });
}));

module.exports = router;
