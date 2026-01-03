const { HelpRequest, HelpRequestMessage, User } = require('../models');

/**
 * Help Request Message Service
 * Handles messaging between creator and accepted helper
 * Similar to emergency message service
 */

/**
 * Check if user is a participant in the help request chat
 * (creator or accepted helper)
 * @param {String} userId - User ID to check
 * @param {String} helpRequestId - Help request ID
 * @returns {Promise<{isParticipant: boolean, role: 'creator'|'helper'|null, helpRequest: Object|null}>}
 */
const isHelpRequestParticipant = async (userId, helpRequestId) => {
  try {
    const helpRequest = await HelpRequest.findById(helpRequestId)
      .populate('user', '_id')
      .populate('acceptedHelper', '_id');

    if (!helpRequest) {
      return { isParticipant: false, role: null, helpRequest: null };
    }

    // Help request must be accepted to allow messaging
    if (helpRequest.status !== 'accepted') {
      return { isParticipant: false, role: null, helpRequest };
    }

    // Check if user is creator
    const creatorId = helpRequest.user?._id?.toString() || helpRequest.user?.toString();
    if (creatorId === userId.toString()) {
      return { isParticipant: true, role: 'creator', helpRequest };
    }

    // Check if user is the accepted helper
    const acceptedHelperId = helpRequest.acceptedHelper?._id?.toString() || helpRequest.acceptedHelper?.toString();
    if (acceptedHelperId === userId.toString()) {
      return { isParticipant: true, role: 'helper', helpRequest };
    }

    return { isParticipant: false, role: null, helpRequest };
  } catch (error) {
    console.error('Error checking help request participant:', error);
    return { isParticipant: false, role: null, helpRequest: null };
  }
};

/**
 * Get messages for a help request
 * @param {String} helpRequestId - Help request ID
 * @param {Object} options - Query options (limit, before)
 * @returns {Promise<{messages: Array, helpRequest: Object}>} Messages and help request
 */
const getHelpRequestMessages = async (helpRequestId, options = {}) => {
  try {
    const { limit = 50, before = null } = options;

    const helpRequest = await HelpRequest.findById(helpRequestId)
      .select('status user acceptedHelper')
      .lean();

    if (!helpRequest) {
      throw new Error('Help request not found');
    }

    if (helpRequest.status !== 'accepted') {
      throw new Error('Can only get messages for accepted help requests');
    }

    const query = { helpRequestId };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await HelpRequestMessage.find(query)
      .populate('senderId', 'profile firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    return {
      messages: messages.reverse(),
      helpRequest
    };
  } catch (error) {
    console.error('Error fetching help request messages:', error);
    throw new Error('Failed to fetch messages');
  }
};

/**
 * Create a new message in help request chat
 * @param {String} helpRequestId - Help request ID
 * @param {String} senderId - User ID sending the message
 * @param {String} message - Message content
 * @returns {Promise<Object>} Created message and help request
 */
const createMessage = async (helpRequestId, senderId, message) => {
  try {
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new Error('Message cannot be empty');
    }

    if (message.length > 1000) {
      throw new Error('Message cannot exceed 1000 characters');
    }

    const helpRequest = await HelpRequest.findById(helpRequestId)
      .populate('user', '_id')
      .populate('acceptedHelper', '_id');

    if (!helpRequest) {
      throw new Error('Help request not found');
    }

    if (helpRequest.status !== 'accepted') {
      throw new Error('Can only send messages to accepted help requests');
    }

    // Determine sender role
    const creatorId = helpRequest.user?._id?.toString() || helpRequest.user?.toString();
    const senderRole = creatorId === senderId.toString() ? 'creator' : 'helper';

    // Create message
    const newMessage = await HelpRequestMessage.create({
      helpRequestId,
      senderId,
      senderRole,
      message: message.trim()
    });

    // Populate sender info
    await newMessage.populate('senderId', 'profile firstName lastName email');

    // Re-populate help request
    await helpRequest.populate('user', 'profile firstName lastName email');
    await helpRequest.populate('acceptedHelper', 'profile firstName lastName email');

    return {
      message: newMessage,
      helpRequest
    };
  } catch (error) {
    console.error('Error creating message:', error);
    throw error;
  }
};

/**
 * Delete a message (only by sender)
 * @param {String} messageId - Message ID
 * @param {String} userId - User ID requesting deletion
 * @returns {Promise<Object>} Deleted message info
 */
const deleteMessage = async (messageId, userId) => {
  try {
    const message = await HelpRequestMessage.findById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    const senderId = message.senderId?.toString() || message.senderId;
    if (senderId !== userId.toString()) {
      throw new Error('Not authorized to delete this message');
    }

    const helpRequest = await HelpRequest.findById(message.helpRequestId);
    
    await HelpRequestMessage.findByIdAndDelete(messageId);

    return {
      messageId: messageId,
      helpRequestId: message.helpRequestId?.toString(),
      helpRequest
    };
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

module.exports = {
  isHelpRequestParticipant,
  getHelpRequestMessages,
  createMessage,
  deleteMessage
};

