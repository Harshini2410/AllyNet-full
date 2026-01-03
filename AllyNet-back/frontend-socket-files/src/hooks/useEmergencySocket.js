import { useEffect, useRef } from 'react';
import { getSocket, disconnectSocket, isSocketConnected } from '../api/socket';

/**
 * useEmergencySocket Hook
 * Manages Socket.IO connection and event listeners for emergency system
 * 
 * @param {Object} options
 * @param {string} options.accessToken - JWT access token
 * @param {Object} options.emergencyStore - Zustand emergency store
 * @param {Object} options.authStore - Zustand auth store (for user info)
 * @param {string|null} options.activeEmergencyId - Current active emergency ID
 * @param {boolean} options.isHelper - Whether user is a helper
 * @param {Function} options.onEmergencyCreated - Callback for new emergency (helpers)
 * @param {Function} options.onEmergencyResolved - Callback for resolved emergency
 * @param {Function} options.onEmergencyCancelled - Callback for cancelled emergency
 */
export const useEmergencySocket = ({
  accessToken,
  emergencyStore,
  authStore,
  activeEmergencyId = null,
  isHelper = false,
  onEmergencyCreated = null,
  onEmergencyResolved = null,
  onEmergencyCancelled = null
}) => {
  const socketRef = useRef(null);
  const joinedRoomsRef = useRef(new Set());
  const locationUpdateIntervalRef = useRef(null);

  // Connect socket when authenticated
  useEffect(() => {
    if (!accessToken) {
      // Disconnect if no token
      if (socketRef.current) {
        disconnectSocket();
        socketRef.current = null;
      }
      return;
    }

    // Get socket instance
    const socket = getSocket(accessToken);
    if (!socket) {
      return;
    }

    socketRef.current = socket;

    // ============================================
    // SERVER → CLIENT EVENT LISTENERS
    // ============================================

    // Emergency created (for helpers)
    const handleEmergencyCreated = (data) => {
      console.log('📢 Emergency created:', data);
      
      if (onEmergencyCreated) {
        onEmergencyCreated(data.emergency);
      }
      
      // Update store if needed (for nearby emergencies list)
      if (emergencyStore?.addNearbyEmergency) {
        emergencyStore.addNearbyEmergency(data.emergency);
      }
    };

    // Emergency nearby (specific helper notification)
    const handleEmergencyNearby = (data) => {
      console.log('📢 Emergency nearby:', data);
      
      if (onEmergencyCreated) {
        onEmergencyCreated(data.emergency);
      }
    };

    // Helper joined (for emergency creator)
    const handleHelperJoined = (data) => {
      console.log('📢 Helper joined:', data);
      
      if (data.emergencyId === activeEmergencyId && emergencyStore) {
        // Add helper to store
        if (emergencyStore.addHelper) {
          emergencyStore.addHelper(data.helper);
        }
        
        // Update helpers count
        if (emergencyStore.incrementHelpersCount) {
          emergencyStore.incrementHelpersCount();
        }
      }
    };

    // Helper status update
    const handleHelperStatusUpdate = (data) => {
      console.log('📢 Helper status update:', data);
      
      if (data.emergencyId === activeEmergencyId && emergencyStore) {
        // Update helper status in store
        if (emergencyStore.updateHelperStatus) {
          emergencyStore.updateHelperStatus(data.helperId, data.status, data.notes);
        }
      }
    };

    // Emergency status changed
    const handleEmergencyStatusChanged = (data) => {
      console.log('📢 Emergency status changed:', data);
      
      if (data.emergencyId === activeEmergencyId && emergencyStore) {
        // Update emergency status in store
        if (emergencyStore.setEmergencyStatus) {
          emergencyStore.setEmergencyStatus(data.status);
        }
      }
    };

    // Emergency resolved
    const handleEmergencyResolved = (data) => {
      console.log('📢 Emergency resolved:', data);
      
      if (data.emergencyId === activeEmergencyId) {
        // Update store
        if (emergencyStore) {
          if (emergencyStore.setEmergencyStatus) {
            emergencyStore.setEmergencyStatus('resolved');
          }
          if (emergencyStore.setResolvedAt) {
            emergencyStore.setResolvedAt(data.resolvedAt);
          }
        }
        
        // Leave room
        if (socketRef.current && joinedRoomsRef.current.has(data.emergencyId)) {
          socketRef.current.emit('emergency:leave', { emergencyId: data.emergencyId });
          joinedRoomsRef.current.delete(data.emergencyId);
        }
        
        // Callback
        if (onEmergencyResolved) {
          onEmergencyResolved(data);
        }
      }
    };

    // Emergency cancelled
    const handleEmergencyCancelled = (data) => {
      console.log('📢 Emergency cancelled:', data);
      
      if (data.emergencyId === activeEmergencyId) {
        // Update store
        if (emergencyStore) {
          if (emergencyStore.setEmergencyStatus) {
            emergencyStore.setEmergencyStatus('cancelled');
          }
          if (emergencyStore.resetEmergency) {
            emergencyStore.resetEmergency();
          }
        }
        
        // Leave room
        if (socketRef.current && joinedRoomsRef.current.has(data.emergencyId)) {
          socketRef.current.emit('emergency:leave', { emergencyId: data.emergencyId });
          joinedRoomsRef.current.delete(data.emergencyId);
        }
        
        // Callback
        if (onEmergencyCancelled) {
          onEmergencyCancelled(data);
        }
      }
    };

    // Emergency ended (broadcast to all)
    const handleEmergencyEnded = (data) => {
      console.log('📢 Emergency ended:', data);
      
      if (data.emergencyId === activeEmergencyId) {
        // Clean up
        if (emergencyStore?.resetEmergency) {
          emergencyStore.resetEmergency();
        }
        
        // Leave room
        if (socketRef.current && joinedRoomsRef.current.has(data.emergencyId)) {
          socketRef.current.emit('emergency:leave', { emergencyId: data.emergencyId });
          joinedRoomsRef.current.delete(data.emergencyId);
        }
      }
    };

    // Location updated confirmation
    const handleLocationUpdated = (data) => {
      console.log('📍 Location updated:', data);
    };

    // Error handler
    const handleError = (error) => {
      console.error('❌ Socket error:', error.message);
    };

    // Join confirmation
    const handleEmergencyJoined = (data) => {
      console.log('✅ Joined emergency room:', data.room);
      if (data.emergencyId) {
        joinedRoomsRef.current.add(data.emergencyId);
      }
    };

    // Leave confirmation
    const handleEmergencyLeft = (data) => {
      console.log('👋 Left emergency room:', data.room);
      if (data.emergencyId) {
        joinedRoomsRef.current.delete(data.emergencyId);
      }
    };

    // Attach event listeners
    socket.on('emergency:created', handleEmergencyCreated);
    socket.on('emergency:nearby', handleEmergencyNearby);
    socket.on('helper:joined', handleHelperJoined);
    socket.on('helper:status_update', handleHelperStatusUpdate);
    socket.on('emergency:status_changed', handleEmergencyStatusChanged);
    socket.on('emergency:resolved', handleEmergencyResolved);
    socket.on('emergency:cancelled', handleEmergencyCancelled);
    socket.on('emergency:ended', handleEmergencyEnded);
    socket.on('location:updated', handleLocationUpdated);
    socket.on('error', handleError);
    socket.on('emergency:joined', handleEmergencyJoined);
    socket.on('emergency:left', handleEmergencyLeft);

    // Cleanup function
    return () => {
      // Remove all event listeners
      socket.off('emergency:created', handleEmergencyCreated);
      socket.off('emergency:nearby', handleEmergencyNearby);
      socket.off('helper:joined', handleHelperJoined);
      socket.off('helper:status_update', handleHelperStatusUpdate);
      socket.off('emergency:status_changed', handleEmergencyStatusChanged);
      socket.off('emergency:resolved', handleEmergencyResolved);
      socket.off('emergency:cancelled', handleEmergencyCancelled);
      socket.off('emergency:ended', handleEmergencyEnded);
      socket.off('location:updated', handleLocationUpdated);
      socket.off('error', handleError);
      socket.off('emergency:joined', handleEmergencyJoined);
      socket.off('emergency:left', handleEmergencyLeft);
    };
  }, [accessToken, activeEmergencyId, emergencyStore, onEmergencyCreated, onEmergencyResolved, onEmergencyCancelled]);

  // Join emergency room when activeEmergencyId changes
  useEffect(() => {
    if (!socketRef.current || !activeEmergencyId) {
      return;
    }

    // Don't join if already in room
    if (joinedRoomsRef.current.has(activeEmergencyId)) {
      return;
    }

    // Join room
    socketRef.current.emit('emergency:join', { emergencyId: activeEmergencyId });
    console.log('📥 Joining emergency room:', activeEmergencyId);

    // Cleanup: leave room when emergencyId changes or component unmounts
    return () => {
      if (socketRef.current && joinedRoomsRef.current.has(activeEmergencyId)) {
        socketRef.current.emit('emergency:leave', { emergencyId: activeEmergencyId });
        joinedRoomsRef.current.delete(activeEmergencyId);
        console.log('📤 Left emergency room:', activeEmergencyId);
      }
    };
  }, [activeEmergencyId]);

  // Location updates (throttled, only when SOS is active or user is responding helper)
  useEffect(() => {
    if (!socketRef.current || !activeEmergencyId) {
      // Clear interval if no active emergency
      if (locationUpdateIntervalRef.current) {
        clearInterval(locationUpdateIntervalRef.current);
        locationUpdateIntervalRef.current = null;
      }
      return;
    }

    // Get location from store or geolocation API
    const updateLocation = () => {
      // Try to get location from emergency store or auth store
      const location = emergencyStore?.location || authStore?.user?.location;
      
      if (location && location.latitude && location.longitude) {
        socketRef.current.emit('location:update', {
          latitude: location.latitude,
          longitude: location.longitude
        });
      } else if (navigator.geolocation) {
        // Fallback to browser geolocation
        navigator.geolocation.getCurrentPosition(
          (position) => {
            socketRef.current.emit('location:update', {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          },
          (error) => {
            console.warn('Location update failed:', error);
          }
        );
      }
    };

    // Update location immediately, then every 30 seconds
    updateLocation();
    locationUpdateIntervalRef.current = setInterval(updateLocation, 30000);

    return () => {
      if (locationUpdateIntervalRef.current) {
        clearInterval(locationUpdateIntervalRef.current);
        locationUpdateIntervalRef.current = null;
      }
    };
  }, [activeEmergencyId, emergencyStore, authStore]);

  // Disconnect on unmount or logout
  useEffect(() => {
    return () => {
      // Leave all rooms
      if (socketRef.current) {
        joinedRoomsRef.current.forEach(emergencyId => {
          socketRef.current.emit('emergency:leave', { emergencyId });
        });
        joinedRoomsRef.current.clear();
      }
      
      // Clear location updates
      if (locationUpdateIntervalRef.current) {
        clearInterval(locationUpdateIntervalRef.current);
        locationUpdateIntervalRef.current = null;
      }
    };
  }, []);

  // Expose socket methods for manual control
  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected || false,
    joinRoom: (emergencyId) => {
      if (socketRef.current && emergencyId) {
        socketRef.current.emit('emergency:join', { emergencyId });
      }
    },
    leaveRoom: (emergencyId) => {
      if (socketRef.current && emergencyId) {
        socketRef.current.emit('emergency:leave', { emergencyId });
        joinedRoomsRef.current.delete(emergencyId);
      }
    },
    updateLocation: (latitude, longitude) => {
      if (socketRef.current) {
        socketRef.current.emit('location:update', { latitude, longitude });
      }
    }
  };
};

