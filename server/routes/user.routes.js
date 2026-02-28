const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/protected');
const asyncHandler = require('../middleware/asyncHandler');
const User = require('../models/User');
const Order = require('../models/Order');

// Get user profile with purchase history
router.get('/profile', protect, asyncHandler(async (req, res) => {
  const orders = await Order.find({ 
    discordId: req.user.discordId,
    status: 'paid'
  }).sort({ createdAt: -1 });

  res.json({
    success: true,
    user: {
      id: req.user._id,
      discordId: req.user.discordId,
      username: req.user.username,
      avatar: req.user.avatar,
      role: req.user.role,
      isPremium: req.user.isPremium,
      premiumSince: req.user.premiumSince,
      premiumExpiresAt: req.user.premiumExpiresAt,
      createdAt: req.user.createdAt
    },
    orders,
    totalOrders: orders.length
  });
}));

// Get user orders
router.get('/orders', protect, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  
  const orders = await Order.find({ discordId: req.user.discordId })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await Order.countDocuments({ discordId: req.user.discordId });

  res.json({
    success: true,
    orders,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    totalOrders: count
  });
}));

module.exports = router;
