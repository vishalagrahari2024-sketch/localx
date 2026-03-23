const mongoose = require('mongoose');

const GroupMemberSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['owner', 'moderator', 'member'],
    default: 'member',
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const GroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: '',
  },
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [GroupMemberSchema],
  coverImage: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    enum: ['club', 'department', 'study', 'event', 'other'],
    default: 'other',
  },
}, {
  timestamps: true,
});

GroupSchema.virtual('memberCount').get(function () {
  return this.members.length;
});

GroupSchema.set('toJSON', { virtuals: true });
GroupSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Group', GroupSchema);
