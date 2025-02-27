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
    alert('Room ID copied to clipboard!');
  };

  return (
    <div className='flex flex-col items-center mt-40'>
      <h1 className='text-3xl md:text-5xl text-gray-300'>Create a Room</h1>
      <button onClick={handleCreateRoom} className='mt-10 text-2xl bg-blue-600 hover:bg-blue-700 cursor-pointer p-2 rounded-lg text-white border-2 border-black'>Create Room</button>
      <ToastContainer />
    </div>
  );
};

export default CreateRoomPage;
