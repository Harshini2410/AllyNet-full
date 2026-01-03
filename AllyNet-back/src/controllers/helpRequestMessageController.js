const helpRequestMessageService = require('../services/helpRequestMessageService');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Help Request Message Controller
 * Handles HTTP requests for help request chat messaging
 */

/**
 * @desc    Get messages for a help request chat
 * @route   GET /api/v1/help-requests/:id/messages
 * @access  Private (participant only)
 */
const getMessages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { limit = 50, before } = req.query;

  // Check authorization: user must be participant
  const participantCheck = await helpRequestMessageService.isHelpRequestParticipant(
    req.user._id,
    id
  );

  if (!participantCheck.isParticipant) {
    return res.status(403).json({
      success: false,
      error: {
        code: 403,
        message: 'Not authorized to view messages for this help request'
      }
    });
  }

  try {
    const result = await helpRequestMessageService.getHelpRequestMessages(id, {
      limit: parseInt(limit),
      before: before ? new Date(before) : null
    });

    const { messages } = result;

    res.status(200).json({
      success: true,
      data: {
        messages
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 500,
        message: error.message || 'Failed to fetch messages'
      }
    });
  }
});

/**
 * @desc    Send a message in help request chat
 * @route   POST /api/v1/help-requests/:id/messages
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
  const participantCheck = await helpRequestMessageService.isHelpRequestParticipant(
    req.user._id,
    id
  );

  if (!participantCheck.isParticipant) {
    return res.status(403).json({
      success: false,
      error: {
        code: 403,
        message: 'Not authorized to send messages for this help request'
      }
    });
  }

  try {
    const result = await helpRequestMessageService.createMessage(
      id,
      req.user._id,
      message
    );

    const { message: messageData } = result;

    res.status(201).json({
      success: true,
      data: {
        message: messageData
      }
    });
  } catch (error) {
    if (error.message === 'Help request not found') {
      return res.status(404).json({
        success: false,
        error: {
          code: 404,
          message: 'Help request not found'
        }
      });
    }

    const errorMessage = error?.message || '';
    if (errorMessage && typeof errorMessage === 'string' && 
        (errorMessage.indexOf('Can only send messages') !== -1)) {
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
 * @route   DELETE /api/v1/help-requests/:id/messages/:messageId
 * @access  Private (participant only, sender only)
 */
const deleteMessage = asyncHandler(async (req, res) => {
  const { id, messageId } = req.params;

  // Check authorization: user must be participant
  const participantCheck = await helpRequestMessageService.isHelpRequestParticipant(
    req.user._id,
    id
  );

  if (!participantCheck.isParticipant) {
    return res.status(403).json({
      success: false,
      error: {
        code: 403,
        message: 'Not authorized to delete messages for this help request'
      }
    });
  }

  try {
    await helpRequestMessageService.deleteMessage(messageId, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
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

