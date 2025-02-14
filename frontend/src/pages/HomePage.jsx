import React from 'react';
import { SignedIn, SignedOut, SignIn, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

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
    <div>
      <div className='flex justify-center items-center mt-40'>
        <SignedOut>
          <SignIn allowedDomains={['vnrvjiet.in']} />
        </SignedOut>
      </div>
      <SignedIn>
        {user && (
          <div className='flex flex-col items-center'>
            <p className='text-6xl'>Welcome, {user.lastName}!</p>
            <div className='flex flex-row justify-center items-center mt-30'>
              <button onClick={handleCreateRoom} className='border-2 hover:text-white me-5 text-2xl bg-white hover:bg-blue-700 cursor-pointer p-2 rounded-lg text-black hover:border-black'>Create Room</button>
              <button onClick={handleJoinRoom} className='me-5 text-2xl bg-blue-600 hover:bg-blue-700 cursor-pointer p-2 rounded-lg text-white border-2 border-black'>Join Room</button>
            </div>
          </div>
        )}
      </SignedIn>
    </div>
  );
};

export default HomePage;
