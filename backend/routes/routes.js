const express = require('express');
const Doubt = require('../models/Doubt');
const Room = require('../models/Room'); // Import Room model

const router = express.Router();

// room create karne ke liye route
router.post('/rooms', async (req, res) => {
  const { roomId } = req.body;
  const room = new Room({ roomId });
  await room.save();
  res.status(201).send({ message: 'Room created', room });
});

// doubt submit karne ke liye route
router.post('/doubts', async (req, res) => {
  const { roomId, text, user } = req.body;
  const doubt = new Doubt({ roomId, text, user, upvotes: 0, upvotedBy: [], answered: false });
  await doubt.save();
  res.status(201).send(doubt);
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

// Check if room exists
router.get('/rooms/:roomId', async (req, res) => {
  const { roomId } = req.params;
  const roomExists = await Room.exists({ roomId });
  if (roomExists) {
    res.status(200).send({ exists: true });
  } else {
    res.status(404).send({ exists: false });
  }
});

module.exports = router;
