import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const createRoom = async () => {
  const response = await axios.post(`${API_BASE_URL}/rooms`);
  return response.data;
};

export const submitDoubt = async (roomId, doubtText, user) => {
  const response = await axios.post(`${API_BASE_URL}/doubts`, { roomId, text: doubtText, user });
  return response.data;
};

export const getDoubts = async (roomId) => {
  const response = await axios.get(`${API_BASE_URL}/rooms/${roomId}/doubts`);
  return response.data;
};

// User management
export const createOrUpdateUser = async (userData) => {
  const response = await axios.post(`${API_BASE_URL}/users`, userData);
  return response.data;
};

export const getUserStats = async (userId) => {
  const response = await axios.get(`${API_BASE_URL}/users/${userId}/stats`);
  return response.data;
};

export const getUserRecentRooms = async (userId, limit = 5) => {
  const response = await axios.get(`${API_BASE_URL}/users/${userId}/recent-rooms?limit=${limit}`);
  return response.data;
};

// Global statistics
export const getGlobalStats = async () => {
  const response = await axios.get(`${API_BASE_URL}/statistics`);
  return response.data;
};

// Profile management
export const getUserProfile = async (userId) => {
  const response = await axios.get(`${API_BASE_URL}/users/${userId}/profile`);
  return response.data;
};

export const getUserCreatedRooms = async (userId) => {
  const response = await axios.get(`${API_BASE_URL}/users/${userId}/created-rooms`);
  return response.data;
};

export const getUserDoubts = async (userId) => {
  const response = await axios.get(`${API_BASE_URL}/users/${userId}/doubts`);
  return response.data;
};

// Room host verification
export const verifyRoomHost = async (roomId, userId) => {
  const response = await axios.get(`${API_BASE_URL}/rooms/${roomId}/verify-host/${userId}`);
  return response.data;
};

