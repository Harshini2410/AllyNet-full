const emergencyService = require('../services/emergencyService');
const asyncHandler = require('../utils/asyncHandler');
const { getEmergencyNamespace } = require('../sockets');
const {
  emitEmergencyCreated,
  emitHelperJoined,
  emitHelperStatusUpdate,
  emitEmergencyStatusChanged,
  emitEmergencyResolved,
  emitEmergencyCancelled
} = require('../sockets/emergencySocket');

/**
 * Emergency Controller
 * Handles HTTP requests for emergency operations
 */

/**
 * @desc    Create emergency (SOS)
 * @route   POST /api/v1/emergencies
 * @access  Private
 */
const createEmergency = asyncHandler(async (req, res) => {
  const { location, type, category, description, silentMode, anonymousMode, priority, severity, requestId } = req.body;

  // Note: avoidRadiusKm is auto-determined by the service (5km → 10km → 15km)
  // We ignore it if provided in request body
  const emergency = await emergencyService.createEmergency(
    {
      location,
      type,
      category,
      description,
      silentMode,
      anonymousMode,
      priority,
      severity
    },
    req.user._id,
    requestId // For idempotency
  );

  // DELIVERY-FIRST: Broadcast emergency:created unconditionally to entire namespace
  // Frontend will filter notifications client-side
  try {
    const emergencyNamespace = getEmergencyNamespace();
    
    if (!emergencyNamespace) {
      console.error('❌ Emergency namespace not available');
      // Don't fail request - emergency is already created
    } else {
      // Unconditional broadcast - no filtering, no helper logic
      emitEmergencyCreated(emergencyNamespace, emergency);
      console.log(`📢 Emergency created event broadcasted unconditionally: ${emergency._id}`);
    }
  } catch (socketError) {
    console.error('⚠️ Error emitting socket event (emergency still created):', socketError);
    // Don't fail the request if socket emission fails
  }

  res.status(201).json({
    success: true,
    message: 'Emergency created successfully',
    data: {
      emergency
    }
  });
});

/**
 * @desc    Get pending emergencies for helper (for notifications)
 * @route   GET /api/v1/emergencies/pending-for-helper
 * @access  Private
 * @note    NEVER throws - always returns { success: true, data: [] }
 * @note    Returns active emergencies where user is not creator and not already responding
 */
const getPendingEmergenciesForHelper = asyncHandler(async (req, res) => {
  try {
    const emergencies = await emergencyService.getPendingEmergenciesForHelper(req.user._id);
    
    // Always return success with array (never throw)
    // Response format: { success: true, data: [...] }
    res.status(200).json({
      success: true,
      data: emergencies || []
    });
  } catch (error) {
    // DEFENSIVE: Catch any errors and return empty array (never throw)
    console.error('Error in getPendingEmergenciesForHelper:', error.message);
    res.status(200).json({
      success: true,
      data: []
    });
  }
});

/**
 * @desc    Get emergency where user is a helper
 * @route   GET /api/v1/emergencies/helper-active
 * @access  Private
 * @note    NEVER throws - returns { success: true, data: null } if no active helper emergency
 */
const getHelperActiveEmergency = asyncHandler(async (req, res) => {
  try {
    const emergency = await emergencyService.getHelperActiveEmergency(req.user._id);

    if (emergency && (emergency.status === 'active' || emergency.status === 'responding')) {
      res.status(200).json({
        success: true,
        data: { emergency }
      });
    } else {
      res.status(200).json({
        success: true,
        data: null
      });
    }
  } catch (error) {
    console.error('Unexpected error in getHelperActiveEmergency:', error.message);
    res.status(200).json({
      success: true,
      data: null
    });
  }
});

/**
 * @desc    Get user's active emergency
 * @route   GET /api/v1/emergencies/active
 * @access  Private
 * @note    NEVER throws - returns { success: true, data: null } if no active emergency
 * @note    DEFENSIVE: Handles all errors gracefully to prevent 500 crashes
 */
const getActiveEmergency = asyncHandler(async (req, res) => {
  try {
    const emergency = await emergencyService.getUserActiveEmergency(req.user._id);

    // DEFENSIVE VALIDATION: Final check before returning
    // Ensure emergency exists and has valid active status
    if (emergency && (emergency.status === 'active' || emergency.status === 'responding')) {
      // API-FIRST: Return emergency (status already validated in service)
      res.status(200).json({
        success: true,
        data: { emergency }
      });
    } else {
      // No valid active emergency - return null (never throw)
      res.status(200).json({
        success: true,
        data: null
      });
    }
  } catch (error) {
    // DEFENSIVE: Catch any unexpected errors (should not happen after defensive fixes)
    console.error('Unexpected error in getActiveEmergency:', error.message);
    // Always return success with null data instead of throwing 500
    res.status(200).json({
      success: true,
      data: null
    });
  }
});

/**
 * @desc    Get emergency by ID
 * @route   GET /api/v1/emergencies/:id
 * @access  Private
 * @note    DEFENSIVE: Handles authorization errors gracefully
 */
const getEmergencyById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    const emergency = await emergencyService.getEmergencyById(id, req.user._id);

    res.status(200).json({
      success: true,
      data: {
        emergency
      }
    });
  } catch (error) {
    // Handle authorization errors
    if (error.message === 'Not authorized to view this emergency') {
      return res.status(403).json({
        success: false,
        error: {
          code: 403,
          message: 'Not authorized to view this emergency'
        }
      });
    }
    
    // Handle not found errors
    if (error.message === 'Emergency not found' || error.message === 'Emergency has invalid or deleted user') {
      return res.status(404).json({
        success: false,
        error: {
          code: 404,
          message: 'Emergency not found'
        }
      });
    }
    
    // Re-throw for asyncHandler to handle
    throw error;
  }
});

/**
 * @desc    Get nearby active emergencies (for helpers)
 * @route   GET /api/v1/emergencies/nearby
 * @access  Private (requires helper role)
 */
const getNearbyEmergencies = asyncHandler(async (req, res) => {
  const { latitude, longitude, radius = 10000, limit = 100 } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({
      success: false,
      error: {
        code: 400,
        message: 'Latitude and longitude are required'
      }
    });
  }

  const emergencies = await emergencyService.getNearbyActiveEmergencies(
    parseFloat(latitude),
    parseFloat(longitude),
    parseFloat(radius),
    parseInt(limit)
  );

  res.status(200).json({
    success: true,
    data: {
      emergencies,
      count: emergencies.length
    }
  });
});

/**
 * @desc    Respond to emergency (add helper)
 * @route   POST /api/v1/emergencies/:id/respond
 * @access  Private (any authenticated user can respond - no verification required)
 */
const respondToEmergency = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { estimatedArrival } = req.body;

  const emergency = await emergencyService.addRespondingHelper(
    id,
    req.user._id,
    estimatedArrival ? new Date(estimatedArrival) : null
  );

  // Emit Socket.IO event for helper joining
  const emergencyNamespace = getEmergencyNamespace();
  const helper = await require('../models').User.findById(req.user._id);
  emitHelperJoined(emergencyNamespace, id, helper);
  
  // Emit status change if this is the first helper
  if (emergency.status === 'responding' && emergency.respondingHelpers.length === 1) {
    emitEmergencyStatusChanged(emergencyNamespace, id, 'responding', emergency);
  }

  res.status(200).json({
    success: true,
    message: 'Successfully responding to emergency',
    data: {
      emergency
    }
  });
});

/**
 * @desc    Update helper status in emergency
 * @route   PUT /api/v1/emergencies/:id/helper-status
 * @access  Private
 */
const updateHelperStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  if (!status) {
    return res.status(400).json({
      success: false,
      error: {
        code: 400,
        message: 'Status is required'
      }
    });
  }

  const validStatuses = ['responding', 'on_way', 'arrived', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 400,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      }
    });
  }

  const emergency = await emergencyService.updateHelperStatus(
    id,
    req.user._id,
    status,
    notes
  );

  // Emit Socket.IO event for helper status update
  const emergencyNamespace = getEmergencyNamespace();
  emitHelperStatusUpdate(emergencyNamespace, id, req.user._id.toString(), status, notes);

  res.status(200).json({
    success: true,
    message: 'Helper status updated successfully',
    data: {
      emergency
    }
  });
});

/**
 * @desc    Resolve emergency
 * @route   POST /api/v1/emergencies/:id/resolve
 * @access  Private
 */
const resolveEmergency = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { resolutionType = 'user_resolved', notes } = req.body;

  const emergency = await emergencyService.resolveEmergency(
    id,
    req.user._id,
    resolutionType,
    notes
  );

  // Emit Socket.IO event for emergency resolution
  const emergencyNamespace = getEmergencyNamespace();
  emitEmergencyResolved(emergencyNamespace, id, emergency);

  res.status(200).json({
    success: true,
    message: 'Emergency resolved successfully',
    data: {
      emergency
    }
  });
});

/**
 * @desc    Cancel emergency
 * @route   POST /api/v1/emergencies/:id/cancel
 * @access  Private (owner only)
 */
const cancelEmergency = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const emergency = await emergencyService.cancelEmergency(
    id,
    req.user._id,
    reason
  );

  // Emit Socket.IO event for emergency cancellation
  const emergencyNamespace = getEmergencyNamespace();
  emitEmergencyCancelled(emergencyNamespace, id);

  res.status(200).json({
    success: true,
    message: 'Emergency cancelled successfully',
    data: {
      emergency
    }
  });
});

/**
 * @desc    Get nearby helpers for an emergency
 * @route   GET /api/v1/emergencies/:id/helpers
 * @access  Private
 */
const getEmergencyHelpers = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { radius = 5000, limit = 50 } = req.query;

  // Get emergency to get location
  const emergency = await emergencyService.getEmergencyById(id, req.user._id);

  const helpers = await emergencyService.findNearbyHelpers(
    emergency.location.latitude,
    emergency.location.longitude,
    parseFloat(radius),
    parseInt(limit)
  );

  res.status(200).json({
    success: true,
    data: {
      helpers,
      count: helpers.length
    }
  });
});

/**
 * @desc    Get user's emergency history (as creator or helper)
 * @route   GET /api/v1/emergencies/history
 * @access  Private
 */
const getEmergencyHistory = asyncHandler(async (req, res) => {
  const { limit = 50, status } = req.query;
  
  try {
    const emergencies = await emergencyService.getUserEmergencyHistory(req.user._id, {
      limit: parseInt(limit),
      status: status || null
    });
    
    res.status(200).json({
      success: true,
      data: {
        emergencies: emergencies || []
      }
    });
  } catch (error) {
    console.error('Error fetching emergency history:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 500,
        message: 'Failed to fetch emergency history'
      }
    });
  }
});

module.exports = {
  createEmergency,
  getActiveEmergency,
  getHelperActiveEmergency,
  getPendingEmergenciesForHelper,
  getEmergencyById,
  getNearbyEmergencies,
  respondToEmergency,
  updateHelperStatus,
  resolveEmergency,
  cancelEmergency,
  getEmergencyHelpers,
  getEmergencyHistory
};

