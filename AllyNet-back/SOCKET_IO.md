# Socket.IO Real-Time System Documentation

## Overview

Socket.IO integration for real-time emergency broadcasts, helper coordination, and live status updates in AllyNet.

---

## 🔌 Socket.IO Architecture

### Namespace: `/emergencies`

All emergency-related Socket.IO events are handled under the `/emergencies` namespace.

**Connection URL**: `ws://localhost:5000/emergencies`

### Authentication

Socket.IO connections require JWT authentication via:
- **Handshake Auth**: `socket.handshake.auth.token`
- **Query Parameter**: `socket.handshake.query.token`

The token is verified using the same JWT utilities as REST API authentication.

---

## 📡 Socket Events

### Client → Server Events

#### `emergency:join`
Join an emergency room to receive updates for a specific emergency.

**Payload**:
```json
{
  "emergencyId": "507f1f77bcf86cd799439011"
}
```

**Response**: `emergency:joined` event

**Authorization**: User must be:
- Emergency owner, OR
- Responding helper, OR
- Verified helper (for viewing nearby emergencies)

---

#### `emergency:leave`
Leave an emergency room.

**Payload**:
```json
{
  "emergencyId": "507f1f77bcf86cd799439011"
}
```

**Response**: `emergency:left` event

---

#### `location:update`
Update user's location for nearby emergency discovery.

**Payload**:
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

**Response**: `location:updated` event

---

### Server → Client Events

#### `emergency:created`
Broadcasted to all connected helpers when a new emergency is created.

**Payload**:
```json
{
  "emergency": {
    "id": "507f1f77bcf86cd799439011",
    "type": "medical",
    "category": "heart_attack",
    "description": "Need immediate medical assistance",
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "address": "123 Main St"
    },
    "priority": "critical",
    "severity": 9,
    "status": "active",
    "createdAt": "2024-01-15T10:00:00Z",
    "anonymousMode": false,
    "user": { ... } // Null if anonymousMode is true
  },
  "nearbyHelperCount": 15
}
```

---

#### `emergency:nearby`
Sent to specific helpers when they're near a new emergency.

**Payload**:
```json
{
  "emergency": { ... },
  "distance": null // Optional distance in meters
}
```

---

#### `emergency:joined`
Confirmation when successfully joined an emergency room.

**Payload**:
```json
{
  "emergencyId": "507f1f77bcf86cd799439011",
  "room": "emergency:507f1f77bcf86cd799439011",
  "message": "Successfully joined emergency room"
}
```

---

#### `emergency:left`
Confirmation when left an emergency room.

**Payload**:
```json
{
  "emergencyId": "507f1f77bcf86cd799439011",
  "room": "emergency:507f1f77bcf86cd799439011"
}
```

---

#### `helper:joined`
Broadcasted to emergency room when a helper joins/responds.

**Payload**:
```json
{
  "emergencyId": "507f1f77bcf86cd799439011",
  "helper": {
    "id": "507f1f77bcf86cd799439012",
    "profile": {
      "firstName": "John",
      "lastName": "Doe"
    },
    "trustScore": 85,
    "helperRating": {
      "average": 4.8,
      "count": 50
    },
    "joinedAt": "2024-01-15T10:05:00Z"
  }
}
```

---

#### `helper:status_update`
Broadcasted when a helper updates their status.

**Payload**:
```json
{
  "emergencyId": "507f1f77bcf86cd799439011",
  "helperId": "507f1f77bcf86cd799439012",
  "status": "on_way", // responding, on_way, arrived, completed, cancelled
  "notes": "On my way, ETA 5 minutes",
  "updatedAt": "2024-01-15T10:10:00Z"
}
```

---

#### `emergency:status_changed`
Broadcasted when emergency status changes.

**Payload**:
```json
{
  "emergencyId": "507f1f77bcf86cd799439011",
  "status": "responding", // active, responding, resolved, cancelled
  "emergency": {
    "id": "507f1f77bcf86cd799439011",
    "status": "responding",
    "updatedAt": "2024-01-15T10:05:00Z"
  },
  "timestamp": "2024-01-15T10:05:00Z"
}
```

---

#### `emergency:resolved`
Broadcasted when emergency is resolved.

**Payload**:
```json
{
  "emergencyId": "507f1f77bcf86cd799439011",
  "resolvedAt": "2024-01-15T10:30:00Z",
  "resolvedBy": "507f1f77bcf86cd799439010",
  "resolutionType": "user_resolved",
  "resolutionNotes": "Help arrived, situation resolved",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

#### `emergency:cancelled`
Broadcasted when emergency is cancelled.

**Payload**:
```json
{
  "emergencyId": "507f1f77bcf86cd799439011",
  "timestamp": "2024-01-15T10:25:00Z"
}
```

---

#### `emergency:ended`
Broadcasted to all helpers when emergency is resolved or cancelled.

**Payload**:
```json
{
  "emergencyId": "507f1f77bcf86cd799439011",
  "status": "resolved", // or "cancelled"
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

#### `location:updated`
Confirmation when location is updated.

**Payload**:
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "message": "Location updated successfully"
}
```

---

#### `error`
Error events sent to client.

**Payload**:
```json
{
  "message": "Error message here"
}
```

---

## 🏠 Room Strategy

### Room Naming Convention

- **Emergency Room**: `emergency:${emergencyId}`
  - Contains: Emergency owner, responding helpers
  - Receives: All emergency-specific updates

- **User Room** (Future): `user:${userId}`
  - Contains: Specific user
  - Receives: User-specific notifications

### Room Lifecycle

1. **Emergency Created**: Room created automatically when helper joins
2. **Helper Joins**: Helper joins `emergency:${emergencyId}` room
3. **Updates Broadcast**: All updates sent to room members
4. **Emergency Resolved**: Room remains active (helpers can still see history)
5. **Cleanup**: Rooms cleaned up when no active members (future enhancement)

---

## 🔄 Integration with REST API

Socket.IO events are automatically emitted when REST API endpoints are called:

| REST Endpoint | Socket Event(s) Emitted |
|--------------|------------------------|
| `POST /api/v1/emergencies` | `emergency:created`, `emergency:nearby` |
| `POST /api/v1/emergencies/:id/respond` | `helper:joined`, `emergency:status_changed` |
| `PUT /api/v1/emergencies/:id/helper-status` | `helper:status_update` |
| `POST /api/v1/emergencies/:id/resolve` | `emergency:resolved`, `emergency:ended` |
| `POST /api/v1/emergencies/:id/cancel` | `emergency:cancelled`, `emergency:ended` |

---

## 🚀 Client Implementation Example

### JavaScript/TypeScript (Browser)

```javascript
import io from 'socket.io-client';

// Connect to emergency namespace
const socket = io('http://localhost:5000/emergencies', {
  auth: {
    token: 'your-jwt-access-token'
  },
  transports: ['websocket', 'polling']
});

// Connection events
socket.on('connect', () => {
  console.log('Connected to emergency namespace');
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
});

// Emergency events
socket.on('emergency:created', (data) => {
  console.log('New emergency:', data.emergency);
  // Show notification to helper
});

socket.on('emergency:nearby', (data) => {
  console.log('Emergency nearby:', data.emergency);
  // Show in helper's nearby emergencies list
});

// Join emergency room
socket.emit('emergency:join', {
  emergencyId: '507f1f77bcf86cd799439011'
});

socket.on('emergency:joined', (data) => {
  console.log('Joined room:', data.room);
});

// Listen for helper updates
socket.on('helper:joined', (data) => {
  console.log('Helper joined:', data.helper);
});

socket.on('helper:status_update', (data) => {
  console.log('Helper status:', data.status);
});

socket.on('emergency:status_changed', (data) => {
  console.log('Status changed:', data.status);
});

socket.on('emergency:resolved', (data) => {
  console.log('Emergency resolved:', data);
});

// Update location
socket.emit('location:update', {
  latitude: 40.7128,
  longitude: -74.0060
});

socket.on('location:updated', (data) => {
  console.log('Location updated:', data);
});

// Error handling
socket.on('error', (error) => {
  console.error('Socket error:', error.message);
});

// Disconnect
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});
```

### React Native Example

```javascript
import io from 'socket.io-client';

const socket = io('http://your-api-url:5000/emergencies', {
  auth: {
    token: userToken
  },
  transports: ['websocket']
});

// Similar event handlers as above
```

---

## 🔒 Security

### Authentication

- JWT tokens required for all connections
- Tokens verified using same logic as REST API
- Invalid/expired tokens result in connection rejection

### Authorization

- Users can only join emergency rooms they have permission for
- Anonymous mode: User identity hidden from helpers
- Privacy: Emergency data filtered based on user role

### Error Handling

- All errors sent to client via `error` event
- Connection errors logged server-side
- Graceful disconnection handling

---

## 📊 Event Flow Examples

### Emergency Creation Flow

```
1. User creates emergency via REST API
   POST /api/v1/emergencies

2. Server emits Socket.IO events:
   - emergency:created (to all helpers)
   - emergency:nearby (to specific nearby helpers)

3. Helpers receive events in real-time
   - Show notification
   - Update nearby emergencies list

4. Helper clicks to respond
   POST /api/v1/emergencies/:id/respond

5. Server emits:
   - helper:joined (to emergency room)
   - emergency:status_changed (if first helper)
```

### Helper Status Update Flow

```
1. Helper updates status via REST API
   PUT /api/v1/emergencies/:id/helper-status

2. Server emits:
   - helper:status_update (to emergency room)

3. Emergency owner and other helpers see update
   - Update UI with helper's status
   - Show ETA, notes, etc.
```

### Emergency Resolution Flow

```
1. User/Helper resolves emergency via REST API
   POST /api/v1/emergencies/:id/resolve

2. Server emits:
   - emergency:resolved (to emergency room)
   - emergency:ended (to all helpers)

3. All parties see resolution
   - Remove from active emergencies
   - Show resolution details
```

---

## 🛠️ Server-Side Components

### Files

1. **`src/sockets/index.js`** - Socket.IO initialization
2. **`src/sockets/socketAuth.js`** - Authentication middleware
3. **`src/sockets/emergencySocket.js`** - Event handlers and emitters

### Functions

- `initializeSocketIO(server)` - Initialize Socket.IO
- `initializeEmergencySockets(io)` - Set up emergency namespace
- `emitEmergencyCreated()` - Emit emergency created event
- `emitHelperJoined()` - Emit helper joined event
- `emitHelperStatusUpdate()` - Emit helper status update
- `emitEmergencyStatusChanged()` - Emit status change
- `emitEmergencyResolved()` - Emit resolution
- `emitEmergencyCancelled()` - Emit cancellation

---

## 🔮 Future Enhancements

1. **Redis Adapter** - Scale Socket.IO across multiple servers
2. **Presence System** - Track online/offline helpers
3. **Private Messaging** - Direct messages between user and helpers
4. **Location Tracking** - Real-time location updates for helpers en route
5. **Push Notifications** - Notify offline helpers via push
6. **Room Persistence** - Store room state in Redis
7. **Rate Limiting** - Prevent socket spam/abuse

---

## 📝 Best Practices

1. **Token Management**: Store JWT token securely (not in localStorage for sensitive apps)
2. **Reconnection**: Handle reconnection logic (Socket.IO does this automatically)
3. **Error Handling**: Always listen for `error` and `connect_error` events
4. **Room Cleanup**: Leave rooms when component unmounts
5. **Event Cleanup**: Remove event listeners on disconnect
6. **Loading States**: Show loading indicators during connection
7. **Offline Handling**: Handle offline scenarios gracefully

---

*Socket.IO integration is production-ready. Real-time emergency broadcasts are fully functional.*

