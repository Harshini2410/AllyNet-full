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
      required: false, // Optional field
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: '' // Default to empty string if not provided
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

    // Search Radius (user-selected for general help requests)
    radiusKm: {
      type: Number,
      enum: [5, 10, 15, 20],
      default: 10,
      required: [true, 'Radius is required']
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

    // Multiple Helper Responses (allows multiple helpers to respond)
    responses: [{
      helper: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      message: {
        type: String,
        required: [true, 'Response message is required'],
        trim: true,
        maxlength: [500, 'Response message cannot exceed 500 characters']
      },
      status: {
        type: String,
        enum: ['pending', 'accepted', 'denied', 'reported'],
        default: 'pending'
      },
      respondedAt: {
        type: Date,
        default: Date.now
      },
      actionedAt: Date, // When creator took action (accept/deny/report)
      reportReason: String, // Reason for reporting (stored when response is reported)
      // Messages/conversation between creator and helper
      messages: [{
        senderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        senderRole: {
          type: String,
          enum: ['creator', 'helper'],
          required: true
        },
        message: {
          type: String,
          required: true,
          trim: true,
          maxlength: [1000, 'Message cannot exceed 1000 characters']
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }]
    }],

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

// Instance Method: Add helper response (multiple helpers can respond)
helpRequestSchema.methods.addResponse = function(helperId, message) {
  if (this.status !== 'open') {
    throw new Error('Help request is not open for responses');
  }

  // Check if helper already responded
  const existingResponse = this.responses.find(
    r => r.helper.toString() === helperId.toString()
  );

  if (existingResponse) {
    throw new Error('You have already responded to this help request');
  }

  this.responses.push({
    helper: helperId,
    message: message,
    status: 'pending',
    respondedAt: new Date()
  });

  return this.save();
};

// Instance Method: Accept a specific helper's response
helpRequestSchema.methods.acceptResponse = function(helperId) {
  if (this.status !== 'open') {
    throw new Error('Help request is not open for acceptance');
  }

  const response = this.responses.find(
    r => r.helper.toString() === helperId.toString()
  );

  if (!response) {
    throw new Error('Helper has not responded to this request');
  }

  if (response.status !== 'pending') {
    throw new Error('This response has already been actioned');
  }

  response.status = 'accepted';
  response.actionedAt = new Date();
  // Initialize messages array if not exists
  if (!response.messages) {
    response.messages = [];
  }

  return this.save();
};

// Instance Method: Deny a helper's response
helpRequestSchema.methods.denyResponse = function(helperId) {
  const response = this.responses.find(
    r => r.helper.toString() === helperId.toString()
  );

  if (!response) {
    throw new Error('Helper has not responded to this request');
  }

  if (response.status !== 'pending') {
    throw new Error('This response has already been actioned');
  }

  // Remove the response from the array
  this.responses = this.responses.filter(
    r => r.helper.toString() !== helperId.toString()
  );

  return this.save();
};

// Instance Method: Report a helper's response (marks as reported, stores reason, adds as message)
helpRequestSchema.methods.reportResponse = function(helperId, reportReason, creatorId) {
  const response = this.responses.find(
    r => r.helper.toString() === helperId.toString()
  );

  if (!response) {
    throw new Error('Helper has not responded to this request');
  }

  // Allow reporting even if response is already accepted (can report accepted helpers)
  if (response.status === 'reported') {
    throw new Error('This response has already been reported');
  }

  // Mark as reported and store the reason
  response.status = 'reported';
  response.reportReason = reportReason.trim();
  response.actionedAt = new Date();
  
  // Initialize messages array if not exists
  if (!response.messages) {
    response.messages = [];
  }

  // Add report reason as a message to the conversation (helper can see this)
  response.messages.push({
    senderId: creatorId,
    senderRole: 'creator',
    message: `🚩 Report: ${reportReason.trim()}`,
    createdAt: new Date()
  });

  return this.save();
};

// Instance Method: Add message to a response conversation
helpRequestSchema.methods.addMessageToResponse = function(helperId, senderId, message, senderRole) {
  const response = this.responses.find(
    r => r.helper.toString() === helperId.toString()
  );

  if (!response) {
    throw new Error('Helper has not responded to this request');
  }

  // Only allow messages if response is accepted
  if (response.status !== 'accepted') {
    throw new Error('Can only send messages to accepted responses');
  }

  if (!response.messages) {
    response.messages = [];
  }

  response.messages.push({
    senderId,
    senderRole,
    message: message.trim(),
    createdAt: new Date()
  });

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
// Note: Each request has its own radiusKm, so we fetch all requests within max radius (20km)
// Service layer will filter by each request's radiusKm
helpRequestSchema.statics.findNearbyOpen = function(latitude, longitude, radiusMeters = 20000, limit = 50) {
  // Fetch requests within maximum radius (20km = 20000m)
  // Service layer will filter by each request's radiusKm
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
  .populate('responses.helper', 'profile firstName lastName helperRating trustScore')
  .populate('responses.messages.senderId', 'profile firstName lastName email')
  .sort({ priority: -1, createdAt: -1 })
  .limit(limit);
};

// Indexes
helpRequestSchema.index({ user: 1, status: 1 });
helpRequestSchema.index({ status: 1, createdAt: -1 });
helpRequestSchema.index({ acceptedHelper: 1 });
helpRequestSchema.index({ 'responses.helper': 1 }); // For finding helper's responses
helpRequestSchema.index({ expiresAt: 1 }); // For cleanup of expired requests
helpRequestSchema.index({ category: 1 });

const HelpRequest = mongoose.model('HelpRequest', helpRequestSchema);

module.exports = HelpRequest;

