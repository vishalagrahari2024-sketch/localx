const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  username: {
    type: String,
    required: true,
    trim: true,
  },
  text: {
    type: String,
    trim: true,
    default: '',
  },
  mediaUrl: {
    type: String,
    default: '',
    trim: true,
  },
  mediaUrls: [{
    type: String,
    trim: true,
  }],
  mediaType: {
    type: String,
    enum: ['image', 'video', ''],
    default: '',
  },
  isAnnouncement: {
    type: Boolean,
    default: false,
  },
  isPinned: {
    type: Boolean,
    default: false,
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  visibility: {
    type: String,
    enum: ['public', 'department', 'group'],
    default: 'public',
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null,
  },
  likes: [{
    type: String,
  }],
  likesCount: {
    type: Number,
    default: 0,
  },
  comments: [{
    userId: { type: String, required: true },
    username: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  }],
  commentsCount: {
    type: Number,
    default: 0,
  },
  shares: [{
    type: String,
  }],
  bookmarks: [{
    type: String,
  }],
}, {
  timestamps: true,
});

// Text index for search
PostSchema.index({ text: 'text' });
PostSchema.index({ tags: 1 });
PostSchema.index({ createdAt: -1 });
PostSchema.index({ isPinned: -1, createdAt: -1 });

module.exports = mongoose.model('Post', PostSchema);
