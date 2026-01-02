const { Ad, User } = require('../models');

/**
 * Ad Service
 * Business logic for ad operations
 */

/**
 * Create ad
 * @param {Object} adData - Ad data
 * @param {String} userId - User ID creating the ad
 * @returns {Promise<Object>} Created ad
 */
const createAd = async (adData, userId) => {
  // Validate user exists and is active
  const user = await User.findById(userId);
  if (!user || !user.isActive || user.isBlocked) {
    throw new Error('User not found or account is inactive');
  }

  // Create ad
  const ad = await Ad.create({
    createdBy: userId,
    title: adData.title,
    description: adData.description,
    image: adData.image || null,
    category: adData.category,
    businessName: adData.businessName,
    businessType: adData.businessType || null,
    location: {
      latitude: adData.location.latitude,
      longitude: adData.location.longitude,
      address: adData.location.address || null,
      city: adData.location.city || null,
      state: adData.location.state || null,
      zipCode: adData.location.zipCode || null
    },
    contact: {
      phone: adData.contact?.phone || null,
      email: adData.contact?.email || null,
      website: adData.contact?.website || null,
      socialMedia: {
        facebook: adData.contact?.socialMedia?.facebook || null,
        instagram: adData.contact?.socialMedia?.instagram || null,
        twitter: adData.contact?.socialMedia?.twitter || null
      }
    },
    status: 'active',
    expiresAt: adData.expiresAt || null // Will use default from model if not provided
  });

  // Populate creator data
  await ad.populate('createdBy', 'profile firstName lastName email');

  return ad;
};

/**
 * Get nearby active ads
 * @param {Number} latitude - User's latitude
 * @param {Number} longitude - User's longitude
 * @param {Number} radiusMeters - Search radius in meters
 * @param {Number} limit - Maximum results
 * @returns {Promise<Array>} Array of nearby ads
 */
const getNearbyAds = async (latitude, longitude, radiusMeters = 10000, limit = 50) => {
  const ads = await Ad.findNearbyActive(latitude, longitude, radiusMeters, limit);
  return ads;
};

/**
 * Get all ads (for explore page)
 * @param {Object} options - Query options (category, status, limit, skip, userId to exclude)
 * @returns {Promise<Object>} Object with ads array and total count
 */
const getAllAds = async (options = {}) => {
  const { category = null, status = 'active', limit = 50, skip = 0, userId = null } = options;
  
  const query = {
    $and: []
  };
  
  // Status filter
  if (status) {
    query.$and.push({ status });
  }
  
  // Category filter
  if (category) {
    query.$and.push({ category });
  }
  
  // Exclude creator's own ads (if userId provided)
  if (userId) {
    query.$and.push({ createdBy: { $ne: userId } });
  }
  
  // Include ads that are not expired (either expiresAt is null or in the future)
  query.$and.push({
    $or: [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: null }
    ]
  });

  // If no conditions, use empty query
  const finalQuery = query.$and.length > 0 ? query : {};

  const [ads, total] = await Promise.all([
    Ad.find(finalQuery)
      .populate('createdBy', 'profile firstName lastName email')
      .populate('ratings.user', 'profile firstName lastName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip)),
    Ad.countDocuments(finalQuery)
  ]);

  return { ads, total };
};

/**
 * Get top rated ads (for home page)
 * @param {Number} limit - Maximum results (default: 2)
 * @param {String} userId - Optional user ID to exclude creator's own ads
 * @returns {Promise<Array>} Array of top rated ads
 */
const getTopRatedAds = async (limit = 2, userId = null) => {
  const query = {
    $and: [
      { status: 'active' },
      {
        $or: [
          { expiresAt: { $gt: new Date() } },
          { expiresAt: null }
        ]
      },
      { averageRating: { $gt: 0 } } // Only get ads with at least one rating
    ]
  };
  
  // Exclude creator's own ads (if userId provided)
  if (userId) {
    query.$and.push({ createdBy: { $ne: userId } });
  }

  const ads = await Ad.find(query)
    .populate('createdBy', 'profile firstName lastName email')
    .populate('ratings.user', 'profile firstName lastName')
    .sort({ averageRating: -1, totalRatings: -1, createdAt: -1 })
    .limit(parseInt(limit));

  return ads;
};

/**
 * Get random ads (for home page)
 * @param {Number} limit - Maximum results (default: 2)
 * @param {String} userId - Optional user ID to exclude creator's own ads
 * @returns {Promise<Array>} Array of random ads
 */
const getRandomAds = async (limit = 2, userId = null) => {
  const query = {
    $and: [
      { status: 'active' },
      {
        $or: [
          { expiresAt: { $gt: new Date() } },
          { expiresAt: null }
        ]
      }
    ]
  };
  
  // Exclude creator's own ads (if userId provided)
  if (userId) {
    query.$and.push({ createdBy: { $ne: userId } });
  }

  // Build match query for aggregate
  const matchQuery = query.$and.length > 0 ? { $and: query.$and } : {};

  // Get total count first
  const totalCount = await Ad.countDocuments(matchQuery);
  
  if (totalCount === 0) {
    return [];
  }

  // Get random sample using MongoDB's $sample
  const ads = await Ad.aggregate([
    { $match: matchQuery },
    { $sample: { size: Math.min(parseInt(limit), totalCount) } }
  ]);

  // Populate the results manually since aggregate doesn't support populate
  const adIds = ads.map(ad => ad._id);
  const populatedAds = await Ad.find({ _id: { $in: adIds } })
    .populate('createdBy', 'profile firstName lastName email')
    .populate('ratings.user', 'profile firstName lastName');

  return populatedAds;
};

/**
 * Get ad by ID
 * @param {String} adId - Ad ID
 * @param {String} userId - Optional user ID for view tracking
 * @returns {Promise<Object>} Ad object
 */
const getAdById = async (adId, userId = null) => {
  const ad = await Ad.findById(adId)
    .populate('createdBy', 'profile firstName lastName email location')
    .populate('ratings.user', 'profile firstName lastName');

  if (!ad) {
    throw new Error('Ad not found');
  }

  // Increment view count (don't track if creator is viewing)
  if (userId && ad.createdBy.toString() !== userId.toString()) {
    await ad.incrementView(userId);
  } else if (!userId) {
    await ad.incrementView(null);
  }

  return ad;
};

/**
 * Get user's ads (ad history)
 * @param {String} userId - User ID
 * @returns {Promise<Array>} Array of user's ads
 */
const getUserAds = async (userId) => {
  const ads = await Ad.find({ createdBy: userId })
    .populate('createdBy', 'profile firstName lastName email')
    .populate('ratings.user', 'profile firstName lastName')
    .sort({ createdAt: -1 });

  return ads;
};

/**
 * Add rating and review to ad
 * @param {String} adId - Ad ID
 * @param {String} userId - User ID rating the ad
 * @param {Number} rating - Rating (1-5)
 * @param {String} review - Optional review text
 * @returns {Promise<Object>} Updated ad
 */
const addRating = async (adId, userId, rating, review = null) => {
  // Validate user exists
  const user = await User.findById(userId);
  if (!user || !user.isActive || user.isBlocked) {
    throw new Error('User not found or account is inactive');
  }

  // Get ad
  const ad = await Ad.findById(adId);
  if (!ad) {
    throw new Error('Ad not found');
  }

  // Check if ad is active
  if (ad.status !== 'active') {
    throw new Error('Cannot rate inactive ad');
  }

  // Validate rating
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  // Add rating using model method
  await ad.addRating(userId, rating, review);

  // Populate and return
  await ad.populate('createdBy', 'profile firstName lastName email');
  await ad.populate('ratings.user', 'profile firstName lastName');

  return ad;
};

/**
 * Update ad
 * @param {String} adId - Ad ID
 * @param {String} userId - User ID (must be creator)
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated ad
 */
const updateAd = async (adId, userId, updateData) => {
  const ad = await Ad.findById(adId);
  if (!ad) {
    throw new Error('Ad not found');
  }

  // Only creator can update
  if (ad.createdBy.toString() !== userId.toString()) {
    throw new Error('Only the creator can update this ad');
  }

  // Update allowed fields
  const allowedFields = ['title', 'description', 'image', 'category', 'businessName', 'businessType', 'location', 'contact', 'status'];
  allowedFields.forEach(field => {
    if (updateData[field] !== undefined) {
      ad[field] = updateData[field];
    }
  });

  await ad.save();

  // Populate and return
  await ad.populate('createdBy', 'profile firstName lastName email');
  await ad.populate('ratings.user', 'profile firstName lastName');

  return ad;
};

/**
 * Delete ad
 * @param {String} adId - Ad ID
 * @param {String} userId - User ID (must be creator)
 * @returns {Promise<Object>} Deleted ad
 */
const deleteAd = async (adId, userId) => {
  const ad = await Ad.findById(adId);
  if (!ad) {
    throw new Error('Ad not found');
  }

  // Only creator can delete
  if (ad.createdBy.toString() !== userId.toString()) {
    throw new Error('Only the creator can delete this ad');
  }

  await ad.deleteOne();

  return ad;
};

module.exports = {
  createAd,
  getNearbyAds,
  getAllAds,
  getTopRatedAds,
  getRandomAds,
  getAdById,
  getUserAds,
  addRating,
  updateAd,
  deleteAd
};

