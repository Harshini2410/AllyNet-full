const mongoose = require('mongoose');

/**
 * Help Request Model
 * Non-urgent help requests (different from emergencies)
 * Examples: moving help, tech support, tutoring, etc.
 */

const helpRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true
    },

    // Request Details
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
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      enum: [
        'moving',
        'tech_support',
        'tutoring',
        'delivery',
        'pet_care',
        'home_repair',
        'cleaning',
        'yard_work',
        'shopping',
        'transportation',
        'other'
      ]
    },
    
    // Priority & Budget
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    budget: {
      amount: {
        type: Number,
        min: [0, 'Budget cannot be negative'],
        default: 0
      },
      currency: {
        type: String,
        default: 'USD'
      },
      negotiable: {
        type: Boolean,
        default: true
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
      address: String,
      description: String // e.g., "My apartment"
    },

    // Status Lifecycle: open → accepted → completed → expired
    status: {
      type: String,
      enum: ['open', 'accepted', 'in_progress', 'completed', 'cancelled', 'expired'],
      default: 'open',
      index: true
    },

    // Accepted Helper
    acceptedHelper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    acceptedAt: Date,

    // Completion
    completedAt: Date,
    completionNotes: String,
    
    // Feedback & Rating
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: {
        type: String,
        maxlength: [500, 'Comment cannot exceed 500 characters']
      },
      submittedAt: Date
    },

    // Expiration
    expiresAt: {
      type: Date,
      default: function() {
        // Default: expires in 7 days
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
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
helpRequestSchema.pre('save', function(next) {
  if (this.location.latitude && this.location.longitude) {
    this.location.coordinates = [this.location.longitude, this.location.latitude];
  }
  this.updatedAt = new Date();
  next();
});

// Instance Method: Accept help request
helpRequestSchema.methods.accept = function(helperId) {
  if (this.status !== 'open') {
    throw new Error('Help request is not open for acceptance');
  }

  this.status = 'accepted';
  this.acceptedHelper = helperId;
  this.acceptedAt = new Date();

  return this.save();
};

// Instance Method: Complete help request
helpRequestSchema.methods.complete = function(notes = null) {
  if (this.status !== 'accepted' && this.status !== 'in_progress') {
    throw new Error('Help request must be accepted before completion');
  }

  this.status = 'completed';
  this.completedAt = new Date();
  if (notes) {
    this.completionNotes = notes;
  }

  return this.save();
};

// Instance Method: Cancel help request
helpRequestSchema.methods.cancel = function() {
  if (this.status === 'completed' || this.status === 'cancelled') {
    throw new Error(`Help request is already ${this.status}`);
  }

  this.status = 'cancelled';
  return this.save();
};

// Static Method: Find nearby open requests
helpRequestSchema.statics.findNearbyOpen = function(latitude, longitude, radiusMeters = 10000, limit = 50) {
  return this.find({
    status: 'open',
    expiresAt: { $gt: new Date() }, // Not expired
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
  .populate('user', 'profile firstName lastName trustScore helperRating')
  .sort({ priority: -1, createdAt: -1 })
  .limit(limit);
};

// Indexes
helpRequestSchema.index({ user: 1, status: 1 });
helpRequestSchema.index({ status: 1, createdAt: -1 });
helpRequestSchema.index({ acceptedHelper: 1 });
helpRequestSchema.index({ expiresAt: 1 }); // For cleanup of expired requests
helpRequestSchema.index({ category: 1 });

const HelpRequest = mongoose.model('HelpRequest', helpRequestSchema);

module.exports = HelpRequest;

