const express = require('express');
const router = express.Router();
const protect = require('../middleware/protected');
const asyncHandler = require('../middleware/asyncHandler');
const Order = require('../models/Order');
const { createRazorpayOrder, verifyRazorpayPayment } = require('../utils/razorpay');
const { createPayPalOrder, capturePayPalOrder } = require('../utils/paypal');

// Create Razorpay order
router.post('/razorpay/create', protect, asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({
      success: false,
      error: 'Order not found'
    });
  }

  if (order.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized'
    });
  }

  const razorpayOrder = await createRazorpayOrder(order.amount, order.currency, order._id.toString());

  order.razorpayOrderId = razorpayOrder.id;
  await order.save();

  res.json({
    success: true,
    data: {
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID
    }
  });
}));

// Verify Razorpay payment
router.post('/razorpay/verify', protect, asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  const isValid = verifyRazorpayPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);

  if (!isValid) {
    return res.status(400).json({
      success: false,
      error: 'Invalid payment signature'
    });
  }

  const order = await Order.findOne({ razorpayOrderId });
  if (!order) {
    return res.status(404).json({
      success: false,
      error: 'Order not found'
    });
  }

  order.status = 'paid';
  order.paymentId = razorpayPaymentId;
  order.paymentDetails = { razorpayPaymentId, razorpaySignature };
  await order.save();

  res.json({
    success: true,
    data: order
  });
}));

// Create PayPal order
router.post('/paypal/create', protect, asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({
      success: false,
      error: 'Order not found'
    });
  }

  if (order.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized'
    });
  }

  const amount = order.currency === 'USD' 
    ? (order.amount / 83).toFixed(2) 
    : (order.amount / 83 / 1.05).toFixed(2);

  const paypalOrder = await createPayPalOrder(amount);

  order.paypalOrderId = paypalOrder.id;
  await order.save();

  res.json({
    success: true,
    data: {
      orderId: paypalOrder.id,
      approveUrl: paypalOrder.links.find(link => link.rel === 'approve').href
    }
  });
}));

// Capture PayPal order
router.post('/paypal/capture', protect, asyncHandler(async (req, res) => {
  const { paypalOrderId } = req.body;

  const order = await Order.findOne({ paypalOrderId });
  if (!order) {
    return res.status(404).json({
      success: false,
      error: 'Order not found'
    });
  }

  if (order.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized'
    });
  }

  const capture = await capturePayPalOrder(paypalOrderId);

  if (capture.status === 'COMPLETED') {
    order.status = 'paid';
    order.paymentId = capture.id;
    order.paymentDetails = capture;
    await order.save();

    res.json({
      success: true,
      data: order
    });
  } else {
    res.status(400).json({
      success: false,
      error: 'Payment not completed'
    });
  }
}));

module.exports = router;
