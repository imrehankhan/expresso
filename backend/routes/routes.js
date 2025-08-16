const express = require('express');
const Doubt = require('../models/Doubt');
const Room = require('../models/Room'); // Import Room model
const User = require('../models/User');
const Statistics = require('../models/Statistics');

const router = express.Router();

// room create karne ke liye route
router.post('/rooms', async (req, res) => {
  try {
    const { roomId, userId, topic } = req.body;
    console.log('Creating room with ID:', roomId, 'Topic:', topic, 'User:', userId);

    if (!roomId) {
      return res.status(400).send({ message: 'Room ID is required' });
    }

    if (!topic) {
      return res.status(400).send({ message: 'Room topic is required' });
    }

    if (!userId) {
      return res.status(400).send({ message: 'User ID is required' });
    }

    // Check if room already exists
    const existingRoom = await Room.findOne({ roomId });
    if (existingRoom) {
      return res.status(409).send({ message: 'Room already exists' });
    }

    const room = new Room({ roomId, topic, createdBy: userId });
    await room.save();

    // If userId provided, update user's room count and add to joinedRooms
    if (userId) {
      console.log('Adding room to user:', userId);
      let user = await User.findOne({ userId });
      if (user) {
        // Check if user already has this room
        const existingRoom = user.joinedRooms.find(r => r.roomId === roomId);
        if (!existingRoom) {
          user.roomsJoined += 1;
          user.joinedRooms.push({
            roomId,
            joinedAt: new Date(),
            role: 'host',
            lastVisited: new Date()
          });
          await user.save();
          console.log('Room added to user successfully');
        }
      }
    }

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
    console.log('Submitting doubt:', { roomId, text, user });

    // Handle user field - it might be an object or string
    const userName = typeof user === 'object' ? user.displayName : user;
    const userId = typeof user === 'object' ? user.uid : user;

    const doubt = new Doubt({
      roomId,
      text,
      user: userName,
      userId: userId,
      upvotes: 0,
      upvotedBy: [],
      answered: false
    });
    await doubt.save();

    // Update user's question count
    const userDoc = await User.findOne({ userId: userId });
    if (userDoc) {
      userDoc.questionsAsked += 1;
      await userDoc.save();
      console.log('Updated user question count');
    }

    console.log('Doubt submitted successfully');
    res.status(201).send(doubt);
  } catch (error) {
    console.error('Error submitting doubt:', error);
    res.status(500).send({ message: 'Failed to submit doubt', error: error.message });
  }
});

// Join a room
router.post('/rooms/:roomId/join', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).send({ message: 'User ID is required' });
    }

    // Check if room exists
    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).send({ message: 'Room not found' });
    }

    // Update user's room data
    const user = await User.findOne({ userId });
    if (user) {
      // Check if user already joined this room
      const existingRoom = user.joinedRooms.find(r => r.roomId === roomId);
      if (existingRoom) {
        // Update last visited
        existingRoom.lastVisited = new Date();
      } else {
        // Add new room
        user.roomsJoined += 1;
        user.joinedRooms.push({
          roomId,
          joinedAt: new Date(),
          role: 'participant',
          lastVisited: new Date()
        });
      }
      await user.save();
    }

    res.status(200).send({ message: 'Successfully joined room', room });
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).send({ message: 'Failed to join room', error: error.message });
  }
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

// room se doubts ko lane ke liye route
router.get('/rooms/:roomId/doubts', async (req, res) => {
  const { roomId } = req.params;
  const doubts = await Doubt.find({ roomId });
  res.status(200).send(doubts);
});

// room close karne ke liye route
router.delete('/rooms/:roomId', async (req, res) => {
  const { roomId } = req.params;
  await Doubt.deleteMany({ roomId });
  await Room.deleteOne({ roomId });
  res.status(200).send({ message: 'Room closed and doubts deleted' });
});

// fetch all doubts
router.get('/doubts', async (req, res) => {
  const doubts = await Doubt.find();
  res.status(200).send(doubts);
});



// Get or create user profile
router.post('/users', async (req, res) => {
  try {
    console.log('POST /users - Request body:', JSON.stringify(req.body, null, 2));
    console.log('POST /users - Content-Type:', req.headers['content-type']);

    const { userId, email, displayName } = req.body;
    console.log('Extracted data:', { userId, email, displayName });

    if (!userId) {
      console.log('Missing userId - returning 400');
      return res.status(400).send({ message: 'Missing required field: userId', received: req.body });
    }

    if (!email) {
      console.log('Missing email - returning 400');
      return res.status(400).send({ message: 'Missing required field: email', received: req.body });
    }

    if (!displayName) {
      console.log('Missing displayName - returning 400');
      return res.status(400).send({ message: 'Missing required field: displayName', received: req.body });
    }

    let user = await User.findOne({ userId });

    if (!user) {
      console.log('Creating new user');
      user = new User({
        userId,
        email,
        displayName,
        questionsAsked: 0,
        roomsJoined: 0,
        upvotesReceived: 0,
        timeSpent: 0,
        streak: 1,
        joinedRooms: []
      });
      await user.save();
      console.log('User created successfully');
    } else {
      console.log('Updating existing user');
      user.email = email;
      user.displayName = displayName;
      user.lastActive = new Date();
      await user.save();
      console.log('User updated successfully');
    }

    res.status(200).send({ user });
  } catch (error) {
    console.error('Error creating/updating user:', error);
    res.status(500).send({ message: 'Failed to create/update user', error: error.message });
  }
});

// Get user statistics
router.get('/users/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Getting stats for userId:', userId);

    const user = await User.findOne({ userId });
    if (!user) {
      console.log('User not found in database');
      return res.status(404).send({ message: 'User not found' });
    }

    console.log('User found:', user.displayName);

    // Calculate additional stats
    const totalQuestions = await Doubt.countDocuments({ userId });
    console.log('Total questions for user:', totalQuestions);

    // Debug: Check all doubts to see what userIds exist
    const allDoubts = await Doubt.find({}, { userId: 1, user: 1 }).limit(10);
    console.log('Sample doubts with userIds:', allDoubts);

    const totalUpvotes = await Doubt.aggregate([
      { $match: { userId } },
      { $group: { _id: null, totalUpvotes: { $sum: '$upvotes' } } }
    ]);
    console.log('Total upvotes for user:', totalUpvotes);

    const stats = {
      questionsAsked: totalQuestions,
      roomsJoined: user.roomsJoined,
      upvotesReceived: totalUpvotes[0]?.totalUpvotes || 0,
      timeSpent: user.timeSpent,
      streak: user.streak,
      rank: user.getRank(),
      lastActive: user.lastActive,
      joinedAt: user.createdAt
    };

    res.status(200).send({ stats });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).send({ message: 'Failed to fetch user stats', error: error.message });
  }
});

// Get user's recent rooms
router.get('/users/:userId/recent-rooms', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 5;
    console.log('Fetching recent rooms for user:', userId);

    const user = await User.findOne({ userId });
    if (!user) {
      console.log('User not found, returning empty rooms');
      return res.status(200).send({ rooms: [] });
    }

    console.log('User found, joined rooms:', user.joinedRooms.length);

    // Get recent rooms from user's joinedRooms array
    const recentRooms = user.joinedRooms
      .sort((a, b) => new Date(b.lastVisited) - new Date(a.lastVisited))
      .slice(0, limit);

    // Get room details with question counts
    const rooms = await Promise.all(
      recentRooms.map(async (userRoom) => {
        const room = await Room.findOne({ roomId: userRoom.roomId });
        const questionCount = await Doubt.countDocuments({ roomId: userRoom.roomId });

        return {
          id: userRoom.roomId,
          name: `Study Room ${userRoom.roomId}`,
          lastJoined: userRoom.lastVisited,
          participants: Math.floor(Math.random() * 15) + 5, // Mock data for now
          questions: questionCount,
          role: userRoom.role,
          isActive: room ? true : false,
          favorite: false
        };
      })
    );

    console.log('Returning rooms:', rooms.length);
    res.status(200).send({ rooms });
  } catch (error) {
    console.error('Error fetching recent rooms:', error);
    res.status(500).send({ message: 'Failed to fetch recent rooms', error: error.message });
  }
});

// Get global statistics
router.get('/statistics', async (req, res) => {
  try {
    console.log('Fetching statistics...');

    // Calculate real-time statistics using direct queries
    const totalUsers = await User.countDocuments();
    const totalRooms = await Room.countDocuments();
    const activeRooms = await Room.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    const totalQuestions = await Doubt.countDocuments();
    const questionsToday = await Doubt.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });

    // Generate realistic online users count
    const baseOnlineUsers = Math.max(totalUsers * 0.1, 5); // 10% of total users or minimum 5
    const onlineUsers = Math.floor(baseOnlineUsers + Math.random() * 20);

    const stats = {
      totalUsers,
      activeRooms,
      questionsToday,
      totalQuestions,
      onlineUsers
    };

    console.log('Statistics calculated:', stats);
    res.status(200).send({ stats });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).send({ message: 'Failed to fetch statistics', error: error.message });
  }
});

// Get user's created rooms
router.get('/users/:userId/created-rooms', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Fetching created rooms for user:', userId);

    // Find rooms created by this user
    const createdRooms = await Room.find({ createdBy: userId }).sort({ createdAt: -1 });

    // Get question counts for each room
    const roomsWithStats = await Promise.all(
      createdRooms.map(async (room) => {
        const questionCount = await Doubt.countDocuments({ roomId: room.roomId });
        const answeredCount = await Doubt.countDocuments({ roomId: room.roomId, answered: true });

        // Count unique participants (users who asked questions in this room)
        const uniqueParticipants = await Doubt.distinct('userId', { roomId: room.roomId });
        const participantCount = uniqueParticipants.length;

        return {
          id: room.roomId,
          topic: room.topic,
          createdAt: room.createdAt,
          questions: questionCount,
          answered: answeredCount,
          participants: Math.max(participantCount, 1) // At least 1 (the creator)
        };
      })
    );

    res.status(200).send({ rooms: roomsWithStats });
  } catch (error) {
    console.error('Error fetching created rooms:', error);
    res.status(500).send({ message: 'Failed to fetch created rooms', error: error.message });
  }
});

// Get user's asked doubts
router.get('/users/:userId/doubts', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Fetching doubts for user:', userId);

    // Debug: Check all doubts to see what userIds exist
    const allDoubts = await Doubt.find({}, { userId: 1, user: 1, text: 1 }).limit(5);
    console.log('All doubts in database:', allDoubts);

    // Find doubts asked by this user
    const userDoubts = await Doubt.find({ userId }).sort({ createdAt: -1 });
    console.log('Found doubts for user:', userDoubts.length);

    // Get room topics for each doubt
    const doubtsWithRoomInfo = await Promise.all(
      userDoubts.map(async (doubt) => {
        const room = await Room.findOne({ roomId: doubt.roomId });

        return {
          id: doubt._id,
          text: doubt.text,
          roomId: doubt.roomId,
          roomTopic: room ? room.topic : 'Unknown Room',
          upvotes: doubt.upvotes,
          answered: doubt.answered,
          answeredAt: doubt.answeredAt,
          createdAt: doubt.createdAt
        };
      })
    );

    res.status(200).send({ doubts: doubtsWithRoomInfo });
  } catch (error) {
    console.error('Error fetching user doubts:', error);
    res.status(500).send({ message: 'Failed to fetch user doubts', error: error.message });
  }
});

// Get comprehensive user profile data
router.get('/users/:userId/profile', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Fetching profile for user:', userId);

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    // Get created rooms count
    const createdRoomsCount = await Room.countDocuments({ createdBy: userId });

    // Get asked doubts count
    const askedDoubtsCount = await Doubt.countDocuments({ userId });

    // Get joined rooms count (from user document)
    const joinedRoomsCount = user.joinedRooms.length;

    // Get total upvotes received
    const totalUpvotes = await Doubt.aggregate([
      { $match: { userId } },
      { $group: { _id: null, totalUpvotes: { $sum: '$upvotes' } } }
    ]);

    const profile = {
      user: {
        userId: user.userId,
        email: user.email,
        displayName: user.displayName,
        joinedAt: user.createdAt,
        lastActive: user.lastActive,
        rank: user.getRank()
      },
      stats: {
        roomsCreated: createdRoomsCount,
        roomsJoined: joinedRoomsCount,
        doubtsAsked: askedDoubtsCount,
        upvotesReceived: totalUpvotes[0]?.totalUpvotes || 0,
        streak: user.streak,
        timeSpent: user.timeSpent
      }
    };

    res.status(200).send({ profile });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).send({ message: 'Failed to fetch user profile', error: error.message });
  }
});

// Debug endpoint to check what users exist
router.get('/debug/users', async (req, res) => {
  try {
    const users = await User.find({}, { userId: 1, email: 1, displayName: 1 }).limit(10);
    const doubts = await Doubt.find({}, { userId: 1, user: 1, text: 1 }).limit(10);

    res.status(200).send({
      users: users,
      doubts: doubts,
      message: 'Debug info for users and doubts'
    });
  } catch (error) {
    res.status(500).send({ message: 'Debug error', error: error.message });
  }
});

// Create test data for a user
router.post('/debug/create-test-data/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Create a test room
    const testRoom = new Room({
      roomId: 'test-room-' + Date.now(),
      topic: 'Test Topic for ' + userId,
      createdBy: userId
    });
    await testRoom.save();

    // Create test doubts
    const testDoubts = [
      {
        text: 'What is React.js?',
        roomId: testRoom.roomId,
        userId: userId,
        upvotes: 5,
        answered: true,
        answeredAt: new Date()
      },
      {
        text: 'How does useState work?',
        roomId: testRoom.roomId,
        userId: userId,
        upvotes: 3,
        answered: false
      }
    ];

    for (const doubtData of testDoubts) {
      const doubt = new Doubt(doubtData);
      await doubt.save();
    }

    res.status(200).send({
      message: 'Test data created successfully',
      room: testRoom,
      doubts: testDoubts.length
    });
  } catch (error) {
    res.status(500).send({ message: 'Error creating test data', error: error.message });
  }
});

// Verify if user is host of a room
router.get('/rooms/:roomId/verify-host/:userId', async (req, res) => {
  try {
    const { roomId, userId } = req.params;
    console.log('Verifying host for room:', roomId, 'user:', userId);

    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).send({ message: 'Room not found', isHost: false });
    }

    const isHost = room.createdBy === userId;
    console.log('Host verification result:', { roomId, userId, createdBy: room.createdBy, isHost });

    res.status(200).send({
      isHost,
      roomId,
      userId,
      createdBy: room.createdBy,
      topic: room.topic
    });
  } catch (error) {
    console.error('Error verifying host:', error);
    res.status(500).send({ message: 'Error verifying host', error: error.message, isHost: false });
  }
});

// Upvote a doubt
router.post('/doubts/:doubtId/upvote', async (req, res) => {
  try {
    const { doubtId } = req.params;
    const { userId } = req.body;

    const doubt = await Doubt.findById(doubtId);
    if (!doubt) {
      return res.status(404).send({ message: 'Doubt not found' });
    }

    // Simple upvote increment (in a real app, you'd track who upvoted)
    doubt.upvotes = (doubt.upvotes || 0) + 1;
    await doubt.save();

    res.status(200).send({
      message: 'Upvoted successfully',
      upvotes: doubt.upvotes
    });
  } catch (error) {
    res.status(500).send({ message: 'Error upvoting', error: error.message });
  }
});

module.exports = router;
