import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateRoomPage = () => {
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    // Generate a unique room ID (for simplicity, using a random number here)
    const newRoomId = Math.random().toString(36).substring(2, 15);
    setRoomId(newRoomId);
    // Navigate to the room page
    navigate(`/room/${newRoomId}`);
  };

  return (
    <div className='flex flex-col items-center mt-40'>
      <h1 className='text-5xl'>Create a Room</h1>
      <button onClick={handleCreateRoom} className='mt-10 text-2xl bg-blue-600 hover:bg-blue-700 cursor-pointer p-2 rounded-lg text-white border-2 border-black'>Create Room</button>
      {roomId && (
        <div className='mt-10'>
          <p>Room ID: {roomId}</p>
          <p>Share this ID or QR code with users to join the room.</p>
          {/* Add QR code generation logic here */}
        </div>
      )}
    </div>
  );
};

export default CreateRoomPage;