const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const asyncHandler = require('../middleware/asyncHandler');
const Order = require('../models/Order');
const User = require('../models/User');
const { sendPaymentEmbed } = require('../config/bot');

// Razorpay Webhook
router.post('/razorpay', asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return res.status(400).json({ error: 'Missing signature or secret' });
  }

  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (signature !== expectedSignature) {
    console.error('[Webhook] Invalid Razorpay signature');
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const event = req.body;

  if (event.event === 'payment.captured') {
    const razorpayOrderId = event.payload.payment.entity.order_id;

    const order = await Order.findOne({ razorpayOrderId });
    if (order && order.status === 'pending') {
      order.status = 'paid';
      order.paymentId = event.payload.payment.entity.id;
      order.paymentDetails = event.payload.payment.entity;
      await order.save();

      // Send Discord embed
      const user = await User.findById(order.userId);
      if (user) {
        await sendPaymentEmbed({
          user: {
            discordId: user.discordId,
            username: user.username,
            avatar: user.avatar
          },
          service: order.service,
          game: order.game,
          amount: order.amount,
          currency: order.currency,
          paymentMethod: 'Razorpay'
        });
      }
    }
  }

  res.json({ received: true });
}));

// PayPal Webhook
router.post('/paypal', asyncHandler(async (req, res) => {
  const webhookEvent = req.body;
  
  console.log('[Webhook] PayPal event received:', webhookEvent.event_type);

  if (webhookEvent.event_type === 'CHECKOUT.ORDER.APPROVED') {
    // Order approved - actual capture happens via API
  }

  if (webhookEvent.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
    const customId = webhookEvent.resource.custom_id;
    
    if (customId) {
      const order = await Order.findById(customId);
      if (order && order.status === 'pending') {
        order.status = 'paid';
        order.paymentId = webhookEvent.resource.id;
        order.paymentDetails = webhookEvent.resource;
        await order.save();

        // Send Discord embed
        const user = await User.findById(order.userId);
        if (user) {
          await sendPaymentEmbed({
            user: {
              discordId: user.discordId,
              username: user.username,
              avatar: user.avatar
            },
            service: order.service,
            game: order.game,
            amount: order.amount,
            currency: order.currency,
            paymentMethod: 'PayPal'
          });
        }
      }
    }
  }

  res.json({ received: true });
}));

// YouTube Webhook (PubSubHubbub)
router.post('/youtube', asyncHandler(async (req, res) => {
  // Handle YouTube notifications if configured
  console.log('[Webhook] YouTube notification received');
  res.status(200).send('OK');
}));

router.get('/youtube', (req, res) => {
  const hubChallenge = req.query['hub.challenge'];
  const hubMode = req.query['hub.mode'];

  if (hubMode === 'subscribe' || hubMode === 'unsubscribe') {
    res.status(200).type('text/plain').send(hubChallenge?.toString() || '');
  } else {
    res.status(400).send('Invalid mode');
  }
});

module.exports = router;
