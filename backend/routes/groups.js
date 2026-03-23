const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const Post = require('../models/Post');
const authMiddleware = require('../middleware');
const { attachDbUser } = require('../middleware/roleCheck');

router.use(authMiddleware, attachDbUser);

// GET /api/groups — Discover groups
router.get('/', async (req, res) => {
  try {
    const { search, category } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) query.category = category;

    const groups = await Group.find(query)
      .populate('creatorId', 'name avatar')
      .sort({ createdAt: -1 });

    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching groups' });
  }
});

// POST /api/groups — Create group
router.post('/', async (req, res) => {
  try {
    const { name, description, category, coverImage } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    const group = await Group.create({
      name: name.trim(),
      description: description?.trim() || '',
      creatorId: req.dbUser._id,
      category: category || 'other',
      coverImage: coverImage || '',
      members: [{ userId: req.dbUser._id, role: 'owner' }],
    });

    res.status(201).json({ message: 'Group created', group });
  } catch (error) {
    res.status(500).json({ message: 'Error creating group' });
  }
});

// GET /api/groups/:groupId
router.get('/:groupId', async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate('creatorId', 'name avatar')
      .populate('members.userId', 'name avatar email');

    if (!group) return res.status(404).json({ message: 'Group not found' });
    res.json(group);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching group' });
  }
});

// POST /api/groups/:groupId/join
router.post('/:groupId/join', async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isMember = group.members.some(m => m.userId.equals(req.dbUser._id));
    if (isMember) return res.status(400).json({ message: 'Already a member' });

    group.members.push({ userId: req.dbUser._id, role: 'member' });
    await group.save();

    res.json({ message: 'Joined group successfully', group });
  } catch (error) {
    res.status(500).json({ message: 'Error joining group' });
  }
});

// DELETE /api/groups/:groupId/leave
router.delete('/:groupId/leave', async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    group.members = group.members.filter(m => !m.userId.equals(req.dbUser._id));
    await group.save();

    res.json({ message: 'Left group successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error leaving group' });
  }
});

// GET /api/groups/:groupId/posts — Group feed
router.get('/:groupId/posts', async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isMember = group.members.some(m => m.userId.equals(req.dbUser._id));
    if (!isMember) return res.status(403).json({ message: 'Must be a member to view group posts' });

    const posts = await Post.find({ groupId: group._id, visibility: 'group' })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching group posts' });
  }
});

// POST /api/groups/:groupId/posts — Post to group
router.post('/:groupId/posts', async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isMember = group.members.some(m => m.userId.equals(req.dbUser._id));
    if (!isMember) return res.status(403).json({ message: 'Must be a member to post' });

    const { text, mediaUrl, mediaType, tags } = req.body;

    const post = await Post.create({
      userId: req.user.uid,
      authorId: req.dbUser._id,
      username: req.dbUser.name,
      text: text?.trim() || '',
      mediaUrl: mediaUrl || '',
      mediaType: mediaType || '',
      tags: tags || [],
      visibility: 'group',
      groupId: group._id,
    });

    res.status(201).json({ message: 'Posted to group', post });
  } catch (error) {
    res.status(500).json({ message: 'Error posting to group' });
  }
});

module.exports = router;
