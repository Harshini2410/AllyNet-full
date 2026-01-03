/**
 * Message Serializer
 * Handles privacy-aware message serialization for emergency chat
 * Masks identities when emergency.anonymousMode === true
 */

/**
 * Serialize emergency message with privacy protection
 * @param {Object} message - EmergencyMessage document (populated or lean)
 * @param {Object} emergency - Emergency document (with anonymousMode)
 * @param {String} viewerUserId - ID of user viewing the message
 * @returns {Object} Serialized message with displayName and isMine
 */
const serializeEmergencyMessage = (message, emergency, viewerUserId) => {
  if (!message || !emergency) {
    throw new Error('Message and emergency are required');
  }

  // Extract senderId - handle both populated and non-populated cases
  let senderId;
  if (message.senderId) {
    if (typeof message.senderId === 'object' && message.senderId._id) {
      senderId = message.senderId._id.toString();
    } else if (typeof message.senderId === 'object' && message.senderId.toString) {
      senderId = message.senderId.toString();
    } else {
      senderId = message.senderId.toString();
    }
  }
  
  // Extract viewerId
  const viewerId = viewerUserId?.toString();
  
  // Compare IDs (defensive: ensure both are strings and not empty)
  const isMine = Boolean(senderId && viewerId && senderId === viewerId);
  const isAnonymous = emergency.anonymousMode === true;

  // Determine display name based on anonymity
  let displayName;
  let displayInitials;

  if (isAnonymous) {
    // Anonymous mode: mask all identities
    if (message.senderRole === 'creator') {
      displayName = 'Emergency Creator';
      displayInitials = 'E';
    } else {
      // Helper - use generic "Helper" or "Helper #<n>" if multiple helpers
      displayName = 'Helper';
      displayInitials = 'H';
    }
  } else {
    // Non-anonymous: use real names
    const sender = message.senderId;
    if (sender?.profile?.firstName && sender?.profile?.lastName) {
      displayName = `${sender.profile.firstName} ${sender.profile.lastName}`;
      displayInitials = `${sender.profile.firstName[0]}${sender.profile.lastName[0]}`.toUpperCase();
    } else if (sender?.firstName && sender?.lastName) {
      displayName = `${sender.firstName} ${sender.lastName}`;
      displayInitials = `${sender.firstName[0]}${sender.lastName[0]}`.toUpperCase();
    } else if (sender?.profile?.firstName) {
      displayName = sender.profile.firstName;
      displayInitials = sender.profile.firstName[0].toUpperCase();
    } else if (sender?.firstName) {
      displayName = sender.firstName;
      displayInitials = sender.firstName[0].toUpperCase();
    } else if (sender?.email && typeof sender.email === 'string') {
      // Fallback to email prefix
      const emailPrefix = sender.email.split('@')[0];
      displayName = emailPrefix;
      displayInitials = emailPrefix[0]?.toUpperCase() || 'U';
    } else {
      // Final fallback
      displayName = message.senderRole === 'creator' ? 'Creator' : 'Helper';
      displayInitials = message.senderRole === 'creator' ? 'C' : 'H';
    }
  }

  // Return only safe fields - NO real user data if anonymous
  return {
    _id: message._id,
    emergencyId: message.emergencyId?.toString() || message.emergencyId,
    senderRole: message.senderRole,
    message: message.message,
    displayName,
    displayInitials,
    isMine: Boolean(isMine), // Ensure boolean value
    createdAt: message.createdAt
  };
};

/**
 * Serialize multiple messages
 * @param {Array} messages - Array of EmergencyMessage documents
 * @param {Object} emergency - Emergency document
 * @param {String} viewerUserId - ID of user viewing messages
 * @returns {Array} Array of serialized messages
 */
const serializeEmergencyMessages = (messages, emergency, viewerUserId) => {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages.map(message => serializeEmergencyMessage(message, emergency, viewerUserId));
};

module.exports = {
  serializeEmergencyMessage,
  serializeEmergencyMessages
};

