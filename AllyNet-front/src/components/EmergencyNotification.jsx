import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useEmergencyStore } from '../store/useEmergencyStore';
import { useAuthStore } from '../store/useAuthStore';
import Button from './Button';

/**
 * HELPER NOTIFICATION COMPONENT
 * - Shows notification for pending emergencies (from API or socket)
 * - Clicking navigates to emergency details (does NOT auto-join or open chat)
 * - API-first: Notifications persist via API restore on page load
 * - Socket enhancement: Real-time updates via emergency:created events
 */
const EmergencyNotification = () => {
  const { nearbyEmergency, showEmergencyNotification, dismissEmergencyNotification, emergencyId, helperEmergencyId } = useEmergencyStore();
  const currentUser = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  // Periodic check: Verify emergency is still valid (every 5 seconds)
  // MUST be called before any early returns (Rules of Hooks)
  useEffect(() => {
    if (!nearbyEmergency || !showEmergencyNotification) {
      return;
    }

    const checkEmergency = async () => {
      try {
        const { emergencyApi } = await import('../api/emergency');
        const emergencyIdToCheck = nearbyEmergency._id || nearbyEmergency.id;
        if (!emergencyIdToCheck) {
          dismissEmergencyNotification();
          return;
        }

        const response = await emergencyApi.getEmergencyById(emergencyIdToCheck);
        if (!response?.success || !response?.data?.emergency) {
          // Emergency doesn't exist - clear notification
          dismissEmergencyNotification();
          return;
        }

        const emergency = response.data.emergency;
        // If emergency is not active or responding, clear notification (allows multiple helpers)
        if (emergency.status !== 'active' && emergency.status !== 'responding') {
          dismissEmergencyNotification();
        }
      } catch (error) {
        // Error checking - clear notification to be safe
        console.warn('Error verifying emergency status:', error);
        dismissEmergencyNotification();
      }
    };

    // Check immediately and then every 5 seconds
    checkEmergency();
    const interval = setInterval(checkEmergency, 5000);

    return () => clearInterval(interval);
  }, [nearbyEmergency, showEmergencyNotification, dismissEmergencyNotification]);

  // STRICT VALIDATION: Only show if notification is enabled AND emergency exists AND is active
  if (!showEmergencyNotification || !nearbyEmergency) {
    return null;
  }

  // FINAL VALIDATION 1: Emergency must be active or responding (allows multiple helpers)
  if (nearbyEmergency.status !== 'active' && nearbyEmergency.status !== 'responding') {
    // Emergency is not active or responding - clear notification
    dismissEmergencyNotification();
    return null;
  }

  // FINAL VALIDATION 2: User must NOT be the creator
  const emergencyUserId = nearbyEmergency.user?._id?.toString() || nearbyEmergency.user?.toString() || nearbyEmergency.user;
  const currentUserId = currentUser?._id?.toString();
  if (currentUserId && emergencyUserId && currentUserId.toString() === emergencyUserId.toString()) {
    // User is the creator - clear notification
    dismissEmergencyNotification();
    return null;
  }

  // FINAL VALIDATION 3: User must NOT have an active emergency (they are creator)
  if (emergencyId) {
    // User has an active emergency (they are creator) - clear notification
    dismissEmergencyNotification();
    return null;
  }

  // FINAL VALIDATION 4: User must NOT already be helping this emergency
  const emergencyIdFromNotification = nearbyEmergency._id || nearbyEmergency.id;
  if (helperEmergencyId && emergencyIdFromNotification && helperEmergencyId.toString() === emergencyIdFromNotification.toString()) {
    // User is already helping this emergency - clear notification
    dismissEmergencyNotification();
    return null;
  }

  const emergencyTypeLabels = {
    medical: 'Medical Emergency',
    safety: 'Safety Emergency',
    assault: 'Harassment', // Display as 'Harassment' but backend uses 'assault'
    accident: 'Accident',
    natural_disaster: 'Natural Disaster',
    other: 'Emergency'
  };

  const typeLabel = emergencyTypeLabels[nearbyEmergency.type] || 'Emergency';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-20 left-0 right-0 z-[90] px-6 max-w-2xl mx-auto"
      >
        <div className="bg-coral-50 dark:bg-coral-900/30 border-2 border-coral-300 dark:border-coral-700 rounded-2xl p-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-coral-100 dark:bg-coral-900/50 rounded-xl">
              <AlertCircle className="text-coral-600 dark:text-coral-400" size={24} />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-coral-900 dark:text-coral-100 text-sm mb-1">
                    {typeLabel} Nearby
                  </h3>
                  {nearbyEmergency.description && (
                    <p className="text-xs text-coral-700 dark:text-coral-300 line-clamp-2">
                      {nearbyEmergency.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={dismissEmergencyNotification}
                  className="p-1 hover:bg-coral-100 dark:hover:bg-coral-900/50 rounded-lg transition-colors"
                >
                  <X size={16} className="text-coral-600 dark:text-coral-400" />
                </button>
              </div>
              {nearbyEmergency.location && (
                <div className="flex items-center gap-1 text-xs text-coral-600 dark:text-coral-400 mb-3">
                  <MapPin size={12} />
                  <span>Location available</span>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="alert"
                  className="flex-1 py-2 text-xs"
                  onClick={() => {
                    const emergencyId = nearbyEmergency.id || nearbyEmergency._id;
                    if (emergencyId) {
                      // Navigate to emergency details (does NOT auto-join or open chat)
                      navigate(`/emergencies/${emergencyId}`);
                      dismissEmergencyNotification();
                    }
                  }}
                >
                  View Details
                </Button>
                <Button
                  variant="outline"
                  className="px-4 py-2 text-xs border-coral-300 dark:border-coral-700 text-coral-700 dark:text-coral-300"
                  onClick={dismissEmergencyNotification}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EmergencyNotification;

