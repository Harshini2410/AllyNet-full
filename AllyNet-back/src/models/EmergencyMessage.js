const mongoose = require('mongoose');

const emergencyMessageSchema = new mongoose.Schema(
  {
    emergencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Emergency',
      required: [true, 'Emergency ID is required'],
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

emergencyMessageSchema.index({ emergencyId: 1, createdAt: -1 });
emergencyMessageSchema.index({ senderId: 1, createdAt: -1 });

const EmergencyMessage = mongoose.model('EmergencyMessage', emergencyMessageSchema);

module.exports = EmergencyMessage;

