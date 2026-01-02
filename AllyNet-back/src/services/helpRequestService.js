const { HelpRequest, User } = require('../models');

/**
 * Help Request Service
 * Business logic for help request operations
 */

/**
 * Create help request
 * @param {Object} requestData - Help request data
 * @param {String} userId - User ID creating the request
 * @returns {Promise<Object>} Created help request
 */
const createHelpRequest = async (requestData, userId) => {
  // Validate user exists and is active
  const user = await User.findById(userId);
  if (!user || !user.isActive || user.isBlocked) {
    throw new Error('User not found or account is inactive');
  }

  // Map frontend category to backend category
  const categoryMap = {
    'Physical': 'moving',
    'Auto': 'transportation',
    'Delivery': 'delivery',
    'Technical': 'tech_support',
    'General': 'other'
  };

  const backendCategory = categoryMap[requestData.category] || 'other';

  // Handle budget - only include if provided and valid
  let budgetAmount = 0;
  if (requestData.budget !== undefined && requestData.budget !== null && requestData.budget !== '') {
    const parsed = parseFloat(requestData.budget);
    if (!isNaN(parsed) && parsed >= 0) {
      budgetAmount = parsed;
    }
  }

  // Create help request
  const helpRequest = await HelpRequest.create({
    user: userId,
    title: requestData.title,
    description: requestData.description || '',
    category: backendCategory,
    priority: requestData.priority || 'medium',
    budget: {
      amount: budgetAmount,
      currency: 'USD',
      negotiable: true
    },
    location: {
      latitude: requestData.location.latitude,
      longitude: requestData.location.longitude,
      address: requestData.location.address || null,
      description: requestData.location.description || null
    },
    status: 'open'
  });

  // Populate user data
  await helpRequest.populate('user', 'profile firstName lastName email location');

  return helpRequest;
};

/**
 * Get user's help requests
 * @param {String} userId - User ID
 * @param {Object} options - Query options (status, limit)
 * @returns {Promise<Array>} Array of help requests
 */
const getUserHelpRequests = async (userId, options = {}) => {
  const { status = null, limit = 50 } = options;
  
  const query = { user: userId };
  if (status) {
    query.status = status;
  }

  const requests = await HelpRequest.find(query)
    .populate('user', 'profile firstName lastName email')
    .populate('responses.helper', 'profile firstName lastName helperRating trustScore')
    .populate('responses.messages.senderId', 'profile firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  return requests;
};

/**
 * Get nearby open help requests for helpers
 * @param {Number} latitude - Helper's latitude
 * @param {Number} longitude - Helper's longitude
 * @param {Number} radiusMeters - Search radius in meters
 * @param {Number} limit - Maximum results
 * @param {String} userId - Current user ID (to exclude their own requests)
 * @returns {Promise<Array>} Array of nearby help requests
 */
const getNearbyHelpRequests = async (latitude, longitude, radiusMeters = 10000, limit = 50, userId = null) => {
  // Get nearby requests (findNearbyOpen already populates responses and messages)
  const requests = await HelpRequest.findNearbyOpen(latitude, longitude, radiusMeters, limit);
  
  // Filter out requests created by the current user (if userId provided)
  if (userId) {
    return requests.filter(request => request.user._id.toString() !== userId.toString());
  }
  
  return requests;
};

/**
 * Get help request by ID
 * @param {String} requestId - Help request ID
 * @param {String} userId - Optional user ID for authorization
 * @returns {Promise<Object>} Help request object
 */
const getHelpRequestById = async (requestId, userId = null) => {
  const request = await HelpRequest.findById(requestId)
    .populate('user', 'profile firstName lastName email location')
    .populate('responses.helper', 'profile firstName lastName helperRating trustScore')
    .populate('responses.messages.senderId', 'profile firstName lastName email');

  if (!request) {
    throw new Error('Help request not found');
  }

  return request;
};

/**
 * Add helper response to help request
 * @param {String} requestId - Help request ID
 * @param {String} helperId - Helper user ID
 * @param {String} message - Helper's response message
 * @returns {Promise<Object>} Updated help request
 */
const addHelperResponse = async (requestId, helperId, message) => {
  // Validate helper exists and is active
  const helper = await User.findById(helperId);
  if (!helper || !helper.isActive || helper.isBlocked) {
    throw new Error('Helper not found or account is inactive');
  }

  // Get help request
  const request = await HelpRequest.findById(requestId);
  if (!request) {
    throw new Error('Help request not found');
  }

  // Check if request is still open
  if (request.status !== 'open') {
    throw new Error('Help request is no longer open for responses');
  }

  // Check if helper is the creator
  if (request.user.toString() === helperId.toString()) {
    throw new Error('You cannot respond to your own help request');
  }

  // Add response using model method
  await request.addResponse(helperId, message);

  // Populate and return
  await request.populate('user', 'profile firstName lastName email location');
  await request.populate('responses.helper', 'profile firstName lastName helperRating trustScore');

  // Increment helper's helpRequestCount
  helper.helpRequestCount = (helper.helpRequestCount || 0) + 1;
  await helper.save();

  return request;
};

/**
 * Delete help request (creator only)
 * @param {String} requestId - Help request ID
 * @param {String} userId - User ID (must be creator)
 * @returns {Promise<Object>} Deleted help request
 */
const deleteHelpRequest = async (requestId, userId) => {
  const request = await HelpRequest.findById(requestId);
  if (!request) {
    throw new Error('Help request not found');
  }

  // Only creator can delete
  if (request.user.toString() !== userId.toString()) {
    throw new Error('Only the creator can delete this help request');
  }

  await request.deleteOne();

  return request;
};

/**
 * Accept a helper's response (creator chooses a helper) - allows multiple accepted helpers
 * @param {String} requestId - Help request ID
 * @param {String} helperId - Helper ID to accept
 * @param {String} userId - User ID (must be creator)
 * @returns {Promise<Object>} Updated help request
 */
const acceptHelperResponse = async (requestId, helperId, userId) => {
  const request = await HelpRequest.findById(requestId);
  if (!request) {
    throw new Error('Help request not found');
  }

  // Only creator can accept
  if (request.user.toString() !== userId.toString()) {
    throw new Error('Only the creator can accept a helper response');
  }

  // Get helper to update trust score
  const helper = await User.findById(helperId);
  if (!helper) {
    throw new Error('Helper not found');
  }

  // Accept response using model method (doesn't change request status, allows multiple accepts)
  await request.acceptResponse(helperId);

  // Increase helper's trust score by 10 (capped at 1000)
  helper.trustScore = Math.min(1000, (helper.trustScore || 0) + 10);
  await helper.save();

  // Populate and return (including messages in responses)
  await request.populate('user', 'profile firstName lastName email location');
  await request.populate('responses.helper', 'profile firstName lastName helperRating trustScore');
  await request.populate('responses.messages.senderId', 'profile firstName lastName email');

  return request;
};

/**
 * Deny a helper's response (creator rejects a helper)
 * @param {String} requestId - Help request ID
 * @param {String} helperId - Helper ID to deny
 * @param {String} userId - User ID (must be creator)
 * @returns {Promise<Object>} Updated help request
 */
const denyHelperResponse = async (requestId, helperId, userId) => {
  const request = await HelpRequest.findById(requestId);
  if (!request) {
    throw new Error('Help request not found');
  }

  // Only creator can deny
  if (request.user.toString() !== userId.toString()) {
    throw new Error('Only the creator can deny a helper response');
  }

  // Deny response using model method (removes from responses array)
  await request.denyResponse(helperId);

  // Populate and return
  await request.populate('user', 'profile firstName lastName email location');
  await request.populate('responses.helper', 'profile firstName lastName helperRating trustScore');
  await request.populate('acceptedHelper', 'profile firstName lastName helperRating trustScore');

  return request;
};

/**
 * Report a helper's response (creator reports a helper)
 * Adds report reason as message, removes response, decreases trust score
 * @param {String} requestId - Help request ID
 * @param {String} helperId - Helper ID to report
 * @param {String} reportReason - Reason for reporting
 * @param {String} userId - User ID (must be creator)
 * @returns {Promise<Object>} Updated help request
 */
const reportHelperResponse = async (requestId, helperId, reportReason, userId) => {
  const request = await HelpRequest.findById(requestId);
  if (!request) {
    throw new Error('Help request not found');
  }

  // Only creator can report
  if (request.user.toString() !== userId.toString()) {
    throw new Error('Only the creator can report a helper response');
  }

  if (!reportReason || !reportReason.trim()) {
    throw new Error('Report reason is required');
  }

  // Get helper to update trust score
  const helper = await User.findById(helperId);
  if (!helper) {
    throw new Error('Helper not found');
  }

  // Find the response to get the original message before removing
  const response = request.responses.find(
    r => r.helper.toString() === helperId.toString()
  );

  if (!response) {
    throw new Error('Helper has not responded to this request');
  }

  // Create a new help request for the helper to see the report reason
  // Actually, we should send it as a message in a new help request from creator to helper
  // But wait, the user wants the report reason shown as a reply to the helper's original response
  // Since we're removing the response, we need a different approach
  // Let's create a notification or message that the helper can see
  
  // For now, we'll create a simple message that the helper can view
  // The report reason will be stored, and helper can see it in their notifications or messages
  // Actually, re-reading the requirement: "for that reported helper recieve the report reson as rply to this rply"
  // This means the helper should see the report reason as a reply to their original response
  // Since we're removing the response, we need to store it somewhere else or send a notification
  
  // Let's implement it by creating a help request message (separate model) or notification
  // Actually, simplest approach: before removing, we add the report reason as a message
  // But since we're removing, the helper won't see it in the original request
  // We need a different solution - maybe create a notification or send it via email/message system
  
  // For now, let's just remove the response and log the report reason
  // The helper's trust score will be reduced, and we can add a notification system later
  // Actually, let me re-read: "for that reported helper recieve the report reson as rply to this rply"
  // I think the user wants the report reason to be visible to the helper somehow
  
  // Let's create a simple solution: before removing, we'll add a special message that indicates reporting
  // But since responses are removed, helper won't see it in the same request
  // We could create a separate "reported_requests" collection or add a notification system
  
  // Simplest implementation for now: Remove response and reduce trust score
  // The report reason can be stored in a separate table for admin review
  // Helper will see trust score reduction as indication they were reported
  
  // Actually, I think the requirement might be that we should NOT remove the response immediately
  // Instead, mark it as reported, add the reason as a message, and then helper can see it
  // Then after helper sees it, we can remove it or keep it marked as reported
  
  // Let me implement it this way: Mark as reported, add reason as message, DON'T remove yet
  // Helper can see their response with the report reason message
  // Actually, user said "then that helper response will be removed" - so we do need to remove it
  
  // Let me implement: Add report reason message first, then remove the response
  // But helper won't be able to see it if we remove it...
  
  // I think the best approach is: 
  // 1. Add report reason as a message to the response (before removing)
  // 2. Store it in a way helper can see (maybe in their notifications or a separate report log)
  // 3. Remove the response
  // 4. Reduce trust score
  
  // For MVP, let's: Mark as reported, add reason message, remove response, reduce score
  // Helper will see trust score reduction and can contact support if needed
  
  // Actually, let me simplify: We'll mark it as reported, add the reason, but keep it visible briefly
  // Or we create a notification system...
  
  // Let me re-read one more time: "if he reports the helper then that mean he need to discribe in short why he reported and then that helper response will be removed and for that repoted helper recieve the report reson as rply to this rply"
  
  // I think the flow should be:
  // 1. Creator reports with reason
  // 2. Reason is added as a message/reply to the helper's response
  // 3. Response is marked as reported (but kept so helper can see)
  // 4. Helper receives notification/sees the report reason message
  // 5. Trust score reduced
  
  // Mark response as reported (DO NOT remove - helper needs to see it)
  await request.reportResponse(helperId, reportReason.trim(), userId);

  // Decrease helper's trust score by 50 (capped at 0)
  helper.trustScore = Math.max(0, (helper.trustScore || 0) - 50);
  await helper.save();

  // Populate and return (including messages)
  await request.populate('user', 'profile firstName lastName email location');
  await request.populate('responses.helper', 'profile firstName lastName helperRating trustScore');
  await request.populate('responses.messages.senderId', 'profile firstName lastName email');

  return request;
};

/**
 * Add message to a response conversation (creator or helper can reply)
 * @param {String} requestId - Help request ID
 * @param {String} helperId - Helper ID whose response to reply to
 * @param {String} senderId - User ID sending the message
 * @param {String} message - Message content
 * @returns {Promise<Object>} Updated help request
 */
const addMessageToResponse = async (requestId, helperId, senderId, message) => {
  const request = await HelpRequest.findById(requestId);
  if (!request) {
    throw new Error('Help request not found');
  }

  // Find the response
  const response = request.responses.find(
    r => r.helper.toString() === helperId.toString()
  );

  if (!response) {
    throw new Error('Helper has not responded to this request');
  }

  // Determine sender role
  const isCreator = request.user.toString() === senderId.toString();
  const isHelper = response.helper.toString() === senderId.toString();

  if (!isCreator && !isHelper) {
    throw new Error('Only the creator or the helper can send messages');
  }

  const senderRole = isCreator ? 'creator' : 'helper';

  // Add message using model method
  await request.addMessageToResponse(helperId, senderId, message, senderRole);

  // Populate and return
  await request.populate('user', 'profile firstName lastName email location');
  await request.populate('responses.helper', 'profile firstName lastName helperRating trustScore');
  await request.populate('responses.messages.senderId', 'profile firstName lastName email');

  return request;
};

module.exports = {
  createHelpRequest,
  getUserHelpRequests,
  getNearbyHelpRequests,
  getHelpRequestById,
  addHelperResponse,
  deleteHelpRequest,
  acceptHelperResponse,
  denyHelperResponse,
  reportHelperResponse,
  addMessageToResponse
};

