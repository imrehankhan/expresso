import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle, signInWithEmail, signUpWithEmail, getGoogleRedirectResult, logOut } from '../config/firebase';
import { isEmailAllowed, validateEmailForSignUp } from '../utils/emailValidation';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaGoogle, FaEye, FaEyeSlash } from 'react-icons/fa';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    // Validate email domain before proceeding
    const emailValidation = validateEmailForSignUp(email);
    if (!emailValidation.isValid) {
      toast.error(emailValidation.message);
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
        toast.success('Account created successfully!');
      } else {
        await signInWithEmail(email, password);
        toast.success('Successfully signed in!');
      }
      navigate('/');
    } catch (error) {
      console.error('Email auth error:', error);
      let errorMessage = 'Authentication failed. Please try again.';

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-800 to-black flex flex-col items-center justify-center text-white px-4">
      <div className="w-full max-w-sm sm:max-w-md p-4 sm:p-8 bg-gray-900 bg-opacity-50 rounded-lg shadow-2xl backdrop-blur-sm border border-gray-700">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            <span className="text-orange-500">Un</span>Doubt
          </h1>
          <p className="text-base sm:text-lg text-gray-300 mb-2">
            {isSignUp ? 'Create your account' : 'Welcome back!'}
          </p>
          <div className="bg-blue-900 bg-opacity-50 rounded-lg p-2 sm:p-3 border border-blue-600">
            <p className="text-xs sm:text-sm text-blue-200">
              🎓 For VNRVJIET Students & Faculty Only
            </p>
            <p className="text-xs text-blue-300 mt-1">
              Use your @vnrvjiet.in email address
            </p>
          </div>
        </div>

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 sm:gap-3 px-4 py-2 sm:px-6 sm:py-3 mb-4 sm:mb-6 text-sm sm:text-lg font-semibold bg-white text-gray-900 hover:bg-gray-100 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <FaGoogle className="text-base sm:text-xl" />
          <span className="hidden sm:inline">{loading ? 'Signing in...' : 'Continue with Google'}</span>
          <span className="sm:hidden">{loading ? 'Signing in...' : 'Google'}</span>
        </button>

        <div className="flex items-center mb-4 sm:mb-6">
          <div className="flex-1 border-t border-gray-600"></div>
          <span className="px-3 sm:px-4 text-sm text-gray-400">or</span>
          <div className="flex-1 border-t border-gray-600"></div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-3 sm:space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pr-10 sm:pr-12"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white text-sm"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-lg font-semibold bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        {/* Toggle Sign Up/Sign In */}
        <div className="mt-4 sm:mt-6 text-center">
          <p className="text-sm sm:text-base text-gray-400">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="ml-2 text-blue-400 hover:text-blue-300 font-semibold text-sm sm:text-base"
              disabled={loading}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
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
      />
    </div>
  );
};

export default LoginPage;
