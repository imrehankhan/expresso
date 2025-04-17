// import React from 'react';
// import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
// import { SignedIn, SignedOut, RedirectToSignIn, useClerk, SignIn } from '@clerk/clerk-react';
// import HomePage from './pages/HomePage';
// import CreateRoomPage from './pages/CreateRoomPage';
// import JoinRoomPage from './pages/JoinRoomPage';
// import RoomPage from './pages/RoomPage';
// import './App.css';

// const Navigation = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { signOut } = useClerk();

//   const handleLogout = () => {
//     signOut();
//     navigate('/');
//   };
  
//   const hideLogoutButton = location.pathname.startsWith('/host');

//   return (
//     <nav className='flex justify-center text-5xl mt-5'>
//       <Link className='mt-10 md:mt-0 text-gray-300' to="/"><span className='text-orange-500'>Un</span>Doubt</Link>
//       <SignedIn>
//         {!hideLogoutButton && (
//           <button className='text-red-500 border-2 border-red rounded text-xl hover:bg-red-500 hover:text-white p-1 cursor-pointer absolute top-0 right-0 mt-2 mr-2 hover:border-black' onClick={handleLogout}>Logout</button>
//         )}
//       </SignedIn>
//     </nav>
//   );
// };

// const SignInPage = () => (
//   <div className="flex flex-col items-center mt-20">
//       <Link className='text-5xl mb-20 text-gray-300' to="/"><span className='text-orange-500'>Un</span>Doubt</Link>
//       <h2 className="text-xl mb-4 text-center text-gray-200">Please sign in with your college mail ID</h2>
//     <SignIn />
//   </div>
// );

// const App = () => {
//   return (
//     <Router>
//       <SignedOut>
//         <SignInPage />
//       </SignedOut>
//       <SignedIn>
//         <Navigation />
//         <Routes>
//           {/* Public routes */}
//           <Route path="/" element={<HomePage />} />
//           <Route path="/create-room" element={<CreateRoomPage />} />
//           <Route path="/join-room" element={<JoinRoomPage />} />
//           <Route path="/join-room/:roomId" element={<JoinRoomPage />} />

//           {/* Protected routes */}
//           <Route
//             path="/room/:roomId"
//             element={
//               <RoomPage role="participant" />
//             }
//           />
//           <Route
//             path="/host/:roomId"
//             element={
//               <RoomPage role="host" />
//             }
//           />

//           {/* Redirect to sign-in for protected routes */}
//           <Route
//             path="*"
//             element={
//               <RedirectToSignIn />
//             }
//           />
//         </Routes>
//       </SignedIn>
//     </Router>
//   );
// };

// export default App;


import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn, useClerk, SignIn } from '@clerk/clerk-react';
import HomePage from './pages/HomePage';
import CreateRoomPage from './pages/CreateRoomPage';
import JoinRoomPage from './pages/JoinRoomPage';
import RoomPage from './pages/RoomPage';
import './App.css';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useClerk();

  const handleLogout = () => {
    signOut();
    navigate('/');
  };

  const hideLogoutButton = location.pathname.startsWith('/host');

  return (
    <nav className="flex justify-between items-center px-5 py-3 bg-gray-900 shadow-lg">
      <Link className="text-3xl md:text-5xl font-bold text-gray-300 hover:text-orange-500 transition duration-300" to="/">
        <span className="text-orange-500">Un</span>Doubt
      </Link>
      <SignedIn>
        {!hideLogoutButton && (
          <button
            className="text-sm md:text-lg text-red-500 border-2 border-red-500 rounded-lg px-4 py-2 hover:bg-red-500 hover:text-white transition duration-300"
            onClick={handleLogout}
          >
            Logout
          </button>
        )}
      </SignedIn>
    </nav>
  );
};

const SignInPage = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-purple-800 to-black text-white">
    <Link className="text-4xl md:text-6xl font-bold mb-10 text-gray-300 hover:text-orange-500 transition duration-300" to="/">
      <span className="text-orange-500">Un</span>Doubt
    </Link>
    <h2 className="text-lg md:text-xl mb-6 text-center text-gray-200">
      Please sign in with your college mail ID
    </h2>
      <SignIn />
  </div>
);

const App = () => {
  return (
    <Router>
      <SignedOut>
        <SignInPage />
      </SignedOut>
      <SignedIn>
        <Navigation />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/create-room" element={<CreateRoomPage />} />
          <Route path="/join-room" element={<JoinRoomPage />} />
          <Route path="/join-room/:roomId" element={<JoinRoomPage />} />

          {/* Protected routes */}
          <Route path="/room/:roomId" element={<RoomPage role="participant" />} />
          <Route path="/host/:roomId" element={<RoomPage role="host" />} />

          {/* Redirect to sign-in for protected routes */}
          <Route path="*" element={<RedirectToSignIn />} />
        </Routes>
      </SignedIn>
    </Router>
  );
};

export default App;


