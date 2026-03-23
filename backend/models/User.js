const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,

    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  collegeId: {
    type: String,
    trim: true,
    default: '',
  },
  role: {
    type: String,
    enum: ['student', 'faculty', 'admin'],
    default: 'student',
  },
  department: {
    type: String,
    trim: true,
    default: '',
  },
  year: {
    type: String,
    trim: true,
    default: '',
  },
  designation: {
    type: String,
    trim: true,
    default: '',
  },
  bio: {
    type: String,
    maxlength: 160,
    default: '',
  },
  avatar: {
    type: String,
    default: '',
  },
  coverPhoto: {
    type: String,
    default: '',
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  savedPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
  }],
  darkMode: {
    type: Boolean,
    default: false,
  },
  isSuspended: {
    type: Boolean,
    default: false,
  },
  provider: {
    type: String,
    enum: ['email', 'google'],
    default: 'email',
  },
}, {
  timestamps: true,
});

// Virtual for follower/following count
UserSchema.virtual('followersCount').get(function () {
  return this.followers ? this.followers.length : 0;
});

UserSchema.virtual('followingCount').get(function () {
  return this.following ? this.following.length : 0;
});

UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', UserSchema);
