import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // Auth state
      accessToken: null,
      refreshToken: null,
      user: null,
      hasCompletedOnboarding: false,
      
      // Note: Use `Boolean(accessToken)` directly in components
      // Auth depends ONLY on token presence
      
      // Actions
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setUser: (user) => set({ user }),
      login: (accessToken, refreshToken, user) => set({ 
        accessToken, 
        refreshToken, 
        user,
        hasCompletedOnboarding: true // Auto-complete onboarding on login
      }),
      logout: () => {
        // Clear all auth state
        set({ 
          accessToken: null, 
          refreshToken: null, 
          user: null,
          hasCompletedOnboarding: false 
        });
        // Clear tokens from localStorage explicitly
        localStorage.removeItem('allynet-auth-storage');
        
        // Clear emergency state on logout (safety: prevent stale state across sessions)
        // Use dynamic import to avoid circular dependencies
        import('./useEmergencyStore').then(({ useEmergencyStore }) => {
          useEmergencyStore.getState().clearEmergency();
        }).catch(() => {
          // Ignore if store not available (e.g., during SSR or initialization)
        });
      },
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
    }),
    {
      name: 'allynet-auth-storage',
    }
  )
);
