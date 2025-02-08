// import React, { useEffect, useState } from 'react';
// import { useParams } from 'react-router-dom'; // Correct import
// import socket from '../utils/socket';

// const UserPage = () => {
//   const { roomId } = useParams();
//   const [doubtText, setDoubtText] = useState('');
//   const [doubts, setDoubts] = useState([]);

//   const handleSubmitDoubt = () => {
//     if (doubtText.trim()) {
//       const doubt = { id: Date.now(), text: doubtText, roomId };
//       socket.emit('submitDoubt', doubt);
//       setDoubtText('');
//     }
//   };

//   useEffect(() => {
//     socket.emit('joinRoom', roomId);

//     socket.on('newDoubt', (doubt) => {
//       setDoubts((prev) => [...prev, doubt]);
//     });

//     return () => {
//       socket.off('newDoubt');
//     };
//   }, [roomId]);

//   return (
//     <div className="p-4">
//       <h1 className="text-2xl font-bold">User Room: {roomId}</h1>
//       <div className="mt-4">
//         <input
//           type="text"
//           value={doubtText}
//           onChange={(e) => setDoubtText(e.target.value)}
//           placeholder="Enter your doubt"
//           className="border p-2 w-full"
//         />
//         <button
//           onClick={handleSubmitDoubt}
//           className="bg-blue-500 text-white px-4 py-2 mt-2 rounded cursor-pointer"
//         >
//           Submit Doubt
//         </button>
//       </div>
//       <div className="mt-4">
//         {doubts.map((doubt) => (
//           <div key={doubt.id} className="bg-gray-100 p-2 mb-2 rounded">
//             <p>{doubt.text}</p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default UserPage;

// // import React, { useState, useEffect } from 'react';
// // import { useParams } from 'react-router-dom';
// // import socket from '../utils/socket';

// // const UserPage = () => {
// //   const { roomId } = useParams();
// //   const [doubtText, setDoubtText] = useState('');
// //   const [doubts, setDoubts] = useState([]);

// //   // Handle doubt submission
// //   const handleSubmitDoubt = () => {
// //     if (doubtText.trim()) {
// //       const doubt = {
// //         id: Date.now(), // Unique ID for the doubt
// //         text: doubtText,
// //         roomId,
// //         upvotes: 0, // Initialize upvotes to 0
// //       };
// //       socket.emit('submitDoubt', doubt); // Send doubt to the server
// //       setDoubtText(''); // Clear the input field
// //     }
// //   };

// //   // Listen for new doubts
// //   useEffect(() => {
// //     socket.emit('joinRoom', roomId); // Join the room

// //     // Listen for new doubts
// //     socket.on('newDoubt', (doubt) => {
// //       setDoubts((prevDoubts) => [...prevDoubts, doubt]);
// //     });

// //     // Cleanup on unmount
// //     return () => {
// //       socket.off('newDoubt');
// //     };
// //   }, [roomId]);

// //   return (
// //     <div className="p-4">
// //       <h1 className="text-2xl font-bold mb-4">User Room: {roomId}</h1>
// //       <div className="mb-4">
// //         <input
// //           type="text"
// //           value={doubtText}
// //           onChange={(e) => setDoubtText(e.target.value)}
// //           placeholder="Enter your doubt"
// //           className="border p-2 w-full rounded"
// //         />
// //         <button
// //           onClick={handleSubmitDoubt}
// //           className="bg-blue-500 text-white px-4 py-2 mt-2 rounded"
// //         >
// //           Submit Doubt
// //         </button>
// //       </div>
// //       <div>
// //         <h2 className="text-xl font-bold mb-2">Doubts</h2>
// //         {doubts.map((doubt) => (
// //           <div key={doubt.id} className="bg-gray-100 p-3 mb-2 rounded">
// //             <p>{doubt.text}</p>
// //             <p className="text-sm text-gray-600">Upvotes: {doubt.upvotes}</p>
// //           </div>
// //         ))}
// //       </div>
// //     </div>
// //   );
// // };

// // export default UserPage;

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import socket from '../utils/socket';

const UserPage = () => {
  const { roomId } = useParams();
  const [doubtText, setDoubtText] = useState('');
  const [doubts, setDoubts] = useState([]);

  // Handle doubt submission
  const handleSubmitDoubt = () => {
    if (doubtText.trim()) {
      const doubt = {
        id: Date.now(), // Unique ID for the doubt
        text: doubtText,
        roomId,
        upvotes: 0, // Initialize upvotes to 0
      };
      socket.emit('submitDoubt', doubt); // Send doubt to the server
      setDoubtText(''); // Clear the input field
    }
  };

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
      <h1 className="text-2xl font-bold mb-4">User Room: {roomId}</h1>
      <div className="mb-4">
        <input
          type="text"
          value={doubtText}
          onChange={(e) => setDoubtText(e.target.value)}
          placeholder="Enter your doubt"
          className="border p-2 w-full rounded"
        />
        <button
          onClick={handleSubmitDoubt}
          className="bg-blue-500 text-white px-4 py-2 mt-2 rounded"
        >
          Submit Doubt
        </button>
      </div>
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

export default UserPage;