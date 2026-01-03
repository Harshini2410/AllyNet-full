const contactService = require('../services/contactService');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Contact Controller
 * Handles HTTP requests for contact form submissions
 */

/**
 * @desc    Submit contact form (user inquiry/complaint)
 * @route   POST /api/v1/contact
 * @access  Private
 */
const submitContact = asyncHandler(async (req, res) => {
  const { subject, message, category } = req.body;

  const contact = await contactService.submitContact(
    req.user._id,
    { subject, message, category }
  );

  res.status(201).json({
    success: true,
    message: 'Your message has been sent successfully. We will get back to you soon.',
    data: {
      contact
    }
  });
});

module.exports = {
  submitContact
};

