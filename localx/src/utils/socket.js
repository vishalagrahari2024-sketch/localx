import { io } from 'socket.io-client';
import { auth } from '../components/firebase';

let socket = null;

export const connectSocket = async () => {
  if (socket?.connected) return socket;

  const user = auth.currentUser;
  if (!user) return null;

  const token = await user.getIdToken();

  socket = io('http://localhost:5000', {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected');
  });

  socket.on('connect_error', (err) => {
    console.error('❌ Socket connection error:', err.message);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
