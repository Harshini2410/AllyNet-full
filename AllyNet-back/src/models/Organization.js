const mongoose = require('mongoose');

/**
 * Organization Model
 * B2B organizations (apartments, colleges, NGOs, etc.)
 * Can have multiple members and emergency dashboard
 */

const organizationSchema = new mongoose.Schema(
  {
    // Admin/Owner
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Organization admin is required'],
      index: true
    },

    // Organization Info
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      maxlength: [200, 'Organization name cannot exceed 200 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    type: {
      type: String,
      required: [true, 'Organization type is required'],
      enum: [
        'apartment',
        'college',
        'university',
        'ngo',
        'community_center',
        'company',
        'government',
        'other'
      ]
    },

    // Contact Info
    contact: {
      phone: String,
      email: String,
      website: String,
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

    // Members (users belonging to this organization)
    members: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      role: {
        type: String,
        enum: ['member', 'moderator', 'admin'],
        default: 'member'
      },
      joinedAt: {
        type: Date,
        default: Date.now
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
      expiresAt: Date,
      maxMembers: {
        type: Number,
        default: 10
      }
    },

    // Emergency Dashboard Settings
    emergencySettings: {
      enableDashboard: {
        type: Boolean,
        default: true
      },
      alertAdmins: {
        type: Boolean,
        default: true
      },
      alertAllMembers: {
        type: Boolean,
        default: false
      }
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

// Instance Method: Add member
organizationSchema.methods.addMember = function(userId, role = 'member') {
  // Check if user is already a member
  const existingMember = this.members.find(
    m => m.user.toString() === userId.toString()
  );

  if (existingMember) {
    throw new Error('User is already a member of this organization');
  }

  // Check member limit
  if (this.members.length >= this.subscription.maxMembers) {
    throw new Error('Organization member limit reached');
  }

  this.members.push({
    user: userId,
    role: role,
    joinedAt: new Date()
  });

  return this.save();
};

// Instance Method: Remove member
organizationSchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(
    m => m.user.toString() !== userId.toString()
  );
  return this.save();
};

// Instance Method: Update member role
organizationSchema.methods.updateMemberRole = function(userId, newRole) {
  const member = this.members.find(
    m => m.user.toString() === userId.toString()
  );

  if (!member) {
    throw new Error('User is not a member of this organization');
  }

  member.role = newRole;
  return this.save();
};

// Indexes
organizationSchema.index({ admin: 1 });
organizationSchema.index({ type: 1, isActive: 1 });
organizationSchema.index({ 'members.user': 1 });
organizationSchema.index({ isVerified: 1 });

const Organization = mongoose.model('Organization', organizationSchema);

module.exports = Organization;

