import { create } from 'zustand';

/**
 * SIMPLIFIED EMERGENCY STORE - API-FIRST
 * Store is NOT source of truth - only mirrors backend state
 * All state comes from API responses via updateFromEmergency()
 */
export const useEmergencyStore = create((set) => ({
  // REQUIRED minimal state (mirrors backend)
  isActive: false,
  emergencyId: null,
  status: 'idle', // 'idle' | 'active' | 'resolved'
  emergencyType: null,
  radius: 500, // in meters (default 0.5km) - for UI slider only
  isAnonymous: false, // Anonymous mode flag (for chat privacy)
  
  // API-FIRST: Update store from API response (backend is source of truth)
  // STRICT VALIDATION: Only accepts 'active' or 'responding' status
  updateFromEmergency: (emergency) => set((state) => {
    if (!emergency) {
      // No emergency = clear state
      return {
        isActive: false,
        emergencyId: null,
        status: 'idle',
        emergencyType: null
      };
    }
    
    // DEFENSIVE VALIDATION: Only accept emergencies with 'active' or 'responding' status
    // Reject resolved, cancelled, or any other status to prevent stale emergencies
    const emergencyStatus = emergency.status;
    const isValidActiveStatus = emergencyStatus === 'active' || emergencyStatus === 'responding';
    
    if (!isValidActiveStatus) {
      // Emergency exists but status is not active/responding - clear state
      // This prevents resolved/cancelled emergencies from activating the UI
      return {
        isActive: false,
        emergencyId: null,
        status: 'idle',
        emergencyType: null
      };
    }
    
    const emergencyId = emergency._id || emergency.id;
    
    return {
      emergencyId: emergencyId,
      isActive: true, // Only set true if we passed validation above
      status: emergencyStatus,
      emergencyType: emergency.type || null,
      radius: emergency.avoidRadiusKm ? emergency.avoidRadiusKm * 1000 : state.radius, // Convert km to meters for UI
      isAnonymous: emergency.anonymousMode === true // Store anonymous mode flag
    };
  }),
  
  // Clear emergency state (after resolve)
  clearEmergency: () => set({
    isActive: false,
    emergencyId: null,
    status: 'idle',
    emergencyType: null
  }),
  
  // UI-only: Set radius for slider (not sent to backend until SOS is created)
  setRadius: (radius) => set({ radius }),
  
  // Helper notifications (API-first with socket enhancement)
  nearbyEmergency: null, // Emergency object (from API or socket)
  showEmergencyNotification: false, // Whether to show notification UI
  
  // Helper state (for helpers who have accepted)
  helperEmergencyId: null, // Emergency ID where user is a helper
  isHelper: false, // Whether user is currently helping
  
  // Show notification (helper side only - can be triggered by API or socket)
  // Note: Callers must validate emergency.status === 'active' and user !== current user
  showNearbyEmergency: (emergency) => set((state) => {
    // STRICT VALIDATION: Only show if emergency exists and is active
    if (!emergency) {
      return state; // No emergency - don't show
    }
    
    // VALIDATION 1: Status must be 'active' or 'responding' (allows multiple helpers)
    if (emergency.status !== 'active' && emergency.status !== 'responding') {
      return state; // Not active or responding - don't show
    }
    
    // VALIDATION 2: Emergency must have an ID
    const emergencyId = emergency._id || emergency.id;
    if (!emergencyId) {
      return state; // No ID - don't show
    }
    
    // VALIDATION 3: Don't show if user is already helping this emergency
    const helperEmergencyId = state.helperEmergencyId;
    if (helperEmergencyId && emergencyId && helperEmergencyId.toString() === emergencyId.toString()) {
      return state; // User is already helping this emergency - don't show notification
    }
    
    // All validations passed - show notification
    return {
      nearbyEmergency: emergency, 
      showEmergencyNotification: true 
    };
  }),
  
  // Dismiss notification
  dismissEmergencyNotification: () => set({ 
    showEmergencyNotification: false,
    nearbyEmergency: null 
  }),
  
  // Clear all notifications
  clearNotifications: () => set({
    showEmergencyNotification: false,
    nearbyEmergency: null
  }),
  
  // Set helper state (when user accepts emergency)
  setHelperEmergency: (emergencyId) => set({
    helperEmergencyId: emergencyId,
    isHelper: true
  }),
  
  // Clear helper state
  clearHelperEmergency: () => set({
    helperEmergencyId: null,
    isHelper: false
  }),

  // Emergency ended notification (for helpers)
  emergencyEndedNotification: null, // { emergencyId, status, message }
  setEmergencyEndedNotification: (notification) => set({ emergencyEndedNotification: notification }),
  clearEmergencyEndedNotification: () => set({ emergencyEndedNotification: null }),
}));


