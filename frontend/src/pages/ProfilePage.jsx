import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaUser, FaQuestionCircle, FaUsers, FaTrophy, FaClock, FaCalendar, FaThumbsUp, FaArrowLeft, FaChartLine, FaStar, FaMedal, FaCrown } from 'react-icons/fa';
import AnimatedBackground from '../components/AnimatedBackground';
import LoadingSpinner from '../components/LoadingSpinner';
import UserStats from '../components/UserStats';
import RecentRooms from '../components/RecentRooms';
import { InteractiveFeatureCard } from '../components/FeatureCard';
import { getUserProfile, getUserCreatedRooms, getUserDoubts, createOrUpdateUser } from '../utils/api';

const ProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [createdRooms, setCreatedRooms] = useState([]);
  const [userDoubts, setUserDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [userBadge, setUserBadge] = useState({ level: 'Beginner', icon: FaStar, color: 'text-yellow-400' });

  // Badge system configuration
  const getBadgeInfo = (stats) => {
    const totalActivity = (stats?.roomsCreated || 0) + (stats?.doubtsAsked || 0) + (stats?.upvotesReceived || 0);
    const roomsCreated = stats?.roomsCreated || 0;
    const questionsAsked = stats?.doubtsAsked || 0;
    const upvotes = stats?.upvotesReceived || 0;

    if (totalActivity >= 100 || roomsCreated >= 20 || questionsAsked >= 50 || upvotes >= 30) {
      return { level: 'Expert', icon: FaCrown, color: 'text-purple-400', bgColor: 'from-purple-500/20 to-indigo-500/20', borderColor: 'border-purple-400/30' };
    } else if (totalActivity >= 50 || roomsCreated >= 10 || questionsAsked >= 25 || upvotes >= 15) {
      return { level: 'Advanced', icon: FaMedal, color: 'text-blue-400', bgColor: 'from-blue-500/20 to-cyan-500/20', borderColor: 'border-blue-400/30' };
    } else if (totalActivity >= 20 || roomsCreated >= 5 || questionsAsked >= 10 || upvotes >= 5) {
      return { level: 'Intermediate', icon: FaTrophy, color: 'text-green-400', bgColor: 'from-green-500/20 to-emerald-500/20', borderColor: 'border-green-400/30' };
    } else {
      return { level: 'Beginner', icon: FaStar, color: 'text-yellow-400', bgColor: 'from-yellow-500/20 to-orange-500/20', borderColor: 'border-yellow-400/30' };
    }
  };

  const getNextBadgeRequirements = (currentStats) => {
    const badge = getBadgeInfo(currentStats);
    const totalActivity = (currentStats?.roomsCreated || 0) + (currentStats?.doubtsAsked || 0) + (currentStats?.upvotesReceived || 0);
    
    if (badge.level === 'Beginner') {
      return {
        nextLevel: 'Intermediate',
        requirements: [
          { label: 'Total Activity', current: totalActivity, needed: 20 },
          { label: 'Rooms Created', current: currentStats?.roomsCreated || 0, needed: 5 },
          { label: 'Questions Asked', current: currentStats?.doubtsAsked || 0, needed: 10 },
          { label: 'Upvotes Received', current: currentStats?.upvotesReceived || 0, needed: 5 }
        ]
      };
    } else if (badge.level === 'Intermediate') {
      return {
        nextLevel: 'Advanced',
        requirements: [
          { label: 'Total Activity', current: totalActivity, needed: 50 },
          { label: 'Rooms Created', current: currentStats?.roomsCreated || 0, needed: 10 },
          { label: 'Questions Asked', current: currentStats?.doubtsAsked || 0, needed: 25 },
          { label: 'Upvotes Received', current: currentStats?.upvotesReceived || 0, needed: 15 }
        ]
      };
    } else if (badge.level === 'Advanced') {
      return {
        nextLevel: 'Expert',
        requirements: [
          { label: 'Total Activity', current: totalActivity, needed: 100 },
          { label: 'Rooms Created', current: currentStats?.roomsCreated || 0, needed: 20 },
          { label: 'Questions Asked', current: currentStats?.doubtsAsked || 0, needed: 50 },
          { label: 'Upvotes Received', current: currentStats?.upvotesReceived || 0, needed: 30 }
        ]
      };
    } else {
      return null; // Expert level - no next level
    }
  };

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
        const [profileRes, roomsRes, doubtsRes] = await Promise.all([
          getUserProfile(user.uid),
          getUserCreatedRooms(user.uid),
          getUserDoubts(user.uid)
        ]);

        console.log('✓ Profile data fetched:', {
          profile: profileRes.profile,
          rooms: roomsRes.rooms.length,
          doubts: doubtsRes.doubts.length
        });

        const userProfile = profileRes.profile || {
          user: {
            userId: user.uid,
            email: user.email,
            displayName: user.displayName,
            joinedAt: new Date(),
            lastActive: new Date()
          },
          stats: {
            roomsCreated: 0,
            roomsJoined: 0,
            doubtsAsked: 0,
            upvotesReceived: 0,
            streak: 0,
            timeSpent: 0
          }
        };

        setProfile(userProfile);
        setCreatedRooms(roomsRes.rooms || []);
        setUserDoubts(doubtsRes.doubts || []);
        
        // Calculate badge based on real stats
        const badgeInfo = getBadgeInfo(userProfile.stats);
        setUserBadge(badgeInfo);
        
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
      gradient: "from-blue-500 to-purple-500"
    },
    {
      icon: <FaUsers />,
      title: "Create Study Rooms",
      description: "Host collaborative learning sessions",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: <FaChartLine />,
      title: "Track Progress",
      description: "Monitor your learning journey and earn badges",
      gradient: "from-green-500 to-blue-500"
    }
  ];

  const nextBadgeInfo = getNextBadgeRequirements(profile?.stats);

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
            
            {/* Enhanced Badge Display */}
            <motion.div 
              className={`mt-4 inline-flex items-center px-4 py-2 bg-gradient-to-r ${userBadge.bgColor} rounded-full border ${userBadge.borderColor}`}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <userBadge.icon className={`${userBadge.color} mr-2 text-lg`} />
              <span className={`${userBadge.color} font-bold text-lg`}>{userBadge.level}</span>
            </motion.div>
            
            {/* Badge Progress */}
            {nextBadgeInfo && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-3"
              >
                <p className="text-sm text-gray-400 mb-2">Next: {nextBadgeInfo.nextLevel}</p>
                <div className="max-w-md mx-auto">
                  {nextBadgeInfo.requirements.map((req, index) => {
                    const progress = Math.min((req.current / req.needed) * 100, 100);
                    const isCompleted = req.current >= req.needed;
                    
                    return (
                      <div key={index} className="mb-2">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>{req.label}</span>
                          <span className={isCompleted ? 'text-green-400' : ''}>
                            {req.current}/{req.needed} {isCompleted && '✓'}
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-1.5">
                          <motion.div
                            className={`h-1.5 rounded-full ${isCompleted ? 'bg-green-400' : 'bg-purple-400'}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
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
                    <p className="text-sm text-gray-500 mt-2">Create your first room to start collaborating!</p>
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
                          <div className="text-xl font-bold text-blue-400">{room.questions || 0}</div>
                          <div className="text-xs text-gray-400">Questions</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-green-400">{room.answered || 0}</div>
                          <div className="text-xs text-gray-400">Answered</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-purple-400">{room.participants || 0}</div>
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
                    <p className="text-sm text-gray-500 mt-2">Join a room and start asking questions!</p>
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
                            <div className="text-lg font-bold text-purple-400">{doubt.upvotes || 0}</div>
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

                {/* Badge Requirements */}
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Badge System</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { name: 'Beginner', icon: FaStar, color: 'yellow', requirements: 'Start your journey' },
                      { name: 'Intermediate', icon: FaTrophy, color: 'green', requirements: '20+ total activity OR 5+ rooms OR 10+ questions OR 5+ upvotes' },
                      { name: 'Advanced', icon: FaMedal, color: 'blue', requirements: '50+ total activity OR 10+ rooms OR 25+ questions OR 15+ upvotes' },
                      { name: 'Expert', icon: FaCrown, color: 'purple', requirements: '100+ total activity OR 20+ rooms OR 50+ questions OR 30+ upvotes' }
                    ].map((badge, index) => (
                      <motion.div
                        key={badge.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-4 rounded-lg border ${
                          userBadge.level === badge.name 
                            ? `bg-${badge.color}-500/20 border-${badge.color}-400/50` 
                            : 'bg-gray-700/30 border-gray-600/50'
                        }`}
                      >
                        <div className="text-center mb-3">
                          <badge.icon className={`text-2xl mx-auto mb-2 ${
                            userBadge.level === badge.name 
                              ? `text-${badge.color}-400` 
                              : 'text-gray-500'
                          }`} />
                          <h4 className={`font-semibold ${
                            userBadge.level === badge.name 
                              ? `text-${badge.color}-300` 
                              : 'text-gray-400'
                          }`}>{badge.name}</h4>
                        </div>
                        <p className="text-xs text-gray-500 text-center">{badge.requirements}</p>
                        {userBadge.level === badge.name && (
                          <div className="mt-2 text-center">
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                              Current Badge
                            </span>
                          </div>
                        )}
                      </motion.div>
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