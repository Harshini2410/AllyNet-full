# AllyNet System Architecture Audit Report

**Date:** 2025-12-27  
**Scope:** Core systems (Auth, SOS, Helpers, Chat, Notifications, Radius)  
**Purpose:** Identify sources of truth, file control, and state duplication/conflicts

---

## 1. AUTHENTICATION SYSTEM

### Source of Truth
- **Primary:** `useAuthStore` (Zustand with persistence)
- **Secondary:** Backend JWT tokens (`/api/v1/auth/me`)
- **Storage:** `localStorage` key `allynet-auth-storage`

### Files That Control It
**Frontend:**
- `AllyNet-front/src/store/useAuthStore.js` - Main auth state store
- `AllyNet-front/src/api/auth.js` - Auth API client (`login`, `signup`, `getMe`)
- `AllyNet-front/src/App.jsx` - Initializes auth on mount (lines 165-190)

**Backend:**
- `AllyNet-back/src/controllers/authController.js` - Auth endpoints
- `AllyNet-back/src/middleware/auth.js` - JWT verification middleware

### State Structure
```javascript
{
  accessToken: null,
  refreshToken: null,
  user: null,
  hasCompletedOnboarding: false
}
```

### Duplicated/Conflicting State
✅ **NO CONFLICTS** - Auth state is single-source:
- Store is persisted to localStorage
- `getMe()` API call refreshes user data on app load
- Store acts as single source of truth

---

## 2. SOS (EMERGENCY CREATION) SYSTEM

### Source of Truth
- **Primary:** `useEmergencyStore` (Zustand, NOT persisted)
- **Secondary:** Backend API (`/api/v1/emergencies`, `GET /api/v1/emergencies/active`)
- **Real-time:** Socket.IO `emergency:created` event

### Files That Control It
**Frontend:**
- `AllyNet-front/src/store/useEmergencyStore.js` - Emergency state (isActive, emergencyId, type, radius, etc.)
- `AllyNet-front/src/features/emergency/SOSOverlay.jsx` - SOS trigger UI (calls `activateEmergency()`)
- `AllyNet-front/src/api/emergency.js` - `createEmergency()`, `getActiveEmergency()` APIs
- `AllyNet-front/src/App.jsx` - Restores active emergency on load (lines 193-260)
- `AllyNet-front/src/hooks/useEmergencySocket.js` - Socket event handlers

**Backend:**
- `AllyNet-back/src/controllers/emergencyController.js` - `createEmergency()` handler
- `AllyNet-back/src/services/emergencyService.js` - Business logic
- `AllyNet-back/src/models/Emergency.js` - Emergency schema
- `AllyNet-back/src/sockets/emergencySocket.js` - Emits `emergency:created`

### State Structure
```javascript
useEmergencyStore: {
  isActive: false,
  status: 'idle',
  emergencyType: null,
  isSilent: false,
  isAnonymous: false,
  radius: 500, // meters (default 0.5km)
  startTime: null,
  emergencyId: null,
  helpers: [],
  helperCount: 0,
  nearbyEmergency: null,
  showEmergencyNotification: false
}
```

### Duplicated/Conflicting State
❌ **MAJOR CONFLICTS:**

1. **Emergency Creation Missing API Call:**
   - `SOSOverlay.jsx` only calls `activateEmergency(selectedType)` (line 31)
   - **NO API call to `emergencyApi.createEmergency()` is made**
   - Store state is set, but backend emergency is never created
   - This is a **critical bug** - UI shows emergency active but backend has no record

2. **Emergency ID Not Set:**
   - `activateEmergency()` sets `isActive: true` but does NOT set `emergencyId`
   - `emergencyId` is only set via `setEmergencyId()` separately
   - Socket events expect `emergencyId` but it may be null initially

3. **Radius State Duplication:**
   - Frontend: `useEmergencyStore.radius` (500-2000 meters, slider in SOSOverlay)
   - Backend: Emergency model does NOT store radius
   - Backend API expects `location` but no `avoidRadiusKm` or `radius` field
   - **Mismatch:** Frontend slider sets radius, but it's never sent to backend
   - User requirement states payload should use `avoidRadiusKm`, but this is not implemented

4. **Emergency State Not Persisted:**
   - `useEmergencyStore` is NOT persisted (unlike `useAuthStore`)
   - On refresh, `isActive` becomes false even if emergency exists
   - `App.jsx` tries to restore via `getActiveEmergency()` but only restores session store, not emergency store properly

5. **Two Emergency Stores:**
   - `useEmergencyStore` - General emergency state (isActive, type, helpers)
   - `useEmergencySessionStore` - Chat-specific state (emergencyId, role, messages)
   - **Conflict:** Both stores can have different `emergencyId` values
   - `useEmergencySessionStore.emergencyId` vs `useEmergencyStore.emergencyId` may diverge

---

## 3. HELPERS SYSTEM

### Source of Truth
- **Primary:** Backend API (`GET /api/v1/emergencies/:id`, `GET /api/v1/emergencies/:id/helpers`)
- **Secondary:** `useEmergencyStore.helpers` array
- **Real-time:** Socket.IO `helper:joined`, `helper:left`, `helper:status_update`

### Files That Control It
**Frontend:**
- `AllyNet-front/src/store/useEmergencyStore.js` - `helpers`, `helperCount`, `addHelper()`, `setHelpers()`, `removeHelper()`
- `AllyNet-front/src/hooks/useEmergencySocket.js` - Handles `helper:joined` event (lines 129-161)
- `AllyNet-front/src/api/emergency.js` - `respondToEmergency()` API

**Backend:**
- `AllyNet-back/src/controllers/emergencyController.js` - `respondToEmergency()`, `updateHelperStatus()`
- `AllyNet-back/src/services/emergencyService.js` - `addRespondingHelper()`, `findNearbyHelpers()`
- `AllyNet-back/src/models/Emergency.js` - `respondingHelpers` array in schema

### State Structure
```javascript
useEmergencyStore: {
  helpers: [], // Array of helper objects
  helperCount: 0
}
```

### Duplicated/Conflicting State
❌ **CONFLICTS:**

1. **Helpers State Not Synced with API:**
   - Store updates via socket events (`helper:joined`)
   - But on refresh, helpers are NOT loaded from API
   - `App.jsx` restore logic doesn't fetch helpers list
   - Store may be empty even if backend has helpers

2. **Helper Count Duplication:**
   - `helperCount` is computed from `helpers.length`
   - But also set separately in `setHelpers()` and `addHelper()`
   - Risk of desync if array is modified without updating count

3. **Helper Data Shape Mismatch:**
   - Socket event payload structure may differ from API response
   - No normalization between socket data and API data

---

## 4. CHAT SYSTEM

### Source of Truth
- **Primary:** Backend API (`GET /api/v1/emergencies/:id/messages`)
- **Secondary:** `useEmergencySessionStore.messages` array
- **Real-time:** Socket.IO `emergency:message`, `emergency:message:deleted`

### Files That Control It
**Frontend:**
- `AllyNet-front/src/store/useEmergencySessionStore.js` - Messages state, `loadMessages()`, `addMessage()`, `removeMessage()`
- `AllyNet-front/src/features/emergency/EmergencyChat.jsx` - Chat UI, sends messages via API
- `AllyNet-front/src/api/emergency.js` - `getMessages()`, `sendMessage()`, `deleteMessage()` APIs
- `AllyNet-front/src/hooks/useEmergencySocket.js` - Handles `emergency:message` event (lines 217-255)
- `AllyNet-front/src/App.jsx` - Restores messages on load (lines 233-240)

**Backend:**
- `AllyNet-back/src/controllers/messageController.js` - Message endpoints
- `AllyNet-back/src/services/messageService.js` - Message business logic
- `AllyNet-back/src/models/Message.js` - Message schema

### State Structure
```javascript
useEmergencySessionStore: {
  emergencyId: null,
  role: null, // 'creator' | 'helper'
  participants: [],
  messages: [],
  chatOpen: false,
  chatAvailable: false,
  loading: false,
  error: null,
  isResolved: false
}
```

### Duplicated/Conflicting State
⚠️ **PARTIAL CONFLICTS:**

1. **Messages Duplication Prevention:**
   - ✅ Good: `addMessage()` checks for duplicates by `_id` (line 42)
   - ✅ Good: Socket events are "enhancement only" - API is source of truth

2. **Session Store EmergencyId vs Emergency Store EmergencyId:**
   - `useEmergencySessionStore.emergencyId` (for chat)
   - `useEmergencyStore.emergencyId` (for general emergency state)
   - **Risk:** These can diverge if not properly synced
   - `App.jsx` restore logic sets session store emergencyId but may not sync emergency store

3. **Chat Available Flag:**
   - Set to `true` when session is initialized
   - But not synced with actual emergency status from backend
   - May be true even if emergency is resolved

4. **Message Alignment Logic:**
   - Uses `message.isMine` flag from backend (good)
   - But also computes `isMine` in socket handler (line 238) - redundant but safe

---

## 5. NOTIFICATIONS SYSTEM

### Source of Truth
- **Primary:** Socket.IO `emergency:created` event (unconditional broadcast)
- **Secondary:** `useEmergencyStore.nearbyEmergency`, `showEmergencyNotification`

### Files That Control It
**Frontend:**
- `AllyNet-front/src/store/useEmergencyStore.js` - `nearbyEmergency`, `showEmergencyNotification`, `showNearbyEmergency()`, `dismissEmergencyNotification()`
- `AllyNet-front/src/hooks/useEmergencySocket.js` - Handles `emergency:created` event (lines 65-99)
- `AllyNet-front/src/components/EmergencyNotification.jsx` - Notification UI component

**Backend:**
- `AllyNet-back/src/controllers/emergencyController.js` - Emits `emergency:created` on create (line 51)
- `AllyNet-back/src/sockets/emergencySocket.js` - `emitEmergencyCreated()` function

### State Structure
```javascript
useEmergencyStore: {
  nearbyEmergency: null, // Emergency object
  showEmergencyNotification: false
}
```

### Duplicated/Conflicting State
⚠️ **PARTIAL CONFLICTS:**

1. **Client-Side Filtering:**
   - Backend broadcasts `emergency:created` unconditionally to entire namespace
   - Frontend filters client-side (ignores self-created, applies distance logic)
   - **Risk:** All clients receive all events, filtering happens after receipt
   - Could be optimized but not a conflict per se

2. **Notification State Not Persisted:**
   - `nearbyEmergency` is cleared on refresh
   - Notification won't reappear after page reload
   - This is expected behavior (notifications are ephemeral)

3. **Notification vs Active Emergency:**
   - `nearbyEmergency` is for viewing OTHER people's emergencies
   - `isActive` is for YOUR emergency
   - These are separate concerns, no conflict

---

## 6. RADIUS SYSTEM

### Source of Truth
- **Primary:** `useEmergencyStore.radius` (500-2000 meters, default 500)
- **Secondary:** ❌ **NONE** - Radius is NOT stored in backend

### Files That Control It
**Frontend:**
- `AllyNet-front/src/store/useEmergencyStore.js` - `radius: 500`, `setRadius()`
- `AllyNet-front/src/features/emergency/SOSOverlay.jsx` - Radius slider (lines 109-125, labeled "Avoidance Radius", 0.5km-2km)

**Backend:**
- ❌ **NONE** - Backend Emergency model does NOT have radius/avoidRadiusKm field
- Backend `emergencyService.createEmergency()` does NOT accept radius parameter
- Backend `findNearbyHelpers()` accepts `radiusMeters` parameter but it's from query string, not emergency model

### State Structure
```javascript
useEmergencyStore: {
  radius: 500 // meters (0.5km default)
}
```

### Duplicated/Conflicting State
❌ **CRITICAL CONFLICT:**

1. **Radius Never Sent to Backend:**
   - Frontend slider allows 500-2000 meters (0.5km-2km)
   - User sets radius in `SOSOverlay.jsx`
   - **But `emergencyApi.createEmergency()` is never called** (see SOS system)
   - Even if it were called, backend API doesn't accept `radius` or `avoidRadiusKm` parameter
   - **User requirement states payload should use `avoidRadiusKm`** - NOT IMPLEMENTED

2. **Radius Purpose Unclear:**
   - Label says "Avoidance Radius" (what to avoid?)
   - But it's used for helper discovery distance?
   - Backend `findNearbyHelpers()` uses query param radius, not emergency's stored radius

3. **Default Radius Mismatch:**
   - Frontend default: 500 meters (0.5km)
   - Backend `findNearbyHelpers()` default: 5000 meters (5km)
   - These are different values for different purposes (confusing)

---

## SUMMARY OF CRITICAL ISSUES

### 🔴 CRITICAL BUGS:

1. **SOS Creation Never Calls API:**
   - `SOSOverlay.jsx` only updates store, never creates backend emergency
   - UI shows emergency active but backend has no record

2. **Radius Not Implemented:**
   - Frontend has radius slider but value is never sent to backend
   - User requirement for `avoidRadiusKm` in payload is not met

3. **Emergency State Not Restored:**
   - `useEmergencyStore` not persisted
   - `App.jsx` restore logic doesn't fully restore emergency store state
   - Only session store is restored, not general emergency state

### ⚠️ STATE DUPLICATION ISSUES:

1. **Two Emergency Stores:**
   - `useEmergencyStore.emergencyId` vs `useEmergencySessionStore.emergencyId`
   - Can diverge if not properly synced

2. **Helpers Not Loaded on Restore:**
   - Socket events populate helpers, but refresh loses this data
   - No API call to restore helpers list on page load

3. **Emergency ID Not Set on Creation:**
   - `activateEmergency()` doesn't set `emergencyId`
   - Must be set separately, creating race conditions

### ✅ GOOD PATTERNS:

1. **API-First Chat:**
   - Messages loaded from API, sockets are enhancement only
   - Duplicate prevention in `addMessage()`

2. **Auth State Single Source:**
   - Well-architected, no conflicts

3. **Socket Events as Enhancement:**
   - Comments indicate sockets are for real-time enhancement, not source of truth

---

## RECOMMENDATIONS (For Future Reference)

1. **Fix SOS Creation:**
   - Add API call to `SOSOverlay.jsx` handleTrigger
   - Set `emergencyId` from API response
   - Sync both stores

2. **Implement Radius in Backend:**
   - Add `avoidRadiusKm` field to Emergency model
   - Accept `avoidRadiusKm` in createEmergency API
   - Store radius with emergency

3. **Persist Emergency Store:**
   - Consider persisting `useEmergencyStore` or always restore from API
   - Ensure both stores are synced

4. **Restore Helpers on Load:**
   - Fetch helpers list in `App.jsx` restore logic
   - Populate `useEmergencyStore.helpers` from API

5. **Unify Emergency ID:**
   - Ensure both stores always have same `emergencyId`
   - Consider single source of truth (e.g., always use session store's emergencyId)

---

**END OF AUDIT**

