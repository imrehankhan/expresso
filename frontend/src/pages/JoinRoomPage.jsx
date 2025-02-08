import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const JoinRoomPage = () => {
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();

  const handleJoinRoom = () => {
    // Navigate to the room page
    navigate(`/room/${roomId}`);
  };

  return (
    <div className='flex flex-col items-center mt-40'>
      <h1 className='text-5xl'>Join a Room</h1>
      <input
        type='text'
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        placeholder='Enter Room ID'
        className='mt-10 p-2 border-2 border-black rounded-lg'
      />
      <button onClick={handleJoinRoom} className='mt-5 text-2xl bg-blue-600 hover:bg-blue-700 cursor-pointer p-2 rounded-lg text-white border-2 border-black'>Join Room</button>
    </div>
  );
};

export default JoinRoomPage;