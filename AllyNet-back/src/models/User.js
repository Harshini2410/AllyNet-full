const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Model
 * Core user profile with authentication, location, trust score, and roles
 */

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false // Don't return password by default
    },
    
    // Profile Information
    profile: {
      firstName: {
        type: String,
        trim: true,
        maxlength: [50, 'First name cannot exceed 50 characters']
      },
      lastName: {
        type: String,
        trim: true,
        maxlength: [50, 'Last name cannot exceed 50 characters']
      },
      phone: {
        type: String,
        trim: true,
        match: [/^\+?[\d\s\-()]+$/, 'Please provide a valid phone number']
      },
      avatar: {
        type: String,
        default: null
      },
      bio: {
        type: String,
        maxlength: [500, 'Bio cannot exceed 500 characters']
      }
    },

    // Location (GeoJSON format for 2dsphere index) - OPTIONAL
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: undefined
      },
      coordinates: {
        type: [Number], // [longitude, latitude] format for MongoDB GeoJSON
        default: undefined,
        validate: {
          validator: function(coords) {
            if (!coords) return true; // Allow undefined
            return coords.length === 2 &&
                   coords[0] >= -180 && coords[0] <= 180 && // longitude
                   coords[1] >= -90 && coords[1] <= 90;    // latitude
          },
          message: 'Coordinates must be [longitude, latitude] with valid ranges'
        }
      }
    },

    // Location metadata (separate from GeoJSON location)
    locationMetadata: {
      address: String,
      city: String,
      state: String,
      zipCode: String,
      country: {
        type: String,
        default: 'US'
      },
      lastUpdated: {
        type: Date,
        default: Date.now
      }
    },

    // Search radius in meters for emergency/help discovery
    searchRadius: {
      type: Number,
      default: 5000, // 5km default
      min: [100, 'Radius must be at least 100 meters'],
      max: [50000, 'Radius cannot exceed 50km']
    },

    // Trust & Verification
    trustScore: {
      type: Number,
      default: 0,
      min: [0, 'Trust score cannot be negative'],
      max: [1000, 'Trust score cannot exceed 1000']
    },
    verification: {
      status: {
        type: String,
        enum: ['unverified', 'pending', 'verified', 'rejected'],
        default: 'unverified'
      },
      verifiedAt: Date,
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      documents: [{
        type: String, // URL or path to verification document
        uploadedAt: Date
      }],
      kycLevel: {
        type: String,
        enum: ['none', 'basic', 'advanced'],
        default: 'none'
      }
    },

    // Roles & Permissions
    role: {
      type: String,
      enum: ['user', 'helper', 'business', 'org_admin', 'admin'],
      default: 'user'
    },
    
    // Helper-specific fields
    helper: {
      type: Boolean,
      default: false
    },
    helperVerified: {
      type: Boolean,
      default: false
    },
    helperSkills: [{
      type: String,
      trim: true
    }],
    helperResponseCount: {
      type: Number,
      default: 0
    },
    helperRating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      count: {
        type: Number,
        default: 0
      }
    },

    // Account Status
    isActive: {
      type: Boolean,
      default: true
    },
    isBlocked: {
      type: Boolean,
      default: false
    },
    blockedReason: String,
    blockedAt: Date,

    // Activity Tracking
    lastLogin: Date,
    emergencyCount: {
      type: Number,
      default: 0
    },
    helpRequestCount: {
      type: Number,
      default: 0
    },
    
    // Emergency Contacts (for SMS notifications)
    emergencyContacts: [{
      name: {
        type: String,
        required: [true, 'Contact name is required'],
        trim: true,
        maxlength: [100, 'Contact name cannot exceed 100 characters']
      },
      phone: {
        type: String,
        required: [true, 'Contact phone is required'],
        trim: true,
        match: [/^\+?[\d\s\-()]+$/, 'Please provide a valid phone number']
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    
    // Organization membership (for org_admin role)
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null
    }
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Geospatial Index: Ensure location is valid GeoJSON format (only if location is provided)
userSchema.pre('save', function(next) {
  // Only validate/format location if it's being set
  if (this.location !== undefined && this.location !== null) {
    // If location is provided, ensure it's valid GeoJSON Point
    if (!this.location.type || this.location.type !== 'Point') {
      this.location = {
        type: 'Point',
        coordinates: [0, 0] // Default to [0, 0] if invalid
      };
    }

    // Ensure coordinates array is valid
    if (!Array.isArray(this.location.coordinates) || this.location.coordinates.length !== 2) {
      this.location.coordinates = [0, 0];
    }

    // Validate coordinate ranges
    const [longitude, latitude] = this.location.coordinates;
    if (typeof longitude !== 'number' || typeof latitude !== 'number' ||
        longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
      this.location.coordinates = [0, 0];
    }

    // Update location metadata timestamp
    if (this.isModified('location')) {
      this.locationMetadata = this.locationMetadata || {};
      this.locationMetadata.lastUpdated = new Date();
    }
  }
  // If location is undefined/null, leave it as is (optional field)

  next();
});

// Password Hashing Middleware
userSchema.pre('save', async function(next) {
  // Only hash password if it's been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance Method: Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance Method: Update trust score (can be called by services)
userSchema.methods.updateTrustScore = function(newScore) {
  if (newScore >= 0 && newScore <= 100) {
    this.trustScore = newScore;
    return this.save();
  }
  throw new Error('Trust score must be between 0 and 100');
};

// Static Method: Find nearby helpers
userSchema.statics.findNearbyHelpers = function(latitude, longitude, radiusMeters = 5000, limit = 50) {
  return this.find({
    helper: true,
    helperVerified: true,
    isActive: true,
    isBlocked: false,
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: radiusMeters
      }
    }
  })
  .select('-password')
  .sort({ trustScore: -1, 'helperRating.average': -1 })
  .limit(limit);
};

// Virtual: Full name
userSchema.virtual('fullName').get(function() {
  if (this.profile && this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  // DEFENSIVE: Check email exists before calling split
  if (this.email && typeof this.email === 'string') {
    return this.email.split('@')[0]; // Fallback to email username
  }
  return 'Unknown User'; // Safe fallback if email is missing
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ helper: 1, helperVerified: 1, isActive: 1 });
userSchema.index({ trustScore: -1 });
userSchema.index({ 'verification.status': 1 });
userSchema.index({ organization: 1 });
userSchema.index({ location: '2dsphere' }, { sparse: true }); // Sparse geospatial index - only indexes documents with location

const User = mongoose.model('User', userSchema);

module.exports = User;

