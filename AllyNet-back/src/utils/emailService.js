/**
 * Email Service
 * Handles sending email notifications for emergencies
 * Uses nodemailer (free, works with Gmail SMTP or any email provider)
 */

/**
 * Send email to emergency contacts when emergency is triggered
 * @param {Array} contacts - Array of emergency contacts { name, email }
 * @param {Object} emergency - Emergency object
 * @param {Object} user - User object who triggered emergency
 * @returns {Promise<void>}
 */
const sendEmergencyEmail = async (contacts, emergency, user) => {
  if (!contacts || contacts.length === 0) {
    console.log('📧 No emergency contacts to notify');
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

  const googleMapsLink = emergency.location?.latitude && emergency.location?.longitude
    ? `https://www.google.com/maps?q=${emergency.location.latitude},${emergency.location.longitude}`
    : '';

  const subject = `🚨 SOS ALERT: ${userName} needs help!`;
  const htmlMessage = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .alert { background-color: #ff4444; color: white; padding: 20px; text-align: center; border-radius: 5px; }
        .content { background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-top: 20px; }
        .info-row { margin: 10px 0; }
        .label { font-weight: bold; }
        .button { display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="alert">
          <h1>🚨 SOS ALERT</h1>
          <h2>${userName} needs immediate help!</h2>
        </div>
        <div class="content">
          <div class="info-row"><span class="label">Emergency Type:</span> ${emergencyType}</div>
          ${emergency.description ? `<div class="info-row"><span class="label">Description:</span> ${emergency.description}</div>` : ''}
          <div class="info-row"><span class="label">Location:</span> ${locationText}</div>
          ${googleMapsLink ? `<a href="${googleMapsLink}" class="button">View on Google Maps</a>` : ''}
          <div class="info-row"><span class="label">Time:</span> ${new Date(emergency.createdAt || emergency.activatedAt).toLocaleString()}</div>
          <p style="margin-top: 20px; font-weight: bold; color: #ff4444;">Please check on them immediately!</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textMessage = `🚨 SOS ALERT from ${userName}\n\n` +
    `Type: ${emergencyType}\n` +
    `${emergency.description ? `Description: ${emergency.description}\n` : ''}` +
    `Location: ${locationText}\n` +
    `${googleMapsLink ? `Map: ${googleMapsLink}\n` : ''}` +
    `Time: ${new Date(emergency.createdAt || emergency.activatedAt).toLocaleString()}\n\n` +
    `Please check on them immediately!`;

  // In development, log to console
  // In production, configure nodemailer with SMTP settings
  console.log('📧 EMAIL NOTIFICATIONS TO SEND:');
  contacts.forEach(contact => {
    console.log(`  To: ${contact.name} (${contact.email})`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Message: ${textMessage}`);
    console.log('  ---');
    
    // TODO: Replace with actual email sending using nodemailer
    // Example:
    // const nodemailer = require('nodemailer');
    // const transporter = nodemailer.createTransport({
    //   service: 'gmail', // or any SMTP provider
    //   auth: {
    //     user: process.env.EMAIL_USER,
    //     pass: process.env.EMAIL_PASSWORD
    //   }
    // });
    // await transporter.sendMail({
    //   from: process.env.EMAIL_FROM || 'AllyNet <noreply@allynet.com>',
    //   to: contact.email,
    //   subject: subject,
    //   text: textMessage,
    //   html: htmlMessage
    // });
  });

  // For now, return success (in production, handle errors from email provider)
  return Promise.resolve();
};

module.exports = {
  sendEmergencyEmail
};

