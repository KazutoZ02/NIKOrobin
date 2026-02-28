const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  discordId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  username: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  accessToken: String,
  refreshToken: String,
  isPremium: {
    type: Boolean,
    default: false
  },
  premiumSince: Date,
  premiumExpiresAt: Date
}, {
  timestamps: true
});

// Index for faster queries
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);
