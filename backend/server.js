const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const handleSocketConnection = require('./controllers/socketController');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:5173', 
    methods: ['GET', 'POST'],
    credentials: true, 
  },
});

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST'],
  credentials: true,
}));

// Mongodb atlas se connect krne k liye (Baad me isku .env me dalde re)
const mongoUri = 'mongodb+srv://rehankhan:rehankhan7089@cluster0.mccpv.mongodb.net/'; // Replace with your MongoDB connection string
mongoose.connect(mongoUri);

io.on('connection', (socket) => handleSocketConnection(io, socket));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
