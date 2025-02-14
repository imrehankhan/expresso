const express = require('express');
const Doubt = require('../models/Doubt');

const router = express.Router();

// room create karne ke liye route
router.post('/rooms', (req, res) => {
  res.status(201).send({ message: 'Room created' });
});

// doubt submit karne ke liye route
router.post('/doubts', async (req, res) => {
  const { roomId, text, user } = req.body;
  const doubt = new Doubt({ roomId, text, user, upvotes: 0, upvotedBy: [] });
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
  res.status(200).send({ message: 'Room closed and doubts deleted' });
});

// fetch all doubts (Natural language processing library ke liye kaam ata re ye)
router.get('/doubts', async (req, res) => {
  const doubts = await Doubt.find();
  res.status(200).send(doubts);
});

module.exports = router;




