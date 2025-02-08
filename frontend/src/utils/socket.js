// import { io } from 'socket.io-client';

// // Use import.meta.env to access environment variables
// const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_SERVER_URL;

// const socket = io(SOCKET_SERVER_URL);

// export default socket;

import { io } from 'socket.io-client';

// Use the correct backend URL
const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:5000';

const socket = io(SOCKET_SERVER_URL, {
  withCredentials: true, // Enable credentials (if needed)
});

export default socket;