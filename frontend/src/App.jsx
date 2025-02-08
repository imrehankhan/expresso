// import React from 'react';
// import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
// import { SignedIn, SignedOut, RedirectToSignIn, useClerk } from '@clerk/clerk-react';
// import HomePage from './pages/HomePage';
// import HostPage from './pages/HostPage';
// import UserPage from './pages/UserPage';

// const Navigation = () => {
//   const navigate = useNavigate();
//   const { signOut } = useClerk();

//   const handleLogout = () => {
//     signOut();
//     navigate('/');
//   };

//   return (
//     <nav className='flex justify-center text-5xl mt-5'>
//       <Link to="/">E<span className='text-orange-500'>x</span>pre<span className='text-blue-600'>ss</span>o</Link>
//       <SignedIn>
//         <button className='text-red-500 border-2 border-red rounded text-xl hover:bg-red-500 hover:text-white p-1 cursor-pointer absolute top-0 right-0 mt-2 mr-2 hover:border-black' onClick={handleLogout}>Logout</button>
//       </SignedIn>
//     </nav>
//   );
// };

// const App = () => {
//   return (
//     <Router>
//       <Navigation />
//       <Routes>
//         {/* Public routes */}
//         <Route path="/" element={<HomePage />} />

//         {/* Protected routes */}
//         <Route
//           path="/host/:roomId"
//           element={
//             <SignedIn>
//               <HostPage />
//             </SignedIn>
//           }
//         />
//         <Route
//           path="/user/:roomId"
//           element={
//             <SignedIn>
//               <UserPage />
//             </SignedIn>
//           }
//         />

//         {/* Redirect to sign-in for protected routes */}
//         <Route
//           path="*"
//           element={
//             <SignedOut>
//               <RedirectToSignIn />
//             </SignedOut>
//           }
//         />
//       </Routes>
//     </Router>
//   );
// };

// export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn, useClerk } from '@clerk/clerk-react';
import HomePage from './pages/HomePage';
import CreateRoomPage from './pages/CreateRoomPage';
import JoinRoomPage from './pages/JoinRoomPage';
import RoomPage from './pages/RoomPage';

const Navigation = () => {
  const navigate = useNavigate();
  const { signOut } = useClerk();

  const handleLogout = () => {
    signOut();
    navigate('/');
  };

  return (
    <nav className='flex justify-center text-5xl mt-5'>
      <Link to="/">E<span className='text-orange-500'>x</span>pre<span className='text-blue-600'>ss</span>o</Link>
      <SignedIn>
        <button className='text-red-500 border-2 border-red rounded text-xl hover:bg-red-500 hover:text-white p-1 cursor-pointer absolute top-0 right-0 mt-2 mr-2 hover:border-black' onClick={handleLogout}>Logout</button>
      </SignedIn>
    </nav>
  );
};

const App = () => {
  return (
    <Router>
      <Navigation />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/create-room" element={<CreateRoomPage />} />
        <Route path="/join-room" element={<JoinRoomPage />} />

        {/* Protected routes */}
        <Route
          path="/room/:roomId"
          element={
            <SignedIn>
              <RoomPage role="participant" />
            </SignedIn>
          }
        />
        <Route
          path="/host/:roomId"
          element={
            <SignedIn>
              <RoomPage role="host" />
            </SignedIn>
          }
        />

        {/* Redirect to sign-in for protected routes */}
        <Route
          path="*"
          element={
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;