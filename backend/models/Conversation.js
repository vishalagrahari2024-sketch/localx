const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  lastMessage: {
    type: String,
    default: '',
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
  },
  isGroup: {
    type: Boolean,
    default: false,
  },
  name: {
    type: String,
    trim: true,
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  groupAvatar: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

// Index for finding conversations by participant
ConversationSchema.index({ participants: 1 });

module.exports = mongoose.model('Conversation', ConversationSchema);
