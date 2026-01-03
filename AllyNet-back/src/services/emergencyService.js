const { Emergency, User } = require('../models');
const { randomUUID } = require('crypto');
const { sendEmergencyEmail } = require('../utils/emailService');

/**
 * Emergency Service
 * Business logic for emergency operations
 * Handles duplicate prevention, helper discovery, status transitions
 */

/**
 * Create Emergency (SOS)
 * Prevents duplicate active emergencies per user (idempotent)
 * @param {Object} emergencyData - Emergency creation data
 * @param {String} userId - User ID creating the emergency
 * @param {String} requestId - Optional request ID for idempotency
 * @returns {Promise<Object>} Created emergency
 */
const createEmergency = async (emergencyData, userId, requestId = null) => {
  // Check for existing active emergency for this user
  const existingEmergency = await Emergency.findActiveEmergency(userId);

  if (existingEmergency) {
    // If requestId matches, return existing emergency (idempotent)
    if (requestId && existingEmergency.requestId === requestId) {
      return existingEmergency;
    }

    // Otherwise, throw error - user already has active emergency
    throw new Error('User already has an active emergency. Please resolve the current emergency first.');
  }

  // Validate user exists and is active (also fetch emergency contacts for SMS)
  const user = await User.findById(userId).select('emergencyContacts profile firstName lastName email isActive isBlocked');
  if (!user || !user.isActive || user.isBlocked) {
    throw new Error('User not found or account is inactive');
  }

  // Generate requestId for idempotency if not provided
  const finalRequestId = requestId || randomUUID();

  // AUTO-EXTENDING RADIUS FOR SOS: Find minimum 3 helpers
  // Start with 5km, extend to 10km, then 15km (max) until we find at least 3 helpers
  const radiusOptions = [5, 10, 15]; // in km
  let finalRadiusKm = 5; // default start
  let helperCount = 0;

  for (const radiusKm of radiusOptions) {
    const radiusMeters = radiusKm * 1000;
    const helpers = await User.findNearbyHelpers(
      emergencyData.location.latitude,
      emergencyData.location.longitude,
      radiusMeters,
      50
    );
    
    helperCount = helpers.length;
    finalRadiusKm = radiusKm;
    
    // If we found at least 3 helpers, use this radius
    if (helperCount >= 3) {
      break;
    }
    
    // If this is the last option (15km), use it anyway even if < 3 helpers
    if (radiusKm === 15) {
      break;
    }
  }

  // Create emergency with auto-determined radius
  const emergency = await Emergency.create({
    user: userId,
    type: emergencyData.type || 'other',
    category: emergencyData.category,
    description: emergencyData.description,
    location: {
      latitude: emergencyData.location.latitude,
      longitude: emergencyData.location.longitude,
      address: emergencyData.location.address,
      description: emergencyData.location.description
    },
    silentMode: emergencyData.silentMode || false,
    anonymousMode: emergencyData.anonymousMode || false,
    fakeCallAlert: emergencyData.fakeCallAlert || false,
    avoidRadiusKm: finalRadiusKm, // Auto-determined radius (5, 10, or 15km)
    priority: emergencyData.priority || 'high',
    severity: emergencyData.severity || 5,
    requestId: finalRequestId,
    status: 'active'
  });

  // Populate user data
  await emergency.populate('user', 'profile firstName lastName email location');

  // Send email notifications to emergency contacts (non-blocking)
  try {
    if (user.emergencyContacts && user.emergencyContacts.length > 0) {
      sendEmergencyEmail(user.emergencyContacts, emergency, user).catch(error => {
        console.error('⚠️ Error sending emergency email notifications:', error);
        // Don't fail emergency creation if email fails
      });
    }
  } catch (emailError) {
    console.error('⚠️ Error initiating email notifications:', emailError);
    // Don't fail emergency creation if email fails
  }

  return emergency;
};

/**
 * Find nearby helpers for an emergency
 * @param {Number} latitude - Emergency latitude
 * @param {Number} longitude - Emergency longitude
 * @param {Number} radiusMeters - Search radius in meters (default: user's radius or 5000m)
 * @param {Number} limit - Maximum number of helpers to return
 * @returns {Promise<Array>} Array of nearby helpers
 */
const findNearbyHelpers = async (latitude, longitude, radiusMeters = 5000, limit = 50) => {
  try {
    const helpers = await User.findNearbyHelpers(latitude, longitude, radiusMeters, limit);
    return helpers;
  } catch (error) {
    throw new Error(`Error finding nearby helpers: ${error.message}`);
  }
};

/**
 * Get emergency by ID
 * @param {String} emergencyId - Emergency ID
 * @param {String} userId - Optional user ID for authorization check
 * @returns {Promise<Object>} Emergency object
 * @note DEFENSIVE: Handles missing/deleted user documents gracefully
 * @note AUTHORIZATION: 
 *   - Creator can always view
 *   - Responding helpers can always view
 *   - Other users can view if emergency is active (for helper acceptance flow)
 *   - Resolved/cancelled emergencies: only creator and helpers can view
 */
const getEmergencyById = async (emergencyId, userId = null) => {
  try {
    const emergency = await Emergency.findById(emergencyId)
      .populate('user', 'profile firstName lastName email location')
      .populate('respondingHelpers.helper', 'profile firstName lastName helperRating trustScore');

    if (!emergency) {
      throw new Error('Emergency not found');
    }

    // DEFENSIVE: Check if user document exists (may be deleted)
    if (!emergency.user || !emergency.user._id) {
      throw new Error('Emergency has invalid or deleted user');
    }

    // If userId provided, check authorization
    if (userId) {
      // DEFENSIVE: Safely check ownership
      const emergencyUserId = emergency.user._id?.toString() || emergency.user?.toString();
      const isOwner = emergencyUserId && emergencyUserId === userId.toString();
      
      // DEFENSIVE: Safely check if user is a responding helper
      let isRespondingHelper = false;
      if (emergency.respondingHelpers && Array.isArray(emergency.respondingHelpers)) {
        isRespondingHelper = emergency.respondingHelpers.some(
          h => {
            if (!h || !h.helper) return false;
            const helperId = h.helper._id?.toString() || h.helper?.toString();
            return helperId && helperId === userId.toString();
          }
        );
      }

      // Authorization rules:
      // 1. Creator can always view
      // 2. Responding helpers can always view
      // 3. For active emergencies: any user can view (for helper acceptance flow)
      // 4. For resolved/cancelled: only creator and helpers can view
      const isActiveEmergency = emergency.status === 'active' || emergency.status === 'responding';
      
      if (!isOwner && !isRespondingHelper) {
        // Not creator or helper - check if emergency is active
        if (!isActiveEmergency) {
          throw new Error('Not authorized to view this emergency');
        }
        // Active emergency: allow viewing (for helper acceptance flow)
      }
    }

    return emergency;
  } catch (error) {
    // Re-throw known errors
    if (error.message === 'Emergency not found' || 
        error.message === 'Not authorized to view this emergency' ||
        error.message === 'Emergency has invalid or deleted user') {
      throw error;
    }
    // Wrap unexpected errors
    console.error(`Error in getEmergencyById for emergency ${emergencyId}:`, error.message);
    throw new Error('Failed to fetch emergency');
  }
};

/**
 * Get pending emergencies for helper (notifications)
 * @param {String} helperId - Helper user ID
 * @returns {Promise<Array>} Array of pending emergencies
 * @note STRICT FILTERS: Only returns emergencies matching ALL conditions:
 * - status === 'active' or 'responding'
 * - user != helperId (creator is NOT the helper)
 * - helperId NOT IN respondingHelpers (helper hasn't accepted yet)
 * - helper is within emergency's avoidRadiusKm (CRITICAL: radius-based filtering)
 */
const getPendingEmergenciesForHelper = async (helperId) => {
  try {
    if (!helperId) {
      return [];
    }

    // Get helper's location (required for radius filtering)
    const helper = await User.findById(helperId).select('location');
    if (!helper || !helper.location || !helper.location.latitude || !helper.location.longitude) {
      // Helper has no location - return empty array (can't filter by radius)
      return [];
    }

    const helperLat = helper.location.latitude;
    const helperLon = helper.location.longitude;

    // STRICT QUERY: Include both 'active' and 'responding' statuses (allows multiple helpers)
    // Get emergencies within max radius (15km) for initial filtering (we'll filter by individual radius below)
    const maxRadiusMeters = 15000; // 15km max for SOS
    const emergencies = await Emergency.find({
      status: { $in: ['active', 'responding'] },
      user: { $ne: helperId },
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [helperLon, helperLat]
          },
          $maxDistance: maxRadiusMeters
        }
      }
    })
      .select('_id type location createdAt activatedAt severity description category priority status respondingHelpers user avoidRadiusKm') // Include avoidRadiusKm for radius filtering
      .sort({ createdAt: -1 })
      .lean();

    // STRICT VALIDATION: Filter with multiple validation layers including radius check
    const R = 6371; // Earth's radius in km
    const pendingEmergencies = emergencies.filter(emergency => {
      // VALIDATION 1: Status must be 'active' or 'responding'
      if (emergency.status !== 'active' && emergency.status !== 'responding') {
        return false;
      }

      // VALIDATION 2: User must NOT be the creator (double-check)
      const emergencyUserId = emergency.user?.toString() || (emergency.user && typeof emergency.user.toString === 'function' ? emergency.user.toString() : String(emergency.user || ''));
      const helperIdStr = helperId.toString();
      if (emergencyUserId && emergencyUserId === helperIdStr) {
        return false;
      }

      // VALIDATION 3: Helper must NOT be in respondingHelpers
      if (emergency.respondingHelpers && emergency.respondingHelpers.length > 0) {
        const isAlreadyResponding = emergency.respondingHelpers.some(
          h => {
            const helperIdInArray = h.helper?.toString() || (h.helper && h.helper.toString());
            return helperIdInArray === helperIdStr;
          }
        );
        if (isAlreadyResponding) {
          return false;
        }
      }

      // VALIDATION 4: CRITICAL - Helper must be within emergency's avoidRadiusKm
      if (!emergency.location?.latitude || !emergency.location?.longitude) {
        return false; // Emergency has no location - skip
      }

      const emergencyRadiusKm = emergency.avoidRadiusKm || 15; // Default to 15km if not set (shouldn't happen)
      
      // Calculate distance using Haversine formula
      const dLat = (emergency.location.latitude - helperLat) * Math.PI / 180;
      const dLon = (emergency.location.longitude - helperLon) * Math.PI / 180;
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(helperLat * Math.PI / 180) * Math.cos(emergency.location.latitude * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceKm = R * c;

      // Only include if helper is within emergency's radius
      if (distanceKm > emergencyRadiusKm) {
        return false; // Helper is outside emergency's radius
      }

      return true; // Passed all validations
    });

    // Format and return minimal fields (limit to 50)
    const formattedEmergencies = pendingEmergencies.slice(0, 50).map(emergency => ({
      _id: emergency._id.toString(),
      id: emergency._id.toString(),
      type: emergency.type,
      location: emergency.location,
      createdAt: emergency.createdAt || emergency.activatedAt,
      severity: emergency.severity,
      description: emergency.description,
      category: emergency.category,
      priority: emergency.priority,
      status: emergency.status,
      user: emergency.user?.toString() || emergency.user
    }));

    return formattedEmergencies || [];
  } catch (error) {
    console.error(`Error in getPendingEmergenciesForHelper for helper ${helperId}:`, error.message);
    // Never throw - return empty array on error
    return [];
  }
};

/**
 * Get emergency where user is a helper (for helper state restoration)
 * @param {String} helperId - Helper user ID
 * @returns {Promise<Object|null>} Emergency where user is helper, or null
 * @note Returns emergency if user is in respondingHelpers and emergency is active/responding
 */
const getHelperActiveEmergency = async (helperId) => {
  try {
    if (!helperId) {
      return null;
    }

    // Find emergencies where user is a responding helper
    const emergency = await Emergency.findOne({
      'respondingHelpers.helper': helperId,
      status: { $in: ['active', 'responding'] }
    })
      .populate('user', 'profile firstName lastName email location')
      .populate('respondingHelpers.helper', 'profile firstName lastName helperRating trustScore');

    if (!emergency) {
      return null;
    }

    // DEFENSIVE VALIDATION: Verify status is still active/responding
    if (emergency.status !== 'active' && emergency.status !== 'responding') {
      return null;
    }

    // DEFENSIVE VALIDATION: Verify helper is still in respondingHelpers
    const isStillHelper = emergency.respondingHelpers.some(
      h => {
        const helperIdInArray = h.helper?._id?.toString() || h.helper?.toString();
        return helperIdInArray === helperId.toString();
      }
    );

    if (!isStillHelper) {
      return null;
    }

    return emergency;
  } catch (error) {
    console.error(`Error in getHelperActiveEmergency for helper ${helperId}:`, error.message);
    return null;
  }
};

/**
 * Get user's active emergency
 * @param {String} userId - User ID
 * @returns {Promise<Object|null>} Active emergency or null
 * @note STRICT VALIDATION: Only returns emergency if status is 'active' or 'responding'
 * @note DEFENSIVE: Safely handles missing/deleted user documents and malformed data
 */
const getUserActiveEmergency = async (userId) => {
  try {
    // Query ONLY for active/responding emergencies (query-level filtering)
    const emergency = await Emergency.findActiveEmergency(userId);
    
    // Early return if no emergency found
    if (!emergency) {
      return null;
    }

    // DEFENSIVE VALIDATION: Explicitly check status (safety check even though query filters)
    if (emergency.status !== 'active' && emergency.status !== 'responding') {
      return null; // Status is not active/responding - don't return stale emergency
    }

    // DEFENSIVE: Safely populate user (handle missing/deleted user documents)
    try {
      await emergency.populate('user', 'profile firstName lastName email location');
      // If user document is missing/deleted, populate returns null - validate
      if (!emergency.user || !emergency.user._id) {
        // User document missing - mark emergency as invalid, return null
        // Note: In production, you might want to mark this emergency as resolved
        return null;
      }
    } catch (populateError) {
      // Populate failed (user document missing/invalid) - return null instead of crashing
      console.warn(`Failed to populate user for emergency ${emergency._id}:`, populateError.message);
      return null;
    }

    // DEFENSIVE: Safely populate helpers (handle missing helper documents)
    try {
      if (emergency.respondingHelpers && emergency.respondingHelpers.length > 0) {
        await emergency.populate('respondingHelpers.helper', 'profile firstName lastName helperRating trustScore');
        // Filter out any null/undefined helper documents (missing/deleted users)
        if (emergency.respondingHelpers) {
          emergency.respondingHelpers = emergency.respondingHelpers.filter(
            h => h.helper && h.helper._id
          );
        }
      }
    } catch (populateError) {
      // Populate failed - log but don't fail (helpers are optional)
      console.warn(`Failed to populate helpers for emergency ${emergency._id}:`, populateError.message);
      // Continue without helpers rather than failing
    }

    return emergency;
  } catch (error) {
    // Catch any unexpected errors (malformed data, database issues, etc.)
    console.error(`Error in getUserActiveEmergency for user ${userId}:`, error.message);
    // Return null instead of throwing - endpoint must never crash
    return null;
  }
};

/**
 * Add helper to emergency (respond to emergency)
 * @param {String} emergencyId - Emergency ID
 * @param {String} helperId - Helper user ID
 * @param {Date} estimatedArrival - Optional estimated arrival time
 * @returns {Promise<Object>} Updated emergency
 */
const addRespondingHelper = async (emergencyId, helperId, estimatedArrival = null) => {
  // Validate user exists and is active (anyone can be a helper - no verification required)
  const helper = await User.findById(helperId);
  if (!helper) {
    throw new Error('User not found');
  }

  if (!helper.isActive || helper.isBlocked) {
    throw new Error('User account is inactive or blocked');
  }

  // Get emergency
  const emergency = await Emergency.findById(emergencyId);
  if (!emergency) {
    throw new Error('Emergency not found');
  }

  // Check if emergency is still active
  if (emergency.status === 'resolved' || emergency.status === 'cancelled') {
    throw new Error('Emergency is already resolved or cancelled');
  }

  // Check if helper is the emergency creator (can't help own emergency)
  if (emergency.user.toString() === helperId.toString()) {
    throw new Error('You cannot respond to your own emergency');
  }

  // Add helper using model method
  await emergency.addRespondingHelper(helperId, estimatedArrival);

  // Increase helper's trust score by 50 (capped at 1000) when they accept/respond to SOS
  helper.trustScore = Math.min(1000, (helper.trustScore || 0) + 50);
  await helper.save();

  // Populate and return
  await emergency.populate('respondingHelpers.helper', 'profile firstName lastName helperRating trustScore');
  await emergency.populate('user', 'profile firstName lastName email location');

  return emergency;
};

/**
 * Update helper status in emergency
 * @param {String} emergencyId - Emergency ID
 * @param {String} helperId - Helper user ID
 * @param {String} status - New status (on_way, arrived, completed, cancelled)
 * @param {String} notes - Optional notes
 * @returns {Promise<Object>} Updated emergency
 */
const updateHelperStatus = async (emergencyId, helperId, status, notes = null) => {
  const emergency = await Emergency.findById(emergencyId);
  if (!emergency) {
    throw new Error('Emergency not found');
  }

  await emergency.updateHelperStatus(helperId, status, notes);

  await emergency.populate('respondingHelpers.helper', 'profile firstName lastName helperRating trustScore');
  await emergency.populate('user', 'profile firstName lastName email location');

  return emergency;
};

/**
 * Resolve emergency
 * @param {String} emergencyId - Emergency ID
 * @param {String} resolvedBy - User ID who resolved (can be user or helper)
 * @param {String} resolutionType - Type of resolution (user_resolved, helper_resolved, etc.)
 * @param {String} notes - Optional resolution notes
 * @returns {Promise<Object>} Resolved emergency
 */
const resolveEmergency = async (emergencyId, resolvedBy, resolutionType = 'user_resolved', notes = null) => {
  const emergency = await Emergency.findById(emergencyId);
  if (!emergency) {
    throw new Error('Emergency not found');
  }

  // Verify resolvedBy has permission (must be user or responding helper)
  const isOwner = emergency.user.toString() === resolvedBy.toString();
  const isRespondingHelper = emergency.respondingHelpers.some(
    h => h.helper.toString() === resolvedBy.toString()
  );

  if (!isOwner && !isRespondingHelper) {
    throw new Error('Not authorized to resolve this emergency');
  }

  await emergency.resolve(resolvedBy, resolutionType, notes);

  // Update user's emergency count
  const user = await User.findById(emergency.user);
  if (user) {
    user.emergencyCount = (user.emergencyCount || 0) + 1;
    await user.save();
  }

  // Note: Trust score increase is handled in addRespondingHelper (when helper accepts SOS)
  // We do NOT increase trust score again on resolution to avoid double-counting

  await emergency.populate('respondingHelpers.helper', 'profile firstName lastName helperRating trustScore');
  await emergency.populate('user', 'profile firstName lastName email location');

  return emergency;
};

/**
 * Cancel emergency
 * @param {String} emergencyId - Emergency ID
 * @param {String} userId - User ID (must be owner)
 * @param {String} reason - Optional cancellation reason
 * @returns {Promise<Object>} Cancelled emergency
 */
const cancelEmergency = async (emergencyId, userId, reason = null) => {
  const emergency = await Emergency.findById(emergencyId);
  if (!emergency) {
    throw new Error('Emergency not found');
  }

  // Only owner can cancel
  if (emergency.user.toString() !== userId.toString()) {
    throw new Error('Only the emergency creator can cancel it');
  }

  await emergency.cancel(reason);

  await emergency.populate('respondingHelpers.helper', 'profile firstName lastName helperRating trustScore');
  await emergency.populate('user', 'profile firstName lastName email location');

  return emergency;
};

/**
 * Delete emergency (only resolved/cancelled, creator only)
 * @param {String} emergencyId - Emergency ID
 * @param {String} userId - User ID (must be owner)
 * @returns {Promise<Object>} Deleted emergency info
 */
const deleteEmergency = async (emergencyId, userId) => {
  const emergency = await Emergency.findById(emergencyId);
  if (!emergency) {
    throw new Error('Emergency not found');
  }

  // Only owner can delete
  if (emergency.user.toString() !== userId.toString()) {
    throw new Error('Only the emergency creator can delete it');
  }

  // Only allow deleting resolved or cancelled emergencies
  if (emergency.status !== 'resolved' && emergency.status !== 'cancelled') {
    throw new Error('Can only delete resolved or cancelled emergencies');
  }

  await Emergency.findByIdAndDelete(emergencyId);

  return { emergencyId, deleted: true };
};

/**
 * Get nearby active emergencies (for helpers to see)
 * @param {Number} latitude - Helper's latitude
 * @param {Number} longitude - Helper's longitude
 * @param {Number} radiusMeters - Search radius
 * @param {Number} limit - Maximum results
 * @returns {Promise<Array>} Array of nearby emergencies
 */
const getNearbyActiveEmergencies = async (latitude, longitude, radiusMeters = 10000, limit = 100) => {
  const emergencies = await Emergency.findNearbyActive(latitude, longitude, radiusMeters, limit);
  
  // Filter out anonymous user data if anonymousMode is true
  return emergencies.map(emergency => {
    const emergencyObj = emergency.toObject();
    if (emergencyObj.anonymousMode && emergencyObj.user) {
      // Hide user identity for anonymous emergencies
      emergencyObj.user = {
        _id: emergencyObj.user._id,
        // Only show minimal info
      };
    }
    return emergencyObj;
  });
};

/**
 * Get user's emergency history (as creator or helper)
 * @param {String} userId - User ID
 * @param {Object} options - Query options (limit, status filter)
 * @returns {Promise<Array>} Array of emergencies
 */
const getUserEmergencyHistory = async (userId, options = {}) => {
  try {
    const { limit = 50, status = null } = options;
    
    // Find emergencies where user is creator OR helper
    const query = {
      $or: [
        { user: userId }, // User is creator
        { 'respondingHelpers.helper': userId } // User is helper
      ]
    };
    
    // Add status filter if provided
    if (status) {
      query.status = status;
    }
    
    const emergencies = await Emergency.find(query)
      .populate('user', 'profile firstName lastName email')
      .populate('respondingHelpers.helper', 'profile firstName lastName helperRating trustScore')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();
    
    return emergencies;
  } catch (error) {
    console.error('Error fetching user emergency history:', error);
    throw new Error('Failed to fetch emergency history');
  }
};

module.exports = {
  createEmergency,
  findNearbyHelpers,
  getEmergencyById,
  getUserActiveEmergency,
  getHelperActiveEmergency,
  addRespondingHelper,
  updateHelperStatus,
  resolveEmergency,
  cancelEmergency,
  deleteEmergency,
  getNearbyActiveEmergencies,
  getUserEmergencyHistory,
  getPendingEmergenciesForHelper
};

