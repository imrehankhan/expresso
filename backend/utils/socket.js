// This file is no longer needed as the backend should not use socket.io-client
// Socket server is already configured in app.js
// Remove this file or use it for server-side socket utilities if needed

export const createSocketNamespace = (io, namespace) => {
  return io.of(namespace);
};

export const emitToRoom = (io, roomId, event, data) => {
  io.to(roomId).emit(event, data);
};
