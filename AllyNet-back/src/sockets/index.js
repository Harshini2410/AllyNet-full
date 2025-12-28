const socketIO = require('socket.io');

/**
 * Socket.IO Server Setup
 * Initializes Socket.IO with authentication and event handlers
 */

let io = null;

/**
 * Initialize Socket.IO server
 * @param {http.Server} server - HTTP server instance
 * @returns {SocketIO.Server} Socket.IO server instance
 */
const initializeSocketIO = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  console.log('✅ Socket.IO initialized');

  // Initialize emergency socket handlers
  const { initializeEmergencySockets } = require('./emergencySocket');
  initializeEmergencySockets(io);

  return io;
};

/**
 * Get Socket.IO instance
 * @returns {SocketIO.Server} Socket.IO server instance
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocketIO first.');
  }
  return io;
};

/**
 * Get Emergency namespace
 * @returns {SocketIO.Namespace} Emergency namespace
 */
const getEmergencyNamespace = () => {
  return getIO().of('/emergencies');
};

module.exports = {
  initializeSocketIO,
  getIO,
  getEmergencyNamespace
};

