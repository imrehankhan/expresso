const express = require('express');
const Doubt = require('../models/Doubt');
const Room = require('../models/Room'); // Import Room model
const User = require('../models/User');
const Statistics = require('../models/Statistics');

const router = express.Router();

/**
 * @swagger
 * /api/rooms:
 *   post:
 *     summary: Create a new room
 *     description: Creates a new room for hosting doubt/question sessions
 *     tags: [Rooms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roomId
 *               - topic
 *               - userId
 *             properties:
 *               roomId:
 *                 type: string
 *                 description: Unique identifier for the room
 *                 example: "12345"
 *               topic:
 *                 type: string
 *                 description: Topic or subject of the room
 *                 example: "React.js Fundamentals"
 *               userId:
 *                 type: string
 *                 description: ID of the user creating the room
 *                 example: "user123"
 *     responses:
 *       201:
 *         description: Room created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Room created"
 *                 room:
 *                   $ref: '#/components/schemas/Room'
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict - room already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/doubts:
 *   post:
 *     summary: Submit a new doubt/question
 *     description: Submit a new question or doubt to a specific room
 *     tags: [Doubts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roomId
 *               - text
 *               - user
 *             properties:
 *               roomId:
 *                 type: string
 *                 description: ID of the room where doubt is being asked
 *                 example: "12345"
 *               text:
 *                 type: string
 *                 description: The question or doubt text
 *                 example: "What is the difference between useState and useEffect?"
 *               user:
 *                 oneOf:
 *                   - type: string
 *                     description: User name or email
 *                     example: "john@example.com"
 *                   - type: object
 *                     properties:
 *                       displayName:
 *                         type: string
 *                         example: "John Doe"
 *                       uid:
 *                         type: string
 *                         example: "user123"
 *     responses:
 *       201:
 *         description: Doubt submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Doubt'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/rooms/{roomId}/join:
 *   post:
 *     summary: Join a room
 *     description: Join an existing room as a participant
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: The room ID to join
 *         example: "12345"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user joining the room
 *                 example: "user123"
 *     responses:
 *       200:
 *         description: Successfully joined room
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Successfully joined room"
 *                 room:
 *                   $ref: '#/components/schemas/Room'
 *       400:
 *         description: Bad request - missing user ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Room not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/rooms/{roomId}:
 *   get:
 *     summary: Check if room exists
 *     description: Verify if a room exists and get room details
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: The room ID to check
 *         example: "12345"
 *     responses:
 *       200:
 *         description: Room exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exists:
 *                   type: boolean
 *                   example: true
 *                 room:
 *                   $ref: '#/components/schemas/Room'
 *       404:
 *         description: Room not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exists:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Room not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exists:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Server error"
 */
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

/**
 * @swagger
 * /api/rooms/{roomId}/doubts:
 *   get:
 *     summary: Get all doubts from a room
 *     description: Retrieve all questions/doubts from a specific room
 *     tags: [Doubts]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: The room ID to get doubts from
 *         example: "12345"
 *     responses:
 *       200:
 *         description: List of doubts from the room
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Doubt'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/rooms/:roomId/doubts', async (req, res) => {
  const { roomId } = req.params;
  const doubts = await Doubt.find({ roomId });
  res.status(200).send(doubts);
});

/**
 * @swagger
 * /api/rooms/{roomId}:
 *   delete:
 *     summary: Close/delete a room
 *     description: Close a room and delete all associated doubts
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: The room ID to close
 *         example: "12345"
 *     responses:
 *       200:
 *         description: Room closed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Room closed and doubts deleted"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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



/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create or update user profile
 *     description: Create a new user profile or update existing user information
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - email
 *               - displayName
 *             properties:
 *               userId:
 *                 type: string
 *                 description: Unique user identifier
 *                 example: "user123"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *                 example: "john@example.com"
 *               displayName:
 *                 type: string
 *                 description: User display name
 *                 example: "John Doe"
 *     responses:
 *       200:
 *         description: User created or updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/users/{userId}/stats:
 *   get:
 *     summary: Get user statistics
 *     description: Retrieve comprehensive statistics for a specific user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID to get statistics for
 *         example: "user123"
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   type: object
 *                   properties:
 *                     questionsAsked:
 *                       type: integer
 *                       description: Total number of questions asked
 *                       example: 15
 *                     roomsJoined:
 *                       type: integer
 *                       description: Total number of rooms joined
 *                       example: 8
 *                     upvotesReceived:
 *                       type: integer
 *                       description: Total upvotes received on questions
 *                       example: 42
 *                     timeSpent:
 *                       type: integer
 *                       description: Total time spent in minutes
 *                       example: 1200
 *                     streak:
 *                       type: integer
 *                       description: Current activity streak
 *                       example: 7
 *                     rank:
 *                       type: string
 *                       description: User rank based on activity
 *                       example: "Advanced"
 *                     lastActive:
 *                       type: string
 *                       format: date-time
 *                       description: Last activity timestamp
 *                     joinedAt:
 *                       type: string
 *                       format: date-time
 *                       description: User registration timestamp
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/statistics:
 *   get:
 *     summary: Get global platform statistics
 *     description: Retrieve overall platform statistics and metrics
 *     tags: [Statistics]
 *     responses:
 *       200:
 *         description: Global statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: integer
 *                       description: Total number of registered users
 *                       example: 1250
 *                     activeRooms:
 *                       type: integer
 *                       description: Number of active rooms (created in last 24h)
 *                       example: 45
 *                     questionsToday:
 *                       type: integer
 *                       description: Number of questions asked today
 *                       example: 128
 *                     totalQuestions:
 *                       type: integer
 *                       description: Total number of questions ever asked
 *                       example: 5420
 *                     onlineUsers:
 *                       type: integer
 *                       description: Estimated number of currently online users
 *                       example: 89
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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
