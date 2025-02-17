import { io } from 'socket.io-client';

// Use the correct backend URL
const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:3000';

const socket = io(SOCKET_SERVER_URL, {
  withCredentials: true, // Enable credentials (if needed)
});

export default socket;