const Doubt = require('../models/Doubt');

const handleSocketConnection = (io, socket) => {
  console.log('🔌 New client connected:', socket.id);

  // Ping handler for testing connectivity
  socket.on('ping', (data, callback) => {
    console.log('🏓 Ping received from', socket.id, ':', data);
    if (callback) callback('pong');
  });

  socket.on('joinRoom', async (roomId, role) => {
    socket.join(roomId);
    console.log(`🔗 Client ${socket.id} joined room: ${roomId} as ${role}`);
    socket.role = role;
    socket.roomId = roomId; // Store room ID on socket for debugging

    // Check current room members
    const roomSockets = await io.in(roomId).fetchSockets();
    console.log(`🔗 Room ${roomId} now has ${roomSockets.length} members:`, roomSockets.map(s => `${s.id}(${s.role || 'unknown'})`));

    // Send existing doubts to the newly joined client
    const existingDoubts = await Doubt.find({ roomId });
    socket.emit('existingDoubts', existingDoubts);
  });

  socket.on('newDoubt', async (roomId, doubt) => {
    console.log('Socket: Received new doubt:', doubt);
    console.log('Socket: Broadcasting new doubt to room:', roomId);
    console.log('Socket: User ID in doubt:', doubt.userId);

    const newDoubt = new Doubt({
      ...doubt,
      roomId,
      upvotes: 0,
      upvotedBy: [],
      userId: doubt.userId // ✅ Ensure userId is saved
    });
    await newDoubt.save();
    console.log('Socket: Doubt saved with userId:', newDoubt.userId);

    // Convert to plain object to avoid Mongoose document issues
    const doubtToEmit = {
      id: newDoubt.id,
      text: newDoubt.text,
      user: newDoubt.user,
      userId: newDoubt.userId,
      upvotes: newDoubt.upvotes,
      upvotedBy: newDoubt.upvotedBy,
      answered: newDoubt.answered,
      answeredAt: newDoubt.answeredAt,
      createdAt: newDoubt.createdAt,
      roomId: newDoubt.roomId
    };

    io.to(roomId).emit('newDoubt', doubtToEmit); // Broadcast to all clients in the room
  });

  socket.on('upvoteDoubt', async (roomId, doubtId, userId) => {
    const doubt = await Doubt.findOne({ roomId, id: doubtId });
    if (doubt && !doubt.upvotedBy.includes(userId)) {
      doubt.upvotes += 1;
      doubt.upvotedBy.push(userId);
      await doubt.save();
      io.to(roomId).emit('upvoteDoubt', doubtId); // Broadcast to all clients in the room
    }
  });

  socket.on('downvoteDoubt', async (roomId, doubtId, userId) => {
    const doubt = await Doubt.findOne({ roomId, id: doubtId });
    if (doubt && doubt.upvotedBy.includes(userId)) {
      doubt.upvotes -= 1;
      doubt.upvotedBy = doubt.upvotedBy.filter(id => id !== userId);
      await doubt.save();
      io.to(roomId).emit('downvoteDoubt', doubtId); // Broadcast to all clients in the room
    }
  });

  socket.on('markAsAnswered', async (roomId, doubtId) => {
    console.log('markAsAnswered socket event received:', { roomId, doubtId });

    const doubt = await Doubt.findOne({ roomId, id: doubtId });
    console.log('Found doubt in database:', doubt);

    if (doubt) {
      doubt.answered = !doubt.answered;
      if (doubt.answered) {
        doubt.answeredAt = new Date();
      } else {
        doubt.answeredAt = null;
      }
      await doubt.save();
      console.log('Doubt updated and saved:', { doubtId, answered: doubt.answered });

      io.to(roomId).emit('markAsAnswered', doubtId, doubt.answered); // Broadcast to all clients in the room
      console.log('markAsAnswered event emitted to room:', roomId);
    } else {
      console.log('Doubt not found in database');
    }
  });

  socket.on('closeRoom', async (roomId) => {
    console.log('Closing room:', roomId);
    console.log('Socket ID requesting closure:', socket.id);

    // Check how many clients are in the room
    const roomSockets = await io.in(roomId).fetchSockets();
    console.log(`Number of clients in room ${roomId}:`, roomSockets.length);
    console.log('Client socket IDs in room:', roomSockets.map(s => s.id));

    // Delete all doubts for this room
    const deletedCount = await Doubt.deleteMany({ roomId });
    console.log(`Deleted ${deletedCount.deletedCount} doubts for room ${roomId}`);

    // Broadcast room closure to all clients in the room
    io.to(roomId).emit('roomClosed', {
      message: 'The room has been closed by the host',
      timestamp: new Date().toISOString()
    });

    console.log(`Room ${roomId} closed and roomClosed event emitted to ${roomSockets.length} clients`);
  });

  socket.on('leaveRoom', async (roomId) => {
    console.log(`🚪 Client ${socket.id} (${socket.role || 'unknown'}) leaving room: ${roomId}`);
    socket.leave(roomId);

    // Check remaining room members
    const roomSockets = await io.in(roomId).fetchSockets();
    console.log(`🚪 Room ${roomId} now has ${roomSockets.length} members after leave:`, roomSockets.map(s => `${s.id}(${s.role || 'unknown'})`));
  });

  socket.on('disconnect', async () => {
    console.log(`❌ Client disconnected: ${socket.id} (${socket.role || 'unknown'}) from room: ${socket.roomId || 'unknown'}`);

    // If socket was in a room, check remaining members
    if (socket.roomId) {
      const roomSockets = await io.in(socket.roomId).fetchSockets();
      console.log(`❌ Room ${socket.roomId} now has ${roomSockets.length} members after disconnect:`, roomSockets.map(s => `${s.id}(${s.role || 'unknown'})`));
    }
  });
};

module.exports = handleSocketConnection;