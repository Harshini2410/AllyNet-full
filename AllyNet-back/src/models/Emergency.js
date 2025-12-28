const mongoose = require('mongoose');

/**
 * Emergency (SOS) Model
 * Critical safety feature - handles emergency requests with strict validation
 * Must prevent duplicates and enforce status lifecycle
 */

const emergencySchema = new mongoose.Schema(
  {
    // User who created the emergency
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true
    },

    // Emergency Status Lifecycle: active → responding → resolved
    status: {
      type: String,
      enum: ['active', 'responding', 'resolved', 'cancelled'],
      default: 'active',
      required: true,
      index: true
    },

    // Location (where emergency occurred)
    location: {
      latitude: {
        type: Number,
        required: [true, 'Latitude is required'],
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
      },
      longitude: {
        type: Number,
        required: [true, 'Longitude is required'],
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
      },
      coordinates: {
        type: [Number], // [longitude, latitude] for MongoDB geospatial
        index: '2dsphere'
      },
      address: String,
      description: String // e.g., "Near Main Street intersection"
    },

    // Emergency Details
    type: {
      type: String,
      enum: ['medical', 'safety', 'accident', 'assault', 'natural_disaster', 'other'],
      required: [true, 'Emergency type is required'],
      default: 'other'
    },
    category: {
      type: String,
      trim: true,
      maxlength: [50, 'Category cannot exceed 50 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    
    // Privacy & Safety Flags
    silentMode: {
      type: Boolean,
      default: false // If true, emergency is created without notifications/sound
    },
    anonymousMode: {
      type: Boolean,
      default: false // If true, user identity is hidden from helpers
    },
    fakeCallAlert: {
      type: Boolean,
      default: false // If true, trigger a fake incoming call for safety
    },
    
    // Avoidance Radius (in kilometers) - distance for helper discovery
    avoidRadiusKm: {
      type: Number,
      min: [0.5, 'Avoidance radius must be at least 0.5km'],
      max: [2, 'Avoidance radius must be at most 2km'],
      default: 0.5
    },

    // Responding Helpers
    respondingHelpers: [{
      helper: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      respondedAt: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['responding', 'on_way', 'arrived', 'completed', 'cancelled'],
        default: 'responding'
      },
      estimatedArrival: Date,
      notes: String
    }],

    // Resolution Details
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolutionNotes: {
      type: String,
      maxlength: [500, 'Resolution notes cannot exceed 500 characters']
    },
    resolutionType: {
      type: String,
      enum: ['user_resolved', 'helper_resolved', 'auto_expired', 'admin_resolved'],
      default: null
    },

    // Emergency Metadata
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'high'
    },
    severity: {
      type: Number,
      min: 1,
      max: 10,
      default: 5
    },
    
    // Idempotency & Duplicate Prevention
    requestId: {
      type: String,
      unique: true,
      sparse: true // Allow null values, but enforce uniqueness for non-null
    },
    
    // Timestamps
    activatedAt: {
      type: Date,
      default: Date.now
    },
    firstResponseAt: Date,
    lastUpdatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Geospatial Index: Update coordinates array when location changes
emergencySchema.pre('save', function(next) {
  if (this.location.latitude && this.location.longitude) {
    this.location.coordinates = [this.location.longitude, this.location.latitude];
  }
  this.lastUpdatedAt = new Date();
  next();
});

// Instance Method: Add responding helper
emergencySchema.methods.addRespondingHelper = function(helperId, estimatedArrival = null) {
  // Check if helper already responding
  const existingHelper = this.respondingHelpers.find(
    h => h.helper.toString() === helperId.toString()
  );

  if (existingHelper) {
    throw new Error('Helper is already responding to this emergency');
  }

  this.respondingHelpers.push({
    helper: helperId,
    respondedAt: new Date(),
    status: 'responding',
    estimatedArrival: estimatedArrival
  });

  // Update status if first helper
  if (this.status === 'active' && this.respondingHelpers.length === 1) {
    this.status = 'responding';
    this.firstResponseAt = new Date();
  }

  return this.save();
};

// Instance Method: Update helper status
emergencySchema.methods.updateHelperStatus = function(helperId, newStatus, notes = null) {
  const helper = this.respondingHelpers.find(
    h => h.helper.toString() === helperId.toString()
  );

  if (!helper) {
    throw new Error('Helper not found in responding helpers');
  }

  helper.status = newStatus;
  if (notes) {
    helper.notes = notes;
  }

  return this.save();
};

// Instance Method: Resolve emergency
emergencySchema.methods.resolve = function(resolvedBy = null, resolutionType = 'user_resolved', notes = null) {
  if (this.status === 'resolved' || this.status === 'cancelled') {
    throw new Error(`Emergency is already ${this.status}`);
  }

  this.status = 'resolved';
  this.resolvedAt = new Date();
  this.resolvedBy = resolvedBy || this.user;
  this.resolutionType = resolutionType;
  if (notes) {
    this.resolutionNotes = notes;
  }

  return this.save();
};

// Instance Method: Cancel emergency
emergencySchema.methods.cancel = function(reason = null) {
  if (this.status === 'resolved' || this.status === 'cancelled') {
    throw new Error(`Emergency is already ${this.status}`);
  }

  this.status = 'cancelled';
  if (reason) {
    this.resolutionNotes = reason;
  }

  return this.save();
};

// Static Method: Find active emergency for user
emergencySchema.statics.findActiveEmergency = function(userId) {
  return this.findOne({
    user: userId,
    status: { $in: ['active', 'responding'] }
  });
};

// Static Method: Find nearby active emergencies
emergencySchema.statics.findNearbyActive = function(latitude, longitude, radiusMeters = 10000, limit = 100) {
  return this.find({
    status: { $in: ['active', 'responding'] },
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
  .populate('user', 'profile firstName lastName location')
  .sort({ priority: -1, activatedAt: -1 })
  .limit(limit);
};

// Indexes for performance
emergencySchema.index({ user: 1, status: 1 }); // For finding user's active emergency
emergencySchema.index({ status: 1, activatedAt: -1 }); // For listing active emergencies
emergencySchema.index({ 'respondingHelpers.helper': 1 }); // For finding helper's emergencies
emergencySchema.index({ requestId: 1 }); // For idempotency checks
emergencySchema.index({ createdAt: -1 }); // For recent emergencies

const Emergency = mongoose.model('Emergency', emergencySchema);

module.exports = Emergency;

