const express = require('express');
const router = express.Router();
const protect = require('../middleware/protected');
const asyncHandler = require('../middleware/asyncHandler');
const User = require('../models/User');
const Order = require('../models/Order');

// Get user profile
router.get('/profile', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  res.json({
    success: true,
    data: user
  });
}));

// Get user orders
router.get('/orders', protect, asyncHandler(async (req, res) => {
  const orders = await Order.find({ userId: req.user._id })
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: orders
  });
}));

// Get user active services
router.get('/services', protect, asyncHandler(async (req, res) => {
  const activeOrders = await Order.find({ 
    userId: req.user._id,
    status: 'paid'
  }).sort({ createdAt: -1 });

  res.json({
    success: true,
    data: activeOrders
  });
}));

module.exports = router;
