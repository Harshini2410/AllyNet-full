const { Emergency, EmergencyMessage } = require('../models');

/**
 * Message Service
 * Handles emergency session messaging logic
 * API-first: Database is source of truth
 */

/**
 * Check if user is a participant in the emergency session
 * (creator or accepted helper)
 * @param {String} userId - User ID to check
 * @param {String} emergencyId - Emergency ID
 * @returns {Promise<{isParticipant: boolean, role: 'creator'|'helper'|null, emergency: Object|null}>}
 */
const isEmergencyParticipant = async (userId, emergencyId) => {
  try {
    // Get emergency with populated helpers
    const emergency = await Emergency.findById(emergencyId)
      .populate('user', '_id')
      .populate('respondingHelpers.helper', '_id');

    if (!emergency) {
      return { isParticipant: false, role: null, emergency: null };
    }

    // Check if user is creator
    const creatorId = emergency.user?._id?.toString() || emergency.user?.toString();
    if (creatorId === userId.toString()) {
      return { isParticipant: true, role: 'creator', emergency };
    }

    // Check if user is an accepted helper
    const isHelper = emergency.respondingHelpers.some(
      h => {
        const helperId = h.helper?._id?.toString() || h.helper?.toString();
        return helperId === userId.toString();
      }
    );

    if (isHelper) {
      return { isParticipant: true, role: 'helper', emergency };
    }

    return { isParticipant: false, role: null, emergency };
  } catch (error) {
    // Defensive: If check fails, deny access
    console.error('Error checking emergency participant:', error);
    return { isParticipant: false, role: null, emergency: null };
  }
};

/**
 * Get messages for an emergency
 * @param {String} emergencyId - Emergency ID
 * @param {Object} options - Query options (limit, before)
 * @returns {Promise<{messages: Array, emergency: Object}>} Messages and emergency
 */
const getEmergencyMessages = async (emergencyId, options = {}) => {
  try {
    const { limit = 50, before = null } = options;

    // Fetch emergency first to check anonymousMode
    const emergency = await Emergency.findById(emergencyId)
      .select('anonymousMode user respondingHelpers')
      .lean();

    if (!emergency) {
      throw new Error('Emergency not found');
    }

    const query = { emergencyId };

    // If 'before' timestamp provided, only get messages before that time
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await EmergencyMessage.find(query)
      .populate('senderId', 'profile firstName lastName email')
      .sort({ createdAt: -1 }) // Most recent first
      .limit(parseInt(limit))
      .lean(); // Use lean() for better performance

    // Reverse to get chronological order (oldest first)
    return {
      messages: messages.reverse(),
      emergency
    };
  } catch (error) {
    console.error('Error fetching emergency messages:', error);
    throw new Error('Failed to fetch messages');
  }
};

/**
 * Create a new message in emergency session
 * @param {String} emergencyId - Emergency ID
 * @param {String} senderId - User ID sending the message
 * @param {String} message - Message content
 * @returns {Promise<Object>} Created message and emergency
 */
const createMessage = async (emergencyId, senderId, message) => {
  try {
    // Validate message content
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new Error('Message cannot be empty');
    }

    if (message.length > 1000) {
      throw new Error('Message cannot exceed 1000 characters');
    }

    // Verify emergency exists and get it
    const emergency = await Emergency.findById(emergencyId)
      .populate('user', '_id')
      .populate('respondingHelpers.helper', '_id');
    if (!emergency) {
      throw new Error('Emergency not found');
    }

    // Emergency must be active or responding to allow messages
    if (!['active', 'responding'].includes(emergency.status)) {
      throw new Error('Can only send messages to active or responding emergencies');
    }

    // Determine sender role based on emergency participants
    const creatorId = emergency.user?._id?.toString() || emergency.user?.toString();
    const senderRole = creatorId === senderId.toString() ? 'creator' : 'helper';

    // Create message
    const newMessage = await EmergencyMessage.create({
      emergencyId,
      senderId,
      senderRole,
      message: message.trim()
    });

    // Populate sender info (needed for serialization)
    await newMessage.populate('senderId', 'profile firstName lastName email');

    // Re-populate emergency for serialization
    await emergency.populate('user', 'profile firstName lastName email');
    await emergency.populate('respondingHelpers.helper', 'profile firstName lastName email');

    return {
      message: newMessage,
      emergency // Return emergency for serialization
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
    // Find message
    const message = await EmergencyMessage.findById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    // Verify user is the sender
    const senderId = message.senderId?.toString() || message.senderId;
    if (senderId !== userId.toString()) {
      throw new Error('Not authorized to delete this message');
    }

    // Get emergency for socket emit
    const emergency = await Emergency.findById(message.emergencyId);
    
    // Delete message
    await EmergencyMessage.findByIdAndDelete(messageId);

    return {
      messageId: messageId,
      emergencyId: message.emergencyId?.toString(),
      emergency
    };
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

module.exports = {
  isEmergencyParticipant,
  getEmergencyMessages,
  createMessage,
  deleteMessage
};

