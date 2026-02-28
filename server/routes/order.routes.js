const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/protected');
const asyncHandler = require('../middleware/asyncHandler');
const Order = require('../models/Order');

// Create order
router.post('/', protect, asyncHandler(async (req, res) => {
  const { services, totalAmount, currency, paymentMethod } = req.body;

  if (!services || services.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No services provided'
    });
  }

  const order = await Order.create({
    userId: req.user._id,
    discordId: req.user.discordId,
    username: req.user.username,
    services,
    totalAmount,
    currency,
    paymentMethod,
    paymentId: `temp_${Date.now()}`,
    status: 'pending'
  });

  res.status(201).json({
    success: true,
    order
  });
}));

// Get order by ID
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    discordId: req.user.discordId
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  res.json({
    success: true,
    order
  });
}));

// Get all orders (admin)
router.get('/', protect, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  
  const query = {};
  if (status) query.status = status;

  const orders = await Order.find(query)
    .populate('userId', 'username avatar discordId')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await Order.countDocuments(query);

  res.json({
    success: true,
    orders,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    totalOrders: count
  });
}));

module.exports = router;
