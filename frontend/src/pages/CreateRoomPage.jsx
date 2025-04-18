import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { FaCopy } from 'react-icons/fa';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const CreateRoomPage = () => {
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();

  const handleCreateRoom = async () => {
    const newRoomId = Math.floor(10000 + Math.random() * 90000).toString();
    try {
      const response = await axios.post(`${API_BASE_URL}/rooms`, { roomId: newRoomId });
      setRoomId(newRoomId);
      toast.success('Room created successfully');
      navigate(`/host/${newRoomId}`);
    } catch (error) {
      toast.error('Failed to create room');
    }
  };

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    toast.success('Room ID copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-800 to-black flex flex-col items-center justify-center text-white">
      <h1 className="text-4xl md:text-6xl font-bold mb-6">Create a Room</h1>
      <button
        onClick={handleCreateRoom}
        className="px-6 py-3 text-lg md:text-xl font-semibold bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300 cursor-pointer"
      >
        Create Room
      </button>
      {roomId && (
        <div className="mt-10 flex flex-col items-center">
          <QRCode value={roomId} className="mb-5" />
          <p className="text-lg md:text-xl mb-3">Room ID: {roomId}</p>
          <button
            onClick={handleCopyRoomId}
            className="px-6 py-3 text-lg md:text-xl font-semibold bg-purple-600 hover:bg-purple-700 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300"
          >
            Copy Room ID
          </button>
        </div>
      )}
      <ToastContainer />
    </div>
  );
};

export default CreateRoomPage;

