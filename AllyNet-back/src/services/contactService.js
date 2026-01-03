const { Contact, User } = require('../models');

/**
 * Contact Service
 * Handles user inquiries, questions, and complaints submitted through Help Center
 */

/**
 * Submit a contact form (user inquiry/complaint)
 * @param {String} userId - User ID submitting the contact
 * @param {Object} contactData - Contact form data
 * @returns {Promise<Object>} Created contact
 */
const submitContact = async (userId, contactData) => {
  // Validate user exists and is active
  const user = await User.findById(userId);
  if (!user || !user.isActive || user.isBlocked) {
    throw new Error('User not found or account is inactive');
  }

  // Create contact
  const contact = await Contact.create({
    user: userId,
    subject: contactData.subject.trim(),
    message: contactData.message.trim(),
    category: contactData.category || 'question',
    status: 'open'
  });

  // Populate user data
  await contact.populate('user', 'profile firstName lastName email');

  return contact;
};

module.exports = {
  submitContact
};

