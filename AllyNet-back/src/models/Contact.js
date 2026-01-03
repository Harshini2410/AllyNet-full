const mongoose = require('mongoose');

/**
 * Contact Model
 * Stores user inquiries, questions, and complaints submitted through the Help Center
 */

const contactSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true
    },

    // Contact Information
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters']
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters']
    },
    category: {
      type: String,
      enum: ['question', 'complaint', 'bug_report', 'feature_request', 'other'],
      default: 'question'
    },

    // Status
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
      index: true
    },

    // Admin Response (optional)
    adminResponse: {
      message: String,
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      respondedAt: Date
    }
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for performance
contactSchema.index({ user: 1, createdAt: -1 });
contactSchema.index({ status: 1, createdAt: -1 });
contactSchema.index({ category: 1 });

const Contact = mongoose.model('Contact', contactSchema);

module.exports = Contact;

