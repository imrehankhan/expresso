const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:5173', // Specify the allowed origin
    methods: ['GET', 'POST'],
    credentials: true, // Allow credentials
  },
});

app.use(cors({
  origin: 'http://localhost:5173', // Specify the allowed origin
  methods: ['GET', 'POST'],
  credentials: true, // Allow credentials
}));

const rooms = {};

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('joinRoom', (roomId, role) => {
    socket.join(roomId);
    console.log(`Client joined room: ${roomId} as ${role}`);
    if (!rooms[roomId]) {
      rooms[roomId] = { doubts: [], host: socket.id };
    }
    socket.role = role;
    // Send existing doubts to the newly joined client
    socket.emit('existingDoubts', rooms[roomId].doubts);
  });

  socket.on('newDoubt', (roomId, doubt) => {
    if (rooms[roomId]) {
      rooms[roomId].doubts.push(doubt);
      io.to(roomId).emit('newDoubt', doubt);
    }
  });

  socket.on('upvoteDoubt', (roomId, doubtId) => {
    if (rooms[roomId]) {
      const doubt = rooms[roomId].doubts.find(d => d.id === doubtId);
      if (doubt) {
        doubt.upvotes += 1;
        io.to(roomId).emit('upvoteDoubt', doubtId);
      }
    }
  });

  socket.on('downvoteDoubt', (roomId, doubtId) => {
    if (rooms[roomId]) {
      const doubt = rooms[roomId].doubts.find(d => d.id === doubtId);
      if (doubt) {
        doubt.upvotes -= 1;
        io.to(roomId).emit('downvoteDoubt', doubtId);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));