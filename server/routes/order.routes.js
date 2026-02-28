const express = require('express');
const router = express.Router();
const protect = require('../middleware/protected');
const asyncHandler = require('../middleware/asyncHandler');
const Order = require('../models/Order');

// Get all orders (admin only in future)
router.get('/', protect, asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate('userId', 'username avatar discordId')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: orders
  });
}));

// Get single order
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({
      success: false,
      error: 'Order not found'
    });
  }

  // Check ownership
  if (order.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized'
    });
  }

  res.json({
    success: true,
    data: order
  });
}));

// Create order
router.post('/', protect, asyncHandler(async (req, res) => {
  const { service, game, description, amount, currency, paymentMethod } = req.body;

  const order = await Order.create({
    userId: req.user._id,
    discordId: req.user.discordId,
    service,
    game,
    description,
    amount,
    currency,
    paymentMethod,
    status: 'pending'
  });

  res.status(201).json({
    success: true,
    data: order
  });
}));

module.exports = router;
