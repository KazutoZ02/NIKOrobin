const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const asyncHandler = require('../middleware/asyncHandler');
const { sendPaymentEmbed } = require('../config/bot');
const Order = require('../models/Order');
const { verifyPayPalWebhook } = require('../utils/paypal');

// Razorpay Webhook
router.post('/razorpay', asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  // Verify webhook signature
  const generatedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (generatedSignature !== signature) {
    console.error('❌ Invalid Razorpay webhook signature');
    return res.status(400).json({
      success: false,
      message: 'Invalid signature'
    });
  }

  const event = req.body;
  console.log('📦 Razorpay Webhook Event:', event.event);

  // Handle payment success
  if (event.event === 'payment.captured') {
    const payment = event.payload.payment.entity;
    const orderId = payment.notes.internalOrderId?.replace('ROYAL_', '');
    
    if (orderId) {
      const order = await Order.findById(orderId).populate('userId');
      if (order && order.status !== 'paid') {
        order.status = 'paid';
        order.paymentId = payment.id;
        order.paymentDetails = {
          method: 'razorpay',
          ...payment
        };
        await order.save();

        // Send Discord embed
        if (order.userId) {
          await sendPaymentEmbed({
            username: order.username,
            discordId: order.discordId,
            avatar: order.userId.avatar,
            serviceName: order.services.map(s => s.name).join(', '),
            game: order.services[0]?.game || 'N/A',
            amount: order.totalAmount,
            currency: order.currency,
            paymentMethod: 'Razorpay',
            paymentId: payment.id
          });
        }
      }
    }
  }

  // Handle payment failed
  if (event.event === 'payment.failed') {
    const payment = event.payload.payment.entity;
    const orderId = payment.notes.internalOrderId?.replace('ROYAL_', '');
    
    if (orderId) {
      const order = await Order.findById(orderId);
      if (order) {
        order.status = 'failed';
        await order.save();
      }
    }
  }

  res.json({ success: true });
}));

// PayPal Webhook
router.post('/paypal', asyncHandler(async (req, res) => {
  const authHeader = req.headers['paypal-transmission-sig'];
  const transmissionId = req.headers['paypal-transmission-id'];
  const certUrl = req.headers['paypal-cert-url'];
  const timestamp = req.headers['paypal-transmission-time'];

  // Verify webhook signature
  const isValid = await verifyPayPalWebhook({
    authHeader,
    transmissionId,
    certUrl,
    timestamp,
    webhookEvent: req.body
  });

  if (!isValid) {
    console.error('❌ Invalid PayPal webhook signature');
    return res.status(400).json({
      success: false,
      message: 'Invalid signature'
    });
  }

  const event = req.body;
  console.log('📦 PayPal Webhook Event:', event.event_type);

  // Handle order approved
  if (event.event_type === 'CHECKOUT.ORDER.APPROVED') {
    const orderId = event.resource.purchase_units[0].custom_id;
    const order = await Order.findById(orderId).populate('userId');
    
    if (order && order.status === 'pending') {
      // Payment approved but not yet captured
      console.log('✅ PayPal order approved:', orderId);
    }
  }

  // Handle payment capture completed
  if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
    const capture = event.resource;
    const orderId = event.resource.custom_id;
    
    const order = await Order.findById(orderId).populate('userId');
    if (order && order.status !== 'paid') {
      order.status = 'paid';
      order.paymentId = capture.id;
      order.paymentDetails = {
        method: 'paypal',
        ...capture
      };
      await order.save();

      // Send Discord embed
      if (order.userId) {
        await sendPaymentEmbed({
          username: order.username,
          discordId: order.discordId,
          avatar: order.userId.avatar,
          serviceName: order.services.map(s => s.name).join(', '),
          game: order.services[0]?.game || 'N/A',
          amount: order.totalAmount,
          currency: order.currency,
          paymentMethod: 'PayPal',
          paymentId: capture.id
        });
      }
    }
  }

  res.json({ success: true });
}));

module.exports = router;
