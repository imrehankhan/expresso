const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const handleSocketConnection = require('./controllers/socketController');
const routes = require('./routes/routes'); // Import routes

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:5173', // Specify the allowed origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow DELETE method
    credentials: true, // Allow credentials
  },
});

app.use(cors({
  origin: 'http://localhost:5173', // Specify the allowed origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow DELETE method
  credentials: true, // Allow credentials
}));

app.use(express.json()); // Middleware to parse JSON bodies
app.use('/api', routes); // Use routes with /api prefix

// Connect to MongoDB Atlas
const mongoUri = 'mongodb+srv://rehankhan:rehankhan7089@cluster0.mccpv.mongodb.net/'; // Replace with your MongoDB connection string
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
