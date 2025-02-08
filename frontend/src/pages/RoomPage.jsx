// import React, { useState, useEffect } from 'react';
// import { useParams } from 'react-router-dom';
// import { useUser } from '@clerk/clerk-react';

// const RoomPage = () => {
//   const { roomId } = useParams();
//   const { user } = useUser();
//   const [doubts, setDoubts] = useState([]);
//   const [newDoubt, setNewDoubt] = useState('');

//   const handleAddDoubt = () => {
//     const doubt = {
//       id: Math.random().toString(36).substring(2, 15),
//       text: newDoubt,
//       user: user.email,
//       upvotes: 0,
//     };
//     setDoubts([...doubts, doubt]);
//     setNewDoubt('');
//   };

//   const handleUpvote = (id) => {
//     setDoubts(doubts.map(doubt => doubt.id === id ? { ...doubt, upvotes: doubt.upvotes + 1 } : doubt));
//   };

//   const topDoubts = doubts.sort((a, b) => b.upvotes - a.upvotes).slice(0, 3);

//   return (
//     <div className='flex flex-col items-center mt-40'>
//       <h1 className='text-5xl'>Room ID: {roomId}</h1>
//       <div className='mt-10'>
//         <input
//           type='text'
//           value={newDoubt}
//           onChange={(e) => setNewDoubt(e.target.value)}
//           placeholder='Enter your doubt'
//           className='p-2 border-2 border-black rounded-lg'
//         />
//         <button onClick={handleAddDoubt} className='ml-2 text-2xl bg-blue-600 hover:bg-blue-700 cursor-pointer p-2 rounded-lg text-white border-2 border-black'>Add Doubt</button>
//       </div>
//       <div className='mt-10'>
//         <h2 className='text-3xl'>Doubts</h2>
//         {doubts.map(doubt => (
//           <div key={doubt.id} className='mt-5 p-2 border-2 border-black rounded-lg'>
//             <p>{doubt.text}</p>
//             <p>Upvotes: {doubt.upvotes}</p>
//             <button onClick={() => handleUpvote(doubt.id)} className='text-xl bg-blue-600 hover:bg-blue-700 cursor-pointer p-1 rounded-lg text-white border-2 border-black'>Upvote</button>
//           </div>
//         ))}
//       </div>
//       <div className='mt-10'>
//         <h2 className='text-3xl'>Top Doubts</h2>
//         {topDoubts.map(doubt => (
//           <div key={doubt.id} className='mt-5 p-2 border-2 border-black rounded-lg'>
//             <p>{doubt.text}</p>
//             <p>Upvotes: {doubt.upvotes}</p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default RoomPage;

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import socket from '../utils/socket';

const RoomPage = ({ role }) => {
  const { roomId } = useParams();
  const { user } = useUser();
  const [doubts, setDoubts] = useState([]);
  const [newDoubt, setNewDoubt] = useState('');

  useEffect(() => {
    socket.emit('joinRoom', roomId, role);

    socket.on('existingDoubts', (existingDoubts) => {
      setDoubts(existingDoubts);
    });

    socket.on('newDoubt', (doubt) => {
      setDoubts((prevDoubts) => [...prevDoubts, doubt]);
    });

    socket.on('upvoteDoubt', (doubtId) => {
      setDoubts((prevDoubts) =>
        prevDoubts.map((doubt) =>
          doubt.id === doubtId ? { ...doubt, upvotes: doubt.upvotes + 1 } : doubt
        )
      );
    });

    return () => {
      socket.off('existingDoubts');
      socket.off('newDoubt');
      socket.off('upvoteDoubt');
    };
  }, [roomId, role]);

  const handleAddDoubt = () => {
    const doubt = {
      id: Math.random().toString(36).substring(2, 15),
      text: newDoubt,
      user: user.email,
      upvotes: 0,
    };
    socket.emit('newDoubt', roomId, doubt);
    setNewDoubt('');
  };

  const handleUpvote = (id) => {
    socket.emit('upvoteDoubt', roomId, id);
  };

  const topDoubts = doubts.sort((a, b) => b.upvotes - a.upvotes).slice(0, 3);

  return (
    <div className='flex flex-col items-center mt-40'>
      <h1 className='text-5xl'>Room ID: {roomId}</h1>
      {role === 'participant' && (
        <div className='mt-10'>
          <input
            type='text'
            value={newDoubt}
            onChange={(e) => setNewDoubt(e.target.value)}
            placeholder='Enter your doubt'
            className='p-2 border-2 border-black rounded-lg'
          />
          <button onClick={handleAddDoubt} className='ml-2 text-2xl bg-blue-600 hover:bg-blue-700 cursor-pointer p-2 rounded-lg text-white border-2 border-black'>Add Doubt</button>
        </div>
      )}
      <div className='mt-10'>
        <h2 className='text-3xl'>Doubts</h2>
        {doubts.map(doubt => (
          <div key={doubt.id} className='mt-5 p-2 border-2 border-black rounded-lg'>
            <p>{doubt.text}</p>
            <p>Upvotes: {doubt.upvotes}</p>
            <button onClick={() => handleUpvote(doubt.id)} className='text-xl bg-blue-600 hover:bg-blue-700 cursor-pointer p-1 rounded-lg text-white border-2 border-black'>Upvote</button>
          </div>
        ))}
      </div>
      <div className='mt-10'>
        <h2 className='text-3xl'>Top Doubts</h2>
        {topDoubts.map(doubt => (
          <div key={doubt.id} className='mt-5 p-2 border-2 border-black rounded-lg'>
            <p>{doubt.text}</p>
            <p>Upvotes: {doubt.upvotes}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomPage;