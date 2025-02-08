const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
});

module.exports = mongoose.model('Room', roomSchema);