import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaUser, FaQuestionCircle, FaUsers, FaTrophy, FaClock, FaCalendar, FaThumbsUp, FaArrowLeft, FaGlobe, FaChartLine, FaFire } from 'react-icons/fa';
import AnimatedBackground from '../components/AnimatedBackground';
import LoadingSpinner from '../components/LoadingSpinner';
import UserStats, { QuickStats } from '../components/UserStats';
import RecentRooms from '../components/RecentRooms';
import FeatureCard, { InteractiveFeatureCard } from '../components/FeatureCard';
import { getUserProfile, getUserCreatedRooms, getUserDoubts, getGlobalStats, createOrUpdateUser } from '../utils/api';

const ProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [createdRooms, setCreatedRooms] = useState([]);
  const [userDoubts, setUserDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [globalStats, setGlobalStats] = useState({
    activeRooms: 0,
    totalUsers: 0,
    questionsToday: 0,
    onlineUsers: 0
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      console.log('ProfilePage - User object:', user);
      console.log('ProfilePage - User UID:', user?.uid);
      console.log('ProfilePage - User email:', user?.email);
      console.log('ProfilePage - User displayName:', user?.displayName);

      if (!user?.uid) {
        console.log('No user UID available, user object:', user);
        setLoading(false);
        return;
      }

      console.log('Fetching profile data for user:', user.uid);
      setLoading(true);
      setError(null);

      try {
        console.log('1. Initializing user in backend...');
        // Initialize user in backend
        await createOrUpdateUser({
          userId: user.uid,
          email: user.email,
          displayName: user.displayName
        });
        console.log('✓ User initialized');

        console.log('2. Fetching profile data...');
        // Fetch all profile data
        const [profileRes, roomsRes, doubtsRes, statsRes] = await Promise.all([
          getUserProfile(user.uid),
          getUserCreatedRooms(user.uid),
          getUserDoubts(user.uid),
          getGlobalStats()
        ]);

        console.log('✓ Profile data fetched:', {
          profile: profileRes.profile,
          rooms: roomsRes.rooms.length,
          doubts: doubtsRes.doubts.length,
          stats: statsRes.stats
        });

        setProfile(profileRes.profile || {
          user: {
            userId: user.uid,
            email: user.email,
            displayName: user.displayName,
            joinedAt: new Date(),
            lastActive: new Date(),
            rank: 'Beginner'
          },
          stats: {
            roomsCreated: 0,
            roomsJoined: 0,
            doubtsAsked: 0,
            upvotesReceived: 0,
            streak: 0,
            timeSpent: 0
          }
        });
        setCreatedRooms(roomsRes.rooms || []);
        setUserDoubts(doubtsRes.doubts || []);
        setGlobalStats(statsRes.stats || {
          activeRooms: 0,
          totalUsers: 0,
          questionsToday: 0,
          onlineUsers: 0
        });
      } catch (error) {
        console.error('❌ Error fetching profile data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <AnimatedBackground>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="xl" text="Loading profile..." />
        </div>
      </AnimatedBackground>
    );
  }

  if (error) {
    return (
      <AnimatedBackground>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-6 max-w-md text-center">
            <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Profile</h2>
            <p className="text-red-300 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </AnimatedBackground>
    );
  }

  if (!user) {
    return (
      <AnimatedBackground>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-6 max-w-md text-center">
            <h2 className="text-xl font-bold text-yellow-400 mb-2">No User Found</h2>
            <p className="text-yellow-300 mb-4">Please log in to view your profile.</p>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </AnimatedBackground>
    );
  }

  const features = [
    {
      icon: <FaQuestionCircle />,
      title: "Ask Questions",
      description: "Get instant answers from peers and experts",
      gradient: "from-blue-500 to-purple-500",
      stats: [
        { value: globalStats.questionsToday || 0, label: "Today" },
        { value: "95%", label: "Answered" }
      ]
    },
    {
      icon: <FaUsers />,
      title: "Join Communities",
      description: "Connect with students and faculty",
      gradient: "from-purple-500 to-pink-500",
      stats: [
        { value: globalStats.totalUsers || 0, label: "Users" },
        { value: globalStats.activeRooms || 0, label: "Active Rooms" }
      ]
    },
    {
      icon: <FaChartLine />,
      title: "Track Progress",
      description: "Monitor your learning journey",
      gradient: "from-green-500 to-blue-500",
      stats: [
        { value: "85%", label: "Engagement" },
        { value: "4.8", label: "Rating" }
      ]
    }
  ];

  return (
    <AnimatedBackground>
      <div className="min-h-screen p-4 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Back Button and Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <motion.button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-md border border-white/20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaArrowLeft className="text-purple-400" />
              <span className="text-white text-sm sm:text-base">Back to Home</span>
            </motion.button>

            <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm text-gray-400">
              <FaGlobe className="text-green-400" />
              <span>{globalStats.onlineUsers} online</span>
            </div>
          </motion.div>

          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center mb-4">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user?.displayName?.charAt(0) || 'U'}
              </div>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">{user?.displayName || 'User'}</h1>
            <p className="text-gray-300">{user?.email || 'No email'}</p>
            <div className="mt-4 inline-flex items-center px-3 py-1 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full border border-purple-400/30">
              <FaTrophy className="text-yellow-400 mr-2" />
              <span className="text-purple-300 font-medium">{profile?.user?.rank || 'Beginner'}</span>
            </div>
          </motion.div>

          {/* Debug Info (temporary) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray-800/50 rounded-lg p-4 mb-6 text-xs"
          >
            <h4 className="text-white font-bold mb-2">Debug Info:</h4>
            <div className="text-gray-300 space-y-1">
              <div>User: {user ? '✓' : '✗'} ({user?.uid})</div>
              <div>Profile: {profile ? '✓' : '✗'}</div>
              <div>Created Rooms: {createdRooms.length}</div>
              <div>User Doubts: {userDoubts.length}</div>
              <div>Global Stats: {globalStats.totalUsers} users</div>
              <div>Loading: {loading ? 'Yes' : 'No'}</div>
              <div>Error: {error || 'None'}</div>
            </div>
          </motion.div>

          {/* Stats Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-center">
              <FaUsers className="text-blue-400 text-2xl mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{profile?.stats?.roomsCreated || 0}</div>
              <div className="text-sm text-gray-400">Rooms Created</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-center">
              <FaQuestionCircle className="text-green-400 text-2xl mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{profile?.stats?.doubtsAsked || 0}</div>
              <div className="text-sm text-gray-400">Questions Asked</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-center">
              <FaThumbsUp className="text-purple-400 text-2xl mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{profile?.stats?.upvotesReceived || 0}</div>
              <div className="text-sm text-gray-400">Upvotes Received</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-center">
              <FaClock className="text-orange-400 text-2xl mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{profile?.stats?.timeSpent || 0}m</div>
              <div className="text-sm text-gray-400">Time Spent</div>
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6"
          >
            <div className="flex flex-wrap sm:flex-nowrap gap-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-1">
              {[
                { id: 'overview', label: 'Overview', shortLabel: 'Info' },
                { id: 'stats', label: 'Statistics', shortLabel: 'Stats' },
                { id: 'rooms', label: 'My Rooms', shortLabel: 'Rooms' },
                { id: 'questions', label: 'My Questions', shortLabel: 'Q&A' },
                { id: 'features', label: 'Features', shortLabel: 'More' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-0 px-2 sm:px-4 py-2 rounded-lg transition-all duration-200 text-xs sm:text-sm ${
                    activeTab === tab.id
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'overview' && profile && (
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm">Member Since</label>
                    <p className="text-white">{formatDate(profile.user.joinedAt)}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Last Active</label>
                    <p className="text-white">{formatDateTime(profile.user.lastActive)}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Current Streak</label>
                    <p className="text-white">{profile.stats.streak} days</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Rooms Joined</label>
                    <p className="text-white">{profile.stats.roomsJoined}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="space-y-6">
                {/* Global Statistics */}
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Global Statistics</h3>
                  <QuickStats stats={globalStats} className="justify-center mb-6" />
                </div>

                {/* User Statistics */}
                <UserStats userId={user?.uid} />

                {/* Recent Activity */}
                <RecentRooms userId={user?.uid} limit={5} />
              </div>
            )}

            {activeTab === 'rooms' && (
              <div className="space-y-4">
                {createdRooms.length === 0 ? (
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8 text-center">
                    <FaUsers className="text-gray-400 text-4xl mx-auto mb-4" />
                    <p className="text-gray-400">No rooms created yet</p>
                  </div>
                ) : (
                  createdRooms.map((room, index) => (
                    <motion.div
                      key={room.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-white">{room.topic}</h4>
                          <p className="text-gray-400">Room ID: {room.id}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-400">Created</div>
                          <div className="text-white">{formatDate(room.createdAt)}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-xl font-bold text-blue-400">{room.questions}</div>
                          <div className="text-xs text-gray-400">Questions</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-green-400">{room.answered}</div>
                          <div className="text-xs text-gray-400">Answered</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-purple-400">{room.participants}</div>
                          <div className="text-xs text-gray-400">Participants</div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'questions' && (
              <div className="space-y-4">
                {userDoubts.length === 0 ? (
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8 text-center">
                    <FaQuestionCircle className="text-gray-400 text-4xl mx-auto mb-4" />
                    <p className="text-gray-400">No questions asked yet</p>
                  </div>
                ) : (
                  userDoubts.map((doubt, index) => (
                    <motion.div
                      key={doubt.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <p className="text-white mb-2">{doubt.text}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span>Room: {doubt.roomTopic}</span>
                            <span>•</span>
                            <span>{formatDateTime(doubt.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 ml-4">
                          <div className="text-center">
                            <div className="text-lg font-bold text-purple-400">{doubt.upvotes}</div>
                            <div className="text-xs text-gray-400">Upvotes</div>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs ${
                            doubt.answered 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {doubt.answered ? 'Answered' : 'Pending'}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'features' && (
              <div className="space-y-6">
                {/* Feature Cards */}
                <div>
                  <h3 className="text-2xl font-bold text-white mb-6">Explore Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                      <InteractiveFeatureCard
                        key={index}
                        {...feature}
                        delay={index * 0.1}
                      />
                    ))}
                  </div>
                </div>

                {/* Trending Topics */}
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Trending Topics</h3>
                  <div className="flex flex-wrap gap-2">
                    {['Data Structures', 'Machine Learning', 'Web Development', 'Algorithms', 'Database Design', 'React.js'].map((topic, index) => (
                      <motion.button
                        key={topic}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="px-3 py-1 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-400/30 rounded-full text-sm text-purple-300 hover:bg-purple-500/30 transition-all"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        #{topic}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatedBackground>
  );
};

export default ProfilePage;
