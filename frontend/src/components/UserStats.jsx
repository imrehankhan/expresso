import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaQuestionCircle, FaUsers, FaThumbsUp, FaClock, FaTrophy, FaFire } from 'react-icons/fa';
import { getUserStats } from '../utils/api';

const UserStats = ({ userId, className = '' }) => {
  const [stats, setStats] = useState({
    questionsAsked: 0,
    roomsJoined: 0,
    upvotesReceived: 0,
    timeSpent: 0,
    streak: 0,
    rank: 'Beginner'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await getUserStats(userId);
        setStats({
          questionsAsked: response.stats.questionsAsked || 0,
          roomsJoined: response.stats.roomsJoined || 0,
          upvotesReceived: response.stats.upvotesReceived || 0,
          timeSpent: response.stats.timeSpent || 0,
          streak: response.stats.streak || 0,
          rank: response.stats.rank || 'Beginner'
        });
      } catch (error) {
        console.error('Error fetching user stats:', error);
        // Fallback to default values
        setStats({
          questionsAsked: 0,
          roomsJoined: 0,
          upvotesReceived: 0,
          timeSpent: 0,
          streak: 0,
          rank: 'Beginner'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  const StatCard = ({ icon, label, value, color = 'purple', delay = 0 }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all duration-300"
    >
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg bg-gradient-to-br from-${color}-500 to-${color}-600`}>
          {icon}
        </div>
        <div>
          <p className="text-gray-400 text-sm">{label}</p>
          <motion.p
            className="text-white text-xl font-bold"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.3, type: "spring", stiffness: 200 }}
          >
            {loading ? '...' : value}
          </motion.p>
        </div>
      </div>
    </motion.div>
  );

  const getRankColor = (rank) => {
    switch (rank) {
      case 'Beginner': return 'text-green-400';
      case 'Intermediate': return 'text-blue-400';
      case 'Advanced': return 'text-purple-400';
      case 'Expert': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 'Expert': return '👑';
      case 'Advanced': return '🏆';
      case 'Intermediate': return '🥈';
      default: return '🥉';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-2xl font-bold text-white mb-2">Your Stats</h2>
        <div className="flex items-center justify-center space-x-2">
          <span className="text-lg">{getRankIcon(stats.rank)}</span>
          <span className={`text-lg font-semibold ${getRankColor(stats.rank)}`}>
            {stats.rank}
          </span>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={<FaQuestionCircle className="text-white w-5 h-5" />}
          label="Questions Asked"
          value={stats.questionsAsked}
          color="blue"
          delay={0.1}
        />
        <StatCard
          icon={<FaUsers className="text-white w-5 h-5" />}
          label="Rooms Joined"
          value={stats.roomsJoined}
          color="green"
          delay={0.2}
        />
        <StatCard
          icon={<FaThumbsUp className="text-white w-5 h-5" />}
          label="Upvotes Received"
          value={stats.upvotesReceived}
          color="purple"
          delay={0.3}
        />
        <StatCard
          icon={<FaClock className="text-white w-5 h-5" />}
          label="Time Spent"
          value={`${stats.timeSpent}m`}
          color="orange"
          delay={0.4}
        />
        <StatCard
          icon={<FaFire className="text-white w-5 h-5" />}
          label="Current Streak"
          value={`${stats.streak} days`}
          color="red"
          delay={0.5}
        />
        <StatCard
          icon={<FaTrophy className="text-white w-5 h-5" />}
          label="Rank"
          value={stats.rank}
          color="yellow"
          delay={0.6}
        />
      </div>

      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400 text-sm">Progress to Next Rank</span>
          <span className="text-white text-sm font-medium">75%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: '75%' }}
            transition={{ delay: 1, duration: 1 }}
          />
        </div>
      </motion.div>
    </div>
  );
};

export const QuickStats = ({ stats, className = '' }) => (
  <div className={`flex space-x-4 ${className}`}>
    {Object.entries(stats).map(([key, value], index) => (
      <motion.div
        key={key}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.1 }}
        className="text-center"
      >
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-xs text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
      </motion.div>
    ))}
  </div>
);

export default UserStats;
