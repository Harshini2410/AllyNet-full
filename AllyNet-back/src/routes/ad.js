const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const adController = require('../controllers/adController');
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
 * @route   POST /api/v1/ads
 * @desc    Create ad
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
      .notEmpty()
      .withMessage('Description is required')
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Description cannot exceed 2000 characters'),
    body('category')
      .notEmpty()
      .withMessage('Category is required')
      .isIn(['shop', 'restaurant', 'service', 'brand', 'event', 'other'])
      .withMessage('Invalid category'),
    body('businessName')
      .notEmpty()
      .withMessage('Business name is required')
      .trim()
      .isLength({ max: 100 })
      .withMessage('Business name cannot exceed 100 characters'),
    body('location.latitude')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be between -90 and 90'),
    body('location.longitude')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180')
  ]),
  adController.createAd
);

/**
 * @route   GET /api/v1/ads/nearby
 * @desc    Get nearby ads
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
  adController.getNearbyAds
);

/**
 * @route   GET /api/v1/ads/top-rated
 * @desc    Get top rated ads (for home page)
 * @access  Private
 */
router.get(
  '/top-rated',
  validate([
    query('limit')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Limit must be between 1 and 10')
  ]),
  adController.getTopRatedAds
);

/**
 * @route   GET /api/v1/ads/random
 * @desc    Get random ads (for home page)
 * @access  Private
 */
router.get(
  '/random',
  validate([
    query('limit')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Limit must be between 1 and 10')
  ]),
  adController.getRandomAds
);

/**
 * @route   GET /api/v1/ads
 * @desc    Get all ads (for explore page)
 * @access  Private
 */
router.get(
  '/',
  validate([
    query('category')
      .optional()
      .isIn(['shop', 'restaurant', 'service', 'brand', 'event', 'other'])
      .withMessage('Invalid category'),
    query('status')
      .optional()
      .isIn(['active', 'inactive', 'expired'])
      .withMessage('Invalid status'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('skip')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Skip must be a non-negative integer')
  ]),
  adController.getAllAds
);

/**
 * @route   GET /api/v1/ads/my-ads
 * @desc    Get user's ads (ad history)
 * @access  Private
 */
router.get(
  '/my-ads',
  adController.getMyAds
);

/**
 * @route   GET /api/v1/ads/:id
 * @desc    Get ad by ID
 * @access  Private
 */
router.get(
  '/:id',
  validate([
    param('id').isMongoId().withMessage('Invalid ad ID')
  ]),
  adController.getAdById
);

/**
 * @route   POST /api/v1/ads/:id/rate
 * @desc    Add rating and review to ad
 * @access  Private
 */
router.post(
  '/:id/rate',
  validate([
    param('id').isMongoId().withMessage('Invalid ad ID'),
    body('rating')
      .notEmpty()
      .withMessage('Rating is required')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('review')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Review cannot exceed 500 characters')
  ]),
  adController.rateAd
);

/**
 * @route   PUT /api/v1/ads/:id
 * @desc    Update ad
 * @access  Private
 */
router.put(
  '/:id',
  validate([
    param('id').isMongoId().withMessage('Invalid ad ID')
  ]),
  adController.updateAd
);

/**
 * @route   DELETE /api/v1/ads/:id
 * @desc    Delete ad
 * @access  Private
 */
router.delete(
  '/:id',
  validate([
    param('id').isMongoId().withMessage('Invalid ad ID')
  ]),
  adController.deleteAd
);

module.exports = router;

