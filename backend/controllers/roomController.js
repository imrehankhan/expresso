const Room = require('../models/room');
const { v4: uuidv4 } = require('uuid');

const createRoom = async (req, res) => {
  try {
    const roomId = uuidv4();
    const room = new Room({ id: roomId });
    await room.save();
    res.status(201).json({ id: roomId });
  } catch (error) {
    res.status(500).json({ error: 'Error creating room' });
  }
};

module.exports = { createRoom };