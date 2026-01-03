const messageService = require('../services/messageService');
const asyncHandler = require('../utils/asyncHandler');
const { getEmergencyNamespace } = require('../sockets');
const { serializeEmergencyMessages, serializeEmergencyMessage } = require('../utils/messageSerializer');

/**
 * Message Controller
 * Handles HTTP requests for emergency session messaging
 * API-first: Database is source of truth, sockets are enhancement only
 */

/**
 * @desc    Get messages for an emergency session
 * @route   GET /api/v1/emergencies/:id/messages
 * @access  Private (participant only)
 */
const getMessages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { limit = 50, before } = req.query;

  // Check authorization: user must be participant
  const participantCheck = await messageService.isEmergencyParticipant(
    req.user._id,
    id
  );

  if (!participantCheck.isParticipant) {
    return res.status(403).json({
      success: false,
      error: {
        code: 403,
        message: 'Not authorized to view messages for this emergency'
      }
    });
  }

  try {
    const result = await messageService.getEmergencyMessages(id, {
      limit: parseInt(limit),
      before: before ? new Date(before) : null
    });

    const { messages, emergency } = result;

    // Serialize messages with privacy protection
    const serializedMessages = serializeEmergencyMessages(
      messages || [],
      emergency,
      req.user._id.toString()
    );

    res.status(200).json({
      success: true,
      data: {
        messages: serializedMessages
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 500,
        message: 'Failed to fetch messages'
      }
    });
  }
});

/**
 * @desc    Send a message in emergency session
 * @route   POST /api/v1/emergencies/:id/messages
 * @access  Private (participant only)
 */
const sendMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 400,
        message: 'Message cannot be empty'
      }
    });
  }

  // Check authorization: user must be participant
  const participantCheck = await messageService.isEmergencyParticipant(
    req.user._id,
    id
  );

  if (!participantCheck.isParticipant) {
    return res.status(403).json({
      success: false,
      error: {
        code: 403,
        message: 'Not authorized to send messages for this emergency'
      }
    });
  }

  try {
    // Create message in database (role is determined internally)
    const result = await messageService.createMessage(
      id,
      req.user._id,
      message
    );

    const { message: newMessage, emergency } = result;

    // Serialize message with privacy protection (for API response)
    const messageData = serializeEmergencyMessage(
      newMessage,
      emergency,
      req.user._id.toString()
    );
    
    // For socket emit, we need to send a version that each user can determine isMine
    // We'll send the raw message data and let each client compute isMine
    // But we still need to respect anonymity
    const socketMessageData = {
      _id: messageData._id,
      emergencyId: messageData.emergencyId,
      senderRole: messageData.senderRole,
      message: messageData.message,
      displayName: messageData.displayName,
      displayInitials: messageData.displayInitials,
      createdAt: messageData.createdAt,
      // Send senderId for isMine computation (privacy-safe: only ID, no name)
      // Handle both populated and non-populated senderId
      senderId: (() => {
        const sid = newMessage.senderId;
        if (!sid) return null;
        if (typeof sid === 'object' && sid._id) {
          return sid._id.toString();
        }
        return sid.toString();
      })()
    };

    // Emit Socket.IO event (best-effort only - don't fail if socket fails)
    try {
      let emergencyNamespace;
      try {
        emergencyNamespace = getEmergencyNamespace();
      } catch (namespaceError) {
        console.error('⚠️ Socket.IO namespace not available:', namespaceError.message);
        emergencyNamespace = null;
      }

      if (emergencyNamespace) {
        try {
          const { emitEmergencyMessage } = require('../sockets/emergencySocket');
          emitEmergencyMessage(emergencyNamespace, id, socketMessageData);
        } catch (emitError) {
          console.error('Error emitting emergency:message:', emitError);
        }
      }
    } catch (socketError) {
      console.error('⚠️ Socket.IO error (message still saved):', socketError);
    }

    res.status(201).json({
      success: true,
      data: {
        message: messageData
      }
    });
  } catch (error) {
    if (error.message === 'Emergency not found') {
      return res.status(404).json({
        success: false,
        error: {
          code: 404,
          message: 'Emergency not found'
        }
      });
    }

    const errorMessage = error?.message || '';
    if (errorMessage && typeof errorMessage === 'string' && 
        (errorMessage.indexOf('Can only send messages') !== -1 || 
         errorMessage.indexOf('Cannot send messages') !== -1)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 400,
          message: error.message
        }
      });
    }

    console.error('Error sending message:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 500,
        message: 'Failed to send message'
      }
    });
  }
});

/**
 * @desc    Delete a message (only by sender)
 * @route   DELETE /api/v1/emergencies/:id/messages/:messageId
 * @access  Private (participant only, sender only)
 */
const deleteMessage = asyncHandler(async (req, res) => {
  const { id: emergencyId, messageId } = req.params;

  // Verify user is participant
  const participantCheck = await messageService.isEmergencyParticipant(
    req.user._id,
    emergencyId
  );

  if (!participantCheck.isParticipant) {
    return res.status(403).json({
      success: false,
      error: {
        code: 403,
        message: 'Not authorized to delete messages for this emergency'
      }
    });
  }

  try {
    const result = await messageService.deleteMessage(messageId, req.user._id);

    // Emit socket event (best-effort only)
    try {
      let emergencyNamespace;
      try {
        emergencyNamespace = getEmergencyNamespace();
      } catch (namespaceError) {
        console.error('⚠️ Socket.IO namespace not available:', namespaceError.message);
        emergencyNamespace = null;
      }

      if (emergencyNamespace && result.emergencyId) {
        try {
          const { emitEmergencyMessageDeleted } = require('../sockets/emergencySocket');
          emitEmergencyMessageDeleted(emergencyNamespace, result.emergencyId, messageId);
        } catch (emitError) {
          console.error('Error emitting emergency:message:deleted:', emitError);
        }
      }
    } catch (socketError) {
      console.error('⚠️ Socket.IO error (message still deleted):', socketError);
    }

    res.status(200).json({
      success: true,
      data: {
        messageId: result.messageId
      }
    });
  } catch (error) {
    if (error.message === 'Message not found') {
      return res.status(404).json({
        success: false,
        error: {
          code: 404,
          message: 'Message not found'
        }
      });
    }

    if (error.message === 'Not authorized to delete this message') {
      return res.status(403).json({
        success: false,
        error: {
          code: 403,
          message: 'Not authorized to delete this message'
        }
      });
    }

    console.error('Error deleting message:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 500,
        message: 'Failed to delete message'
      }
    });
  }
});

module.exports = {
  getMessages,
  sendMessage,
  deleteMessage
};

