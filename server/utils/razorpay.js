const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const createRazorpayOrder = async ({ amount, currency, receipt, notes }) => {
  try {
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt,
      notes
    });
    return order;
  } catch (error) {
    console.error('Razorpay Order Creation Error:', error);
    throw new Error('Failed to create Razorpay order');
  }
};

const verifyRazorpayPayment = async ({ razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId }) => {
  try {
    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (generatedSignature !== razorpaySignature) {
      console.error('❌ Signature mismatch');
      return false;
    }

    // Verify order exists
    const order = await Order.findById(orderId);
    if (!order || order.razorpayOrderId !== razorpayOrderId) {
      console.error('❌ Order mismatch');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Razorpay Verification Error:', error);
    return false;
  }
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
  razorpay
};
