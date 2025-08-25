import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import './HomePage.css';
import { LuUsersRound } from "react-icons/lu";
import { TiUserAddOutline } from "react-icons/ti";
import { FaUser, FaSpinner } from 'react-icons/fa';
import AnimatedBackground from '../components/AnimatedBackground';


const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  const handleCreateRoom = () => {
    navigate('/create-room');
  };

  const handleJoinRoom = () => {
    navigate('/join-room');
  };

  const handleProfileClick = async () => {
    setIsProfileLoading(true);
    try {
      // Small delay to show loading state (optional)
      await new Promise(resolve => setTimeout(resolve, 500));
      navigate('/profile');
    } catch (error) {
      console.error('Error navigating to profile:', error);
    } finally {
      setIsProfileLoading(false);
    }
  };

  return (
    <AnimatedBackground>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-white">
      {/* Header */}
      <div className="absolute top-4 right-4 flex items-center space-x-4">
        <motion.button
          onClick={handleProfileClick}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-md border border-white/20 relative"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Profile"
          disabled={isProfileLoading}
        >
          {isProfileLoading ? (
            <FaSpinner className="text-blue-400 text-lg animate-spin" />
          ) : (
            <FaUser className="text-blue-400 text-lg" />
          )}
        </motion.button>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl sm:text-5xl md:text-7xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent"
        >
          Welcome to UnDoubt!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg sm:text-xl md:text-2xl mb-8 sm:mb-12 px-4 text-gray-300"
        >
          Create or join a room to start collaborating with others.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center w-full"
        >
          <motion.button
            onClick={handleCreateRoom}
            className="px-6 py-3 sm:px-8 sm:py-4 text-lg sm:text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-lg transform transition-all duration-300 flex items-center justify-center cursor-pointer min-w-[200px] backdrop-blur-md border border-white/20"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <TiUserAddOutline className="text-xl sm:text-2xl mr-2" />
            <span>Create Room</span>
          </motion.button>

          <motion.button
            onClick={handleJoinRoom}
            className="px-6 py-3 sm:px-8 sm:py-4 text-lg sm:text-xl font-semibold bg-white/10 hover:bg-white/20 rounded-xl shadow-lg transform transition-all duration-300 flex items-center justify-center cursor-pointer min-w-[200px] backdrop-blur-md border border-white/20"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <LuUsersRound className="text-xl sm:text-2xl mr-2" />
            <span>Join Room</span>
          </motion.button>
        </motion.div>

        {/* Welcome Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 sm:mt-12 text-center"
        >
          <p className="text-lg text-gray-300 mb-2">
            Welcome back, <span className="text-purple-400 font-semibold">{user?.displayName?.split(' ')[0] || 'Student'}</span>!
          </p>
          <p className="text-sm text-gray-400">
            Ready to learn and collaborate today?
          </p>

          {/* Debug Info */}
          <div className="mt-4 text-xs text-gray-500 bg-gray-800/30 rounded p-2">
            <div>User UID: {user?.uid || 'Not available'}</div>
            <div>Email: {user?.email || 'Not available'}</div>
            <div>Display Name: {user?.displayName || 'Not available'}</div>
          </div>
        </motion.div>
      </div>
    </div>
    </AnimatedBackground>
  );
};

export default HomePage;
