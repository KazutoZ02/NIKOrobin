const crypto = require('crypto');
const axios = require('axios');

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

const razorpay = axios.create({
  baseURL: 'https://api.razorpay.com/v1',
  auth: {
    username: RAZORPAY_KEY_ID,
    password: RAZORPAY_KEY_SECRET
  }
});

const createRazorpayOrder = async (amount, currency, orderId) => {
  try {
    const response = await razorpay.post('/orders', {
      amount: Math.round(amount * 100), // Convert to paise
      currency: currency === 'INR' ? 'INR' : 'USD',
      notes: {
        internalOrderId: orderId
      }
    });

    return response.data;
  } catch (error) {
    console.error('[Razorpay] Create order error:', error.response?.data || error.message);
    throw new Error('Failed to create Razorpay order');
  }
};

const verifyRazorpayPayment = (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  try {
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    return razorpaySignature === expectedSignature;
  } catch (error) {
    console.error('[Razorpay] Verify error:', error.message);
    return false;
  }
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment
};
