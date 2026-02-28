const mongoose = require('mongoose');

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
  discriminator: {
    type: String,
    default: '0'
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'vip'],
    default: 'user'
  },
  isMember: {
    type: Boolean,
    default: false
  },
  memberSince: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
