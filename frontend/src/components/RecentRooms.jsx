import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaClock, FaUsers, FaQuestionCircle, FaPlay, FaTrash, FaStar } from 'react-icons/fa';
import { LoadingCard } from './LoadingSpinner';
import { getUserRecentRooms } from '../utils/api';

const RecentRooms = ({ userId, limit = 5, className = '' }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecentRooms = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await getUserRecentRooms(userId, limit);
        const roomsData = response.rooms.map(room => ({
          ...room,
          lastJoined: new Date(room.lastJoined),
          name: room.name || `Room ${room.id}` // Fallback name
        }));
        setRooms(roomsData);
      } catch (error) {
        console.error('Error fetching recent rooms:', error);
        setRooms([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentRooms();
  }, [userId, limit]);

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const handleJoinRoom = (roomId) => {
    navigate(`/room/${roomId}`);
  };

  const handleRemoveRoom = (roomId) => {
    setRooms(prev => prev.filter(room => room.id !== roomId));
  };

  const toggleFavorite = (roomId) => {
    setRooms(prev => prev.map(room => 
      room.id === roomId ? { ...room, favorite: !room.favorite } : room
    ));
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <h3 className="text-xl font-semibold text-white mb-4">Recent Rooms</h3>
        {[...Array(3)].map((_, i) => (
          <LoadingCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Recent Rooms</h3>
        {rooms.length > 0 && (
          <button
            onClick={() => navigate('/rooms')}
            className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
          >
            View All
          </button>
        )}
      </div>

      <AnimatePresence>
        {rooms.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8 bg-white/5 rounded-xl border border-white/10"
          >
            <FaQuestionCircle className="text-gray-400 text-4xl mx-auto mb-3" />
            <p className="text-gray-400">No recent rooms</p>
            <p className="text-gray-500 text-sm mt-1">Join or create a room to get started</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {rooms.map((room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                className="group bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="text-white font-medium truncate">{room.name}</h4>
                      {room.favorite && (
                        <FaStar className="text-yellow-400 text-sm flex-shrink-0" />
                      )}
                      <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${
                        room.isActive 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {room.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <div className="flex items-center space-x-1">
                        <FaClock className="text-xs" />
                        <span>{formatTimeAgo(room.lastJoined)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FaUsers className="text-xs" />
                        <span>{room.participants}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FaQuestionCircle className="text-xs" />
                        <span>{room.questions}</span>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${
                        room.role === 'host' 
                          ? 'bg-purple-500/20 text-purple-400' 
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {room.role}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <motion.button
                      onClick={() => toggleFavorite(room.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        room.favorite 
                          ? 'text-yellow-400 hover:text-yellow-300' 
                          : 'text-gray-400 hover:text-yellow-400'
                      }`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <FaStar className="text-sm" />
                    </motion.button>
                    
                    <motion.button
                      onClick={() => handleJoinRoom(room.id)}
                      className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FaPlay className="text-sm" />
                    </motion.button>
                    
                    <motion.button
                      onClick={() => handleRemoveRoom(room.id)}
                      className="p-2 text-gray-400 hover:text-red-400 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <FaTrash className="text-sm" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const RoomCard = ({ room, onJoin, onRemove, onToggleFavorite }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all duration-300"
  >
    {/* Room card content */}
  </motion.div>
);

export default RecentRooms;
