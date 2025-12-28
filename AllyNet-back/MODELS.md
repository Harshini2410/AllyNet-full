# Database Models Documentation

## Overview

All models use Mongoose schemas with proper validation, indexes, and instance/static methods for common operations.

---

## 📋 Models Summary

### 1. **User Model** (`User.js`)
**Core user profile with authentication, location, trust score, and roles**

#### Key Features:
- **Authentication**: Email + password (bcrypt hashed, 12 salt rounds)
- **Profile**: First name, last name, phone, avatar, bio
- **Location**: Latitude/longitude with geospatial index (2dsphere) for nearby queries
- **Trust Score**: 0-100 numeric score (can be updated via instance method)
- **Verification**: Status (unverified/pending/verified/rejected), KYC level, documents
- **Roles**: user, helper, business, org_admin, admin
- **Helper Fields**: Verification status, skills, response count, ratings
- **Organization**: Reference to organization (for org_admin role)

#### Instance Methods:
- `comparePassword(candidatePassword)` - Compare password for login
- `updateTrustScore(newScore)` - Update user's trust score

#### Static Methods:
- `findNearbyHelpers(lat, lng, radius, limit)` - Find verified helpers within radius

#### Indexes:
- Email (unique)
- Location coordinates (2dsphere for geospatial queries)
- Role, helper status
- Trust score
- Organization

---

### 2. **Emergency Model** (`Emergency.js`)
**Critical SOS system with strict status lifecycle and duplicate prevention**

#### Key Features:
- **Status Lifecycle**: `active → responding → resolved/cancelled` (enforced)
- **Location**: Geospatial index for nearby emergency discovery
- **Types**: medical, safety, accident, assault, natural_disaster, other
- **Privacy Flags**: `silentMode`, `anonymousMode`
- **Responding Helpers**: Array of helpers with timestamps and status
- **Idempotency**: `requestId` field for duplicate prevention
- **Resolution**: Resolution type, notes, resolved by user/helper

#### Instance Methods:
- `addRespondingHelper(helperId, estimatedArrival)` - Add helper to emergency
- `updateHelperStatus(helperId, newStatus, notes)` - Update helper's status
- `resolve(resolvedBy, resolutionType, notes)` - Resolve emergency
- `cancel(reason)` - Cancel emergency

#### Static Methods:
- `findActiveEmergency(userId)` - Find user's active emergency (prevents duplicates)
- `findNearbyActive(lat, lng, radius, limit)` - Find nearby active emergencies

#### Indexes:
- User + status (for finding user's active emergency)
- Status + activatedAt
- Location coordinates (2dsphere)
- Request ID (for idempotency)

#### Critical Design Decisions:
- **Duplicate Prevention**: Only ONE active/responding emergency per user
- **Atomic Operations**: Status transitions are enforced via instance methods
- **Geospatial Queries**: Efficient nearby helper discovery

---

### 3. **HelpRequest Model** (`HelpRequest.js`)
**Non-urgent help requests (different from emergencies)**

#### Key Features:
- **Status**: `open → accepted → in_progress → completed/cancelled/expired`
- **Categories**: moving, tech_support, tutoring, delivery, pet_care, etc.
- **Budget**: Amount, currency, negotiable flag
- **Location**: Geospatial index for discovery
- **Expiration**: Default 7 days, can be customized
- **Feedback**: Rating (1-5) and comments

#### Instance Methods:
- `accept(helperId)` - Accept help request
- `complete(notes)` - Mark as completed
- `cancel()` - Cancel request

#### Static Methods:
- `findNearbyOpen(lat, lng, radius, limit)` - Find nearby open requests

---

### 4. **Skill Model** (`Skill.js`)
**Individual skills marketplace**

#### Key Features:
- **Categories**: tutoring, tech_support, home_repair, cooking, etc.
- **Pricing**: free, hourly, fixed, negotiable
- **Promotion**: Paid promotion flag with expiration
- **Availability**: Days of week, time ranges
- **Rating**: Average rating and count
- **Service Radius**: Distance for service delivery

#### Instance Methods:
- `updateRating(newRating, reviewCount)` - Update skill rating

---

### 5. **Business Model** (`Business.js`)
**Local business profiles with promotions**

#### Key Features:
- **Categories**: restaurant, retail, services, healthcare, etc.
- **Contact Info**: Phone, email, website, social media
- **Location**: Geospatial index for discovery
- **Promotions**: Embedded array of promotions with validity dates
- **Subscription**: Tier (free/basic/premium/enterprise), status, expiration
- **Verification**: Business verification status

#### Static Methods:
- `findNearby(lat, lng, radius, category, limit)` - Find nearby businesses

---

### 6. **Organization Model** (`Organization.js`)
**B2B organizations (apartments, colleges, NGOs)**

#### Key Features:
- **Types**: apartment, college, university, ngo, community_center, etc.
- **Members**: Array of users with roles (member, moderator, admin)
- **Subscription**: Tier with member limits
- **Emergency Settings**: Dashboard configuration, alert preferences

#### Instance Methods:
- `addMember(userId, role)` - Add member (checks limits)
- `removeMember(userId)` - Remove member
- `updateMemberRole(userId, newRole)` - Update member's role

---

### 7. **Payment Model** (`Payment.js`)
**Payment tracking and subscription management**

#### Key Features:
- **Types**: subscription, promotion, skill_promotion, feature, other
- **Status**: pending, processing, completed, failed, refunded, cancelled
- **Payment Methods**: card, bank_transfer, paypal, apple_pay, google_pay
- **Gateways**: stripe, paypal, square, manual
- **Gateway Integration**: Stores transaction IDs and responses
- **Refunds**: Refund tracking with gateway IDs
- **Subscriptions**: Duration, start/end dates

#### Instance Methods:
- `markCompleted(gatewayTransactionId, gatewayResponse)` - Mark payment complete
- `markFailed(reason)` - Mark payment failed
- `processRefund(amount, reason, gatewayRefundId)` - Process refund

#### Static Methods:
- `findUserPayments(userId, limit)` - Get user's payment history
- `findActiveSubscriptions(userId)` - Find active subscriptions

---

## 🔑 Key Design Patterns

### 1. **Geospatial Queries**
All location-based models use MongoDB's 2dsphere index:
```javascript
coordinates: {
  type: [Number], // [longitude, latitude]
  index: '2dsphere'
}
```

### 2. **Password Security**
- Passwords hashed with bcrypt (12 salt rounds)
- Password field excluded from queries by default (`select: false`)
- Pre-save middleware handles hashing

### 3. **Status Lifecycle**
- Enforced via instance methods (prevents invalid state transitions)
- Status changes are atomic operations

### 4. **Relationships**
- **References**: Foreign keys to other models (User, Organization)
- **Embedded**: Arrays within documents (promotions, responding helpers)
- Use references for large/independent entities
- Use embedded for small, related arrays

### 5. **Indexes Strategy**
- **Query Performance**: Index on frequently queried fields
- **Geospatial**: 2dsphere for location queries
- **Compound**: User + status for finding user's active items
- **Unique**: Email, requestId for duplicate prevention

### 6. **Validation**
- Schema-level validation (required, enum, min/max)
- Custom validators where needed
- Error messages for better UX

---

## 📊 Model Relationships

```
User
 ├── Emergency (1:N) - User creates emergencies
 ├── HelpRequest (1:N) - User creates help requests
 ├── Skill (1:N) - User offers skills
 ├── Business (1:1) - User owns business
 ├── Organization (N:1) - Users belong to organizations
 └── Payment (1:N) - User makes payments

Organization
 ├── User (1:N via members array) - Organization has members
 └── Emergency (via members) - Organization can view member emergencies

Emergency
 ├── User (N:1) - Emergency belongs to user
 └── User (N:M via respondingHelpers) - Helpers respond to emergencies

HelpRequest
 ├── User (N:1) - Request belongs to user
 └── User (N:1 via acceptedHelper) - Helper accepts request
```

---

## 🚀 Usage Examples

### Creating a User
```javascript
const user = new User({
  email: 'user@example.com',
  password: 'securepassword123',
  profile: {
    firstName: 'John',
    lastName: 'Doe'
  },
  location: {
    latitude: 40.7128,
    longitude: -74.0060,
    radius: 5000
  },
  role: 'user'
});
await user.save();
```

### Creating an Emergency
```javascript
const emergency = new Emergency({
  user: userId,
  type: 'medical',
  location: {
    latitude: 40.7128,
    longitude: -74.0060
  },
  description: 'Need medical assistance',
  requestId: uuidv4() // For idempotency
});
await emergency.save();
```

### Finding Nearby Helpers
```javascript
const helpers = await User.findNearbyHelpers(40.7128, -74.0060, 5000, 50);
```

### Adding Helper to Emergency
```javascript
await emergency.addRespondingHelper(helperId, estimatedArrivalTime);
```

---

## 🔒 Security Considerations

1. **Password Hashing**: All passwords hashed with bcrypt
2. **Field Exclusion**: Sensitive fields (password) excluded by default
3. **Input Validation**: Schema-level validation prevents invalid data
4. **Status Enforcement**: Instance methods prevent invalid state transitions
5. **Duplicate Prevention**: Unique indexes and idempotency fields

---

*Models are ready for use. Next: Authentication system and routes.*

