import { io } from 'socket.io-client';

/**
 * Socket.IO Client Instance
 * Reusable socket connection for emergency namespace
 */

let socket = null;
let isConnecting = false;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * Connect socket instance
 * @param {string} accessToken - JWT access token
 * @returns {Socket} Socket instance
 */
export const connectSocket = (accessToken) => {
  // Return existing socket if connected and token matches
  if (socket && socket.connected) {
    return socket;
  }

  // Prevent duplicate connections
  if (isConnecting) {
    return socket;
  }

  if (!accessToken) {
    console.warn('Socket: No access token provided, cannot connect');
    return null;
  }

  isConnecting = true;

  // Create socket connection to emergency namespace
  socket = io(`${API_BASE_URL}/emergencies`, {
    auth: {
      token: accessToken
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
  });

  // Connection event handlers
  socket.on('connect', () => {
    console.log('🔌 Socket connected:', socket.id);
    isConnecting = false;
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error.message);
    isConnecting = false;
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason);
    isConnecting = false;
  });

  socket.on('error', (error) => {
    console.error('❌ Socket error:', error.message);
  });

  return socket;
};

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    isConnecting = false;
    console.log('🔌 Socket disconnected and cleaned up');
  }
};

/**
 * Check if socket is connected
 * @returns {boolean}
 */
export const isSocketConnected = () => {
  return socket && socket.connected;
};

/**
 * Get current socket instance (may be null)
 * @returns {Socket|null}
 */
export const getCurrentSocket = () => {
  return socket;
};

