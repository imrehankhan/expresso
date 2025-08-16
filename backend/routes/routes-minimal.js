const express = require('express');
const Doubt = require('../models/Doubt');
const Room = require('../models/Room'); // Import Room model

const router = express.Router();

// room create karne ke liye route
router.post('/rooms', async (req, res) => {
  try {
    const { roomId, userId } = req.body;
    console.log('Creating room with ID:', roomId);
    
    if (!roomId) {
      return res.status(400).send({ message: 'Room ID is required' });
    }
    
    // Check if room already exists
    const existingRoom = await Room.findOne({ roomId });
    if (existingRoom) {
      return res.status(409).send({ message: 'Room already exists' });
    }
    
    const room = new Room({ roomId });
    await room.save();
    
    console.log('Room created successfully:', room);
    res.status(201).send({ message: 'Room created', room });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).send({ message: 'Failed to create room', error: error.message });
  }
});

// doubt submit karne ke liye route
router.post('/doubts', async (req, res) => {
  try {
    const { roomId, text, user } = req.body;
    const doubt = new Doubt({ roomId, text, user, userId: user.uid, upvotes: 0, upvotedBy: [], answered: false });
    await doubt.save();
    
    res.status(201).send(doubt);
  } catch (error) {
    console.error('Error submitting doubt:', error);
    res.status(500).send({ message: 'Failed to submit doubt', error: error.message });
  }
});

// room se doubts ko lane ke liye route
router.get('/rooms/:roomId/doubts', async (req, res) => {
  const { roomId } = req.params;
  const doubts = await Doubt.find({ roomId });
  res.status(200).send(doubts);
});

// check if room exists
router.get('/rooms/:roomId', async (req, res) => {
  const { roomId } = req.params;
  try {
    const room = await Room.findOne({ roomId });
    if (room) {
      res.status(200).send({ exists: true, room });
    } else {
      res.status(404).send({ exists: false, message: 'Room not found' });
    }
  } catch (error) {
    res.status(500).send({ exists: false, message: 'Server error' });
  }
});

// Simple statistics endpoint for testing
router.get('/statistics', async (req, res) => {
  try {
    const totalRooms = await Room.countDocuments();
    const totalQuestions = await Doubt.countDocuments();
    
    const stats = {
      totalUsers: 100, // Mock data for now
      activeRooms: Math.min(totalRooms, 10),
      questionsToday: Math.min(totalQuestions, 50),
      totalQuestions,
      onlineUsers: Math.floor(Math.random() * 30) + 10
    };

    res.status(200).send({ stats });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).send({ message: 'Failed to fetch statistics', error: error.message });
  }
});

// Simple user stats endpoint
router.get('/users/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user's questions
    const questionsAsked = await Doubt.countDocuments({ userId });
    
    const stats = {
      questionsAsked,
      roomsJoined: 0,
      upvotesReceived: 0,
      timeSpent: 0,
      streak: 0,
      rank: 'Beginner'
    };

    res.status(200).send({ stats });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).send({ message: 'Failed to fetch user stats', error: error.message });
  }
});

// Simple user recent rooms endpoint
router.get('/users/:userId/recent-rooms', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Return empty array for now
    const rooms = [];

    res.status(200).send({ rooms });
  } catch (error) {
    console.error('Error fetching recent rooms:', error);
    res.status(500).send({ message: 'Failed to fetch recent rooms', error: error.message });
  }
});

// Simple user creation endpoint
router.post('/users', async (req, res) => {
  try {
    const { userId, email, displayName } = req.body;
    
    if (!userId || !email || !displayName) {
      return res.status(400).send({ message: 'Missing required fields' });
    }

    // Just return success for now
    const user = { userId, email, displayName };
    res.status(200).send({ user });
  } catch (error) {
    console.error('Error creating/updating user:', error);
    res.status(500).send({ message: 'Failed to create/update user', error: error.message });
  }
});

module.exports = router;
