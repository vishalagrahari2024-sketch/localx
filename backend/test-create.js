require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Group = require('./models/Group');
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to DB');

    // get a random user
    const dbUser = await User.findOne();
    if (!dbUser) throw new Error('No user found to test with');
    console.log('Testing with user:', dbUser._id);

    // Try creating a group
    try {
      const group = await Group.create({
        name: 'Test Group',
        description: 'Test Desc',
        creatorId: dbUser._id,
        category: 'other',
        members: [{ userId: dbUser._id, role: 'owner' }]
      });
      console.log('Group created successfully:', group._id);
    } catch (e) {
      console.error('Group creation failed:', e.message);
    }

    // Try creating a conversation and message
    try {
      const conv = await Conversation.create({
        participants: [dbUser._id, new mongoose.Types.ObjectId()]
      });
      const msg = await Message.create({
        conversationId: conv._id,
        senderId: dbUser._id,
        content: 'Test message',
        status: 'sent'
      });
      console.log('Message created successfully:', msg._id);
    } catch (e) {
      console.error('Message creation failed:', e.message);
    }

    process.exit(0);
  } catch (err) {
    console.error('System error:', err);
    process.exit(1);
  }
})();
