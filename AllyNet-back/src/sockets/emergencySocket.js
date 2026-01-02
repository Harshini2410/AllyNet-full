const { Emergency, User } = require('../models');

/**
 * Emergency Socket.IO Event Handlers
 * Handles real-time events for emergency system
 */

/**
 * Initialize Emergency Socket Events
 * @param {SocketIO.Server} io - Socket.IO server instance
 */
const initializeEmergencySockets = (io) => {
  // Socket.IO middleware namespace for emergency events
  const emergencyNamespace = io.of('/emergencies');

  // Authentication middleware for emergency namespace
  const socketAuth = require('./socketAuth');
  emergencyNamespace.use(socketAuth);

  emergencyNamespace.on('connection', (socket) => {
    console.log(`🔌 Emergency Socket Connected: ${socket.userId} (${socket.userRole})`);

    // Auto-join user room for targeted notifications
    const userRoom = `user:${socket.userId}`;
    socket.join(userRoom);
    console.log(`📥 User ${socket.userId} auto-joined user room: ${userRoom}`);

    /**
     * Join emergency room
     * User/Helper joins a specific emergency room to receive updates
     */
    socket.on('emergency:join', async (data) => {
      try {
        const { emergencyId } = data;

        if (!emergencyId) {
          socket.emit('error', { message: 'Emergency ID is required' });
          return;
        }

        // Handle special case: "current" means user's active emergency
        let actualEmergencyId = emergencyId;
        if (emergencyId === 'current') {
          const userActiveEmergency = await Emergency.findActiveEmergency(socket.userId);
          if (!userActiveEmergency) {
            socket.emit('error', { message: 'No active emergency found for user' });
            return;
          }
          actualEmergencyId = userActiveEmergency._id.toString();
        }

        // Verify emergency exists
        const emergency = await Emergency.findById(actualEmergencyId);
        if (!emergency) {
          socket.emit('error', { message: 'Emergency not found' });
          return;
        }

        // Verify user has permission to join (owner or responding helper)
        const isOwner = emergency.user.toString() === socket.userId;
        const isHelper = emergency.respondingHelpers.some(
          h => h.helper.toString() === socket.userId
        );

        // Any authenticated user can join emergency rooms (no verification required)
        // Only check if user exists and is active
        const user = await User.findById(socket.userId);
        if (!user || !user.isActive || user.isBlocked) {
          socket.emit('error', { message: 'User account is inactive or blocked' });
          return;
        }

        // Allow anyone to join (owner, helper, or any authenticated user)
        // No verification check needed

        const roomName = `emergency:${actualEmergencyId}`;
        socket.join(roomName);

        console.log(`📥 User ${socket.userId} joined room: ${roomName}`);

        socket.emit('emergency:joined', {
          emergencyId: actualEmergencyId,
          room: roomName,
          message: 'Successfully joined emergency room'
        });
      } catch (error) {
        console.error('Error joining emergency room:', error);
        socket.emit('error', { message: 'Error joining emergency room: ' + error.message });
      }
    });

    /**
     * Leave emergency room
     */
    socket.on('emergency:leave', async (data) => {
      try {
        const { emergencyId } = data;
        if (!emergencyId) {
          return;
        }

        // Handle special case: "current" means user's active emergency
        let actualEmergencyId = emergencyId;
        if (emergencyId === 'current') {
          const userActiveEmergency = await Emergency.findActiveEmergency(socket.userId);
          if (userActiveEmergency) {
            actualEmergencyId = userActiveEmergency._id.toString();
          } else {
            // No active emergency to leave - silently return
            return;
          }
        }

        const roomName = `emergency:${actualEmergencyId}`;
        socket.leave(roomName);
        socket.emit('emergency:left', { emergencyId: actualEmergencyId, room: roomName });
        console.log(`📤 User ${socket.userId} left room: ${roomName}`);
      } catch (error) {
        console.error('Error leaving emergency room:', error);
        // Don't emit error for leave - it's not critical
      }
    });

    /**
     * Update user location (for nearby emergency discovery)
     */
    socket.on('location:update', async (data) => {
      try {
        const { latitude, longitude } = data;

        if (latitude === undefined || longitude === undefined) {
          socket.emit('error', { message: 'Latitude and longitude are required' });
          return;
        }

        // Update user location in database (GeoJSON format)
        const user = await User.findById(socket.userId);
        if (user) {
          user.location = {
            type: 'Point',
            coordinates: [longitude, latitude] // [longitude, latitude] for GeoJSON
          };
          user.locationMetadata = user.locationMetadata || {};
          user.locationMetadata.lastUpdated = new Date();
          await user.save();

          socket.emit('location:updated', {
            latitude,
            longitude,
            message: 'Location updated successfully'
          });
        }
      } catch (error) {
        console.error('Error updating location:', error);
        socket.emit('error', { message: 'Error updating location: ' + error.message });
      }
    });

    /**
     * Handle disconnect
     */
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Emergency Socket Disconnected: ${socket.userId} (${reason})`);
    });
  });

  return emergencyNamespace;
};

/**
 * Emit emergency created event - DELIVERY-FIRST architecture
 * ALWAYS broadcasts to entire namespace unconditionally
 * Frontend filters notifications client-side
 * @param {SocketIO.Namespace} namespace - Emergency namespace
 * @param {Object} emergency - Emergency object
 */
const emitEmergencyCreated = (namespace, emergency) => {
  if (!emergency || !namespace) {
    console.error('❌ Cannot emit emergency:created - missing emergency or namespace');
    return;
  }

  // Extract minimal emergency data for notification
  const emergencyId = emergency._id?.toString() || emergency._id;
  const userId = emergency.user?._id?.toString() || emergency.user?.toString() || null;

  const emergencyData = {
    id: emergencyId,
    _id: emergencyId,
    userId: userId, // Include userId for frontend filtering
    type: emergency.type || 'other',
    location: emergency.location || null,
    anonymousMode: emergency.anonymousMode === true,
    createdAt: emergency.createdAt || emergency.activatedAt || new Date(),
    // Optional fields (may be filtered by frontend)
    category: emergency.category,
    description: emergency.description,
    priority: emergency.priority,
    severity: emergency.severity,
    status: emergency.status || 'active'
  };

  // UNCONDITIONAL BROADCAST - no filtering, no user rooms, no helper logic
  namespace.emit('emergency:created', {
    emergency: emergencyData
  });
  
  console.log(`📢 Emergency created broadcasted to ALL connected sockets: ${emergencyId}`);
};

/**
 * Emit helper joined event to emergency room
 * @param {SocketIO.Namespace} namespace - Emergency namespace
 * @param {String} emergencyId - Emergency ID
 * @param {Object} helper - Helper user object
 */
const emitHelperJoined = (namespace, emergencyId, helper) => {
  const roomName = `emergency:${emergencyId}`;

  namespace.to(roomName).emit('helper:joined', {
    emergencyId,
    helper: {
      id: helper._id,
      profile: helper.profile,
      trustScore: helper.trustScore,
      helperRating: helper.helperRating,
      joinedAt: new Date()
    }
  });

  console.log(`📢 Helper joined event emitted to ${roomName}: ${helper._id}`);
};

/**
 * Emit helper status update to emergency room
 * @param {SocketIO.Namespace} namespace - Emergency namespace
 * @param {String} emergencyId - Emergency ID
 * @param {String} helperId - Helper ID
 * @param {String} status - New status
 * @param {String} notes - Optional notes
 */
const emitHelperStatusUpdate = (namespace, emergencyId, helperId, status, notes = null) => {
  const roomName = `emergency:${emergencyId}`;

  namespace.to(roomName).emit('helper:status_update', {
    emergencyId,
    helperId,
    status,
    notes,
    updatedAt: new Date()
  });

  console.log(`📢 Helper status update emitted to ${roomName}: ${helperId} -> ${status}`);
};

/**
 * Emit emergency status changed event
 * @param {SocketIO.Namespace} namespace - Emergency namespace
 * @param {String} emergencyId - Emergency ID
 * @param {String} status - New status
 * @param {Object} emergency - Emergency object
 */
const emitEmergencyStatusChanged = (namespace, emergencyId, status, emergency) => {
  const roomName = `emergency:${emergencyId}`;

  namespace.to(roomName).emit('emergency:status_changed', {
    emergencyId,
    status,
    emergency: {
      id: emergency._id,
      status: emergency.status,
      resolvedAt: emergency.resolvedAt,
      resolutionType: emergency.resolutionType,
      updatedAt: emergency.updatedAt
    },
    timestamp: new Date()
  });

  // Also broadcast to all helpers if emergency is resolved/cancelled
  if (status === 'resolved' || status === 'cancelled') {
    namespace.emit('emergency:ended', {
      emergencyId,
      status,
      timestamp: new Date()
    });
  }

  console.log(`📢 Emergency status changed event emitted to ${roomName}: ${status}`);
};

/**
 * Emit emergency resolved event
 * @param {SocketIO.Namespace} namespace - Emergency namespace
 * @param {String} emergencyId - Emergency ID
 * @param {Object} emergency - Emergency object
 */
const emitEmergencyResolved = (namespace, emergencyId, emergency) => {
  const roomName = `emergency:${emergencyId}`;

  namespace.to(roomName).emit('emergency:resolved', {
    emergencyId,
    resolvedAt: emergency.resolvedAt,
    resolvedBy: emergency.resolvedBy,
    resolutionType: emergency.resolutionType,
    resolutionNotes: emergency.resolutionNotes,
    timestamp: new Date()
  });

  // Notify all helpers that emergency is resolved
  namespace.emit('emergency:ended', {
    emergencyId,
    status: 'resolved',
    timestamp: new Date()
  });

  console.log(`📢 Emergency resolved event emitted: ${emergencyId}`);
};

/**
 * Emit emergency cancelled event
 * @param {SocketIO.Namespace} namespace - Emergency namespace
 * @param {String} emergencyId - Emergency ID
 */
const emitEmergencyCancelled = (namespace, emergencyId) => {
  const roomName = `emergency:${emergencyId}`;

  namespace.to(roomName).emit('emergency:cancelled', {
    emergencyId,
    timestamp: new Date()
  });

  // Notify all helpers
  namespace.emit('emergency:ended', {
    emergencyId,
    status: 'cancelled',
    timestamp: new Date()
  });

  console.log(`📢 Emergency cancelled event emitted: ${emergencyId}`);
};

/**
 * Emit emergency message event to emergency room
 * @param {SocketIO.Namespace} namespace - Emergency namespace
 * @param {String} emergencyId - Emergency ID
 * @param {Object} message - Serialized message object (with privacy applied)
 */
const emitEmergencyMessage = (namespace, emergencyId, message) => {
  const roomName = `emergency:${emergencyId}`;
  
  namespace.to(roomName).emit('emergency:message', {
    emergencyId,
    message
  });

  console.log(`📢 Emergency message event emitted to ${roomName}`);
};

/**
 * Emit emergency message deleted event to emergency room
 * @param {SocketIO.Namespace} namespace - Emergency namespace
 * @param {String} emergencyId - Emergency ID
 * @param {String} messageId - Deleted message ID
 */
const emitEmergencyMessageDeleted = (namespace, emergencyId, messageId) => {
  const roomName = `emergency:${emergencyId}`;
  
  namespace.to(roomName).emit('emergency:message:deleted', {
    emergencyId,
    messageId
  });

  console.log(`📢 Emergency message deleted event emitted to ${roomName}`);
};

module.exports = {
  initializeEmergencySockets,
  emitEmergencyCreated,
  emitHelperJoined,
  emitHelperStatusUpdate,
  emitEmergencyStatusChanged,
  emitEmergencyResolved,
  emitEmergencyCancelled,
  emitEmergencyMessage,
  emitEmergencyMessageDeleted
};

