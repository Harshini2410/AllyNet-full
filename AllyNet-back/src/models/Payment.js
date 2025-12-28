const mongoose = require('mongoose');

/**
 * Payment Model
 * Tracks payment intents, subscriptions, and payment history
 * Integration-ready for payment gateways (Stripe, PayPal, etc.)
 */

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true
    },

    // Payment Type
    type: {
      type: String,
      enum: ['subscription', 'promotion', 'skill_promotion', 'feature', 'other'],
      required: [true, 'Payment type is required']
    },

    // Amount
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true
    },

    // Payment Status
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
      default: 'pending',
      index: true
    },

    // Payment Method & Gateway
    paymentMethod: {
      type: String,
      enum: ['card', 'bank_transfer', 'paypal', 'apple_pay', 'google_pay', 'other']
    },
    gateway: {
      type: String,
      enum: ['stripe', 'paypal', 'square', 'manual', 'other']
    },
    gatewayTransactionId: String, // External gateway transaction ID
    gatewayResponse: mongoose.Schema.Types.Mixed, // Store full gateway response

    // Related Entities
    relatedTo: {
      entityType: {
        type: String,
        enum: ['subscription', 'business', 'skill', 'promotion', 'organization']
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId
      }
    },

    // Subscription-specific
    subscription: {
      tier: String,
      duration: Number, // in days
      startDate: Date,
      endDate: Date
    },

    // Refund Info
    refund: {
      amount: Number,
      reason: String,
      refundedAt: Date,
      gatewayRefundId: String
    },

    // Metadata
    description: String,
    metadata: mongoose.Schema.Types.Mixed, // Additional flexible data

    // Timestamps
    paidAt: Date,
    failedAt: Date,
    failureReason: String
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Instance Method: Mark as completed
paymentSchema.methods.markCompleted = function(gatewayTransactionId = null, gatewayResponse = null) {
  this.status = 'completed';
  this.paidAt = new Date();
  if (gatewayTransactionId) {
    this.gatewayTransactionId = gatewayTransactionId;
  }
  if (gatewayResponse) {
    this.gatewayResponse = gatewayResponse;
  }
  return this.save();
};

// Instance Method: Mark as failed
paymentSchema.methods.markFailed = function(reason = null) {
  this.status = 'failed';
  this.failedAt = new Date();
  if (reason) {
    this.failureReason = reason;
  }
  return this.save();
};

// Instance Method: Process refund
paymentSchema.methods.processRefund = function(amount, reason = null, gatewayRefundId = null) {
  if (this.status !== 'completed') {
    throw new Error('Only completed payments can be refunded');
  }

  if (amount > this.amount) {
    throw new Error('Refund amount cannot exceed payment amount');
  }

  this.status = 'refunded';
  this.refund = {
    amount: amount,
    reason: reason,
    refundedAt: new Date(),
    gatewayRefundId: gatewayRefundId
  };

  return this.save();
};

// Static Method: Find user's payment history
paymentSchema.statics.findUserPayments = function(userId, limit = 50) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static Method: Find active subscriptions
paymentSchema.statics.findActiveSubscriptions = function(userId) {
  return this.find({
    user: userId,
    type: 'subscription',
    status: 'completed',
    'subscription.endDate': { $gt: new Date() }
  }).sort({ 'subscription.endDate': -1 });
};

// Indexes
paymentSchema.index({ user: 1, status: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ gatewayTransactionId: 1 });
paymentSchema.index({ type: 1 });
paymentSchema.index({ 'subscription.endDate': 1 }); // For subscription expiry checks

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;

