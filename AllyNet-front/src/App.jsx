import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import AppShell from './layouts/AppShell';
import Card from './components/Card';
import Button from './components/Button';
import { Shield, Heart, MapPin, Info, ArrowRight, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import SOSOverlay from './features/emergency/SOSOverlay';
import CreateHelpRequest from './features/help/CreateHelpRequest';
import Onboarding from './features/auth/Onboarding';
import LoginPage from './features/auth/LoginPage';
import SignupPage from './features/auth/SignupPage';
import { useAuthStore } from './store/useAuthStore';
import { useThemeStore } from './store/useThemeStore';
import ProtectedRoute from './components/ProtectedRoute';
import { api } from './api/auth';
import { useEmergencySocket } from "./hooks/useEmergencySocket";
import EmergencyNotification from './components/EmergencyNotification';
import EmergencyEndedNotification from './components/EmergencyEndedNotification';
import EmergencyDetails from './features/emergency/EmergencyDetails';
import HelpRequestsPage from './features/help/HelpRequestsPage';
import NearbyAdsPreview from './components/NearbyAdsPreview';
import AdDetailView from './features/ads/AdDetailView';
import EmergencyHistory from './features/profile/EmergencyHistory';
import SafetySettings from './features/profile/SafetySettings';
import HelpCenter from './features/profile/HelpCenter';
import AboutAllyNet from './features/about/AboutAllyNet';



function HomePage() {
  const navigate = useNavigate();
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  
  // Derive name from user profile
  const displayName = user?.profile?.firstName || user?.email?.split('@')[0] || 'there';

  return (
    <AppShell>
      <SOSOverlay isOpen={isSOSOpen} onClose={() => setIsSOSOpen(false)} />
      <CreateHelpRequest isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      
      <div className="space-y-6 pt-4">
        {/* Welcome Section */}
        <section>
          <h2 className="text-2xl mb-1 text-charcoal-500 dark:text-sand-50">Hello, {displayName}</h2>
          <p className="text-charcoal-300 dark:text-sand-400 text-sm">Everything in your area seems safe today.</p>
        </section>

        {/* SOS Card - High Priority */}
        <Card className="bg-gradient-to-br from-sage-50 to-white dark:from-charcoal-800 dark:to-charcoal-800 border-sage-100 dark:border-charcoal-700">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-sage-100 dark:bg-sage-900/40 rounded-2xl text-sage-600 dark:text-sage-400">
              <Shield size={24} />
            </div>
            <span className="text-[10px] font-bold text-sage-600 dark:text-sage-400 uppercase tracking-widest bg-sage-50 dark:bg-sage-900/20 px-2 py-1 rounded-full">Active Protection</span>
          </div>
          <h3 className="text-lg mb-2 text-charcoal-500 dark:text-sand-50">Emergency SOS</h3>
          <p className="text-sm text-charcoal-300 dark:text-sand-400 mb-6 leading-relaxed">
            Instantly notify local helpers and emergency services of your location.
          </p>
          <Button 
            variant="alert" 
            className="w-full py-4 text-lg"
            onClick={() => setIsSOSOpen(true)}
          >
            Trigger SOS
          </Button>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Card 
            className="p-4 flex flex-col gap-3 hover:bg-white dark:hover:bg-charcoal-700 transition-colors cursor-pointer group"
            onClick={() => setIsHelpOpen(true)}
          >
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 w-fit rounded-xl group-hover:scale-110 transition-transform">
              <Heart size={20} />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-charcoal-500 dark:text-sand-50">Ask for Help</h4>
              <p className="text-[11px] text-charcoal-300 dark:text-sand-400">Non-urgent assistance</p>
            </div>
          </Card>

          <Card 
            className="p-4 flex flex-col gap-3 hover:bg-white dark:hover:bg-charcoal-700 transition-colors cursor-pointer group"
            onClick={() => navigate('/help-requests')}
          >
            <div className="p-2 bg-sage-50 dark:bg-sage-900/20 text-sage-600 dark:text-sage-400 w-fit rounded-xl group-hover:scale-110 transition-transform">
              <MessageSquare size={20} />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-charcoal-500 dark:text-sand-50">My Requests</h4>
              <p className="text-[11px] text-charcoal-300 dark:text-sand-400">View your requests</p>
            </div>
          </Card>
        </div>

        {/* Nearby Ads Preview */}
        <NearbyAdsPreview />

        {/* Refined About AllyNet Section */}
        <section className="pt-8 pb-12">
          <div className="p-6 bg-sand-200/50 dark:bg-charcoal-800/50 rounded-[2.5rem] border border-sand-200 dark:border-charcoal-700">
            <div className="flex items-center gap-2 mb-4 text-sage-600 dark:text-sage-400">
              <Info size={18} />
              <h3 className="text-xs font-bold uppercase tracking-widest">About AllyNet</h3>
            </div>
            <p className="text-xs text-charcoal-300 dark:text-sand-400 leading-relaxed mb-4">
              AllyNet is a safety-first network built on mutual trust. We combine real-time emergency response with daily community assistance to ensure no one in our neighborhood feels alone.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-bold text-charcoal-500 dark:text-sand-50 uppercase tracking-tight">
                <Shield size={12} className="text-sage-500" />
                <span>Verified community members</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-charcoal-500 dark:text-sand-50 uppercase tracking-tight">
                <Heart size={12} className="text-amber-500" />
                <span>Peer-to-peer help marketplace</span>
              </div>
            </div>
            <button 
              onClick={() => navigate('/about')}
              className="mt-6 flex items-center gap-2 text-xs font-bold text-sage-600 dark:text-sage-400 hover:text-sage-700 dark:hover:text-sage-300 transition-colors"
            >
              Learn more about our mission
              <ArrowRight size={14} />
            </button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}



function App() {
  const { 
    accessToken, 
    hasCompletedOnboarding, 
    completeOnboarding, 
    setUser
  } = useAuthStore();
  const theme = useThemeStore((state) => state.theme);

  // Socket connection for helper notifications only (enhancement only, not source of truth)
  useEmergencySocket();

  // Initialize theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Initialize auth: fetch user if token exists
  useEffect(() => {
    const initializeAuth = async () => {
      const state = useAuthStore.getState();
      if (state.accessToken && !state.user) {
        try {
          const response = await api.getMe();
          // Extract user from response.data.user
          const user = response?.data?.user;
          if (user) {
            setUser(user);
          } else {
            // Invalid response, clear auth state
            state.logout();
          }
        } catch (error) {
          // Token invalid, clear auth state
          state.logout();
        }
      } else if (!state.accessToken && state.user) {
        // No token but user exists - clear user
        setUser(null);
      }
    };

    initializeAuth();
  }, [accessToken, setUser]);

  // Restore emergency state and helper notifications from API on app load (API-FIRST)
  // STRICT VALIDATION: Only restores if emergency status is 'active' or 'responding'
  useEffect(() => {
    const restoreEmergencyAndNotifications = async () => {
      const authState = useAuthStore.getState();
      if (!authState.accessToken || !authState.user) {
        // Not authenticated - clear emergency state and notifications
        const { useEmergencyStore } = await import('./store/useEmergencyStore');
        const { useEmergencySessionStore } = await import('./store/useEmergencySessionStore');
        useEmergencyStore.getState().clearEmergency();
        useEmergencyStore.getState().clearHelperEmergency();
        useEmergencyStore.getState().clearNotifications();
        useEmergencySessionStore.getState().clearSession();
        return;
      }

      try {
        const { emergencyApi } = await import('./api/emergency');
        const { useEmergencyStore } = await import('./store/useEmergencyStore');
        const emergencyStore = useEmergencyStore.getState();
        
        // 1. Restore user's active emergency (if they created one)
        const activeResponse = await emergencyApi.getActiveEmergency();
        
        if (activeResponse?.success && activeResponse?.data?.emergency) {
          const emergency = activeResponse.data.emergency;
          const emergencyStatus = emergency.status;
          
          // Only restore if status is 'active' or 'responding'
          if (emergencyStatus === 'active' || emergencyStatus === 'responding') {
            emergencyStore.updateFromEmergency(emergency);
            
            // Initialize chat session for creator (API-first)
            const { useEmergencySessionStore } = await import('./store/useEmergencySessionStore');
            const emergencyId = emergency._id || emergency.id;
            const sessionStore = useEmergencySessionStore.getState();
            sessionStore.initializeSession(emergencyId, 'creator');
            sessionStore.setChatAvailable(true);
            // Restore chat open state (creator should have chat access)
            // Note: chatOpen defaults to false, creator can open via button
          } else {
            emergencyStore.clearEmergency();
          }
        } else {
          emergencyStore.clearEmergency();
        }
        
        // 2. Restore helper state (if user is helping an emergency)
        const helperResponse = await emergencyApi.getHelperActiveEmergency();
        
        if (helperResponse?.success && helperResponse?.data?.emergency) {
          const helperEmergency = helperResponse.data.emergency;
          
          // Only restore if status is 'active' or 'responding'
          if (helperEmergency.status === 'active' || helperEmergency.status === 'responding') {
            const helperEmergencyId = helperEmergency._id || helperEmergency.id;
            emergencyStore.setHelperEmergency(helperEmergencyId);
            
            // Initialize chat session for helper
            const { useEmergencySessionStore } = await import('./store/useEmergencySessionStore');
            useEmergencySessionStore.getState().initializeSession(helperEmergencyId, 'helper');
            useEmergencySessionStore.getState().setChatAvailable(true);
          } else {
            emergencyStore.clearHelperEmergency();
          }
        } else {
          emergencyStore.clearHelperEmergency();
        }
        
        // 3. Restore helper notifications (pending emergencies for helpers)
        // CRITICAL: Only show notifications if:
        // - User is NOT the creator of any active emergency
        // - There are active emergencies the user hasn't accepted
        // - User is NOT already helping any emergency
        
        // ALWAYS clear notifications first - we'll only show if we find valid emergencies
        emergencyStore.clearNotifications();
        
        // First, check if user is a creator of an active emergency - if so, NEVER show notifications
        const isCreator = activeResponse?.success && activeResponse?.data?.emergency && 
          (activeResponse.data.emergency.status === 'active' || activeResponse.data.emergency.status === 'responding');
        
        if (isCreator) {
          // User has an active emergency (they are the creator) - notifications already cleared, exit
          return;
        }
        
        // User is not a creator - check for pending emergencies
        const pendingResponse = await emergencyApi.getPendingEmergenciesForHelper();
        
        // If no response or not an array, notifications already cleared, exit
        if (!pendingResponse?.success || !Array.isArray(pendingResponse?.data)) {
          return;
        }
        
        const pendingEmergencies = pendingResponse.data;
        
        // If array is empty, notifications already cleared, exit
        if (pendingEmergencies.length === 0) {
          return;
        }
        
        const currentUserId = authState.user?._id?.toString();
        
        // STRICT VALIDATION: Re-validate before showing notification
        const validEmergencies = pendingEmergencies.filter(emergency => {
          // VALIDATION 1: Emergency must exist and have required fields
          if (!emergency || (!emergency._id && !emergency.id)) {
            return false;
          }
          
          // VALIDATION 2: Status must be 'active' or 'responding' (allows multiple helpers)
          if (emergency.status !== 'active' && emergency.status !== 'responding') {
            return false;
          }
          
          // VALIDATION 3: User must NOT be the creator (backend should filter, but double-check)
          const emergencyUserId = emergency.user?._id?.toString() || emergency.user?.toString() || emergency.user;
          if (currentUserId && emergencyUserId && currentUserId.toString() === emergencyUserId.toString()) {
            return false; // Reject emergencies created by current user
          }
          
          // VALIDATION 4: User must NOT already be helping this emergency (check helperEmergencyId)
          const helperEmergencyId = emergencyStore.helperEmergencyId;
          const emergencyId = emergency._id || emergency.id;
          if (helperEmergencyId && emergencyId && helperEmergencyId.toString() === emergencyId.toString()) {
            return false; // Reject if user is already helping this emergency
          }
          
          // VALIDATION 5: User must NOT be in respondingHelpers array (double-check)
          if (emergency.respondingHelpers && Array.isArray(emergency.respondingHelpers)) {
            const isAlreadyHelper = emergency.respondingHelpers.some(helperData => {
              const helperId = helperData.helper?._id?.toString() || helperData.helper?.toString() || helperData.helper;
              return currentUserId && helperId && currentUserId.toString() === helperId.toString();
            });
            if (isAlreadyHelper) {
              return false; // Reject if user is already in respondingHelpers
            }
          }
          
          return true; // Passed all validations
        });
        
        // Show notification ONLY if there are valid emergencies after all validations
        if (validEmergencies.length > 0) {
          const mostRecent = validEmergencies[0]; // Already sorted by createdAt desc
          emergencyStore.showNearbyEmergency(mostRecent);
        }
        // If no valid emergencies, notifications already cleared above
      } catch (error) {
        // Log but don't fail app load
        console.warn('Failed to restore emergency/notifications:', error?.message || error);
        const { useEmergencyStore } = await import('./store/useEmergencyStore');
        const { useEmergencySessionStore } = await import('./store/useEmergencySessionStore');
        useEmergencyStore.getState().clearEmergency();
        useEmergencyStore.getState().clearHelperEmergency();
        useEmergencyStore.getState().clearNotifications();
        useEmergencySessionStore.getState().clearSession();
      }
    };

    // Only restore if user is authenticated
    const authState = useAuthStore.getState();
    if (authState.accessToken && authState.user) {
      restoreEmergencyAndNotifications();
    } else {
      // Not authenticated - clear emergency state and notifications
      Promise.all([
        import('./store/useEmergencyStore'),
        import('./store/useEmergencySessionStore')
      ]).then(([{ useEmergencyStore }, { useEmergencySessionStore }]) => {
        useEmergencyStore.getState().clearEmergency();
        useEmergencyStore.getState().clearHelperEmergency();
        useEmergencyStore.getState().clearNotifications();
        useEmergencySessionStore.getState().clearSession();
      }).catch(() => {
        // Ignore if store not available
      });
    }
  }, [accessToken]);

  return (
    <BrowserRouter>
      {/* Helper notifications (enhancement only - shows when emergency:created event received) */}
      <EmergencyNotification />
      <EmergencyEndedNotification />
      <Routes>
        {/* Public auth routes */}
        <Route 
          path="/auth/login" 
          element={
            accessToken ? <Navigate to="/" replace /> : <LoginPage />
          } 
        />
        <Route 
          path="/auth/signup" 
          element={
            accessToken ? <Navigate to="/" replace /> : <SignupPage />
          } 
        />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              {!hasCompletedOnboarding ? (
                <Onboarding onComplete={completeOnboarding} />
              ) : (
                <HomePage />
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/emergencies/:id"
          element={
            <ProtectedRoute>
              <EmergencyDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/help-requests"
          element={
            <ProtectedRoute>
              <HelpRequestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ads/:id"
          element={
            <ProtectedRoute>
              <AdDetailView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/emergency-history"
          element={
            <ProtectedRoute>
              <EmergencyHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/safety-settings"
          element={
            <ProtectedRoute>
              <SafetySettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/help-center"
          element={
            <ProtectedRoute>
              <HelpCenter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/about"
          element={
            <ProtectedRoute>
              <AboutAllyNet />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
