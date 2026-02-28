const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/protected');
const asyncHandler = require('../middleware/asyncHandler');
const { paymentLimiter } = require('../middleware/rateLimiter');
const { createRazorpayOrder, verifyRazorpayPayment } = require('../utils/razorpay');
const { createPayPalOrder, capturePayPalOrder } = require('../utils/paypal');
const Order = require('../models/Order');

// Create Razorpay order
router.post('/razorpay/create', protect, paymentLimiter, asyncHandler(async (req, res) => {
  const { orderId, amount, currency } = req.body;

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  const razorpayOrder = await createRazorpayOrder({
    amount: Math.round(amount * 100), // Convert to paise
    currency: currency === 'INR' ? 'INR' : 'USD',
    receipt: order._id.toString(),
    notes: {
      orderId: order._id.toString(),
      userId: req.user.discordId,
      internalOrderId: `ROYAL_${order._id.toString()}`
    }
  });

  // Update order with razorpay order ID
  order.razorpayOrderId = razorpayOrder.id;
  await order.save();

  res.json({
    success: true,
    order: razorpayOrder,
    keyId: process.env.RAZORPAY_KEY_ID
  });
}));

// Verify Razorpay payment
router.post('/razorpay/verify', protect, asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

  const isValid = await verifyRazorpayPayment({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    orderId
  });

  if (!isValid) {
    return res.status(400).json({
      success: false,
      message: 'Payment verification failed'
    });
  }

  const order = await Order.findById(orderId);
  if (order) {
    order.paymentId = razorpayPaymentId;
    order.status = 'paid';
    order.paymentDetails = {
      method: 'razorpay',
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    };
    await order.save();
  }

  res.json({
    success: true,
    message: 'Payment verified successfully',
    order
  });
}));

// Create PayPal order
router.post('/paypal/create', protect, paymentLimiter, asyncHandler(async (req, res) => {
  const { orderId, amount, currency } = req.body;

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  const paypalOrder = await createPayPalOrder({
    amount: amount.toFixed(2),
    currency: currency === 'USD' ? 'USD' : 'USD',
    orderId: order._id.toString()
  });

  // Update order with PayPal order ID
  order.paypalOrderId = paypalOrder.id;
  await order.save();

  res.json({
    success: true,
    order: paypalOrder
  });
}));

// Capture PayPal order
router.post('/paypal/capture', protect, asyncHandler(async (req, res) => {
  const { paypalOrderId, orderId } = req.body;

  const captureData = await capturePayPalOrder(paypalOrderId);

  if (captureData.status !== 'COMPLETED') {
    return res.status(400).json({
      success: false,
      message: 'Payment not completed'
    });
  }

  const order = await Order.findById(orderId);
  if (order) {
    order.paymentId = captureData.purchase_units[0].payments.captures[0].id;
    order.status = 'paid';
    order.paymentDetails = {
      method: 'paypal',
      paypalOrderId,
      captureId: captureData.purchase_units[0].payments.captures[0].id
    };
    await order.save();
  }

  res.json({
    success: true,
    message: 'Payment captured successfully',
    order
  });
}));

module.exports = router;
