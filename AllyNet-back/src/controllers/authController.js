const { User, HelpRequest, Emergency } = require('../models');
const { generateTokenPair, verifyRefreshToken, generateAccessToken } = require('../utils/jwt');
const asyncHandler = require('../utils/asyncHandler');
const mongoose = require('mongoose');

/**
 * Authentication Controller
 * Handles registration, login, logout, token refresh, and profile management
 */

/**
 * @desc    Register new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  // Log incoming request body
  console.log('REGISTER BODY:', JSON.stringify(req.body, null, 2));

  // Get email - express-validator's normalizeEmail() may have already normalized it
  let { email, password, name } = req.body;
  
  // Ensure email is a string and normalize it (express-validator may have done this already)
  if (typeof email !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 400,
        message: 'Email must be a string'
      }
    });
  }

  // Validate required fields
  if (!email) {
    return res.status(400).json({
      success: false,
      error: {
        code: 400,
        message: 'Email is required'
      }
    });
  }

  if (!password) {
    return res.status(400).json({
      success: false,
      error: {
        code: 400,
        message: 'Password is required'
      }
    });
  }

  // Split name safely into firstName / lastName
  let firstName = null;
  let lastName = null;
  if (name && typeof name === 'string') {
    const nameParts = name.trim().split(/\s+/).filter(part => part.length > 0);
    if (nameParts.length > 0) {
      firstName = nameParts[0] || null;
      lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;
    }
  }

  // Normalize email - ensure it's lowercase and trimmed
  const normalizedEmail = email.toLowerCase().trim();
  console.log('═══════════════════════════════════════════════════════');
  console.log('📝 REGISTRATION ATTEMPT');
  console.log('ORIGINAL EMAIL FROM REQUEST:', JSON.stringify(email));
  console.log('NORMALIZED EMAIL:', JSON.stringify(normalizedEmail));
  console.log('EMAIL LENGTH:', normalizedEmail.length);
  console.log('EMAIL CHAR CODES:', normalizedEmail.split('').map(c => c.charCodeAt(0)).join(','));
  
  // First, let's see ALL users in the database for debugging
  const allUsers = await User.find({}).select('email _id').limit(20);
  console.log('📊 ALL USERS IN DATABASE:', JSON.stringify(allUsers, null, 2));
  
  // Check if user already exists - try multiple methods
  console.log('🔍 CHECKING FOR EXISTING USER...');
  const existingUser = await User.findOne({ email: normalizedEmail });
  
  if (existingUser) {
    console.log('⚠️  EXISTING USER FOUND:');
    console.log('   - ID:', existingUser._id);
    console.log('   - Email:', JSON.stringify(existingUser.email));
    console.log('   - Email Length:', existingUser.email.length);
    console.log('   - Emails Match:', existingUser.email.toLowerCase() === normalizedEmail);
    console.log('   - Email Comparison:', existingUser.email.toLowerCase().localeCompare(normalizedEmail));
  } else {
    console.log('✅ NO EXISTING USER FOUND - Email is available');
  }
  
  if (existingUser) {
    console.log('DUPLICATE EMAIL ATTEMPT FOUND:', {
      normalizedEmail,
      existingEmail: existingUser.email,
      existingUserId: existingUser._id,
      emailsMatch: existingUser.email.toLowerCase() === normalizedEmail
    });
    return res.status(409).json({
      success: false,
      error: {
        code: 409,
        message: 'Account already exists'
      }
    });
  }
  console.log('NO EXISTING USER FOUND - PROCEEDING WITH REGISTRATION');

  // Create user with ONLY required fields
  const createData = {
    email: normalizedEmail,
    password,
    role: 'user'
  };

  // Only add profile if we have name parts
  if (firstName || lastName) {
    createData.profile = {};
    if (firstName) createData.profile.firstName = firstName;
    if (lastName) createData.profile.lastName = lastName;
  }

  console.log('CREATING USER WITH DATA:', JSON.stringify({ ...createData, password: '[REDACTED]' }, null, 2));

  let user;
  try {
    console.log('ATTEMPTING TO CREATE USER IN DATABASE:', mongoose.connection.name);
    console.log('COLLECTION NAME:', User.collection.name);
    console.log('CREATE DATA (email only):', { email: createData.email, hasPassword: !!createData.password });
    user = await User.create(createData);
    console.log('✅ USER CREATED SUCCESSFULLY:', user._id, 'Email:', user.email);
  } catch (createError) {
    console.error('❌ ERROR CREATING USER:', createError);
    console.error('ERROR CODE:', createError.code);
    console.error('ERROR NAME:', createError.name);
    console.error('ERROR KEYPATTERN:', createError.keyPattern);
    console.error('ERROR KEYVALUE:', createError.keyValue);
    console.error('FULL ERROR:', JSON.stringify(createError, Object.getOwnPropertyNames(createError)));
    
    // Handle MongoDB duplicate key error (email)
    if (createError.code === 11000 || createError.name === 'MongoServerError') {
      // Check which field caused the duplicate
      const duplicateField = createError.keyPattern ? Object.keys(createError.keyPattern)[0] : 'email';
      const duplicateValue = createError.keyValue ? createError.keyValue[duplicateField] : normalizedEmail;
      
      console.log('DUPLICATE KEY ERROR:', {
        field: duplicateField,
        value: duplicateValue,
        attemptedEmail: normalizedEmail
      });
      
      // Double-check if user actually exists
      const actualUser = await User.findOne({ email: duplicateValue });
      console.log('ACTUAL USER CHECK:', actualUser ? `Found user ${actualUser._id}` : 'No user found');
      
      return res.status(409).json({
        success: false,
        error: {
          code: 409,
          message: 'Account already exists'
        }
      });
    }

    // Handle validation errors
    if (createError.name === 'ValidationError') {
      const firstError = Object.values(createError.errors)[0];
      return res.status(400).json({
        success: false,
        error: {
          code: 400,
          message: firstError ? firstError.message : 'Validation error'
        }
      });
    }

    // Re-throw unexpected errors
    throw createError;
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokenPair(user);
  console.log('TOKENS GENERATED SUCCESSFULLY');

  // Prepare response payload
  const responsePayload = {
    success: true,
    data: {
      user: {
        _id: user._id.toString(),
        email: user.email,
        profile: {
          firstName: user.profile?.firstName || null,
          lastName: user.profile?.lastName || null
        },
        role: user.role
      },
      tokens: {
        accessToken,
        refreshToken
      }
    }
  };

  console.log('REGISTER RESPONSE:', JSON.stringify({ ...responsePayload, data: { ...responsePayload.data, tokens: { accessToken: '[REDACTED]', refreshToken: '[REDACTED]' } } }, null, 2));

  res.status(201).json(responsePayload);
});

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  // Log incoming request body
  console.log('LOGIN BODY:', JSON.stringify({ email: req.body.email, password: '[REDACTED]' }, null, 2));

  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: {
        code: 400,
        message: 'Please provide email and password'
      }
    });
  }

  // Find user and include password for comparison
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

  if (!user) {
    console.log('LOGIN FAILED: User not found for email:', email.toLowerCase().trim());
    return res.status(401).json({
      success: false,
      error: {
        code: 401,
        message: 'Invalid email or password'
      }
    });
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    console.log('LOGIN FAILED: Invalid password for email:', email.toLowerCase().trim());
    return res.status(401).json({
      success: false,
      error: {
        code: 401,
        message: 'Invalid email or password'
      }
    });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      error: {
        code: 401,
        message: 'Invalid email or password'
      }
    });
  }

  // Check if user is blocked
  if (user.isBlocked) {
    return res.status(401).json({
      success: false,
      error: {
        code: 401,
        message: 'Invalid email or password'
      }
    });
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokenPair(user);

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Prepare response payload
  const responsePayload = {
    success: true,
    data: {
      user: {
        _id: user._id.toString(),
        email: user.email,
        profile: {
          firstName: user.profile?.firstName || null,
          lastName: user.profile?.lastName || null
        },
        role: user.role
      },
      tokens: {
        accessToken,
        refreshToken
      }
    }
  };

  console.log('LOGIN RESPONSE:', JSON.stringify({ ...responsePayload, data: { ...responsePayload.data, tokens: { accessToken: '[REDACTED]', refreshToken: '[REDACTED]' } } }, null, 2));

  res.status(200).json(responsePayload);
});

/**
 * @desc    Refresh access token
 * @route   POST /api/v1/auth/refresh
 * @access  Public (requires refresh token)
 */
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      error: {
        code: 400,
        message: 'Refresh token is required'
      }
    });
  }

  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(token);

    // Get user from database
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive || user.isBlocked) {
      return res.status(401).json({
        success: false,
        error: {
          code: 401,
          message: 'User not found or account is inactive'
        }
      });
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    });

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken
      }
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 401,
          message: 'Invalid or expired refresh token'
        }
      });
    }
    throw error;
  }
});

/**
 * @desc    Get current user profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    data: {
      user: {
        _id: user._id.toString(),
        email: user.email,
        profile: {
          firstName: user.profile?.firstName || null,
          lastName: user.profile?.lastName || null
        },
        role: user.role
      }
    }
  });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/v1/auth/me
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, bio, avatar } = req.body;

  const user = await User.findById(req.user._id);

  // Update profile fields
  if (firstName !== undefined) user.profile.firstName = firstName;
  if (lastName !== undefined) user.profile.lastName = lastName;
  if (phone !== undefined) user.profile.phone = phone;
  if (bio !== undefined) user.profile.bio = bio;
  if (avatar !== undefined) user.profile.avatar = avatar;

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        id: user._id,
        email: user.email,
        profile: user.profile,
        role: user.role
      }
    }
  });
});

/**
 * @desc    Update password
 * @route   PUT /api/v1/auth/update-password
 * @access  Private
 */
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      error: {
        code: 400,
        message: 'Please provide current password and new password'
      }
    });
  }

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // Verify current password
  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      error: {
        code: 401,
        message: 'Current password is incorrect'
      }
    });
  }

  // Update password
  user.password = newPassword;
  await user.save(); // Password will be hashed by pre-save middleware

  res.status(200).json({
    success: true,
    message: 'Password updated successfully'
  });
});

/**
 * @desc    Logout (client-side token removal)
 * @route   POST /api/v1/auth/logout
 * @access  Private
 * 
 * Note: Since we're using JWT (stateless), logout is primarily client-side.
 * This endpoint can be used for logging/logging purposes or if implementing token blacklist.
 */
const logout = asyncHandler(async (req, res) => {
  // In a stateless JWT system, logout is handled client-side by removing tokens
  // If you want to implement token blacklisting, you'd store blacklisted tokens in Redis/DB here
  
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * @desc    Get user stats (helped, requested, SOS counts, reports)
 * @route   GET /api/v1/auth/stats
 * @access  Private
 */
const getUserStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  // Convert userId to ObjectId for aggregation queries (handles both ObjectId and string)
  const userIdObj = userId instanceof mongoose.Types.ObjectId 
    ? userId 
    : new mongoose.Types.ObjectId(userId);

  // Get user with trust score
  const user = await User.findById(userId).select('trustScore');

  // Count: Helped - General (accepted responses in HelpRequest)
  const helpedGeneralResult = await HelpRequest.aggregate([
    { $unwind: '$responses' },
    {
      $match: {
        'responses.helper': userIdObj,
        'responses.status': 'accepted'
      }
    },
    { $count: 'count' }
  ]);
  const helpedGeneral = helpedGeneralResult.length > 0 ? helpedGeneralResult[0].count : 0;

  // Count: Helped - Emergency (emergencies where user is in respondingHelpers)
  const helpedEmergencyResult = await Emergency.aggregate([
    { $unwind: '$respondingHelpers' },
    {
      $match: {
        'respondingHelpers.helper': userIdObj
      }
    },
    { $count: 'count' }
  ]);
  const helpedEmergency = helpedEmergencyResult.length > 0 ? helpedEmergencyResult[0].count : 0;

  // Count: Requested - General (help requests created by user)
  const requestedGeneral = await HelpRequest.countDocuments({
    user: userId
  });

  // Count: Requested - Emergency (emergencies created by user)
  const requestedEmergency = await Emergency.countDocuments({
    user: userId
  });

  // Count: Reports - count of reported responses where user is helper
  const reportsResult = await HelpRequest.aggregate([
    { $unwind: '$responses' },
    {
      $match: {
        'responses.helper': userIdObj,
        'responses.status': 'reported'
      }
    },
    { $count: 'count' }
  ]);
  const reportsCount = reportsResult.length > 0 ? reportsResult[0].count : 0;

  res.status(200).json({
    success: true,
    data: {
      trustScore: user?.trustScore || 0,
      helped: {
        general: helpedGeneral,
        emergency: helpedEmergency,
        total: helpedGeneral + helpedEmergency
      },
      requested: {
        general: requestedGeneral,
        emergency: requestedEmergency,
        total: requestedGeneral + requestedEmergency
      },
      reports: reportsCount
    }
  });
});

/**
 * @desc    Get user's emergency contacts
 * @route   GET /api/v1/auth/emergency-contacts
 * @access  Private
 */
const getEmergencyContacts = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('emergencyContacts');
  
  res.status(200).json({
    success: true,
    data: {
      contacts: user?.emergencyContacts || []
    }
  });
});

/**
 * @desc    Add emergency contact
 * @route   POST /api/v1/auth/emergency-contacts
 * @access  Private
 */
const addEmergencyContact = asyncHandler(async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({
      success: false,
      error: {
        code: 400,
        message: 'Name and email are required'
      }
    });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        code: 404,
        message: 'User not found'
      }
    });
  }

  // Validate email format
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({
      success: false,
      error: {
        code: 400,
        message: 'Please provide a valid email address'
      }
    });
  }

  // Check if contact already exists (by email)
  const emailNormalized = email.trim().toLowerCase();
  const existingContact = user.emergencyContacts?.find(
    contact => contact.email.toLowerCase() === emailNormalized
  );

  if (existingContact) {
    return res.status(400).json({
      success: false,
      error: {
        code: 400,
        message: 'Contact with this email already exists'
      }
    });
  }

  // Add contact
  if (!user.emergencyContacts) {
    user.emergencyContacts = [];
  }
  user.emergencyContacts.push({
    name: name.trim(),
    email: emailNormalized
  });

  await user.save();

  res.status(201).json({
    success: true,
    message: 'Emergency contact added successfully',
    data: {
      contact: user.emergencyContacts[user.emergencyContacts.length - 1]
    }
  });
});

/**
 * @desc    Delete emergency contact
 * @route   DELETE /api/v1/auth/emergency-contacts/:contactId
 * @access  Private
 */
const deleteEmergencyContact = asyncHandler(async (req, res) => {
  const { contactId } = req.params;

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        code: 404,
        message: 'User not found'
      }
    });
  }

  // Find and remove contact
  const contactIndex = user.emergencyContacts?.findIndex(
    contact => contact._id.toString() === contactId
  );

  if (contactIndex === -1 || contactIndex === undefined) {
    return res.status(404).json({
      success: false,
      error: {
        code: 404,
        message: 'Emergency contact not found'
      }
    });
  }

  user.emergencyContacts.splice(contactIndex, 1);
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Emergency contact deleted successfully'
  });
});

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  updateProfile,
  updatePassword,
  getUserStats,
  getEmergencyContacts,
  addEmergencyContact,
  deleteEmergencyContact
};

