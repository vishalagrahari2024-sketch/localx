const mongoose = require('mongoose');

// Mock User & Group to prevent missing ref warnings
mongoose.model('User', new mongoose.Schema({}));
mongoose.model('Group', new mongoose.Schema({}));

const Post = require('./models/Post');

async function test() {
  try {
    const newPost = new Post({
      userId: 'test_uid',
      authorId: new mongoose.Types.ObjectId(),
      username: 'Test User',
      text: 'Hello World',
      mediaUrl: '',
      mediaUrls: [],
      mediaType: '',
      tags: [],
      visibility: 'public',
      isAnnouncement: false,
      isPinned: false,
      groupId: null,
    });

    await newPost.validate();
    console.log("Validation passed!");
  } catch (error) {
    console.error("Validation failed:", error.message);
  }
}

test();
