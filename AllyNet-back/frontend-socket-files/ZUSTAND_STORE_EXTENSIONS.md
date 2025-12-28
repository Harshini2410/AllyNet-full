# Zustand Store Extensions

## Required Store Actions

Add these actions to your `useEmergencyStore`:

```javascript
// In your emergency store (e.g., src/stores/useEmergencyStore.js)

const useEmergencyStore = create((set, get) => ({
  // ... existing state ...
  
  // Existing state (assumed):
  // emergency: null,
  // helpers: [],
  // helpersCount: 0,
  // status: null,
  // location: null,
  
  // ============================================
  // NEW ACTIONS FOR SOCKET.IO INTEGRATION
  // ============================================
  
  /**
   * Add helper to emergency
   */
  addHelper: (helper) => set((state) => ({
    helpers: [...(state.helpers || []), helper],
    helpersCount: (state.helpersCount || 0) + 1
  })),
  
  /**
   * Set all helpers at once
   */
  setHelpers: (helpers) => set({ helpers: helpers || [] }),
  
  /**
   * Update helper status
   */
  updateHelperStatus: (helperId, status, notes = null) => set((state) => ({
    helpers: (state.helpers || []).map(helper => 
      helper.id === helperId || helper._id === helperId
        ? { ...helper, status, notes, updatedAt: new Date() }
        : helper
    )
  })),
  
  /**
   * Set emergency status
   */
  setEmergencyStatus: (status) => set((state) => ({
    status,
    emergency: state.emergency ? { ...state.emergency, status } : null
  })),
  
  /**
   * Set resolved timestamp
   */
  setResolvedAt: (resolvedAt) => set((state) => ({
    emergency: state.emergency 
      ? { ...state.emergency, resolvedAt, status: 'resolved' }
      : null,
    status: 'resolved'
  })),
  
  /**
   * Increment helpers count
   */
  incrementHelpersCount: () => set((state) => ({
    helpersCount: (state.helpersCount || 0) + 1
  })),
  
  /**
   * Add nearby emergency (for helpers viewing nearby emergencies)
   */
  addNearbyEmergency: (emergency) => set((state) => {
    const nearbyEmergencies = state.nearbyEmergencies || [];
    // Check if already exists
    const exists = nearbyEmergencies.some(e => e.id === emergency.id || e._id === emergency.id);
    if (exists) {
      return {
        nearbyEmergencies: nearbyEmergencies.map(e => 
          (e.id === emergency.id || e._id === emergency.id) ? emergency : e
        )
      };
    }
    return {
      nearbyEmergencies: [...nearbyEmergencies, emergency]
    };
  }),
  
  /**
   * Reset emergency state (when resolved/cancelled)
   */
  resetEmergency: () => set({
    emergency: null,
    helpers: [],
    helpersCount: 0,
    status: null,
    // Keep location if needed for other purposes
  }),
}));
```

## Usage in Components

```javascript
// Example: In your SOS component
import { useEmergencySocket } from '../hooks/useEmergencySocket';
import { useEmergencyStore } from '../stores/useEmergencyStore';
import { useAuthStore } from '../stores/useAuthStore';

function SOSComponent() {
  const emergencyStore = useEmergencyStore();
  const authStore = useAuthStore();
  const { emergency, status } = emergencyStore;
  
  // Use the socket hook
  useEmergencySocket({
    accessToken: authStore.accessToken,
    emergencyStore: emergencyStore,
    authStore: authStore,
    activeEmergencyId: emergency?.id || emergency?._id || null,
    isHelper: authStore.user?.helper || false,
    onEmergencyResolved: (data) => {
      // Optional: Show success message, navigate, etc.
      console.log('Emergency resolved:', data);
    },
    onEmergencyCancelled: (data) => {
      // Optional: Handle cancellation
      console.log('Emergency cancelled:', data);
    }
  });
  
  // ... rest of component
}
```

