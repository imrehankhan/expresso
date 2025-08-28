const Doubt = require('../models/Doubt');

const handleSocketConnection = (io, socket) => {
  console.log('New client connected:', socket.id);

  
  socket.on('joinRoom', async (roomId, role) => {
    try {
      socket.join(roomId);
      console.log(`Client ${socket.id} joined room: ${roomId} as ${role}`);
      socket.role = role;
      socket.roomId = roomId;

      // Send existing doubts to the newly joined client
      const existingDoubts = await Doubt.find({ roomId });
      console.log(`Sending ${existingDoubts.length} existing doubts to client ${socket.id}`);
      socket.emit('existingDoubts', existingDoubts);
    } catch (error) {
      console.error('Error in joinRoom:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  socket.on('newDoubt', async (roomId, doubt) => {
    try {
      console.log('Socket: Received new doubt:', doubt);
      console.log('Socket: Broadcasting new doubt to room:', roomId);
      console.log('Socket: User ID in doubt:', doubt.userId);

      const newDoubt = new Doubt({
        ...doubt,
        roomId,
        upvotes: 0,
        upvotedBy: [],
        userId: doubt.userId // Ensure userId is saved
      });
      await newDoubt.save();
      console.log('Socket: Doubt saved with userId:', newDoubt.userId);

      // Broadcast the new doubt to all clients in the room
      io.to(roomId).emit('newDoubt', newDoubt);
      console.log('Socket: New doubt broadcasted to room:', roomId);
    } catch (error) {
      console.error('Error in newDoubt:', error);
      socket.emit('error', { message: 'Failed to save doubt' });
    }
  });

  socket.on('upvoteDoubt', async (roomId, doubtId, userId) => {
    try {
      console.log('Upvote request:', { roomId, doubtId, userId });
      const doubt = await Doubt.findOneAndUpdate({ roomId, id: doubtId }, { $inc: { upvotes: 1 }, $addToSet: { upvotedBy: userId } }, { new: true });
      console.log('Doubt updated with upvote:', doubt);

      // Broadcast the updated doubt to all clients in the room
      io.to(roomId).emit('doubtUpdated', doubt);
    } catch (error) {
      console.error('Error upvoting doubt:', error);
      socket.emit('error', { message: 'Failed to upvote doubt' });
    }
  });

  socket.on('downvoteDoubt', async (roomId, doubtId, userId) => {
    try {
      console.log('Downvote request:', { roomId, doubtId, userId });
      const doubt = await Doubt.findOneAndUpdate({ roomId, id: doubtId }, { $inc: { upvotes: -1 }, $pull: { upvotedBy: userId } }, { new: true });
      console.log('Doubt updated with downvote:', doubt);

      // Broadcast the updated doubt to all clients in the room
      io.to(roomId).emit('doubtUpdated', doubt);
    } catch (error) {
      console.error('Error downvoting doubt:', error);
      socket.emit('error', { message: 'Failed to downvote doubt' });
    }
  });

  socket.on('markAsAnswered', async (roomId, doubtId) => {
    try {
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
    } catch (error) {
      console.error('Error in markAsAnswered:', error);
    }
  });

  socket.on('closeRoom', async (roomId) => {
    await Doubt.deleteMany({ roomId });
    io.to(roomId).emit('roomClosed'); // Broadcast to all clients in the room
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
};

module.exports = handleSocketConnection;