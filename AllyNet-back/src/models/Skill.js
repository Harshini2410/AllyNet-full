const mongoose = require('mongoose');

/**
 * Skill Model
 * Individual skills marketplace - users can offer services/skills
 */

const skillSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true
    },

    title: {
      type: String,
      required: [true, 'Skill title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      enum: [
        'tutoring',
        'tech_support',
        'home_repair',
        'cleaning',
        'cooking',
        'pet_care',
        'fitness',
        'beauty',
        'music',
        'art',
        'photography',
        'writing',
        'translation',
        'other'
      ]
    },

    // Pricing
    pricing: {
      type: {
        type: String,
        enum: ['free', 'hourly', 'fixed', 'negotiable'],
        default: 'negotiable'
      },
      amount: {
        type: Number,
        min: [0, 'Amount cannot be negative'],
        default: 0
      },
      currency: {
        type: String,
        default: 'USD'
      }
    },

    // Promotion (paid feature)
    promoted: {
      type: Boolean,
      default: false
    },
    promotionExpiresAt: Date,

    // Availability
    isActive: {
      type: Boolean,
      default: true
    },
    availability: {
      days: [{
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      }],
      timeRange: {
        start: String, // e.g., "09:00"
        end: String    // e.g., "17:00"
      }
    },

    // Rating & Reviews
    rating: {
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

    // Location-based discovery
    serviceRadius: {
      type: Number, // in meters
      default: 10000, // 10km default
      min: [0, 'Service radius cannot be negative']
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Instance Method: Update rating
skillSchema.methods.updateRating = function(newRating, reviewCount) {
  this.rating.average = newRating;
  this.rating.count = reviewCount;
  return this.save();
};

// Indexes
skillSchema.index({ user: 1, isActive: 1 });
skillSchema.index({ category: 1, isActive: 1 });
skillSchema.index({ promoted: 1, createdAt: -1 });
skillSchema.index({ rating: -1 });

const Skill = mongoose.model('Skill', skillSchema);

module.exports = Skill;

