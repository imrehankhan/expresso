import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const JoinRoomPage = () => {
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();

  const handleJoinRoom = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/rooms/${roomId}`);
      if (response.data.exists) {
        navigate(`/room/${roomId}`);
      } else {
        toast.error('Invalid Room ID');
      }
    } catch (error) {
      toast.error('Invalid Room ID');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-800 to-black flex flex-col items-center justify-center text-white">
      <h1 className="text-4xl md:text-6xl font-bold mb-6 text-center">
        Join a Room
      </h1>
      <p className="text-lg md:text-xl mb-6 text-center">
        Enter the Room ID or scan the QR code provided by the host.
      </p>
      <input
        type="text"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        placeholder="Enter Room ID"
        className="p-3 text-lg md:text-xl border-2 border-gray-300 rounded-lg text-black w-72 md:w-96 mb-6 placeholder-gray-600 bg-gray-200"
      />
      <button
        onClick={handleJoinRoom}
        className="px-6 py-3 text-lg md:text-xl font-semibold bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300 cursor-pointer"
      >
        Join Room
      </button>
      <ToastContainer />
    </div>
  );
};

export default JoinRoomPage;