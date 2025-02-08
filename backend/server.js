require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');
app.use(cors());
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  },
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Protect routes with Clerk
app.use(ClerkExpressRequireAuth());

// Routes
app.post('/api/rooms', (req, res) => {
  const roomId = require('uuid').v4();
  res.status(201).json({ id: roomId });
});

// Socket.IO logic
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });

  socket.on('submitDoubt', (doubt) => {
    io.to(doubt.roomId).emit('newDoubt', doubt);
    console.log(`New doubt submitted in room ${doubt.roomId}:`, doubt.text);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});