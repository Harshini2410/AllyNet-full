/**
 * SMS Service
 * Handles sending SMS notifications for emergencies
 * Currently uses console.log for development (replace with Twilio or similar in production)
 */

/**
 * Send SMS to emergency contacts when emergency is triggered
 * @param {Array} contacts - Array of emergency contacts { name, phone }
 * @param {Object} emergency - Emergency object
 * @param {Object} user - User object who triggered emergency
 * @returns {Promise<void>}
 */
const sendEmergencySMS = async (contacts, emergency, user) => {
  if (!contacts || contacts.length === 0) {
    console.log('📱 No emergency contacts to notify');
    return;
  }

  const userName = user?.profile?.firstName 
    ? `${user.profile.firstName}${user.profile.lastName ? ' ' + user.profile.lastName : ''}`
    : user?.email?.split('@')[0] || 'User';

  const emergencyType = emergency.type 
    ? emergency.type.charAt(0).toUpperCase() + emergency.type.slice(1).replace('_', ' ')
    : 'Emergency';

  const locationText = emergency.location?.address 
    ? emergency.location.address
    : emergency.location?.latitude && emergency.location?.longitude
      ? `${emergency.location.latitude}, ${emergency.location.longitude}`
      : 'Location not available';

  const message = `🚨 SOS ALERT from ${userName}\n\n` +
    `Type: ${emergencyType}\n` +
    `${emergency.description ? `Description: ${emergency.description}\n` : ''}` +
    `Location: ${locationText}\n` +
    `Time: ${new Date(emergency.createdAt || emergency.activatedAt).toLocaleString()}\n\n` +
    `Please check on them immediately!`;

  // In development, log to console
  // In production, integrate with SMS provider (Twilio, AWS SNS, etc.)
  console.log('📱 SMS NOTIFICATIONS TO SEND:');
  contacts.forEach(contact => {
    console.log(`  To: ${contact.name} (${contact.phone})`);
    console.log(`  Message: ${message}`);
    console.log('  ---');
    
    // TODO: Replace with actual SMS API call
    // Example with Twilio:
    // await twilioClient.messages.create({
    //   body: message,
    //   to: contact.phone,
    //   from: process.env.TWILIO_PHONE_NUMBER
    // });
  });

  // For now, return success (in production, handle errors from SMS provider)
  return Promise.resolve();
};

module.exports = {
  sendEmergencySMS
};

