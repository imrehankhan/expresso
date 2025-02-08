import React, { useEffect } from 'react';
import { SignedIn, SignedOut, SignIn, useUser } from '@clerk/clerk-react';

const HomePage = () => {
  const { user } = useUser();

  return (
    <div>
      {/* <h1>Please sign in to continue...</h1> */}
      <div className='flex justify-center items-center mt-40'>
      <SignedOut>
        <SignIn />
      </SignedOut>
      </div> 
      <SignedIn>
        
        {/* <p className='text-center'>You are signed in!</p> */}
        {user && (
          <div className='flex flex-col items-center'>
            <p className='text-9xl'>Welcome, {user.firstName}!</p>
            {/* <img src={user.profileImageUrl} alt="Profile" className="rounded-full w-24 h-24" /> */}
            <div className='flex flex-row justify-center items-center mt-30'>
              <button className='border-2 hover:text-white me-5 text-2xl bg-white hover:bg-blue-700 cursor-pointer p-2 rounded-lg text-black'>Create Room</button>
              <button className='me-5 text-2xl bg-blue-600 hover:bg-blue-700 cursor-pointer p-2 rounded-lg text-white border-2 border-black'>Join Room</button>
            </div>
          </div>
          
        )}
      </SignedIn>
    </div>
  );
};

export default HomePage;