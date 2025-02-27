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
    <div className="flex flex-col items-center mt-40">
      <h1 className="text-3xl text-gray-300">Enter roomId or scan QR code provided by the host</h1>
      <input
        type="text"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        placeholder="Enter Room ID"
        className="p-2 border-2 border-gray-300 text-gray-300 rounded-lg mt-5"
      />
      <button
        onClick={handleJoinRoom}
        className="mt-5 text-2xl bg-blue-600 hover:bg-blue-700 cursor-pointer p-2 rounded-lg text-white border-2 border-black"
      >
        Join Room
      </button>
      <ToastContainer />
    </div>
  );
};

export default JoinRoomPage;