import React from 'react';
import { SignedIn, SignedOut, SignIn, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import { LuUsersRound } from "react-icons/lu";
import { TiUserAddOutline } from "react-icons/ti";

const HomePage = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    navigate('/create-room');
  };

  const handleJoinRoom = () => {
    navigate('/join-room');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-800 to-black flex flex-col items-center justify-center text-white">
  <div className="flex justify-center items-center">
    <SignedOut>
      <SignIn allowedDomains={['vnrvjiet.in']} />
    </SignedOut>
  </div>
  <SignedIn>
    {user && (
      <div className="flex flex-col items-center text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-shadow-glow">
          Welcome, {user.lastName}!
        </h1>
        <p className="text-lg md:text-2xl mb-10">
          Create or join a room to start collaborating with others.
        </p>
        <div className="flex flex-col md:flex-row gap-5">
          <button
            onClick={handleCreateRoom}
            className="px-6 py-3 text-lg md:text-xl font-semibold bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300 flex items-center justify-center cursor-pointer"
          >
            <TiUserAddOutline/><span className='ml-1.5'>Create Room</span>
          </button>
          <button
            onClick={handleJoinRoom}
            className="px-6 py-3 text-lg md:text-xl font-semibold bg-purple-600 hover:bg-purple-700 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300 flex items-center justify-center cursor-pointer"
          >
            <LuUsersRound/> <span className='ml-2'>Join Room</span>
          </button>
        </div>
      </div>
    )}
  </SignedIn>
</div>
  );
};

export default HomePage;
