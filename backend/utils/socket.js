import { io } from 'socket.io-client';

// http://localhost:3000
const socket = io('https://render-test-0i8l.onrender.com', {
  withCredentials: true,
});

export default socket;