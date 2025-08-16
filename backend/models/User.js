const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
  },
  displayName: {
    type: String,
    required: true,
  },
  questionsAsked: {
    type: Number,
    default: 0,
  },
  roomsJoined: {
    type: Number,
    default: 0,
  },
  upvotesReceived: {
    type: Number,
    default: 0,
  },
  timeSpent: {
    type: Number,
    default: 0, // in minutes
  },
  streak: {
    type: Number,
    default: 0,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
  joinedRooms: [{
    roomId: String,
    joinedAt: Date,
    role: String, // 'host' or 'participant'
    lastVisited: Date
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate user rank based on activity
userSchema.methods.getRank = function() {
  const totalActivity = this.questionsAsked + this.roomsJoined + this.upvotesReceived;
  
  if (totalActivity >= 100) return 'Expert';
  if (totalActivity >= 50) return 'Advanced';
  if (totalActivity >= 20) return 'Intermediate';
  return 'Beginner';
};

// Update streak based on last active date
userSchema.methods.updateStreak = function() {
  const today = new Date();
  const lastActive = new Date(this.lastActive);
  const diffTime = Math.abs(today - lastActive);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) {
    this.streak += 1;
  } else if (diffDays > 1) {
    this.streak = 1;
  }
  // If same day, keep current streak
  
  this.lastActive = today;
  return this.streak;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
