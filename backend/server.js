const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const handleSocketConnection = require('./controllers/socketController');
const routes = require('./routes/routes'); // Import routes
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.VITE_FRONTEND_URL, // Specify the allowed origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow DELETE method
    credentials: true, // Allow credentials
  },
});

app.use(cors({
  origin: process.env.VITE_FRONTEND_URL, // Specify the allowed origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow DELETE method
  credentials: true, // Allow credentials
}));

app.use(express.json()); // Middleware to parse JSON bodies
app.use('/api', routes); // Use routes with /api prefix

// Connect to MongoDB Atlas
const mongoUri = process.env.MONGO_URI; // Use MONGO_URI from .env file
mongoose.connect(mongoUri)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

io.on('connection', (socket) => {
  console.log('New client connected');
  handleSocketConnection(io, socket);
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
