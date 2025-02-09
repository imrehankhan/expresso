import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { FaCopy } from 'react-icons/fa';

const CreateRoomPage = () => {
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    // Generate a unique room ID (for simplicity, using a random number here)
    const newRoomId = Math.random().toString(36).substring(2, 15);
    setRoomId(newRoomId);
    // Navigate to the room page
    navigate(`/host/${newRoomId}`);
  };

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    alert('Room ID copied to clipboard!');
  };

  return (
    <div className='flex flex-col items-center mt-40'>
      <h1 className='text-5xl'>Create a Room</h1>
      <button onClick={handleCreateRoom} className='mt-10 text-2xl bg-blue-600 hover:bg-blue-700 cursor-pointer p-2 rounded-lg text-white border-2 border-black'>Create Room</button>
      {roomId && (
        <div className='mt-10'>
          <p>Room ID: {roomId} <FaCopy onClick={handleCopyRoomId} className='cursor-pointer inline-block ml-2' /></p>
          <QRCode value={`http://localhost:5173/join-room/${roomId}`} />
          <p>Share this QR code with users to join the room.</p>
        </div>
      )}
    </div>
  );
};

export default CreateRoomPage;