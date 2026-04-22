const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const authMiddleware = require('../middleware');
const { attachDbUser } = require('../middleware/roleCheck');

router.use(authMiddleware, attachDbUser);

// GET /api/messages/conversations — List conversations
router.get('/conversations', async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.dbUser._id,
    })
      .populate('participants', 'name avatar email')
      .sort({ lastMessageAt: -1 });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching conversations' });
  }
});

// POST /api/messages/conversations — Create or get conversation
router.post('/conversations', async (req, res) => {
  try {
    const { participantId } = req.body;
    if (!participantId) {
      return res.status(400).json({ message: 'participantId required' });
    }

    const otherUser = await User.findById(participantId);
    if (!otherUser) return res.status(404).json({ message: 'User not found' });

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [req.dbUser._id, otherUser._id], $size: 2 },
    }).populate('participants', 'name avatar email');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.dbUser._id, otherUser._id],
      });
      conversation = await conversation.populate('participants', 'name avatar email');
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: 'Error creating conversation' });
  }
});

// POST /api/messages/conversations/group — Create a group conversation
router.post('/conversations/group', async (req, res) => {
  try {
    const { name, participantIds } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Group name is required' });
    }
    if (!participantIds || !Array.isArray(participantIds) || participantIds.length < 1) {
      return res.status(400).json({ message: 'Participants are required for a group' });
    }

    // Ensure the creator is in the participants list
    const participants = new Set([...participantIds, req.dbUser._id.toString()]);

    const conversation = await Conversation.create({
      participants: Array.from(participants),
      isGroup: true,
      name: name.trim(),
      adminId: req.dbUser._id,
    });

    const populatedConversation = await conversation.populate('participants', 'name avatar email');

    res.status(201).json(populatedConversation);
  } catch (error) {
    console.error('Error creating group conversation:', error);
    res.status(500).json({ message: 'Error creating group conversation' });
  }
});

// GET /api/messages/conversations/:id/messages — Get messages
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const { cursor, limit = 50 } = req.query;

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    // Verify participant
    if (!conversation.participants.includes(req.dbUser._id)) {
      return res.status(403).json({ message: 'Not a participant of this conversation' });
    }

    const query = { conversationId: conversation._id };
    if (cursor) query._id = { $lt: cursor };

    const messages = await Message.find(query)
      .populate('senderId', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) + 1);

    const hasMore = messages.length > parseInt(limit);
    const results = hasMore ? messages.slice(0, -1) : messages;

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId: conversation._id,
        senderId: { $ne: req.dbUser._id },
        status: { $ne: 'read' },
      },
      { status: 'read' }
    );

    res.json({
      messages: results.reverse(),
      hasMore,
      nextCursor: hasMore ? results[0]._id : null,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

// POST /api/messages/conversations/:id/messages — Send message
router.post('/conversations/:id/messages', async (req, res) => {
  try {
    const { content, mediaUrl } = req.body;

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    if (!conversation.participants.includes(req.dbUser._id)) {
      return res.status(403).json({ message: 'Not a participant' });
    }

    if ((!content || !content.trim()) && !mediaUrl) {
      return res.status(400).json({ message: 'Message must have content or media' });
    }

    const message = await Message.create({
      conversationId: conversation._id,
      senderId: req.dbUser._id,
      content: content?.trim() || '',
      mediaUrl: mediaUrl || '',
      status: 'sent',
    });

    // Update conversation's last message
    conversation.lastMessage = content?.trim() || '📷 Image';
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const populatedMessage = await message.populate('senderId', 'name avatar');

    // Real-time message delivery via Socket.IO
    if (req.app.get('io')) {
      const recipientId = conversation.participants.find(
        p => !p.equals(req.dbUser._id)
      );
      req.app.get('io').to(`user_${recipientId}`).emit('new-message', {
        conversationId: conversation._id,
        message: populatedMessage,
      });
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Message send error:', error);
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
});

module.exports = router;
