# Emergency (SOS) System Documentation

## Overview

Critical safety feature for AllyNet. Handles emergency requests with strict validation, duplicate prevention, and status lifecycle management.

---

## 🔐 Key Features

1. **Duplicate Prevention** - Users can only have ONE active emergency at a time
2. **Idempotent Creation** - Same requestId prevents duplicate emergencies
3. **Status Lifecycle** - Enforced state machine: `active → responding → resolved/cancelled`
4. **Location-Based Discovery** - Geospatial queries for nearby helpers
5. **Privacy Controls** - Silent mode and anonymous mode support
6. **Helper Coordination** - Multiple helpers can respond with status tracking

---

## 📊 Status Lifecycle

```
active → responding → resolved
         ↓
      cancelled
```

- **active**: Emergency created, waiting for helpers
- **responding**: At least one helper has responded
- **resolved**: Emergency has been resolved (by user or helper)
- **cancelled**: Emergency cancelled by user

---

## 🗂️ Components

### 1. **Emergency Service** (`src/services/emergencyService.js`)

Business logic layer for emergency operations.

#### Functions:

- `createEmergency(emergencyData, userId, requestId)` - Create emergency with duplicate prevention
- `findNearbyHelpers(lat, lng, radius, limit)` - Find verified helpers within radius
- `getEmergencyById(emergencyId, userId)` - Get emergency with authorization check
- `getUserActiveEmergency(userId)` - Get user's active emergency
- `addRespondingHelper(emergencyId, helperId, estimatedArrival)` - Helper responds to emergency
- `updateHelperStatus(emergencyId, helperId, status, notes)` - Update helper's status
- `resolveEmergency(emergencyId, resolvedBy, resolutionType, notes)` - Resolve emergency
- `cancelEmergency(emergencyId, userId, reason)` - Cancel emergency (owner only)
- `getNearbyActiveEmergencies(lat, lng, radius, limit)` - Get nearby emergencies for helpers

---

### 2. **Emergency Controller** (`src/controllers/emergencyController.js`)

HTTP request handlers for emergency endpoints.

---

### 3. **Emergency Routes** (`src/routes/emergency.js`)

Route definitions with validation and authentication.

---

## 📡 API Endpoints

### Create Emergency

**POST** `/api/v1/emergencies`

**Access**: Private

**Request Body**:
```json
{
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "address": "123 Main St, New York, NY",
    "description": "Near Main Street intersection"
  },
  "type": "medical",
  "category": "heart_attack",
  "description": "Need immediate medical assistance",
  "silentMode": false,
  "anonymousMode": false,
  "priority": "critical",
  "severity": 9,
  "requestId": "optional-uuid-for-idempotency"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Emergency created successfully",
  "data": {
    "emergency": { ... },
    "nearbyHelpers": 15,
    "helpers": [ ... ] // First 10 helpers
  }
}
```

**Duplicate Prevention**: If user already has active emergency, returns error unless `requestId` matches existing emergency.

---

### Get Active Emergency

**GET** `/api/v1/emergencies/active`

**Access**: Private

**Response**:
```json
{
  "success": true,
  "data": {
    "emergency": { ... }
  }
}
```

Returns 404 if no active emergency exists.

---

### Get Emergency by ID

**GET** `/api/v1/emergencies/:id`

**Access**: Private

**Authorization**: User must be owner or responding helper

---

### Get Nearby Active Emergencies

**GET** `/api/v1/emergencies/nearby?latitude=40.7128&longitude=-74.0060&radius=10000&limit=50`

**Access**: Private

**Query Parameters**:
- `latitude` (required) - Helper's latitude
- `longitude` (required) - Helper's longitude
- `radius` (optional, default: 10000) - Search radius in meters
- `limit` (optional, default: 100) - Maximum results

**Response**:
```json
{
  "success": true,
  "data": {
    "emergencies": [ ... ],
    "count": 5
  }
}
```

**Note**: Anonymous emergencies have user identity hidden.

---

### Respond to Emergency

**POST** `/api/v1/emergencies/:id/respond`

**Access**: Private (helper role)

**Request Body**:
```json
{
  "estimatedArrival": "2024-01-15T10:30:00Z" // Optional ISO 8601 date
}
```

**Response**:
```json
{
  "success": true,
  "message": "Successfully responding to emergency",
  "data": {
    "emergency": { ... }
  }
}
```

**Behavior**:
- Adds helper to `respondingHelpers` array
- Updates emergency status to `responding` if first helper
- Sets `firstResponseAt` timestamp

---

### Update Helper Status

**PUT** `/api/v1/emergencies/:id/helper-status`

**Access**: Private

**Request Body**:
```json
{
  "status": "on_way", // responding, on_way, arrived, completed, cancelled
  "notes": "On my way, ETA 5 minutes" // Optional
}
```

---

### Resolve Emergency

**POST** `/api/v1/emergencies/:id/resolve`

**Access**: Private (owner or responding helper)

**Request Body**:
```json
{
  "resolutionType": "user_resolved", // user_resolved, helper_resolved, auto_expired, admin_resolved
  "notes": "Emergency resolved, help arrived" // Optional
}
```

**Authorization**: User must be emergency owner or a responding helper.

---

### Cancel Emergency

**POST** `/api/v1/emergencies/:id/cancel`

**Access**: Private (owner only)

**Request Body**:
```json
{
  "reason": "False alarm" // Optional
}
```

**Authorization**: Only the emergency creator can cancel.

---

### Get Emergency Helpers

**GET** `/api/v1/emergencies/:id/helpers?radius=5000&limit=50`

**Access**: Private

**Query Parameters**:
- `radius` (optional, default: 5000) - Search radius in meters
- `limit` (optional, default: 50) - Maximum helpers to return

**Response**:
```json
{
  "success": true,
  "data": {
    "helpers": [ ... ],
    "count": 15
  }
}
```

---

## 🔒 Security & Validation

### Duplicate Prevention

1. **User-Level**: Only ONE active/responding emergency per user
2. **Idempotency**: Same `requestId` returns existing emergency
3. **Atomic Checks**: Service layer prevents race conditions

### Authorization Checks

- **View Emergency**: Must be owner or responding helper
- **Resolve Emergency**: Must be owner or responding helper
- **Cancel Emergency**: Must be owner only
- **Respond to Emergency**: Must be verified helper

### Input Validation

All endpoints validate:
- Location coordinates (latitude: -90 to 90, longitude: -180 to 180)
- Emergency type (enum values)
- Status transitions (enforced by model methods)
- String lengths (category: 50 chars, description: 1000 chars)

---

## 🗄️ Database Queries

### Geospatial Queries

Uses MongoDB 2dsphere index for efficient location-based searches:

```javascript
{
  'location.coordinates': {
    $near: {
      $geometry: {
        type: 'Point',
        coordinates: [longitude, latitude]
      },
      $maxDistance: radiusMeters
    }
  }
}
```

### Performance Indexes

- `user: 1, status: 1` - Find user's active emergency
- `status: 1, activatedAt: -1` - List active emergencies
- `location.coordinates: '2dsphere'` - Geospatial queries
- `respondingHelpers.helper: 1` - Find helper's emergencies
- `requestId: 1` - Idempotency checks

---

## 🚀 Usage Examples

### Create Emergency (User)

```javascript
POST /api/v1/emergencies
Authorization: Bearer <token>
Content-Type: application/json

{
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "address": "123 Main St"
  },
  "type": "medical",
  "description": "Need immediate help",
  "priority": "critical"
}
```

### Respond to Emergency (Helper)

```javascript
POST /api/v1/emergencies/507f1f77bcf86cd799439011/respond
Authorization: Bearer <helper_token>
Content-Type: application/json

{
  "estimatedArrival": "2024-01-15T10:30:00Z"
}
```

### Update Helper Status

```javascript
PUT /api/v1/emergencies/507f1f77bcf86cd799439011/helper-status
Authorization: Bearer <helper_token>
Content-Type: application/json

{
  "status": "arrived",
  "notes": "I've arrived at the location"
}
```

### Resolve Emergency

```javascript
POST /api/v1/emergencies/507f1f77bcf86cd799439011/resolve
Authorization: Bearer <token>
Content-Type: application/json

{
  "resolutionType": "user_resolved",
  "notes": "Help arrived, situation resolved"
}
```

---

## 🔄 Error Handling

### Common Error Scenarios

1. **Duplicate Emergency**
   ```json
   {
     "success": false,
     "error": {
       "code": 409,
       "message": "User already has an active emergency. Please resolve the current emergency first."
     }
   }
   ```

2. **Not Authorized**
   ```json
   {
     "success": false,
     "error": {
       "code": 403,
       "message": "Not authorized to view this emergency"
     }
   }
   ```

3. **Invalid Status Transition**
   ```json
   {
     "success": false,
     "error": {
       "code": 400,
       "message": "Emergency is already resolved"
     }
   }
   ```

4. **Helper Not Verified**
   ```json
   {
     "success": false,
     "error": {
       "code": 403,
       "message": "User is not a verified helper"
     }
   }
   ```

---

## 📝 Privacy Features

### Anonymous Mode

When `anonymousMode: true`:
- User identity is hidden from helpers in nearby emergencies list
- Only minimal user info is returned (no name, email, etc.)
- Helps protect user privacy in sensitive situations

### Silent Mode

When `silentMode: true`:
- Emergency created without sound/notifications
- Useful for situations requiring discretion
- Helpers still receive the emergency but silently

---

## 🔮 Future Enhancements

1. **Socket.IO Integration** - Real-time emergency broadcasts
2. **Auto-Expiration** - Automatically expire old active emergencies
3. **Misuse Detection** - Track and flag emergency misuse patterns
4. **Emergency History** - Store resolved emergencies for analytics
5. **Push Notifications** - Notify helpers via push notifications
6. **Emergency Rooms** - Socket.IO rooms for real-time coordination

---

*Emergency system is production-ready. Next: Socket.IO integration for real-time events.*

