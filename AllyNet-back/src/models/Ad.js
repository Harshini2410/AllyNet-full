const mongoose = require('mongoose');

/**
 * Ad Model
 * Promotional ads for nearby shops, brands, businesses
 * Includes ratings and reviews system
 */

const adSchema = new mongoose.Schema(
  {
    // Ad Creator
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
      index: true
    },

    // Ad Details
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    image: {
      type: String,
      default: null // URL to image
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'shop',
        'restaurant',
        'service',
        'brand',
        'event',
        'other'
      ],
      index: true
    },

    // Business/Shop Information
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
      maxlength: [100, 'Business name cannot exceed 100 characters']
    },
    businessType: {
      type: String,
      trim: true
    },

    // Location
    location: {
      latitude: {
        type: Number,
        required: [true, 'Latitude is required']
      },
      longitude: {
        type: Number,
        required: [true, 'Longitude is required']
      },
      coordinates: {
        type: [Number],
        index: '2dsphere'
      },
      address: String,
      city: String,
      state: String,
      zipCode: String
    },

    // Contact Information
    contact: {
      phone: String,
      email: String,
      website: String,
      socialMedia: {
        facebook: String,
        instagram: String,
        twitter: String
      }
    },

    // Ratings and Reviews
    ratings: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
      },
      review: {
        type: String,
        trim: true,
        maxlength: [500, 'Review cannot exceed 500 characters']
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],

    // Average Rating (calculated)
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalRatings: {
      type: Number,
      default: 0
    },

    // Reach/Views Tracking
    views: {
      type: Number,
      default: 0
    },
    viewHistory: [{
      viewedAt: {
        type: Date,
        default: Date.now
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null // null for anonymous views
      }
    }],

    // Status
    status: {
      type: String,
      enum: ['active', 'inactive', 'expired'],
      default: 'active',
      index: true
    },

    // Expiration
    expiresAt: {
      type: Date,
      default: function() {
        // Default: expires in 30 days
        return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Geospatial Index: Update coordinates
adSchema.pre('save', function(next) {
  if (this.location.latitude && this.location.longitude) {
    this.location.coordinates = [this.location.longitude, this.location.latitude];
  }
  this.updatedAt = new Date();
  next();
});

// Calculate average rating before save
adSchema.pre('save', function(next) {
  if (this.ratings && this.ratings.length > 0) {
    const sum = this.ratings.reduce((acc, r) => acc + r.rating, 0);
    this.averageRating = (sum / this.ratings.length).toFixed(1);
    this.totalRatings = this.ratings.length;
  } else {
    this.averageRating = 0;
    this.totalRatings = 0;
  }
  next();
});

// Instance Method: Add rating and review
adSchema.methods.addRating = function(userId, rating, review = null) {
  // Check if user already rated
  const existingRating = this.ratings.find(
    r => r.user.toString() === userId.toString()
  );

  if (existingRating) {
    // Update existing rating
    existingRating.rating = rating;
    if (review) {
      existingRating.review = review;
    }
    existingRating.createdAt = new Date();
  } else {
    // Add new rating
    this.ratings.push({
      user: userId,
      rating: rating,
      review: review || null,
      createdAt: new Date()
    });
  }

  return this.save();
};

// Instance Method: Remove rating
adSchema.methods.removeRating = function(userId) {
  this.ratings = this.ratings.filter(
    r => r.user.toString() !== userId.toString()
  );
  return this.save();
};

// Instance Method: Increment view count
adSchema.methods.incrementView = function(userId = null) {
  this.views = (this.views || 0) + 1;
  this.viewHistory.push({
    viewedAt: new Date(),
    userId: userId || null
  });
  // Keep only last 1000 view records to prevent unbounded growth
  if (this.viewHistory.length > 1000) {
    this.viewHistory = this.viewHistory.slice(-1000);
  }
  return this.save();
};

// Static Method: Find nearby active ads
adSchema.statics.findNearbyActive = function(latitude, longitude, radiusMeters = 10000, limit = 50) {
  return this.find({
    status: 'active',
    $or: [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: null }
    ],
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: radiusMeters
      }
    }
  })
  .populate('createdBy', 'profile firstName lastName email')
  .populate('ratings.user', 'profile firstName lastName')
  .sort({ createdAt: -1 })
  .limit(limit);
};

// Indexes
adSchema.index({ createdBy: 1, status: 1 });
adSchema.index({ status: 1, createdAt: -1 });
adSchema.index({ category: 1 });
adSchema.index({ expiresAt: 1 }); // For cleanup of expired ads
adSchema.index({ 'ratings.user': 1 }); // For finding user's ratings

const Ad = mongoose.model('Ad', adSchema);

module.exports = Ad;

