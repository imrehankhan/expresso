import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import socket from '../utils/socket';

const HostPage = () => {
  const { roomId } = useParams();
  const [doubts, setDoubts] = useState([]);

  // Listen for new doubts
  useEffect(() => {
    socket.emit('joinRoom', roomId); // Join the room

    // Listen for new doubts
    socket.on('newDoubt', (doubt) => {
      setDoubts((prevDoubts) => [...prevDoubts, doubt]);
    });

    // Cleanup on unmount
    return () => {
      socket.off('newDoubt');
    };
  }, [roomId]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Host Room: {roomId}</h1>
      <div>
        <h2 className="text-xl font-bold mb-2">Doubts</h2>
        {doubts.map((doubt) => (
          <div key={doubt.id} className="bg-gray-100 p-3 mb-2 rounded">
            <p>{doubt.text}</p>
            <p className="text-sm text-gray-600">Upvotes: {doubt.upvotes}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HostPage;