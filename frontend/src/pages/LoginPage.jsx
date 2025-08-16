import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithGoogle, getGoogleRedirectResult, logOut } from '../config/firebase';
import { isEmailAllowed } from '../utils/emailValidation';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaGoogle, FaUsers, FaComments, FaChartLine, FaStar, FaQuoteLeft } from 'react-icons/fa';
import AnimatedBackground from '../components/AnimatedBackground';
import FeatureCard from '../components/FeatureCard';
import LoadingSpinner, { LoadingDots } from '../components/LoadingSpinner';


const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);
  const [showTestimonials, setShowTestimonials] = useState(false);
  const navigate = useNavigate();

  // Features data
  const features = [
    {
      icon: <FaComments />,
      title: "Real-time Q&A",
      description: "Ask questions and get answers instantly with live updates across all devices.",
      gradient: "from-blue-500 to-purple-500"
    },
    {
      icon: <FaUsers />,
      title: "Collaborative Learning",
      description: "Join study rooms, vote on questions, and learn together with your peers.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: <FaChartLine />,
      title: "Smart Analytics",
      description: "Track engagement, popular questions, and learning progress in real-time.",
      gradient: "from-green-500 to-blue-500"
    }
  ];

  // Testimonials data
  const testimonials = [
    {
      name: "Priya Sharma",
      role: "CSE Student",
      content: "UnDoubt has revolutionized how we interact during lectures. No more hesitation to ask questions!",
      rating: 5
    },
    {
      name: "Dr. Rajesh Kumar",
      role: "Faculty, ECE Dept",
      content: "This platform has significantly improved student engagement in my classes. Highly recommended!",
      rating: 5
    },
    {
      name: "Arjun Reddy",
      role: "IT Student",
      content: "The real-time voting feature helps prioritize the most important questions. Love it!",
      rating: 5
    }
  ];

  // Feature carousel effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [features.length]);

  // Testimonials toggle effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowTestimonials(prev => !prev);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Check for redirect result on component mount
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const result = await getGoogleRedirectResult();
        if (result) {
          const userEmail = result.user.email;

          // Check if email is allowed
          if (!isEmailAllowed(userEmail)) {
            // Sign out the user immediately
            await logOut();
            toast.error('Access denied: This website is only for VNRVJIET students and faculty.');
            navigate('/access-denied');
            return;
          }

          toast.success('Successfully signed in with Google!');
          navigate('/');
        }
      } catch (error) {
        console.error('Redirect result error:', error);
        toast.error('Failed to complete Google sign-in');
      }
    };

    checkRedirectResult();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      const userEmail = result.user.email;
      
      // Check if email is allowed
      if (!isEmailAllowed(userEmail)) {
        // Sign out the user immediately
        await logOut();
        toast.error('Access denied: This website is only for VNRVJIET students and faculty.');
        navigate('/access-denied');
        return;
      }
      
      toast.success('Successfully signed in with Google!');
      navigate('/');
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast.error('Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedBackground variant="gradient">


      <div className="min-h-screen flex flex-col lg:flex-row">
        {/* Left Side - Login Form */}
        <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-md"
          >
            {/* Glassmorphism Login Card */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-center mb-8"
              >
                <motion.h1
                  className="text-4xl sm:text-5xl font-bold mb-3 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  UnDoubt
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-lg text-gray-300 mb-6"
                >
                  Transform Your Learning Experience
                </motion.p>

                {/* Institution Badge */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                  className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 border border-blue-400/30"
                >
                  <p className="text-sm text-blue-200 font-medium">
                    🎓 VNRVJIET Students & Faculty
                  </p>
                  <p className="text-xs text-blue-300 mt-1">
                    Use your @vnrvjiet.in email address
                  </p>
                </motion.div>
              </motion.div>

              {/* Google Sign In Button */}
              <motion.button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 mb-6 text-lg font-semibold bg-white text-gray-900 hover:bg-gray-100 rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                {loading ? (
                  <LoadingDots color="purple" size="sm" />
                ) : (
                  <>
                    <FaGoogle className="text-xl text-red-500 group-hover:scale-110 transition-transform" />
                    Continue with Google
                  </>
                )}
              </motion.button>

              {/* Information */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-center"
              >
                <p className="text-sm text-gray-400 mb-2">
                  Sign in with your VNRVJIET Google account
                </p>
                <p className="text-xs text-gray-500">
                  Secure authentication • Privacy protected
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Right Side - Features & Testimonials */}
        <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
          <div className="w-full max-w-lg">
            {/* Feature Showcase */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mb-8"
            >
              <h2 className="text-2xl font-bold text-white mb-6 text-center">
                Why Choose UnDoubt?
              </h2>

              {/* Feature Carousel */}
              <div className="relative h-64 overflow-hidden rounded-2xl">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentFeature}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0"
                  >
                    <FeatureCard
                      {...features[currentFeature]}
                      className="h-full cursor-pointer"
                      onClick={() => setCurrentFeature((prev) => (prev + 1) % features.length)}
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Feature Indicators */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {features.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentFeature(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentFeature ? 'bg-white scale-125' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Testimonials Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <h3 className="text-xl font-semibold text-white mb-4 text-center">
                What Our Users Say
              </h3>

              <AnimatePresence mode="wait">
                {showTestimonials && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6"
                  >
                    {testimonials.map((testimonial, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="mb-4 last:mb-0"
                      >
                        <div className="flex items-start space-x-3">
                          <FaQuoteLeft className="text-purple-400 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-gray-300 text-sm mb-2">
                              "{testimonial.content}"
                            </p>
                            <div className="flex items-center space-x-2">
                              <div className="flex space-x-1">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                  <FaStar key={i} className="text-yellow-400 text-xs" />
                                ))}
                              </div>
                              <span className="text-xs text-gray-400">
                                {testimonial.name} • {testimonial.role}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        toastStyle={{
          background: 'rgba(17, 24, 39, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      />
    </AnimatedBackground>
  );
};

export default LoginPage;
