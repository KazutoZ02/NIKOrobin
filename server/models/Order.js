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
  username: {
    type: String,
    required: true
  },
  services: [{
    serviceId: String,
    name: String,
    game: String,
    price: Number,
    currency: String,
    quantity: {
      type: Number,
      default: 1
    }
  }],
  totalAmount: {
    type: Number,
    required: true
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
    required: true
  },
  razorpayOrderId: String,
  paypalOrderId: String,
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentDetails: {
    email: String,
    contact: String,
    method: String
  }
}, {
  timestamps: true
});

// Indexes
orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ discordId: 1 });

module.exports = mongoose.model('Order', orderSchema);
