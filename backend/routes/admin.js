const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const Report = require('../models/Report');
const authMiddleware = require('../middleware');
const { attachDbUser, requireRole } = require('../middleware/roleCheck');

// All admin routes require auth + admin role
router.use(authMiddleware, attachDbUser, requireRole('admin'));

// GET /api/admin/users — List all users with pagination
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { collegeId: { $regex: search, $options: 'i' } },
      ];
    }

    if (role) query.role = role;

    const users = await User.find(query)
      .select('-savedPosts')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({ users, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// PUT /api/admin/users/:userId/role — Update user role
router.put('/users/:userId/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['student', 'faculty', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { role },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Role updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating role' });
  }
});

// PUT /api/admin/users/:userId/suspend — Toggle suspend
router.put('/users/:userId/suspend', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isSuspended = !user.isSuspended;
    await user.save();

    res.json({ message: user.isSuspended ? 'User suspended' : 'User unsuspended', user });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling suspension' });
  }
});

// DELETE /api/admin/users/:userId — Delete user
router.delete('/users/:userId', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Also delete user's posts
    await Post.deleteMany({ userId: user.firebaseUid });

    res.json({ message: 'User and their posts deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// DELETE /api/admin/posts/:postId — Delete any post
router.delete('/posts/:postId', async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json({ message: 'Post deleted by admin' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting post' });
  }
});

// PUT /api/admin/posts/:postId/pin — Toggle pin announcement
router.put('/posts/:postId/pin', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.isPinned = !post.isPinned;
    post.isAnnouncement = post.isPinned;
    await post.save();

    res.json({ message: post.isPinned ? 'Post pinned' : 'Post unpinned', post });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling pin' });
  }
});

// GET /api/admin/reports — List reports
router.get('/reports', async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const query = {};
    if (status !== 'all') query.status = status;

    const reports = await Report.find(query)
      .populate('reporterId', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(query);

    res.json({ reports, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reports' });
  }
});

// PUT /api/admin/reports/:reportId — Update report status
router.put('/reports/:reportId', async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const updates = {};
    if (status) updates.status = status;
    if (adminNote !== undefined) updates.adminNote = adminNote;

    const report = await Report.findByIdAndUpdate(
      req.params.reportId,
      updates,
      { new: true }
    );

    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json({ message: 'Report updated', report });
  } catch (error) {
    res.status(500).json({ message: 'Error updating report' });
  }
});

// GET /api/admin/analytics — Dashboard analytics
router.get('/analytics', async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalUsers, totalPosts, totalReports, todayPosts, todayUsers] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      Post.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({ createdAt: { $gte: today } }),
    ]);

    // Posts per day for last 7 days
    const postsPerDay = await Post.aggregate([
      { $match: { createdAt: { $gte: lastWeek } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top departments
    const topDepartments = await User.aggregate([
      { $match: { department: { $ne: '' } } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // Role distribution
    const roleDistribution = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    res.json({
      totalUsers,
      totalPosts,
      totalReports,
      todayPosts,
      todayUsers,
      postsPerDay,
      topDepartments,
      roleDistribution,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics' });
  }
});

module.exports = router;
