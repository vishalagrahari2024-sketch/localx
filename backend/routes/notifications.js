const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware');
const { attachDbUser } = require('../middleware/roleCheck');

router.use(authMiddleware, attachDbUser);

// GET /api/notifications — Paginated list
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const notifications = await Notification.find({ recipientId: req.dbUser._id })
      .populate('senderId', 'name avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const unreadCount = await Notification.countDocuments({
      recipientId: req.dbUser._id,
      isRead: false,
    });

    const total = await Notification.countDocuments({ recipientId: req.dbUser._id });

    res.json({
      notifications,
      unreadCount,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// PUT /api/notifications/read-all — Mark all as read
router.put('/read-all', async (req, res) => {
  try {
    await Notification.updateMany(
      { recipientId: req.dbUser._id, isRead: false },
      { isRead: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking notifications as read' });
  }
});

// PUT /api/notifications/:id/read — Mark single as read
router.put('/:id/read', async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking notification as read' });
  }
});

module.exports = router;
