# Frontend Socket.IO Integration Guide

## Summary

This integration connects the AllyNet frontend SOS system to the backend Socket.IO real-time system.

## Files Created

1. **`src/api/socket.js`**
   - Reusable Socket.IO client instance
   - Handles connection, reconnection, authentication
   - Exports: `getSocket()`, `disconnectSocket()`, `isSocketConnected()`

2. **`src/hooks/useEmergencySocket.js`**
   - React hook for Socket.IO lifecycle management
   - Handles all Socket.IO events
   - Updates Zustand store automatically
   - Manages room joining/leaving
   - Handles location updates

3. **Zustand Store Extensions** (see `ZUSTAND_STORE_EXTENSIONS.md`)
   - Required store actions for Socket.IO integration

## Installation

```bash
npm install socket.io-client
```

## Integration Steps

### 1. Copy Files to Frontend Project

Copy these files to your frontend project:
- `src/api/socket.js`
- `src/hooks/useEmergencySocket.js`

### 2. Update Zustand Store

Add the actions from `ZUSTAND_STORE_EXTENSIONS.md` to your `useEmergencyStore`.

### 3. Use Hook in SOS Components

```javascript
import { useEmergencySocket } from '../hooks/useEmergencySocket';
import { useEmergencyStore } from '../stores/useEmergencyStore';
import { useAuthStore } from '../stores/useAuthStore';

function YourSOSComponent() {
  const emergencyStore = useEmergencyStore();
  const authStore = useAuthStore();
  const emergency = emergencyStore.emergency;
  
  // Wire up Socket.IO
  useEmergencySocket({
    accessToken: authStore.accessToken,
    emergencyStore,
    authStore,
    activeEmergencyId: emergency?.id || emergency?._id || null,
    isHelper: authStore.user?.helper || false
  });
  
  // ... rest of component
}
```

### 4. Use Hook in Helper Components

For helpers viewing nearby emergencies:

```javascript
function HelperDashboard() {
  const emergencyStore = useEmergencyStore();
  const authStore = useAuthStore();
  
  useEmergencySocket({
    accessToken: authStore.accessToken,
    emergencyStore,
    authStore,
    activeEmergencyId: null, // No active emergency for helper
    isHelper: true,
    onEmergencyCreated: (emergency) => {
      // Show notification, update UI, etc.
      console.log('New emergency nearby:', emergency);
    }
  });
  
  // ... rest of component
}
```

## Events Wired

### Server → Client Events

| Event | Action | Store Update |
|-------|--------|--------------|
| `emergency:created` | New emergency broadcast | `addNearbyEmergency()` |
| `emergency:nearby` | Emergency near helper | `addNearbyEmergency()` |
| `helper:joined` | Helper responded | `addHelper()`, `incrementHelpersCount()` |
| `helper:status_update` | Helper status changed | `updateHelperStatus()` |
| `emergency:status_changed` | Emergency status changed | `setEmergencyStatus()` |
| `emergency:resolved` | Emergency resolved | `setEmergencyStatus('resolved')`, `setResolvedAt()` |
| `emergency:cancelled` | Emergency cancelled | `setEmergencyStatus('cancelled')`, `resetEmergency()` |
| `emergency:ended` | Emergency ended | `resetEmergency()` |

### Client → Server Events

| Event | When Emitted |
|-------|--------------|
| `emergency:join` | When `activeEmergencyId` is set |
| `emergency:leave` | When emergency ends or component unmounts |
| `location:update` | Every 30 seconds when SOS is active |

## Key Features

✅ **Automatic Connection**: Connects when user is authenticated  
✅ **Room Management**: Automatically joins/leaves emergency rooms  
✅ **Store Updates**: All events update Zustand store  
✅ **Location Updates**: Periodic location updates (throttled)  
✅ **Cleanup**: Proper cleanup on unmount/logout  
✅ **Error Handling**: Comprehensive error handling  
✅ **Reconnection**: Automatic reconnection on disconnect  

## Assumptions Made

1. **Auth Store Structure**:
   - `authStore.accessToken` - JWT access token
   - `authStore.user` - User object with `helper` property
   - `authStore.user.location` - User location (optional)

2. **Emergency Store Structure**:
   - `emergencyStore.emergency` - Current emergency object
   - `emergencyStore.helpers` - Array of helpers
   - `emergencyStore.helpersCount` - Number of helpers
   - `emergencyStore.status` - Emergency status
   - `emergencyStore.location` - Emergency location (optional)
   - `emergencyStore.nearbyEmergencies` - Array for helpers (optional)

3. **Emergency ID Format**:
   - Supports both `emergency.id` and `emergency._id` formats
   - Handles MongoDB ObjectId strings

4. **Component Lifecycle**:
   - Hook is used in components that need real-time updates
   - Components handle their own UI updates based on store changes

## Testing Checklist

- [ ] Socket connects when user is authenticated
- [ ] Socket disconnects on logout
- [ ] Emergency created broadcasts to helpers
- [ ] Helper joined updates creator's UI
- [ ] Status updates propagate in real-time
- [ ] Emergency resolved updates all clients
- [ ] Room joining/leaving works correctly
- [ ] Location updates work (if enabled)
- [ ] No memory leaks on component unmount
- [ ] Reconnection works after network issues

## Troubleshooting

### Socket not connecting
- Check JWT token is valid
- Verify backend is running on `http://localhost:5000`
- Check browser console for connection errors

### Events not received
- Verify emergency ID matches between client and server
- Check room joining is successful
- Verify store actions are properly defined

### Memory leaks
- Ensure hook cleanup runs on unmount
- Check all event listeners are removed
- Verify intervals are cleared

## Next Steps

1. Test with real backend
2. Add error boundaries for socket errors
3. Add loading states during connection
4. Implement retry logic for failed operations
5. Add analytics for socket events (optional)

