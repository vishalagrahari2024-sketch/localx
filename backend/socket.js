const admin = require('firebase-admin');
const User = require('./models/User');

/**
 * Socket.IO server setup with Firebase authentication.
 */
function setupSocket(server) {
  const { Server } = require('socket.io');

  const io = new Server(server, {
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decodedToken = await admin.auth().verifyIdToken(token);
      socket.user = decodedToken;

      // Attach MongoDB user
      const dbUser = await User.findOne({ firebaseUid: decodedToken.uid });
      if (dbUser) {
        socket.dbUser = dbUser;
      }

      next();
    } catch (error) {
      next(new Error('Invalid authentication token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ Socket connected: ${socket.user.uid}`);

    // Join personal notification room
    if (socket.dbUser) {
      socket.join(`user_${socket.dbUser._id}`);
    }

    // Join conversation rooms
    socket.on('join-conversation', (conversationId) => {
      socket.join(`conversation_${conversationId}`);
    });

    // Leave conversation rooms
    socket.on('leave-conversation', (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
    });

    // Join group rooms
    socket.on('join-group', (groupId) => {
      socket.join(`group_${groupId}`);
    });

    // Typing indicator
    socket.on('typing', ({ conversationId, isTyping }) => {
      socket.to(`conversation_${conversationId}`).emit('user-typing', {
        userId: socket.dbUser?._id,
        userName: socket.dbUser?.name,
        isTyping,
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.user.uid}`);
    });
  });

  return io;
}

module.exports = setupSocket;
