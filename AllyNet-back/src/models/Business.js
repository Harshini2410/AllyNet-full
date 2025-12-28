const mongoose = require('mongoose');

/**
 * Business Model
 * Local business profiles with promotions and deals
 */

const businessSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Business owner is required'],
      index: true
    },

    // Business Info
    name: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
      maxlength: [100, 'Business name cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'restaurant',
        'retail',
        'services',
        'healthcare',
        'education',
        'entertainment',
        'automotive',
        'home_improvement',
        'other'
      ]
    },

    // Contact Info
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
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: {
          type: String,
          default: 'US'
        }
      }
    },

    // Promotions & Deals
    promotions: [{
      title: {
        type: String,
        required: true,
        maxlength: [100, 'Promotion title cannot exceed 100 characters']
      },
      description: {
        type: String,
        maxlength: [500, 'Promotion description cannot exceed 500 characters']
      },
      discount: {
        type: Number,
        min: 0,
        max: 100
      },
      validFrom: {
        type: Date,
        default: Date.now
      },
      validUntil: {
        type: Date,
        required: true
      },
      isActive: {
        type: Boolean,
        default: true
      }
    }],

    // Subscription
    subscription: {
      tier: {
        type: String,
        enum: ['free', 'basic', 'premium', 'enterprise'],
        default: 'free'
      },
      status: {
        type: String,
        enum: ['active', 'expired', 'cancelled'],
        default: 'active'
      },
      expiresAt: Date
    },

    // Status
    isActive: {
      type: Boolean,
      default: true
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedAt: Date
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Geospatial Index: Update coordinates
businessSchema.pre('save', function(next) {
  if (this.location.latitude && this.location.longitude) {
    this.location.coordinates = [this.location.longitude, this.location.latitude];
  }
  next();
});

// Static Method: Find nearby businesses
businessSchema.statics.findNearby = function(latitude, longitude, radiusMeters = 10000, category = null, limit = 50) {
  const query = {
    isActive: true,
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: radiusMeters
      }
    }
  };

  if (category) {
    query.category = category;
  }

  return this.find(query)
    .populate('owner', 'profile firstName lastName')
    .limit(limit);
};

// Indexes
businessSchema.index({ owner: 1 });
businessSchema.index({ category: 1, isActive: 1 });
businessSchema.index({ isVerified: 1 });
businessSchema.index({ 'subscription.tier': 1, 'subscription.status': 1 });

const Business = mongoose.model('Business', businessSchema);

module.exports = Business;

