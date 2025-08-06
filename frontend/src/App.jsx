import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CreateRoomPage from './pages/CreateRoomPage';
import JoinRoomPage from './pages/JoinRoomPage';
import RoomPage from './pages/RoomPage';
import './App.css';

const Navigation = () => {
  return (
    <nav className="flex justify-between items-center px-5 py-3 bg-gray-900 shadow-lg">
      <Link className="text-3xl md:text-5xl font-bold text-gray-300 hover:text-orange-500 transition duration-300 cursor-pointer" to="/">
        <span className="text-orange-500">Un</span>Doubt
      </Link>
    </nav>
  );
};



const App = () => {
  return (
    <Router>
      <Navigation />
      <Routes>
        {/* All routes are now public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/create-room" element={<CreateRoomPage />} />
        <Route path="/join-room" element={<JoinRoomPage />} />
        <Route path="/join-room/:roomId" element={<JoinRoomPage />} />
        <Route path="/room/:roomId" element={<RoomPage role="participant" />} />
        <Route path="/host/:roomId" element={<RoomPage role="host" />} />
      </Routes>
    </Router>
  );
};

export default App;


