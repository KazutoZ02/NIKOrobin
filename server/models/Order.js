const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  discordId: {
    type: String,
    required: true
  },
  service: {
    type: String,
    required: true
  },
  game: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  amount: {
    type: Number,
    required: true
  },
  originalAmount: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    enum: ['INR', 'USD'],
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'paypal'],
    required: true
  },
  paymentId: {
    type: String,
    default: null
  },
  razorpayOrderId: {
    type: String,
    default: null
  },
  paypalOrderId: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
