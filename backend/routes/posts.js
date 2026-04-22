const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware');
const { attachDbUser, requireRole } = require('../middleware/roleCheck');
const cloudinary = require('../cloudinary');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Cloudinary storage config
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'localx_posts',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov'],
    resource_type: 'auto',
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB for videos
});

// All routes require auth
router.use(authMiddleware, attachDbUser);

// GET /api/posts — Feed with cursor pagination
router.get('/', async (req, res) => {
  try {
    const { cursor, limit = 20, search, tag, visibility } = req.query;
    const query = {};

    if (cursor) {
      query._id = { $lt: cursor };
    }

    if (search) {
      query.$or = [
        { text: { $regex: search, $options: 'i' } },
        { tags: { $in: [search.toLowerCase()] } },
      ];
    }

    if (tag) {
      query.tags = tag.toLowerCase();
    }

    if (visibility) {
      query.visibility = visibility;
    } else {
      // Default: show public posts + user's department posts
      const visibilityConditions = [{ visibility: 'public' }];
      if (req.dbUser.department) {
        visibilityConditions.push({
          visibility: 'department',
          tags: req.dbUser.department.toLowerCase(),
        });
      }
      
      if (query.$or) {
        query.$and = [
          { $or: query.$or },
          { $or: visibilityConditions }
        ];
        delete query.$or;
      } else {
        query.$or = visibilityConditions;
      }
    }

    const posts = await Post.find(query)
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(parseInt(limit) + 1);

    const hasMore = posts.length > parseInt(limit);
    const results = hasMore ? posts.slice(0, -1) : posts;
    const nextCursor = hasMore ? results[results.length - 1]._id : null;

    res.json({
      posts: results,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({ message: 'Error fetching feed' });
  }
});

// GET /api/posts/announcements — Pinned announcements
router.get('/announcements', async (req, res) => {
  try {
    const announcements = await Post.find({ isAnnouncement: true, isPinned: true })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching announcements' });
  }
});

// POST /api/posts — Create post
router.post('/', upload.array('media', 4), async (req, res) => {
  try {
    const { text, tags, visibility, isAnnouncement, groupId } = req.body;
    const userId = req.user.uid;
    const username = req.dbUser.name;

    const mediaUrls = req.files ? req.files.map(f => f.path) : [];
    const mediaUrl = mediaUrls[0] || '';
    const mediaType = req.files && req.files.length > 0
      ? (req.files[0].mimetype?.startsWith('video') ? 'video' : 'image')
      : '';

    // Only faculty/admin can create announcements
    const canAnnounce = ['faculty', 'admin'].includes(req.dbUser.role);

    if ((!text || text.trim().length === 0) && mediaUrls.length === 0) {
      return res.status(400).json({ message: 'Post must have text or media.' });
    }

    const parsedTags = tags
      ? (typeof tags === 'string' ? tags.split(',').map(t => t.trim().toLowerCase()) : tags)
      : [];

    const newPost = new Post({
      userId,
      authorId: req.dbUser._id,
      username,
      text: text?.trim() || '',
      mediaUrl,
      mediaUrls,
      mediaType,
      tags: parsedTags,
      visibility: visibility || 'public',
      isAnnouncement: canAnnounce && isAnnouncement === 'true',
      isPinned: canAnnounce && isAnnouncement === 'true',
      groupId: groupId || null,
    });

    const post = await newPost.save();

    // Broadcast via Socket.IO
    if (req.app.get('io')) {
      req.app.get('io').emit('new-post', post);
    }

    res.status(201).json({ message: 'Post created successfully!', post });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Server error during post creation', error: error.message, stack: error.stack });
  }
});

// GET /api/posts/:postId
router.get('/:postId', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching post' });
  }
});

// DELETE /api/posts/:postId
router.delete('/:postId', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Only author or admin can delete
    if (post.userId !== req.user.uid && req.dbUser.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(req.params.postId);
    res.json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting post' });
  }
});

// POST /api/posts/:postId/like — Toggle like
router.post('/:postId/like', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const uid = req.user.uid;
    const isLiked = post.likes.includes(uid);

    if (isLiked) {
      post.likes = post.likes.filter(id => id !== uid);
    } else {
      post.likes.push(uid);

      // Notification for like (only if liker is not post author)
      if (post.userId !== uid) {
        await Notification.create({
          recipientId: post.authorId || post.userId,
          senderId: req.dbUser._id,
          type: 'like',
          refId: post._id,
          refModel: 'Post',
          message: `${req.dbUser.name} liked your post`,
        });
      }
    }

    post.likesCount = post.likes.length;
    await post.save();

    // Real-time like update
    if (req.app.get('io')) {
      req.app.get('io').emit('like-update', {
        postId: post._id,
        likesCount: post.likesCount,
        likes: post.likes,
      });
    }

    res.json({ post });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling like' });
  }
});

// DELETE /api/posts/:postId/like — Unlike
router.delete('/:postId/like', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.likes = post.likes.filter(id => id !== req.user.uid);
    post.likesCount = post.likes.length;
    await post.save();

    res.json({ post });
  } catch (error) {
    res.status(500).json({ message: 'Error removing like' });
  }
});

// POST /api/posts/:postId/comment — Add comment
router.post('/:postId/comment', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text required' });
    }

    post.comments.push({
      userId: req.user.uid,
      username: req.dbUser.name,
      text: text.trim(),
    });
    post.commentsCount = post.comments.length;
    await post.save();

    // Notification for comment
    if (post.userId !== req.user.uid) {
      await Notification.create({
        recipientId: post.authorId || post.userId,
        senderId: req.dbUser._id,
        type: 'comment',
        refId: post._id,
        refModel: 'Post',
        message: `${req.dbUser.name} commented on your post`,
      });
    }

    // Real-time comment update
    if (req.app.get('io')) {
      req.app.get('io').emit('comment-update', {
        postId: post._id,
        commentsCount: post.commentsCount,
        comment: post.comments[post.comments.length - 1],
      });
    }

    res.json({ post });
  } catch (error) {
    res.status(500).json({ message: 'Error adding comment' });
  }
});

// GET /api/posts/:postId/comments
router.get('/:postId/comments', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId).select('comments');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post.comments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching comments' });
  }
});

// POST /api/posts/:postId/bookmark — Toggle bookmark
router.post('/:postId/bookmark', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const uid = req.user.uid;
    const isBookmarked = post.bookmarks.includes(uid);

    if (isBookmarked) {
      post.bookmarks = post.bookmarks.filter(id => id !== uid);
      await User.findByIdAndUpdate(req.dbUser._id, { $pull: { savedPosts: post._id } });
    } else {
      post.bookmarks.push(uid);
      await User.findByIdAndUpdate(req.dbUser._id, { $addToSet: { savedPosts: post._id } });
    }

    await post.save();
    res.json({ bookmarked: !isBookmarked });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling bookmark' });
  }
});

// POST /api/posts/:postId/share
router.post('/:postId/share', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.shares.push(req.user.uid);
    await post.save();

    res.json({ sharesCount: post.shares.length });
  } catch (error) {
    res.status(500).json({ message: 'Error sharing post' });
  }
});

module.exports = router;
