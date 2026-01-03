const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const helpRequestController = require('../controllers/helpRequestController');
const { protect } = require('../middleware/auth');
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
 * @route   POST /api/v1/help-requests
 * @desc    Create help request
 * @access  Private
 */
router.post(
  '/',
  validate([
    body('title')
      .notEmpty()
      .withMessage('Title is required')
      .trim()
      .isLength({ max: 100 })
      .withMessage('Title cannot exceed 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Description cannot exceed 2000 characters'),
    body('category')
      .notEmpty()
      .withMessage('Category is required')
      .isIn(['Physical', 'Auto', 'Delivery', 'Technical', 'General'])
      .withMessage('Invalid category'),
    body('priority')
      .notEmpty()
      .withMessage('Priority is required')
      .isIn(['low', 'medium', 'high'])
      .withMessage('Invalid priority'),
    body('budget')
      .optional({ nullable: true, checkFalsy: true })
      .custom((value) => {
        if (value === null || value === undefined || value === '') {
          return true; // Allow null/empty
        }
        const num = parseFloat(value);
        return !isNaN(num) && num >= 0;
      })
      .withMessage('Budget must be a positive number or empty'),
    body('location.latitude')
      .notEmpty()
      .withMessage('Latitude is required')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be between -90 and 90'),
    body('location.longitude')
      .notEmpty()
      .withMessage('Longitude is required')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180')
  ]),
  helpRequestController.createHelpRequest
);

/**
 * @route   GET /api/v1/help-requests/my-requests
 * @desc    Get user's help requests
 * @access  Private
 */
router.get(
  '/my-requests',
  validate([
    query('status')
      .optional()
      .isIn(['open', 'accepted', 'in_progress', 'completed', 'cancelled', 'expired'])
      .withMessage('Invalid status filter'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ]),
  helpRequestController.getMyHelpRequests
);

/**
 * @route   GET /api/v1/help-requests/nearby
 * @desc    Get nearby help requests (for helpers)
 * @access  Private
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
  helpRequestController.getNearbyHelpRequests
);

/**
 * @route   GET /api/v1/help-requests/:id
 * @desc    Get help request by ID
 * @access  Private
 */
router.get(
  '/:id',
  validate([
    param('id').isMongoId().withMessage('Invalid help request ID')
  ]),
  helpRequestController.getHelpRequestById
);

/**
 * @route   POST /api/v1/help-requests/:id/respond
 * @desc    Add helper response to help request
 * @access  Private
 */
router.post(
  '/:id/respond',
  validate([
    param('id').isMongoId().withMessage('Invalid help request ID'),
    body('message')
      .notEmpty()
      .withMessage('Response message is required')
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('Response message must be between 1 and 500 characters')
  ]),
  helpRequestController.respondToHelpRequest
);

/**
 * @route   DELETE /api/v1/help-requests/:id
 * @desc    Delete help request (creator only)
 * @access  Private
 */
router.delete(
  '/:id',
  validate([
    param('id').isMongoId().withMessage('Invalid help request ID')
  ]),
  helpRequestController.deleteHelpRequest
);

/**
 * @route   POST /api/v1/help-requests/:id/accept-helper
 * @desc    Accept a helper's response (creator chooses helper)
 * @access  Private
 */
router.post(
  '/:id/accept-helper',
  validate([
    param('id').isMongoId().withMessage('Invalid help request ID'),
    body('helperId')
      .isMongoId()
      .withMessage('Helper ID is required and must be valid')
  ]),
  helpRequestController.acceptHelper
);

/**
 * @route   POST /api/v1/help-requests/:id/deny-helper
 * @desc    Deny a helper's response (creator rejects helper)
 * @access  Private
 */
router.post(
  '/:id/deny-helper',
  validate([
    param('id').isMongoId().withMessage('Invalid help request ID'),
    body('helperId')
      .isMongoId()
      .withMessage('Helper ID is required and must be valid')
  ]),
  helpRequestController.denyHelper
);

/**
 * @route   POST /api/v1/help-requests/:id/report-helper
 * @desc    Report a helper's response (creator reports helper)
 * @access  Private
 */
router.post(
  '/:id/report-helper',
  validate([
    param('id').isMongoId().withMessage('Invalid help request ID'),
    body('helperId')
      .isMongoId()
      .withMessage('Helper ID is required and must be valid'),
    body('reason')
      .notEmpty()
      .withMessage('Report reason is required')
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('Report reason must be between 1 and 500 characters')
  ]),
  helpRequestController.reportHelper
);

/**
 * @route   POST /api/v1/help-requests/:id/responses/:helperId/reply
 * @desc    Reply to a helper's response (creator or helper can reply)
 * @access  Private
 */
router.post(
  '/:id/responses/:helperId/reply',
  validate([
    param('id').isMongoId().withMessage('Invalid help request ID'),
    param('helperId').isMongoId().withMessage('Invalid helper ID'),
    body('message')
      .notEmpty()
      .withMessage('Message is required')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Message must be between 1 and 1000 characters')
  ]),
  helpRequestController.replyToResponse
);

module.exports = router;

