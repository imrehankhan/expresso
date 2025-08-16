const mongoose = require('mongoose');

const statisticsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true,
  },
  totalUsers: {
    type: Number,
    default: 0,
  },
  activeUsers: {
    type: Number,
    default: 0,
  },
  totalRooms: {
    type: Number,
    default: 0,
  },
  activeRooms: {
    type: Number,
    default: 0,
  },
  totalQuestions: {
    type: Number,
    default: 0,
  },
  questionsToday: {
    type: Number,
    default: 0,
  },
  totalUpvotes: {
    type: Number,
    default: 0,
  },
  upvotesToday: {
    type: Number,
    default: 0,
  },
  onlineUsers: {
    type: Number,
    default: 0,
  },
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
statisticsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to get or create today's statistics
statisticsSchema.statics.getTodayStats = async function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let stats = await this.findOne({ date: today });
  
  if (!stats) {
    stats = new this({ date: today });
    await stats.save();
  }
  
  return stats;
};

// Static method to update statistics
statisticsSchema.statics.updateStats = async function(updates) {
  const stats = await this.getTodayStats();
  
  Object.keys(updates).forEach(key => {
    if (stats[key] !== undefined) {
      stats[key] = updates[key];
    }
  });
  
  await stats.save();
  return stats;
};

// Static method to increment a statistic
statisticsSchema.statics.incrementStat = async function(statName, amount = 1) {
  const stats = await this.getTodayStats();
  stats[statName] = (stats[statName] || 0) + amount;
  await stats.save();
  return stats;
};

const Statistics = mongoose.model('Statistics', statisticsSchema);

module.exports = Statistics;
