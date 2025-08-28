import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import socket from '../utils/socket';
import QRCode from 'react-qr-code';
import { FaCopy, FaEye, FaEyeSlash, FaCheck, FaThumbsUp, FaMicrophone, FaVolumeUp, FaUsers, FaClock, FaSearch, FaTimes, FaBars, FaQrcode, FaExpand } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import stringSimilarity from 'string-similarity';
import { createRoom, submitDoubt, getDoubts, verifyRoomHost } from '../utils/api';

// Custom toast function to handle multiple notifications
const showNotification = (message, type = 'info', options = {}) => {
  const toastId = `toast-${type}-${Date.now()}`;
  const existingToast = toast.isActive(toastId);
  
  if (existingToast) {
    // If same toast exists, update it with count
    const count = parseInt(document.getElementById(toastId)?.getAttribute('data-count') || '1', 10) + 1;
    const toastElement = document.getElementById(toastId);
    if (toastElement) {
      toastElement.setAttribute('data-count', count);
      const messageElement = toastElement.querySelector('.Toastify__toast-body');
      if (messageElement) {
        messageElement.textContent = count > 1 ? `${message} (x${count})` : message;
      }
    }
    return;
  }

  const mergedOptions = {
    toastId,
    autoClose: 3000,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    closeButton: false,
    position: 'top-right',
    onClose: () => {
      const toastElement = document.getElementById(toastId);
      if (toastElement) {
        toastElement.remove();
      }
    },
    ...options
  };

  switch (type) {
    case 'success':
      toast.success(message, mergedOptions);
      break;
    case 'error':
      toast.error(message, mergedOptions);
      break;
    case 'warning':
      toast.warn(message, mergedOptions);
      break;
    default:
      toast.info(message, mergedOptions);
  }
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL;

const RoomPage = ({ role: propRole }) => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Get role from URL params or props
  const urlParams = new URLSearchParams(window.location.search);
  const urlRole = urlParams.get('role');
  const requestedRole = urlRole || propRole || 'participant';

  // Host verification states
  const [isVerifyingHost, setIsVerifyingHost] = useState(true);
  const [isAuthorizedHost, setIsAuthorizedHost] = useState(false);
  const [actualRole, setActualRole] = useState('participant');

  const [doubts, setDoubts] = useState([]);
  const [answeredDoubts, setAnsweredDoubts] = useState([]);
  const [newDoubt, setNewDoubt] = useState('');
  const [similarity, setSimilarity] = useState(0);
  const [upvotedDoubts, setUpvotedDoubts] = useState(new Set());
  const [visibleEmails, setVisibleEmails] = useState(new Set());
  const [isRoomClosed, setIsRoomClosed] = useState(false);
  const [roomClosureMessage, setRoomClosureMessage] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('upvotes'); // Default to 'upvotes'
  const [socketConnected, setSocketConnected] = useState(false);
  const [animatingDoubts, setAnimatingDoubts] = useState(new Set());

  // UI states
  const [showQRCode, setShowQRCode] = useState(true); // Show QR code by default
  const [showFullScreenQR, setShowFullScreenQR] = useState(false);
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Added mobile menu state

  // Speech states
  const [isListening, setIsListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const speechSynthesis = useRef(window.speechSynthesis);
  const speechRecognition = useRef(null);

  // Store pending votes to handle duplicates
  const pendingVotes = useRef(new Set());

  // Get consistent user ID
  const getUserId = () => {
    const uid = user?.uid || user?.id;
    if (!uid) {
      console.warn('No user ID available');
    }
    return uid;
  };

  // Initialize speech APIs
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      speechRecognition.current = new SpeechRecognition();
      speechRecognition.current.continuous = false;
      speechRecognition.current.interimResults = false;
      speechRecognition.current.lang = 'en-US';

      speechRecognition.current.onresult = (event) => {
        const result = event.results[0][0].transcript;
        setNewDoubt(prev => prev + (prev ? ' ' : '') + result);
        setIsListening(false);
      };

      speechRecognition.current.onerror = () => {
        setIsListening(false);
        showNotification('Speech recognition failed. Please try again.', 'error');
      };

      speechRecognition.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Host verification effect
  useEffect(() => {
    const verifyHostAccess = async () => {
      if (!getUserId()) {
        setIsVerifyingHost(false);
        setActualRole('participant');
        return;
      }

      if (requestedRole === 'host') {
        try {
          const verification = await verifyRoomHost(roomId, getUserId());
          if (verification.isHost) {
            setIsAuthorizedHost(true);
            setActualRole('host');
            showNotification('Welcome back, host!', 'success');
          } else {
            setIsAuthorizedHost(false);
            setActualRole('participant');
            showNotification('Access denied: You are not the host of this room. Joining as participant.', 'warning');
            const newUrl = window.location.pathname + '?role=participant';
            window.history.replaceState({}, '', newUrl);
          }
        } catch (error) {
          console.error('Error verifying host:', error);
          setIsAuthorizedHost(false);
          setActualRole('participant');
          showNotification('Could not verify host status. Joining as participant.', 'error');
          const newUrl = window.location.pathname + '?role=participant';
          window.history.replaceState({}, '', newUrl);
        }
      } else {
        setActualRole('participant');
      }
      setIsVerifyingHost(false);
    };

    verifyHostAccess();
  }, [roomId, user?.uid, requestedRole]);

  // Socket connection and room management
  useEffect(() => {
    if (isVerifyingHost || !getUserId()) return;

    const initializeSocket = () => {
      // Clean up existing listeners
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('existingDoubts');
      socket.off('newDoubt');
      socket.off('upvoteDoubt');
      socket.off('downvoteDoubt');
      socket.off('markAsAnswered');
      socket.off('roomClosed');

      const handleConnect = () => {
        console.log('Socket connected');
        setSocketConnected(true);
        socket.emit('joinRoom', roomId, actualRole, (response) => {
          if (response?.error) {
            console.error('Error joining room:', response.error);
            showNotification('Failed to join room. Please refresh and try again.', 'error');
          } else {
            console.log('Successfully joined room');
          }
        });
      };

      const handleDisconnect = () => {
        console.log('Socket disconnected');
        setSocketConnected(false);
        // Clear pending votes on disconnect
        pendingVotes.current.clear();
      };

      const handleConnectError = (error) => {
        console.error('Socket connection error:', error);
        setSocketConnected(false);
        pendingVotes.current.clear();
      };

      const handleExistingDoubts = (existingDoubts) => {
        console.log('Received existing doubts:', existingDoubts);
        
        if (!Array.isArray(existingDoubts)) {
          console.error('Invalid existing doubts data:', existingDoubts);
          return;
        }

        const activeDoubts = existingDoubts.filter(d => !d.answered);
        const answeredDoubts = existingDoubts.filter(d => d.answered);
        
        setDoubts(activeDoubts);
        setAnsweredDoubts(answeredDoubts);
        
        const currentUserId = getUserId();
        if (currentUserId) {
          const upvoted = new Set(
            existingDoubts
              .filter(d => Array.isArray(d.upvotedBy) && d.upvotedBy.includes(currentUserId))
              .map(d => d.id)
          );
          setUpvotedDoubts(upvoted);
          console.log('Set initial upvoted doubts:', Array.from(upvoted));
        }
      };

      const handleNewDoubt = (doubt) => {
        console.log('Received new doubt:', doubt);
        setDoubts((prevDoubts) => {
          const existingDoubt = prevDoubts.find(d => d.id === doubt.id);
          if (existingDoubt) {
            return prevDoubts;
          }
          
          setAnimatingDoubts(prev => new Set(prev).add(doubt.id));
          setTimeout(() => {
            setAnimatingDoubts(prev => {
              const newSet = new Set(prev);
              newSet.delete(doubt.id);
              return newSet;
            });
          }, 1000);
          
          return [...prevDoubts, doubt];
        });
        
        showNotification(`New Question: ${doubt.text.substring(0, 50)}${doubt.text.length > 50 ? '...' : ''}`, 'info');
      };

      const handleUpvoteDoubt = (data) => {
        console.log('Received upvote update:', data);
        const { doubtId, upvotes, upvotedBy } = data;
        
        if (!doubtId) {
          console.error('Invalid upvote data received:', data);
          return;
        }

        const currentUserId = getUserId();

        // Remove from pending votes since we got a response
        pendingVotes.current.delete(doubtId);

        // Update both active and answered doubts with server data
        const updateDoubtUpvotes = (doubt) => {
          if (doubt.id === doubtId) {
            return {
              ...doubt,
              upvotes: typeof upvotes === 'number' ? upvotes : 0,
              upvotedBy: Array.isArray(upvotedBy) ? upvotedBy : []
            };
          }
          return doubt;
        };

        setDoubts(prevDoubts => prevDoubts.map(updateDoubtUpvotes));
        setAnsweredDoubts(prevAnswered => prevAnswered.map(updateDoubtUpvotes));

        // Update local upvoted state based on server data
        setUpvotedDoubts(prev => {
          const newSet = new Set(prev);
          if (Array.isArray(upvotedBy) && currentUserId && upvotedBy.includes(currentUserId)) {
            newSet.add(doubtId);
          } else {
            newSet.delete(doubtId);
          }
          return newSet;
        });

        console.log('Updated upvote state for doubt:', doubtId, 'New upvotes:', upvotes);
      };

      const handleDownvoteDoubt = handleUpvoteDoubt;

      const handleMarkAsAnswered = (doubtId, answered) => {
        console.log('Mark as answered received:', doubtId, answered);
        if (answered) {
          setDoubts(prev => {
            const doubtToMove = prev.find(d => d.id === doubtId);
            if (doubtToMove) {
              setAnsweredDoubts(prevAnswered => {
                const isAlreadyAnswered = prevAnswered.some(d => d.id === doubtId);
                if (!isAlreadyAnswered) {
                  return [...prevAnswered, {
                    ...doubtToMove,
                    answered: true,
                    answeredAt: new Date().toISOString()
                  }];
                }
                return prevAnswered;
              });
              
              return prev.filter(d => d.id !== doubtId);
            }
            return prev;
          });
        } else {
          setAnsweredDoubts(prev => {
            const doubtToMove = prev.find(d => d.id === doubtId);
            if (doubtToMove) {
              setDoubts(prevActive => {
                const isAlreadyActive = prevActive.some(d => d.id === doubtId);
                if (!isAlreadyActive) {
                  return [...prevActive, {
                    ...doubtToMove,
                    answered: false
                  }];
                }
                return prevActive;
              });
              
              return prev.filter(d => d.id !== doubtId);
            }
            return prev;
          });
        }
      };

      const handleRoomClosed = (data) => {
        console.log('Room closed:', data);
        setIsRoomClosed(true);
        setRoomClosureMessage(data?.message || 'Room has been closed by the host');
        showNotification('Room has been closed by the host. Redirecting to home...', 'warning', { autoClose: 5000 });
        
        // Redirect to home page after 3 seconds
        setTimeout(() => {
          navigate('/');
        }, 3000);
      };

      // Set up event listeners
      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      socket.on('connect_error', handleConnectError);
      socket.on('existingDoubts', handleExistingDoubts);
      socket.on('newDoubt', handleNewDoubt);
      socket.on('upvoteDoubt', handleUpvoteDoubt);
      socket.on('downvoteDoubt', handleDownvoteDoubt);
      socket.on('markAsAnswered', handleMarkAsAnswered);
      socket.on('roomClosed', handleRoomClosed);

      // Connect if not already connected
      if (!socket.connected) {
        console.log('Connecting socket...');
        socket.connect();
      } else {
        handleConnect();
      }
    };

    initializeSocket();

    // Cleanup function
    return () => {
      console.log('Cleaning up socket listeners');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('existingDoubts');
      socket.off('newDoubt');
      socket.off('upvoteDoubt');
      socket.off('downvoteDoubt');
      socket.off('markAsAnswered');
      socket.off('roomClosed');
      pendingVotes.current.clear();
    };
  }, [isVerifyingHost, actualRole, roomId, navigate]);

  // Initial fetch of doubts (backup)
  useEffect(() => {
    const fetchDoubts = async () => {
      if (!socketConnected) return;
      
      try {
        const response = await axios.get(`${API_BASE_URL}/rooms/${roomId}/doubts`);
        const allDoubts = response.data || [];
        const activeDoubts = allDoubts.filter(d => !d.answered);
        const answeredDoubts = allDoubts.filter(d => d.answered);
        
        setDoubts(prev => prev.length === 0 ? activeDoubts : prev);
        setAnsweredDoubts(prev => prev.length === 0 ? answeredDoubts : prev);
        
        const currentUserId = getUserId();
        const upvoted = new Set(
          allDoubts
            .filter(d => Array.isArray(d.upvotedBy) && d.upvotedBy.includes(currentUserId))
            .map(d => d.id)
        );
        setUpvotedDoubts(upvoted);
      } catch (error) {
        console.error('Error fetching doubts:', error);
        showNotification('Failed to load questions. Please try refreshing the page.', 'error');
      }
    };

    const timeoutId = setTimeout(fetchDoubts, 1000);
    return () => clearTimeout(timeoutId);
  }, [roomId, socketConnected]);

  // Speech functionality
  const handleStartListening = () => {
    if (!speechRecognition.current) {
      showNotification('Speech recognition is not supported in your browser', 'error');
      return;
    }

    try {
      setIsListening(true);
      speechRecognition.current.start();
    } catch (error) {
      setIsListening(false);
      showNotification('Failed to start speech recognition', 'error');
    }
  };

  const handleStopListening = () => {
    if (speechRecognition.current && isListening) {
      speechRecognition.current.stop();
    }
    setIsListening(false);
  };

  const handleSpeakQuestion = (text) => {
    if (!('speechSynthesis' in window)) {
      showNotification('Text-to-speech is not supported in your browser', 'error');
      return;
    }

    if (speaking) {
      speechSynthesis.current.cancel();
      setSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      speechSynthesis.current.speak(utterance);
    }
  };

  const handleAddDoubt = () => {
    if (newDoubt.trim() === '') {
      showNotification('Question cannot be empty', 'error');
      return;
    }

    if (!socketConnected) {
      showNotification('Please wait for connection to be established.', 'warning');
      return;
    }

    const currentUserId = getUserId();
    const doubt = {
      id: Math.random().toString(36).substring(2, 15) + Date.now(),
      text: newDoubt.trim(),
      user: user.emailAddresses[0].emailAddress,
      userId: currentUserId,
      upvotes: 0,
      upvotedBy: [],
      createdAt: new Date().toISOString(),
      answered: false,
    };
    
    socket.emit('newDoubt', roomId, doubt, (response) => {
      if (response?.error) {
        console.error('Error submitting doubt:', response.error);
        showNotification('Failed to submit question. Please try again.', 'error');
      } else {
        showNotification('Question submitted successfully!', 'success');
      }
    });

    setNewDoubt('');
    setSimilarity(0);
  };

  const handleToggleUpvote = (id) => {
    if (!socketConnected) {
      showNotification('Please wait for connection to be established.', 'warning');
      return;
    }

    const currentUserId = getUserId();
    if (!currentUserId) {
      showNotification('User authentication required', 'error');
      return;
    }

    // Check if vote is already pending
    if (pendingVotes.current.has(id)) {
      showNotification('Vote in progress, please wait...', 'warning');
      return;
    }

    // Find the current doubt to get its current state
    const currentDoubt = [...doubts, ...answeredDoubts].find(d => d.id === id);
    if (!currentDoubt) {
      showNotification('Question not found', 'error');
      return;
    }

    const wasUpvoted = upvotedDoubts.has(id);
    console.log(`Toggling upvote for doubt ${id}: wasUpvoted=${wasUpvoted}, currentUserId=${currentUserId}`);

    // Add to pending votes
    pendingVotes.current.add(id);

    // Create optimistic update helper
    const createOptimisticUpdate = (doubt) => {
      if (doubt.id === id) {
        const currentUpvotedBy = Array.isArray(doubt.upvotedBy) ? doubt.upvotedBy : [];
        const newUpvotedBy = wasUpvoted 
          ? currentUpvotedBy.filter(userId => userId !== currentUserId)
          : [...currentUpvotedBy, currentUserId];
        
        return {
          ...doubt,
          upvotes: newUpvotedBy.length,
          upvotedBy: newUpvotedBy
        };
      }
      return doubt;
    };

    // Store original state for potential revert
    const originalDoubt = { ...currentDoubt };

    // Apply optimistic updates immediately
    setUpvotedDoubts(prev => {
      const newSet = new Set(prev);
      if (wasUpvoted) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      console.log('Optimistic upvote update:', Array.from(newSet));
      return newSet;
    });

    setDoubts(prevDoubts => prevDoubts.map(createOptimisticUpdate));
    setAnsweredDoubts(prevAnswered => prevAnswered.map(createOptimisticUpdate));

    // Emit the vote event with proper error handling
    const voteEventName = wasUpvoted ? 'downvoteDoubt' : 'upvoteDoubt';
    
    const timeoutId = setTimeout(() => {
      console.error('Vote request timed out for doubt:', id);
      pendingVotes.current.delete(id);
      showNotification('Vote request timed out. Please try again.', 'error');
      revertOptimisticUpdate();
    }, 10000); // 10 second timeout

    const revertOptimisticUpdate = () => {
      console.log('Reverting optimistic update for doubt:', id);
      // Revert upvoted state
      setUpvotedDoubts(prev => {
        const newSet = new Set(prev);
        if (wasUpvoted) {
          newSet.add(id);
        } else {
          newSet.delete(id);
        }
        return newSet;
      });

      // Revert doubt updates by restoring original state
      const revertUpdate = (doubt) => {
        if (doubt.id === id) {
          return originalDoubt;
        }
        return doubt;
      };

      setDoubts(prevDoubts => prevDoubts.map(revertUpdate));
      setAnsweredDoubts(prevAnswered => prevAnswered.map(revertUpdate));
    };

    socket.emit(voteEventName, roomId, id, currentUserId, (response) => {
      clearTimeout(timeoutId);
      pendingVotes.current.delete(id);
      
      if (response?.error) {
        console.error(`${voteEventName} error:`, response.error);
        showNotification(`Failed to ${wasUpvoted ? 'remove upvote' : 'upvote'}`, 'error');
        revertOptimisticUpdate();
      } else {
        console.log(`${voteEventName} successful for doubt ${id}`);
        // Success - the socket event handler will update the state with server data
      }
    });
  };

  const handleToggleEmailVisibility = (id) => {
    setVisibleEmails((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleMarkAsAnswered = (id) => {
    if (!socketConnected) {
      showNotification('Please wait for connection to be established.', 'warning');
      return;
    }

    // Add animation for moving question
    setAnimatingDoubts(prev => new Set(prev).add(id));
    
    socket.emit('markAsAnswered', roomId, id, (response) => {
      if (response?.error) {
        console.error('Error marking as answered:', response.error);
        showNotification('Failed to mark as answered. Please try again.', 'error');
        setAnimatingDoubts(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      } else {
        showNotification('Question marked as answered', 'success');
        setTimeout(() => {
          setAnimatingDoubts(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
          });
        }, 800);
      }
    });
  };

  const handleCopyRoomId = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(roomId).then(() => {
        showNotification('Room ID copied to clipboard!', 'success');
      }).catch((err) => {
        showNotification('Failed to copy Room ID', 'error');
        console.error('Failed to copy Room ID:', err);
      });
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = roomId;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        showNotification('Room ID copied to clipboard!', 'success');
      } catch (err) {
        showNotification('Failed to copy Room ID', 'error');
        console.error('Failed to copy Room ID:', err);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleCloseRoom = async () => {
    if (!socketConnected) {
      showNotification('Please wait for connection to be established.', 'warning');
      return;
    }

    try {
      // Emit room closure to all participants first
      socket.emit('closeRoom', roomId, (response) => {
        if (response?.error) {
          console.error('Error closing room:', response.error);
          showNotification('Failed to close room. Please try again.', 'error');
        } else {
          showNotification('Room closed successfully', 'success');
          // Navigate after successful closure
          setTimeout(() => navigate('/'), 1000);
        }
      });
      
      // Also make API call to delete room
      await axios.delete(`${API_BASE_URL}/rooms/${roomId}`);
    } catch (error) {
      console.error('Error closing room:', error);
      showNotification('Failed to close room. Please try again.', 'error');
    }
  };

  const handleLeaveRoom = () => {
    // Emit leave room event
    socket.emit('leaveRoom', roomId);
    navigate('/');
  };

  const handleDoubtChange = (e) => {
    const newDoubtText = e.target.value;
    setNewDoubt(newDoubtText);

    if (newDoubtText.trim() === '') {
      setSimilarity(0);
      return;
    }

    const existingDoubtTexts = doubts
      .filter(doubt => doubt && doubt.text && typeof doubt.text === 'string')
      .map(doubt => doubt.text);

    if (existingDoubtTexts.length === 0) {
      setSimilarity(0);
      return;
    }

    const bestMatch = stringSimilarity.findBestMatch(newDoubtText, existingDoubtTexts);
    setSimilarity(bestMatch.bestMatch.rating * 100);
  };

  // Filtering and sorting functions
  const getFilteredDoubts = (doubtsList) => {
    let filtered = [...doubtsList];

    if (searchQuery.trim()) {
      filtered = filtered.filter(doubt =>
        doubt.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doubt.user.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    switch (sortBy) {
      case 'newest':
        filtered = filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        filtered = filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'upvotes':
        filtered = filtered.sort((a, b) => {
          if (b.upvotes === a.upvotes) {
            return new Date(b.createdAt) - new Date(a.createdAt);
          }
          return b.upvotes - a.upvotes;
        });
        break;
      default:
        filtered = filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return filtered;
  };

  const sortedDoubts = getFilteredDoubts(doubts);
  const sortedAnsweredDoubts = getFilteredDoubts(answeredDoubts);

  // Show loading screen while verifying host
  if (isVerifyingHost) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white mx-auto mb-6"></div>
          <p className="text-white text-xl font-medium">Verifying access...</p>
        </motion.div>
      </div>
    );
  }

  // Show room closed message
  if (isRoomClosed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-pink-900 to-purple-900 flex items-center justify-center">
        <motion.div 
          className="text-center bg-black/20 backdrop-blur-xl rounded-2xl p-8 border border-white/10 max-w-md mx-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-6xl mb-4">🚪</div>
          <h2 className="text-2xl font-bold text-white mb-4">Room Closed</h2>
          <p className="text-red-200 mb-6">{roomClosureMessage}</p>
          <div className="text-sm text-red-300 mb-4">
            Redirecting to home page...
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition-colors"
          >
            Go to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white overflow-hidden'>
      {/* Mobile Header */}
      <div className="lg:hidden flex bg-black/20 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40 shadow-2xl p-4 justify-between items-center">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg bg-indigo-800 hover:bg-indigo-700 transition-colors"
          >
            <FaBars className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Room: {roomId}</h1>
            <div className="flex items-center gap-2 text-xs text-indigo-200">
              <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
              {socketConnected ? 'Connected' : 'Connecting...'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSearchFocused(!isSearchFocused)}
            className="p-2 rounded-lg bg-indigo-800 hover:bg-indigo-700 transition-colors"
          >
            <FaSearch className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {isSearchFocused && (
          <motion.div 
            className="fixed inset-0 z-50 bg-black bg-opacity-70 lg:hidden flex items-start pt-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSearchFocused(false)}
          >
            <motion.div 
              className="w-full p-4 bg-indigo-900"
              initial={{ y: -50 }}
              animate={{ y: 0 }}
              exit={{ y: -50 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-300">
                  <FaSearch className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-indigo-800 border border-indigo-700 rounded-lg text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-indigo-300 hover:text-white"
                  >
                    <FaTimes className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="mt-3">
                <div className="relative group">
                  <div className="relative w-full">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="appearance-none w-full bg-indigo-800 border border-indigo-700 rounded-lg pl-3 pr-8 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm cursor-pointer"
                    >
                      <option value="upvotes">Most Upvoted</option>
                      <option value="newest">Newest</option>
                      <option value="oldest">Oldest</option>
                    </select>
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-indigo-300">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsSearchFocused(false)}
                className="w-full mt-4 py-2 bg-indigo-700 rounded-lg text-white font-medium"
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            className="fixed inset-0 z-50 bg-black bg-opacity-70 lg:hidden flex"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div 
              className="absolute top-0 left-0 bottom-0 w-64 bg-indigo-900 shadow-xl"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-indigo-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Room Menu</h2>
                  <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-lg hover:bg-indigo-800"
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3 p-3 bg-indigo-800 rounded-lg">
                  <div className={`w-3 h-3 rounded-full ${socketConnected ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                  <span>{socketConnected ? 'Connected' : 'Connecting...'}</span>
                </div>

                <div className="space-y-2">
                  {actualRole !== 'participant' && (
                    <button
                      onClick={() => { setShowQRCode(true); setIsMobileMenuOpen(false); }}
                      className="w-full flex items-center gap-3 p-3 bg-indigo-800 hover:bg-indigo-700 rounded-lg transition-colors"
                    >
                      <FaQrcode className="w-5 h-5" />
                      <span>Show QR Code</span>
                    </button>
                  )}
                  
                  <button
                    onClick={handleCopyRoomId}
                    className="w-full flex items-center gap-3 p-3 bg-indigo-800 hover:bg-indigo-700 rounded-lg transition-colors"
                  >
                    <FaCopy className="w-5 h-5" />
                    <span>Copy Room ID</span>
                  </button>

                  {actualRole !== 'participant' && (
                    <button
                      onClick={handleCloseRoom}
                      className="w-full flex items-center gap-3 p-3 bg-red-800 hover:bg-red-700 rounded-lg transition-colors"
                    >
                      <span>Close Room</span>
                    </button>
                  )}

                  {actualRole === 'participant' && (
                    <button
                      onClick={handleLeaveRoom}
                      className="w-full flex items-center gap-3 p-3 bg-red-800 hover:bg-red-700 rounded-lg transition-colors"
                    >
                      <span>Leave Room</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Header */}
      <div className="hidden lg:flex bg-black/20 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40 shadow-2xl p-4 justify-between items-center">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsDesktopMenuOpen(!isDesktopMenuOpen)}
            className="p-2 rounded-lg bg-indigo-800 hover:bg-indigo-700 transition-colors"
          >
            <FaBars className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Room: {roomId.substring(0, 8)}</h1>
            <div className="flex items-center gap-2 text-xs text-indigo-200">
              <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
              {socketConnected ? 'Connected' : 'Connecting...'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-300">
              <FaSearch className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-10 pr-4 py-2 bg-indigo-800 border border-indigo-700 rounded-lg text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-indigo-300 hover:text-white"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-indigo-800 border border-indigo-700 rounded-lg pl-3 pr-8 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm cursor-pointer min-w-[140px]"
            >
              <option value="upvotes">Most Upvoted</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-indigo-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Menu */}
      <AnimatePresence>
        {isDesktopMenuOpen && (
          <motion.div 
            className="fixed inset-0 z-40 bg-black bg-opacity-70 lg:flex hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsDesktopMenuOpen(false)}
          >
            <motion.div 
              className="absolute top-0 left-0 bottom-0 w-64 bg-indigo-900 shadow-xl"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-indigo-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Room Menu</h2>
                  <button 
                    onClick={() => setIsDesktopMenuOpen(false)}
                    className="p-2 rounded-lg hover:bg-indigo-800"
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3 p-3 bg-indigo-800 rounded-lg">
                  <div className={`w-3 h-3 rounded-full ${socketConnected ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                  <span>{socketConnected ? 'Connected' : 'Connecting...'}</span>
                </div>

                <div className="space-y-2">
                  {actualRole !== 'participant' && (
                    <button
                      onClick={() => { setShowQRCode(true); setIsDesktopMenuOpen(false); }}
                      className="w-full flex items-center gap-3 p-3 bg-indigo-800 hover:bg-indigo-700 rounded-lg transition-colors"
                    >
                      <FaQrcode className="w-5 h-5" />
                      <span>Show QR Code</span>
                    </button>
                  )}
                  
                  <button
                    onClick={handleCopyRoomId}
                    className="w-full flex items-center gap-3 p-3 bg-indigo-800 hover:bg-indigo-700 rounded-lg transition-colors"
                  >
                    <FaCopy className="w-5 h-5" />
                    <span>Copy Room ID</span>
                  </button>

                  {actualRole !== 'participant' && (
                    <button
                      onClick={handleCloseRoom}
                      className="w-full flex items-center gap-3 p-3 bg-red-800 hover:bg-red-700 rounded-lg transition-colors"
                    >
                      <span>Close Room</span>
                    </button>
                  )}

                  {actualRole === 'participant' && (
                    <button
                      onClick={handleLeaveRoom}
                      className="w-full flex items-center gap-3 p-3 bg-red-800 hover:bg-red-700 rounded-lg transition-colors"
                    >
                      <span>Leave Room</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen QR Code */}
      <AnimatePresence>
        {showFullScreenQR && actualRole !== 'participant' && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFullScreenQR(false)}
          >
            <div className="max-w-md w-full bg-gray-900 rounded-2xl p-8 relative">
              <h3 className="text-2xl font-bold text-white mb-6">Scan to Join</h3>
              <div className="bg-white p-4 rounded-lg">
                <QRCode 
                  value={`${FRONTEND_URL}/join/${roomId}?role=participant`} 
                  size={window.innerWidth >= 768 ? 350 : 300}
                  level="H"
                  className="mx-auto"
                />
              </div>
              <p className="mt-4 text-center text-lg font-medium text-white-800">
                Scan to join the room
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 lg:py-6">
        <div className="grid grid-cols-1 gap-6">
          {/* Question Input for Participants */}
          {actualRole === 'participant' && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="bg-black/20 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-r from-green-500 to-blue-600 p-2 rounded-xl">
                  <span className="text-lg">💬</span>
                </div>
                <h2 className="text-xl font-bold">Ask Your Question</h2>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <textarea
                    value={newDoubt}
                    onChange={handleDoubtChange}
                    placeholder="Type your question here..."
                    className="w-full h-28 p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 resize-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 text-sm backdrop-blur-sm"
                    disabled={isRoomClosed || isListening}
                  />
                  {isListening && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium animate-pulse">
                      Listening...
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white/5 rounded-xl border border-white/10 text-xs">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">Similarity:</span>
                      <div className={`px-2 py-1 rounded-full font-bold ${
                        similarity > 70 ? 'bg-red-500/20 text-red-300' : 
                        similarity > 40 ? 'bg-yellow-500/20 text-yellow-300' : 
                        'bg-green-500/20 text-green-300'
                      }`}>
                        {similarity.toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-gray-400">
                      {newDoubt.length}/500
                    </div>
                  </div>
                  
                  <div className={`flex items-center gap-1 ${socketConnected ? 'text-green-400' : 'text-yellow-400'}`}>
                    <div className={`w-2 h-2 rounded-full animate-pulse ${socketConnected ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                    {socketConnected ? 'Connected' : 'Connecting...'}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  {speechRecognition.current && (
                    <motion.button
                      onClick={isListening ? handleStopListening : handleStartListening}
                      disabled={isRoomClosed || !socketConnected}
                      className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 text-sm ${
                        isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                      } disabled:bg-gray-600 disabled:cursor-not-allowed border border-white/20`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <FaMicrophone className="w-4 h-4" />
                      {isListening ? 'Stop' : 'Voice'}
                    </motion.button>
                  )}

                  <motion.button
                    onClick={handleAddDoubt}
                    disabled={isRoomClosed || !newDoubt.trim() || isListening || !socketConnected}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed rounded-xl font-medium transition-all duration-300 text-sm border border-white/20"
                    whileHover={{ scale: socketConnected && newDoubt.trim() ? 1.02 : 1 }}
                    whileTap={{ scale: socketConnected && newDoubt.trim() ? 0.98 : 1 }}
                  >
                    {socketConnected ? 'Submit Question' : 'Connecting...'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* QR Code Section - Visible to Host */}
          {actualRole !== 'participant' && showQRCode && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-indigo-900/50 backdrop-blur-lg rounded-2xl p-4 mb-6 border border-indigo-700/50 overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">Room QR Code</h3>
                  <p className="text-sm text-indigo-200">Share this code to let others join the room</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowFullScreenQR(true)}
                    className="p-2 rounded-lg bg-indigo-700 hover:bg-indigo-600 transition-colors"
                    title="Expand QR Code"
                  >
                    <FaExpand className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setShowQRCode(false)}
                    className="p-2 rounded-lg bg-indigo-700 hover:bg-indigo-600 transition-colors"
                    title="Hide QR Code"
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Questions Container */}
          <div className="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-xl">
            <div className="p-4 lg:p-6 lg:pb-8">
              {/* Tabs */}
              <div className="flex bg-white/5 rounded-xl overflow-hidden mb-4">
                <button
                  onClick={() => setActiveTab('active')}
                  className={`flex-1 px-4 py-3 font-medium transition-all duration-300 flex items-center justify-center gap-2 text-sm relative ${
                    activeTab === 'active'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>Active</span>
                  <div className="bg-white/20 px-2 py-1 rounded-full text-xs font-bold">
                    {sortedDoubts.length}
                  </div>
                </button>
                
                <button
                  onClick={() => setActiveTab('answered')}
                  className={`flex-1 px-4 py-3 font-medium transition-all duration-300 flex items-center justify-center gap-2 text-sm relative ${
                    activeTab === 'answered'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>Answered</span>
                  <div className="bg-white/20 px-2 py-1 rounded-full text-xs font-bold">
                    {sortedAnsweredDoubts.length}
                  </div>
                </button>
              </div>

              <AnimatePresence mode="wait">
                {activeTab === 'active' && (
                  <motion.div
                    key="active"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 30 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="space-y-4"
                  >
                    {sortedDoubts.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-10"
                      >
                        <div className="text-6xl mb-4">💬</div>
                        <h3 className="text-lg font-bold text-gray-300 mb-2">
                          {actualRole === 'participant'
                            ? 'No questions yet. Be the first to ask!'
                            : 'No active questions at the moment.'
                          }
                        </h3>
                        {searchQuery && (
                          <p className="text-gray-500 text-sm">
                            Try adjusting your search terms
                          </p>
                        )}
                      </motion.div>
                    ) : (
                      <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto custom-scrollbar pr-2">
                        {sortedDoubts.map((doubt, index) => (
                          <motion.div
                            key={doubt.id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ 
                              opacity: 1, 
                              y: 0, 
                              scale: 1,
                              ...(animatingDoubts.has(doubt.id) && {
                                scale: [1, 1.03, 1],
                                transition: { duration: 0.4, ease: "easeInOut" }
                              })
                            }}
                            transition={{ 
                              delay: index * 0.05,
                              type: "spring",
                              stiffness: 200,
                              damping: 20
                            }}
                            className={`bg-white/10 rounded-xl p-4 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 ${
                              animatingDoubts.has(doubt.id) ? 'ring-2 ring-blue-400/50' : ''
                            }`}
                          >
                            <div className="flex flex-col gap-4">
                              {/* Question Header */}
                              <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 shadow-lg text-sm">
                                  {doubt.user.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-sm lg:text-base leading-relaxed mb-2">
                                    {doubt.text}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300">
                                    <motion.div 
                                      className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full"
                                      animate={animatingDoubts.has(doubt.id) ? { scale: [1, 1.1, 1] } : {}}
                                      transition={{ duration: 0.2 }}
                                    >
                                      <FaThumbsUp className="text-xs lg:text-sm" />
                                      <span className="font-bold text-xs lg:text-sm">{doubt.upvotes || 0}</span>
                                    </motion.div>
                                    <span className="flex items-center gap-1">
                                      <FaClock className="text-xs lg:text-sm" />
                                      {new Date(doubt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {actualRole === 'host' && visibleEmails.has(doubt.id) && (
                                      <span className="text-blue-300 bg-blue-500/20 px-2 py-1 rounded-full border border-blue-500/30 text-xs">
                                        {doubt.user}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center justify-end gap-2">
                                {'speechSynthesis' in window && (
                                  <motion.button
                                    onClick={() => handleSpeakQuestion(doubt.text)}
                                    className={`p-2 rounded-lg transition-all duration-300 ${
                                      speaking ? 'bg-orange-600 hover:bg-orange-700' : 'bg-purple-600 hover:bg-purple-700'
                                    } border border-white/20 text-xs`}
                                    title={speaking ? 'Stop speaking' : 'Read question aloud'}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    {speaking ? 
                                      <span className="text-sm">🔇</span> : 
                                      <FaVolumeUp className="w-3 h-3 lg:w-4 lg:h-4" />
                                    }
                                  </motion.button>
                                )}

                                {actualRole === 'host' && (
                                  <React.Fragment>
                                    <motion.button
                                      onClick={() => handleToggleEmailVisibility(doubt.id)}
                                      className="p-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-all duration-300 border border-white/20 text-xs"
                                      title={visibleEmails.has(doubt.id) ? 'Hide email' : 'Show email'}
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                    >
                                      {visibleEmails.has(doubt.id) ? <FaEyeSlash className="w-3 h-3 lg:w-4 lg:h-4" /> : <FaEye className="w-3 h-3 lg:w-4 lg:h-4" />}
                                    </motion.button>
                                    <motion.button
                                      onClick={() => handleMarkAsAnswered(doubt.id)}
                                      disabled={!socketConnected}
                                      className="p-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-all duration-300 border border-white/20 text-xs"
                                      title="Mark as answered"
                                      whileHover={{ scale: socketConnected ? 1.05 : 1 }}
                                      whileTap={{ scale: socketConnected ? 0.95 : 1 }}
                                    >
                                      <FaCheck className="w-3 h-3 lg:w-4 lg:h-4" />
                                    </motion.button>
                                  </React.Fragment>
                                )}

                                <motion.button
                                  onClick={() => handleToggleUpvote(doubt.id)}
                                  disabled={!socketConnected || pendingVotes.current.has(doubt.id)}
                                  className={`p-2 rounded-lg transition-all duration-300 disabled:cursor-not-allowed border text-xs ${
                                    upvotedDoubts.has(doubt.id)
                                      ? 'bg-blue-600 text-white border-blue-500/50 scale-110'
                                      : 'bg-gray-600 hover:bg-gray-700 hover:scale-105 border-white/20'
                                  } ${!socketConnected || pendingVotes.current.has(doubt.id) ? 'opacity-50' : ''}`}
                                  title={pendingVotes.current.has(doubt.id) ? 'Processing...' : 'Upvote question'}
                                  whileHover={{ 
                                    scale: socketConnected && !pendingVotes.current.has(doubt.id) ? (upvotedDoubts.has(doubt.id) ? 1.1 : 1.05) : 1 
                                  }}
                                  whileTap={{ 
                                    scale: socketConnected && !pendingVotes.current.has(doubt.id) ? (upvotedDoubts.has(doubt.id) ? 1.0 : 0.95) : 1 
                                  }}
                                  animate={animatingDoubts.has(doubt.id) ? { 
                                    scale: [1, 1.1, 1],
                                    rotate: [0, 5, -5, 0]
                                  } : {}}
                                >
                                  <FaThumbsUp className="w-3 h-3 lg:w-4 lg:h-4" />
                                </motion.button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'answered' && (
                  <motion.div
                    key="answered"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="space-y-4"
                  >
                    {sortedAnsweredDoubts.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-10"
                      >
                        <div className="text-6xl mb-4">✅</div>
                        <h3 className="text-lg font-bold text-gray-300 mb-2">
                          No questions have been answered yet.
                        </h3>
                        {searchQuery && (
                          <p className="text-gray-500 text-sm">
                            Try adjusting your search terms
                          </p>
                        )}
                      </motion.div>
                    ) : (
                      <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto custom-scrollbar pr-2">
                        {sortedAnsweredDoubts.map((doubt, index) => (
                          <motion.div
                            key={doubt.id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ 
                              delay: index * 0.05,
                              type: "spring",
                              stiffness: 200,
                              damping: 20
                            }}
                            className="bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 rounded-xl p-4 border border-green-500/30 hover:border-green-500/50 transition-all duration-300"
                          >
                            <div className="flex flex-col gap-4">
                              {/* Question Header */}
                              <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-lg text-sm">
                                  ✅
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-sm lg:text-base leading-relaxed mb-2">
                                    {doubt.text}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300">
                                    <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full">
                                      <FaThumbsUp className="text-xs lg:text-sm" />
                                      <span className="font-bold text-xs lg:text-sm">{doubt.upvotes || 0}</span>
                                    </div>
                                    <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded-full font-bold border border-green-500/30 text-xs">
                                      ✓ Answered
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <FaClock className="text-xs lg:text-sm" />
                                      {new Date(doubt.answeredAt || doubt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {actualRole === 'host' && visibleEmails.has(doubt.id) && (
                                      <span className="text-blue-300 bg-blue-500/20 px-2 py-1 rounded-full border border-blue-500/30 text-xs">
                                        {doubt.user}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center justify-end gap-2">
                                {'speechSynthesis' in window && (
                                  <motion.button
                                    onClick={() => handleSpeakQuestion(doubt.text)}
                                    className={`p-2 rounded-lg transition-all duration-300 ${
                                      speaking ? 'bg-orange-600 hover:bg-orange-700' : 'bg-purple-600 hover:bg-purple-700'
                                    } border border-white/20 text-xs`}
                                    title={speaking ? 'Stop speaking' : 'Read question aloud'}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    {speaking ? 
                                      <span className="text-sm">🔇</span> : 
                                      <FaVolumeUp className="w-3 h-3 lg:w-4 lg:h-4" />
                                    }
                                  </motion.button>
                                )}

                                {actualRole === 'host' && (
                                  <motion.button
                                    onClick={() => handleToggleEmailVisibility(doubt.id)}
                                    className="p-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-all duration-300 border border-white/20 text-xs"
                                    title={visibleEmails.has(doubt.id) ? 'Hide email' : 'Show email'}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    {visibleEmails.has(doubt.id) ? <FaEyeSlash className="w-3 h-3 lg:w-4 lg:h-4" /> : <FaEye className="w-3 h-3 lg:w-4 lg:h-4" />}
                                  </motion.button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        toastStyle={{
          background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(30,30,30,0.9) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          color: 'white',
          fontSize: '14px'
        }}
      />
      
      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
        }

        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #667eea rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
};

export default RoomPage;