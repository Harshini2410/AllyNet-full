const express = require('express');
const { body, validationResult } = require('express-validator');
const contactController = require('../controllers/contactController');
const { protect } = require('../middleware/auth');

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
        details: errors.array().map(err => ({
          field: err.path || err.param,
          message: err.msg,
          value: err.value
        }))
      }
    });
  };
};

/**
 * @route   POST /api/v1/contact
 * @desc    Submit contact form (user inquiry/complaint)
 * @access  Private
 */
router.post(
  '/',
  protect,
  validate([
    body('subject')
      .notEmpty()
      .withMessage('Subject is required')
      .trim()
      .isLength({ min: 3, max: 200 })
      .withMessage('Subject must be between 3 and 200 characters'),
    body('message')
      .notEmpty()
      .withMessage('Message is required')
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Message must be between 10 and 2000 characters'),
    body('category')
      .optional()
      .isIn(['question', 'complaint', 'bug_report', 'feature_request', 'other'])
      .withMessage('Invalid category')
  ]),
  contactController.submitContact
);

module.exports = router;

