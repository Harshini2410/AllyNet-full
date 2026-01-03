const helpRequestService = require('../services/helpRequestService');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Help Request Controller
 * Handles HTTP requests for help request operations
 */

/**
 * @desc    Create help request
 * @route   POST /api/v1/help-requests
 * @access  Private
 */
const createHelpRequest = asyncHandler(async (req, res) => {
  const { title, description, category, priority, budget, location, radiusKm } = req.body;

  const helpRequest = await helpRequestService.createHelpRequest(
    {
      title,
      description,
      category,
      priority,
      budget,
      location,
      radiusKm
    },
    req.user._id
  );

  res.status(201).json({
    success: true,
    message: 'Help request created successfully',
    data: {
      helpRequest
    }
  });
});

/**
 * @desc    Get user's help requests
 * @route   GET /api/v1/help-requests/my-requests
 * @access  Private
 */
const getMyHelpRequests = asyncHandler(async (req, res) => {
  const { status, limit } = req.query;

  const requests = await helpRequestService.getUserHelpRequests(req.user._id, {
    status: status || null,
    limit: parseInt(limit) || 50
  });

  res.status(200).json({
    success: true,
    data: {
      requests
    }
  });
});

/**
 * @desc    Get nearby help requests (for helpers)
 * @route   GET /api/v1/help-requests/nearby
 * @access  Private
 */
const getNearbyHelpRequests = asyncHandler(async (req, res) => {
  const { latitude, longitude, radius = 10000, limit = 50 } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({
      success: false,
      error: {
        code: 400,
        message: 'Latitude and longitude are required'
      }
    });
  }

  const requests = await helpRequestService.getNearbyHelpRequests(
    parseFloat(latitude),
    parseFloat(longitude),
    parseFloat(radius),
    parseInt(limit),
    req.user._id // Pass current user ID to exclude their own requests
  );

  res.status(200).json({
    success: true,
    data: {
      requests,
      count: requests.length
    }
  });
});

/**
 * @desc    Get help request by ID
 * @route   GET /api/v1/help-requests/:id
 * @access  Private
 */
const getHelpRequestById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const request = await helpRequestService.getHelpRequestById(id, req.user._id);

  res.status(200).json({
    success: true,
    data: {
      helpRequest: request
    }
  });
});

/**
 * @desc    Add helper response to help request
 * @route   POST /api/v1/help-requests/:id/respond
 * @access  Private
 */
const respondToHelpRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 400,
        message: 'Response message is required'
      }
    });
  }

  const helpRequest = await helpRequestService.addHelperResponse(
    id,
    req.user._id,
    message.trim()
  );

  res.status(200).json({
    success: true,
    message: 'Response added successfully',
    data: {
      helpRequest
    }
  });
});

/**
 * @desc    Delete help request (creator only)
 * @route   DELETE /api/v1/help-requests/:id
 * @access  Private
 */
const deleteHelpRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await helpRequestService.deleteHelpRequest(id, req.user._id);

  res.status(200).json({
    success: true,
    message: 'Help request deleted successfully'
  });
});

/**
 * @desc    Accept a helper's response (creator chooses helper)
 * @route   POST /api/v1/help-requests/:id/accept-helper
 * @access  Private
 */
const acceptHelper = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { helperId } = req.body;

  if (!helperId) {
    return res.status(400).json({
      success: false,
      error: {
        code: 400,
        message: 'Helper ID is required'
      }
    });
  }

  const helpRequest = await helpRequestService.acceptHelperResponse(
    id,
    helperId,
    req.user._id
  );

  res.status(200).json({
    success: true,
    message: 'Helper response accepted successfully',
    data: {
      helpRequest
    }
  });
});

/**
 * @desc    Deny a helper's response (creator rejects helper)
 * @route   POST /api/v1/help-requests/:id/deny-helper
 * @access  Private
 */
const denyHelper = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { helperId } = req.body;

  if (!helperId) {
    return res.status(400).json({
      success: false,
      error: {
        code: 400,
        message: 'Helper ID is required'
      }
    });
  }

  const helpRequest = await helpRequestService.denyHelperResponse(
    id,
    helperId,
    req.user._id
  );

  res.status(200).json({
    success: true,
    message: 'Helper response denied successfully',
    data: {
      helpRequest
    }
  });
});

/**
 * @desc    Report a helper's response (creator reports helper)
 * @route   POST /api/v1/help-requests/:id/report-helper
 * @access  Private
 */
const reportHelper = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { helperId, reason } = req.body;

  if (!helperId) {
    return res.status(400).json({
      success: false,
      error: {
        code: 400,
        message: 'Helper ID is required'
      }
    });
  }

  if (!reason || !reason.trim()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 400,
        message: 'Report reason is required'
      }
    });
  }

  const helpRequest = await helpRequestService.reportHelperResponse(
    id,
    helperId,
    reason.trim(),
    req.user._id
  );

  res.status(200).json({
    success: true,
    message: 'Helper response reported successfully',
    data: {
      helpRequest
    }
  });
});

/**
 * @desc    Reply to a helper's response (creator or helper can reply)
 * @route   POST /api/v1/help-requests/:id/responses/:helperId/reply
 * @access  Private
 */
const replyToResponse = asyncHandler(async (req, res) => {
  const { id, helperId } = req.params;
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 400,
        message: 'Message is required'
      }
    });
  }

  const helpRequest = await helpRequestService.addMessageToResponse(
    id,
    helperId,
    req.user._id,
    message.trim()
  );

  res.status(200).json({
    success: true,
    message: 'Reply sent successfully',
    data: {
      helpRequest
    }
  });
});

module.exports = {
  createHelpRequest,
  getMyHelpRequests,
  getNearbyHelpRequests,
  getHelpRequestById,
  respondToHelpRequest,
  deleteHelpRequest,
  acceptHelper,
  denyHelper,
  reportHelper,
  replyToResponse
};

