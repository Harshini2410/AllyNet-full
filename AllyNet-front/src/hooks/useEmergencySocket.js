// src/hooks/useEmergencySocket.js
import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useEmergencyStore } from "../store/useEmergencyStore";
import { useEmergencySessionStore } from "../store/useEmergencySessionStore";

/**
 * SIMPLIFIED SOCKET HOOK - Helper notifications (real-time enhancement)
 * - Listens ONLY for emergency:created events
 * - SOS state comes from API, not sockets
 * - Sockets provide real-time notifications, but API is source of truth for persistence
 * - Notifications persist via API restore on page load
 */
export const useEmergencySocket = () => {
  const socketRef = useRef(null);
  const [socketModule, setSocketModule] = useState(null);

  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);
  const currentUserId = useAuthStore((s) => s.user?._id?.toString());
  const emergencyId = useEmergencyStore((s) => s.emergencyId);
  const helperEmergencyId = useEmergencyStore((s) => s.helperEmergencyId);
  const sessionEmergencyId = useEmergencySessionStore((s) => s.emergencyId);

  // Load socket module
  useEffect(() => {
    import("../api/socket")
      .then((module) => {
        setSocketModule(module);
      })
      .catch((error) => {
        console.warn("Socket module not available:", error);
      });
  }, []);

  useEffect(() => {
    // Only connect if authenticated and socket module is available
    if (!isAuthenticated || !accessToken || !socketModule) {
      // Disconnect if not authenticated
      if (socketRef.current && socketModule?.disconnectSocket) {
        socketModule.disconnectSocket();
        socketRef.current = null;
      }
      return;
    }

    try {
      const { connectSocket, disconnectSocket } = socketModule;
      socketRef.current = connectSocket(accessToken);
      const socket = socketRef.current;

      if (!socket) {
        console.warn('⚠️ Socket connection failed - no socket instance returned');
        return;
      }

      // Helper notifications only: Listen for emergency:created (enhancement only, not source of truth)
      socket.on("emergency:created", (payload) => {
        try {
          const { emergency } = payload || {};
          
          if (!emergency) {
            return;
          }

          // STRICT VALIDATION 1: Status must be 'active' or 'responding' (allows multiple helpers)
          if (emergency.status !== 'active' && emergency.status !== 'responding') {
            return; // Reject resolved, cancelled, or other statuses
          }

          // STRICT VALIDATION 2: User must NOT be the creator
          const emergencyUserId = emergency.userId || emergency.user?._id || emergency.user;
          if (currentUserId && emergencyUserId && currentUserId.toString() === emergencyUserId.toString()) {
            return; // User created this emergency - don't show notification
          }
          
          // STRICT VALIDATION 3: Helper must NOT already be responding (check helperEmergencyId)
          const emergencyStore = useEmergencyStore.getState();
          const helperEmergencyId = emergencyStore.helperEmergencyId;
          const emergencyId = emergency._id || emergency.id;
          if (helperEmergencyId && emergencyId && helperEmergencyId.toString() === emergencyId.toString()) {
            return; // User is already helping this emergency
          }
          
          // STRICT VALIDATION 4: Helper must NOT be in respondingHelpers array
          if (emergency.respondingHelpers && Array.isArray(emergency.respondingHelpers)) {
            const isAlreadyHelper = emergency.respondingHelpers.some(helperData => {
              const helperId = helperData.helper?._id?.toString() || helperData.helper?.toString() || helperData.helper;
              return currentUserId && helperId && currentUserId.toString() === helperId.toString();
            });
            if (isAlreadyHelper) {
              return; // User is already in respondingHelpers - don't show notification
            }
          }
          
          // VALIDATION 5: Double-check user is not creator (using currentUserId from hook)
          // This prevents showing notifications if user created the emergency
          if (currentUserId && emergencyUserId && currentUserId.toString() === emergencyUserId.toString()) {
            return; // User is the creator - don't show notification
          }
          
          // VALIDATION 6: Verify emergency is still active by checking store state
          // If user has an active emergency (they are creator), don't show notifications
          if (emergencyStore.emergencyId) {
            return; // User is a creator - don't show notifications
          }
          
          // All validations passed - show notification for helpers (real-time socket enhancement)
          emergencyStore.showNearbyEmergency(emergency);
          console.log('🔔 Real-time notification received via socket');
        } catch (error) {
          console.error("Error handling emergency:created notification:", error);
        }
      });

      // Chat messages: Listen for emergency:message (enhancement only, API is source of truth)
      socket.on("emergency:message", (payload) => {
        try {
          const { emergencyId: eventEmergencyId, message } = payload || {};
          
          if (!eventEmergencyId || !message) {
            return;
          }

          const sessionStore = useEmergencySessionStore.getState();
          
          // Only add message if it's for the current session
          if (sessionStore.emergencyId && sessionStore.emergencyId.toString() === eventEmergencyId.toString()) {
            sessionStore.addMessage(message);
            console.log('💬 Real-time message received via socket');
          }
        } catch (error) {
          console.error("Error handling emergency:message:", error);
        }
      });

      // Message deleted: Listen for emergency:message:deleted
      socket.on("emergency:message:deleted", (payload) => {
        try {
          const { emergencyId: eventEmergencyId, messageId } = payload || {};
          
          if (!eventEmergencyId || !messageId) {
            return;
          }

          const sessionStore = useEmergencySessionStore.getState();
          
          // Only remove message if it's for the current session
          if (sessionStore.emergencyId && sessionStore.emergencyId.toString() === eventEmergencyId.toString()) {
            sessionStore.removeMessage(messageId);
            console.log('🗑️ Real-time message deletion received via socket');
          }
        } catch (error) {
          console.error("Error handling emergency:message:deleted:", error);
        }
      });

      // Emergency resolved/cancelled: Clear chat and helper state, show notification
      socket.on("emergency:ended", (payload) => {
        try {
          const { emergencyId: eventEmergencyId, status } = payload || {};
          
          if (!eventEmergencyId) {
            return;
          }

          const emergencyStore = useEmergencyStore.getState();
          const sessionStore = useEmergencySessionStore.getState();
          
          // Check if user is helping this emergency
          const isHelperForThisEmergency = emergencyStore.helperEmergencyId && 
            emergencyStore.helperEmergencyId.toString() === eventEmergencyId.toString();
          
          if (isHelperForThisEmergency) {
            // User is a helper for this emergency - show notification
            const statusMessage = status === 'resolved' 
              ? 'The person who requested help has confirmed they are safe. The emergency has been resolved.'
              : status === 'cancelled'
              ? 'The emergency has been cancelled by the person who requested help.'
              : 'The emergency has ended.';
            
            emergencyStore.setEmergencyEndedNotification({
              emergencyId: eventEmergencyId,
              status: status,
              message: statusMessage
            });
            
            // Clear helper state
            emergencyStore.clearHelperEmergency();
            sessionStore.clearSession();
            console.log('🛑 Emergency ended - helper notified and state cleared');
          }
          
          // Clear notification if this is the pending emergency
          if (emergencyStore.nearbyEmergency) {
            const nearbyId = emergencyStore.nearbyEmergency._id || emergencyStore.nearbyEmergency.id;
            if (nearbyId && nearbyId.toString() === eventEmergencyId.toString()) {
              emergencyStore.clearNotifications();
              console.log('🛑 Emergency ended - cleared notification');
            }
          }
        } catch (error) {
          console.error("Error handling emergency:ended:", error);
        }
      });

      // Join emergency room for chat (if user is participant)
      const joinEmergencyRoom = (emergencyIdToJoin) => {
        if (emergencyIdToJoin && socket.connected) {
          socket.emit('emergency:join', { emergencyId: emergencyIdToJoin });
          console.log(`📥 Joined emergency room: ${emergencyIdToJoin}`);
        }
      };

      // Determine which emergency room to join
      const emergencyToJoin = sessionEmergencyId || emergencyId || helperEmergencyId;
      if (emergencyToJoin) {
        joinEmergencyRoom(emergencyToJoin);
      }

      // Connection status listeners
      socket.on('connect', () => {
        console.log('✅ Socket connected successfully:', socket.id);
        // Rejoin room after reconnection
        const emergencyToRejoin = sessionEmergencyId || emergencyId || helperEmergencyId;
        if (emergencyToRejoin) {
          joinEmergencyRoom(emergencyToRejoin);
        }
      });

      socket.on('disconnect', (reason) => {
        console.log('⚠️ Socket disconnected:', reason);
      });

      socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
      });

      return () => {
        if (socket) {
          // Clean up all listeners
          socket.off("emergency:created");
          socket.off("emergency:message");
          socket.off("emergency:message:deleted");
          socket.off("emergency:ended");
          socket.off("connect");
          socket.off("disconnect");
          socket.off("connect_error");
        }
        if (socketModule?.disconnectSocket) {
          disconnectSocket();
        }
      };
    } catch (error) {
      console.error("Socket initialization error:", error);
    }
  }, [accessToken, isAuthenticated, socketModule, currentUserId, emergencyId, helperEmergencyId, sessionEmergencyId]);
};
