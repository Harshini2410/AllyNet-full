import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  EyeOff, 
  X, 
  AlertCircle,
  Phone,
  UserX
} from 'lucide-react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import FakeCallAlert from '../../components/FakeCallAlert';
import { useEmergencyStore } from '../../store/useEmergencyStore';
import { useAuthStore } from '../../store/useAuthStore';
import { emergencyApi } from '../../api/emergency';
import { cn } from '../../utils';

/**
 * SIMPLIFIED SOS OVERLAY - API-FIRST
 * - Removed: socket logic, helper logic, chat/session logic, manual store mutation
 * - Only: Call API, update store from API response
 */
const SOSOverlay = ({ isOpen, onClose }) => {
  const user = useAuthStore((state) => state.user);
  const [selectedType, setSelectedType] = useState('medical');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [anonymousMode, setAnonymousMode] = useState(false);
  const [fakeCallAlert, setFakeCallAlert] = useState(false);
  const [showFakeCall, setShowFakeCall] = useState(false);

  const emergencyTypes = [
    { id: 'medical', label: 'Medical', icon: HeartIcon, color: 'text-rose-500', bg: 'bg-rose-50' },
    { id: 'safety', label: 'Safety', icon: ShieldAlert, color: 'text-amber-500', bg: 'bg-amber-50' },
    { id: 'assault', label: 'Harassment', icon: EyeOff, color: 'text-purple-500', bg: 'bg-purple-50' },
    { id: 'other', label: 'Other', icon: AlertCircle, color: 'text-charcoal-300', bg: 'bg-sand-200' },
  ];


  // SIMPLIFIED: API-FIRST SOS creation - no sockets, no helpers, no chat
  const handleTrigger = async () => {
    if (isCreating) return;
    
    setIsCreating(true);
    setError('');
    
    try {
      // Get user location (required)
      let latitude, longitude;
      
      if (navigator.geolocation) {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            maximumAge: 60000
          });
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } else if (user?.location?.latitude && user?.location?.longitude) {
        latitude = user.location.latitude;
        longitude = user.location.longitude;
      } else {
        throw new Error('Location is required. Please enable location services.');
      }
      
      // Call API to create emergency (API auto-determines radius: 5km → 10km → 15km)
      const response = await emergencyApi.createEmergency({
        location: {
          latitude,
          longitude,
          address: null,
          description: null
        },
        type: selectedType,
        priority: 'high',
        severity: 5,
        anonymousMode: anonymousMode,
        silentMode: false,
        fakeCallAlert: fakeCallAlert
      });
      
      if (response?.success && response?.data?.emergency) {
        // API-FIRST: Update store ONLY from API response
        const { updateFromEmergency } = useEmergencyStore.getState();
        updateFromEmergency(response.data.emergency);
        
        // Initialize chat session for creator (API-first)
        const { useEmergencySessionStore } = await import('../../store/useEmergencySessionStore');
        const emergencyId = response.data.emergency._id || response.data.emergency.id;
        const sessionStore = useEmergencySessionStore.getState();
        sessionStore.initializeSession(emergencyId, 'creator');
        sessionStore.setChatAvailable(true);
        // Auto-open chat for creator (they need to see helper messages)
        sessionStore.setChatOpen(true);
        
        // Trigger fake call alert if enabled
        if (fakeCallAlert) {
          setShowFakeCall(true);
        }
        
        onClose();
      } else {
        throw new Error('Failed to create emergency');
      }
    } catch (err) {
      console.error('Error creating emergency:', err);
      setError(err.message || 'Failed to create emergency. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-charcoal-900/40 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-sand-100 rounded-t-[3rem] p-8 z-[70] max-w-2xl mx-auto shadow-2xl"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-display text-charcoal-500">SOS Configuration</h2>
                <p className="text-sm text-charcoal-300">Set your emergency parameters</p>
              </div>
              <button onClick={onClose} className="p-2 bg-white rounded-full shadow-sm">
                <X size={20} className="text-charcoal-300" />
              </button>
            </div>

            <div className="space-y-8">
              {/* Error Message */}
              {error && (
                <div className="p-4 bg-coral-50 dark:bg-coral-900/20 border border-coral-200 dark:border-coral-800 rounded-2xl text-sm text-coral-600 dark:text-coral-400">
                  {error}
                </div>
              )}
              
              {/* Emergency Types */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-sage-600 mb-4">Emergency Type</p>
                <div className="grid grid-cols-4 gap-3">
                  {emergencyTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedType === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setSelectedType(type.id)}
                        className={cn(
                          'flex flex-col items-center gap-2 p-3 rounded-2xl transition-all',
                          isSelected ? 'bg-white shadow-md ring-2 ring-sage-500/20' : 'bg-transparent'
                        )}
                      >
                        <div className={cn('p-3 rounded-xl transition-colors', isSelected ? type.bg : 'bg-sand-200')}>
                          <Icon size={24} className={isSelected ? type.color : 'text-charcoal-200'} />
                        </div>
                        <span className={cn('text-[10px] font-bold', isSelected ? 'text-charcoal-500' : 'text-charcoal-200')}>
                          {type.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Info about auto-extending radius */}
              <Card className="p-4 bg-sage-50 dark:bg-sage-900/20 border border-sage-200 dark:border-sage-800">
                <p className="text-sm text-sage-800 dark:text-sage-200">
                  <strong>Auto-Extending Radius:</strong> The system will automatically search for helpers within 5km, then extend to 10km, and up to 15km if needed to find at least 3 helpers.
                </p>
              </Card>

              {/* Privacy & Safety Options */}
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-sage-600">Privacy & Safety</p>
                
                {/* Anonymous Mode Toggle */}
                <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 rounded-xl">
                      <UserX size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-charcoal-500">Anonymous Mode</p>
                      <p className="text-xs text-charcoal-300">Hide your identity from helpers</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAnonymousMode(!anonymousMode)}
                    className={cn(
                      "relative w-12 h-6 rounded-full transition-colors",
                      anonymousMode ? "bg-purple-500" : "bg-sand-200"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform",
                        anonymousMode ? "translate-x-6" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>

                {/* Fake Call Alert Toggle */}
                <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-coral-50 rounded-xl">
                      <Phone size={20} className="text-coral-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-charcoal-500">Fake Call Alert</p>
                      <p className="text-xs text-charcoal-300">Trigger a fake incoming call for safety</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFakeCallAlert(!fakeCallAlert)}
                    className={cn(
                      "relative w-12 h-6 rounded-full transition-colors",
                      fakeCallAlert ? "bg-coral-500" : "bg-sand-200"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform",
                        fakeCallAlert ? "translate-x-6" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <Button 
                variant="alert" 
                className="w-full py-5 text-xl rounded-[2rem] shadow-coral-200 shadow-xl"
                onClick={handleTrigger}
                disabled={isCreating}
              >
                {isCreating ? 'Creating Emergency...' : 'Confirm SOS'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
      
      {/* Fake Call Alert Overlay */}
      <FakeCallAlert 
        isActive={showFakeCall} 
        onDismiss={() => setShowFakeCall(false)} 
      />
    </AnimatePresence>
  );
};

const HeartIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.505 4.046 3 5.5L12 21l7-7Z" />
  </svg>
);

export default SOSOverlay;


