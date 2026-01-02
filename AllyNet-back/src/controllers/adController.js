const adService = require('../services/adService');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Ad Controller
 * Handles HTTP requests for ad operations
 */

/**
 * @desc    Create ad
 * @route   POST /api/v1/ads
 * @access  Private
 */
const createAd = asyncHandler(async (req, res) => {
  const { title, description, image, category, businessName, businessType, location, contact, expiresAt } = req.body;

  const ad = await adService.createAd(
    {
      title,
      description,
      image,
      category,
      businessName,
      businessType,
      location,
      contact,
      expiresAt
    },
    req.user._id
  );

  res.status(201).json({
    success: true,
    message: 'Ad created successfully',
    data: {
      ad
    }
  });
});

/**
 * @desc    Get nearby ads
 * @route   GET /api/v1/ads/nearby
 * @access  Private
 */
const getNearbyAds = asyncHandler(async (req, res) => {
  const { latitude, longitude, radius = 10000, limit = 50 } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({
      success: false,
      error: {
        code: 400,
        message: 'Latitude and longitude are required'
      }
    });
  }

  const ads = await adService.getNearbyAds(
    parseFloat(latitude),
    parseFloat(longitude),
    parseFloat(radius),
    parseInt(limit)
  );

  res.status(200).json({
    success: true,
    data: {
      ads,
      count: ads.length
    }
  });
});

/**
 * @desc    Get all ads (for explore page)
 * @route   GET /api/v1/ads
 * @access  Private
 */
const getAllAds = asyncHandler(async (req, res) => {
  const { category, status = 'active', limit = 50, skip = 0 } = req.query;

  const result = await adService.getAllAds({
    category: category || null,
    status,
    limit: parseInt(limit),
    skip: parseInt(skip),
    userId: req.user._id // Exclude creator's own ads
  });

  res.status(200).json({
    success: true,
    data: {
      ads: result.ads,
      total: result.total,
      limit: parseInt(limit),
      skip: parseInt(skip)
    }
  });
});

/**
 * @desc    Get top rated ads (for home page)
 * @route   GET /api/v1/ads/top-rated
 * @access  Private
 */
const getTopRatedAds = asyncHandler(async (req, res) => {
  const { limit = 2 } = req.query;

  const ads = await adService.getTopRatedAds(parseInt(limit), req.user._id);

  res.status(200).json({
    success: true,
    data: {
      ads,
      count: ads.length
    }
  });
});

/**
 * @desc    Get random ads (for home page)
 * @route   GET /api/v1/ads/random
 * @access  Private
 */
const getRandomAds = asyncHandler(async (req, res) => {
  const { limit = 2 } = req.query;

  const ads = await adService.getRandomAds(parseInt(limit), req.user._id);

  res.status(200).json({
    success: true,
    data: {
      ads,
      count: ads.length
    }
  });
});

/**
 * @desc    Get ad by ID
 * @route   GET /api/v1/ads/:id
 * @access  Private
 */
const getAdById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const ad = await adService.getAdById(id, req.user._id);

  res.status(200).json({
    success: true,
    data: {
      ad
    }
  });
});

/**
 * @desc    Get user's ads (ad history)
 * @route   GET /api/v1/ads/my-ads
 * @access  Private
 */
const getMyAds = asyncHandler(async (req, res) => {
  const ads = await adService.getUserAds(req.user._id);

  res.status(200).json({
    success: true,
    data: {
      ads,
      count: ads.length
    }
  });
});

/**
 * @desc    Add rating and review to ad
 * @route   POST /api/v1/ads/:id/rate
 * @access  Private
 */
const rateAd = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, review } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      error: {
        code: 400,
        message: 'Rating is required and must be between 1 and 5'
      }
    });
  }

  const ad = await adService.addRating(id, req.user._id, rating, review || null);

  res.status(200).json({
    success: true,
    message: 'Rating added successfully',
    data: {
      ad
    }
  });
});

/**
 * @desc    Update ad
 * @route   PUT /api/v1/ads/:id
 * @access  Private
 */
const updateAd = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const ad = await adService.updateAd(id, req.user._id, updateData);

  res.status(200).json({
    success: true,
    message: 'Ad updated successfully',
    data: {
      ad
    }
  });
});

/**
 * @desc    Delete ad
 * @route   DELETE /api/v1/ads/:id
 * @access  Private
 */
const deleteAd = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await adService.deleteAd(id, req.user._id);

  res.status(200).json({
    success: true,
    message: 'Ad deleted successfully'
  });
});

module.exports = {
  createAd,
  getNearbyAds,
  getAllAds,
  getTopRatedAds,
  getRandomAds,
  getAdById,
  getMyAds,
  rateAd,
  updateAd,
  deleteAd
};

