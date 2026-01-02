const mongoose = require('mongoose');

/**
 * Help Request Message Model
 * Messages between creator and accepted helper for a help request
 * Similar to EmergencyMessage but for help requests
 */

const helpRequestMessageSchema = new mongoose.Schema(
  {
    helpRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HelpRequest',
      required: [true, 'Help request ID is required'],
      index: true
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender ID is required'],
      index: true
    },
    senderRole: {
      type: String,
      enum: ['creator', 'helper'],
      required: [true, 'Sender role is required']
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

helpRequestMessageSchema.index({ helpRequestId: 1, createdAt: -1 });
helpRequestMessageSchema.index({ senderId: 1, createdAt: -1 });

const HelpRequestMessage = mongoose.model('HelpRequestMessage', helpRequestMessageSchema);

module.exports = HelpRequestMessage;

