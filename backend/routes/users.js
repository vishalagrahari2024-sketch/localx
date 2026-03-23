const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware');
const { attachDbUser } = require('../middleware/roleCheck');

// All user routes require auth
router.use(authMiddleware, attachDbUser);

// GET /api/users/me
router.get('/me', async (req, res) => {
  try {
    const user = await User.findById(req.dbUser._id)
      .populate('followers', 'name avatar firebaseUid')
      .populate('following', 'name avatar firebaseUid');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

// PUT /api/users/me — Update profile
router.put('/me', async (req, res) => {
  try {
    const allowedUpdates = ['name', 'bio', 'department', 'year', 'designation', 'avatar', 'coverPhoto', 'darkMode', 'collegeId'];
    const updates = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const user = await User.findByIdAndUpdate(req.dbUser._id, updates, { new: true, runValidators: true });
    res.json({ message: 'Profile updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// GET /api/users/search?q=
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { collegeId: { $regex: q, $options: 'i' } },
        { department: { $regex: q, $options: 'i' } },
      ],
    }).select('name email avatar department year role collegeId').limit(20);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Search error' });
  }
});

// GET /api/users/:userId
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-savedPosts')
      .populate('followers', 'name avatar')
      .populate('following', 'name avatar');

    if (!user) return res.status(404).json({ message: 'User not found' });

    const postCount = await Post.countDocuments({ userId: user.firebaseUid });
    const userObj = user.toJSON();
    userObj.postCount = postCount;

    res.json(userObj);
  } catch (error) {
    console.error('Error fetching user /:userId:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
});

// POST /api/users/:userId/follow
router.post('/:userId/follow', async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });
    if (targetUser._id.equals(req.dbUser._id)) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    // Check if already following
    if (req.dbUser.following.includes(targetUser._id)) {
      return res.status(400).json({ message: 'Already following this user' });
    }

    await User.findByIdAndUpdate(req.dbUser._id, { $addToSet: { following: targetUser._id } });
    await User.findByIdAndUpdate(targetUser._id, { $addToSet: { followers: req.dbUser._id } });

    // Create notification
    await Notification.create({
      recipientId: targetUser._id,
      senderId: req.dbUser._id,
      type: 'follow',
      refId: req.dbUser._id,
      refModel: 'User',
      message: `${req.dbUser.name} started following you`,
    });

    // Emit socket event if available
    if (req.app.get('io')) {
      req.app.get('io').to(`user_${targetUser._id}`).emit('new-notification', {
        type: 'follow',
        message: `${req.dbUser.name} started following you`,
      });
    }

    res.json({ message: 'Followed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error following user' });
  }
});

// DELETE /api/users/:userId/follow
router.delete('/:userId/follow', async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    await User.findByIdAndUpdate(req.dbUser._id, { $pull: { following: targetUser._id } });
    await User.findByIdAndUpdate(targetUser._id, { $pull: { followers: req.dbUser._id } });

    res.json({ message: 'Unfollowed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error unfollowing user' });
  }
});

module.exports = router;
