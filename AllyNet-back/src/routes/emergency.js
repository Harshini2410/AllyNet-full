const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const emergencyController = require('../controllers/emergencyController');
const messageController = require('../controllers/messageController');
const { protect, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

/**
 * Validation Middleware Wrapper
 */
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    return res.status(400).json({
      success: false,
      error: {
        code: 400,
        message: 'Validation error',
        details: errors.array()
      }
    });
  };
};

// All routes require authentication
router.use(protect);

/**
 * @route   POST /api/v1/emergencies
 * @desc    Create emergency (SOS)
 * @access  Private
 */
router.post(
  '/',
  validate([
    body('location.latitude')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be between -90 and 90'),
    body('location.longitude')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180'),
    body('type')
      .optional()
      .isIn(['medical', 'safety', 'accident', 'assault', 'natural_disaster', 'other'])
      .withMessage('Invalid emergency type'),
    body('category')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Category cannot exceed 50 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description cannot exceed 1000 characters'),
    body('silentMode')
      .optional()
      .isBoolean()
      .withMessage('Silent mode must be a boolean'),
    body('anonymousMode')
      .optional()
      .isBoolean()
      .withMessage('Anonymous mode must be a boolean'),
    body('fakeCallAlert')
      .optional()
      .isBoolean()
      .withMessage('Fake call alert must be a boolean'),
    body('avoidRadiusKm')
      .optional()
      .isFloat({ min: 0.5, max: 2 })
      .withMessage('Avoidance radius must be between 0.5 and 2 kilometers'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Invalid priority level'),
    body('severity')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Severity must be between 1 and 10'),
    body('requestId')
      .optional()
      .isString()
      .withMessage('Request ID must be a string')
  ]),
  emergencyController.createEmergency
);

/**
 * @route   GET /api/v1/emergencies/active
 * @desc    Get user's active emergency (as creator)
 * @access  Private
 */
router.get('/active', emergencyController.getActiveEmergency);

/**
 * @route   GET /api/v1/emergencies/helper-active
 * @desc    Get emergency where user is a helper
 * @access  Private
 */
router.get('/helper-active', emergencyController.getHelperActiveEmergency);

/**
 * @route   GET /api/v1/emergencies/pending-for-helper
 * @desc    Get pending emergencies for helper (for notifications)
 * @access  Private
 * @note    Returns active emergencies where user is not creator and not already responding
 */
router.get('/pending-for-helper', emergencyController.getPendingEmergenciesForHelper);

/**
 * @route   GET /api/v1/emergencies/history
 * @desc    Get user's emergency history (as creator or helper)
 * @access  Private
 */
router.get(
  '/history',
  validate([
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('status')
      .optional()
      .isIn(['active', 'responding', 'resolved', 'cancelled'])
      .withMessage('Invalid status filter')
  ]),
  emergencyController.getEmergencyHistory
);

/**
 * @route   GET /api/v1/emergencies/nearby
 * @desc    Get nearby active emergencies (for helpers)
 * @access  Private (helper role preferred but not required)
 */
router.get(
  '/nearby',
  validate([
    query('latitude')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude is required and must be between -90 and 90'),
    query('longitude')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude is required and must be between -180 and 180'),
    query('radius')
      .optional()
      .isInt({ min: 100, max: 50000 })
      .withMessage('Radius must be between 100 and 50000 meters'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ]),
  emergencyController.getNearbyEmergencies
);

/**
 * @route   GET /api/v1/emergencies/:id
 * @desc    Get emergency by ID
 * @access  Private
 */
router.get(
  '/:id',
  validate([
    param('id').isMongoId().withMessage('Invalid emergency ID')
  ]),
  emergencyController.getEmergencyById
);

/**
 * @route   GET /api/v1/emergencies/:id/helpers
 * @desc    Get nearby helpers for an emergency
 * @access  Private
 */
router.get(
  '/:id/helpers',
  validate([
    param('id').isMongoId().withMessage('Invalid emergency ID'),
    query('radius')
      .optional()
      .isInt({ min: 100, max: 50000 })
      .withMessage('Radius must be between 100 and 50000 meters'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ]),
  emergencyController.getEmergencyHelpers
);

/**
 * @route   POST /api/v1/emergencies/:id/respond
 * @desc    Respond to emergency (add helper)
 * @access  Private (any authenticated user can respond - no verification required)
 */
router.post(
  '/:id/respond',
  // No role-based authorization - any authenticated user (protected by router.use(protect)) can respond
  validate([
    param('id').isMongoId().withMessage('Invalid emergency ID'),
    body('estimatedArrival')
      .optional()
      .isISO8601()
      .withMessage('Estimated arrival must be a valid ISO 8601 date')
  ]),
  emergencyController.respondToEmergency
);

/**
 * @route   PUT /api/v1/emergencies/:id/helper-status
 * @desc    Update helper status in emergency
 * @access  Private
 */
router.put(
  '/:id/helper-status',
  validate([
    param('id').isMongoId().withMessage('Invalid emergency ID'),
    body('status')
      .isIn(['responding', 'on_way', 'arrived', 'completed', 'cancelled'])
      .withMessage('Invalid status. Must be: responding, on_way, arrived, completed, or cancelled'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters')
  ]),
  emergencyController.updateHelperStatus
);

/**
 * @route   POST /api/v1/emergencies/:id/resolve
 * @desc    Resolve emergency
 * @access  Private
 */
router.post(
  '/:id/resolve',
  validate([
    param('id').isMongoId().withMessage('Invalid emergency ID'),
    body('resolutionType')
      .optional()
      .isIn(['user_resolved', 'helper_resolved', 'auto_expired', 'admin_resolved'])
      .withMessage('Invalid resolution type'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Resolution notes cannot exceed 500 characters')
  ]),
  emergencyController.resolveEmergency
);

/**
 * @route   POST /api/v1/emergencies/:id/cancel
 * @desc    Cancel emergency (owner only)
 * @access  Private
 */
router.post(
  '/:id/cancel',
  validate([
    param('id').isMongoId().withMessage('Invalid emergency ID'),
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Cancellation reason cannot exceed 500 characters')
  ]),
  emergencyController.cancelEmergency
);

/**
 * @route   GET /api/v1/emergencies/:id/messages
 * @desc    Get messages for an emergency session
 * @access  Private (participant only)
 */
router.get(
  '/:id/messages',
  validate([
    param('id').isMongoId().withMessage('Invalid emergency ID'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('before')
      .optional()
      .isISO8601()
      .withMessage('Before must be a valid ISO 8601 date')
  ]),
  messageController.getMessages
);

/**
 * @route   POST /api/v1/emergencies/:id/messages
 * @desc    Send a message in emergency session
 * @access  Private (participant only)
 */
router.post(
  '/:id/messages',
  validate([
    param('id').isMongoId().withMessage('Invalid emergency ID'),
    body('message')
      .notEmpty()
      .withMessage('Message is required')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Message must be between 1 and 1000 characters')
  ]),
  messageController.sendMessage
);

/**
 * @route   DELETE /api/v1/emergencies/:id/messages/:messageId
 * @desc    Delete a message (only by sender)
 * @access  Private (participant only, sender only)
 */
router.delete(
  '/:id/messages/:messageId',
  validate([
    param('id').isMongoId().withMessage('Invalid emergency ID'),
    param('messageId').isMongoId().withMessage('Invalid message ID')
  ]),
  messageController.deleteMessage
);

module.exports = router;

