import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  MapPin, 
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { useEmergencyStore } from '../../store/useEmergencyStore';
import { useEmergencySessionStore } from '../../store/useEmergencySessionStore';
import { emergencyApi } from '../../api/emergency';
import Button from '../../components/Button';
import Card from '../../components/Card';
import EmergencyChat from './EmergencyChat';
import { cn } from '../../utils';

/**
 * EMERGENCY ACTIVE VIEW - API-FIRST
 * - Displays emergency status for creator
 * - Includes chat access for creator
 * - Stop button calls API
 */
const EmergencyActiveView = () => {
  const { status, emergencyId, emergencyType, clearEmergency } = useEmergencyStore();
  const { chatAvailable, chatOpen, setChatOpen, emergencyId: sessionEmergencyId, role } = useEmergencySessionStore();
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [respondingHelpers, setRespondingHelpers] = useState([]);
  const [loadingHelpers, setLoadingHelpers] = useState(false);
  
  // Fetch full emergency data with responding helpers (API-first)
  useEffect(() => {
    const fetchEmergencyData = async () => {
      if (!emergencyId) {
        setRespondingHelpers([]);
        return;
      }

      try {
        setLoadingHelpers(true);
        const response = await emergencyApi.getEmergencyById(emergencyId);
        
        if (response?.success && response?.data?.emergency) {
          const emergency = response.data.emergency;
          // Extract responding helpers with their data
          const helpers = emergency.respondingHelpers || [];
          setRespondingHelpers(helpers);
        } else {
          setRespondingHelpers([]);
        }
      } catch (error) {
        console.error('Error fetching emergency data:', error);
        setRespondingHelpers([]);
      } finally {
        setLoadingHelpers(false);
      }
    };

    fetchEmergencyData();
    
    // Poll for updates every 5 seconds to get new helpers
    const interval = setInterval(fetchEmergencyData, 5000);
    
    return () => clearInterval(interval);
  }, [emergencyId]);
  
  // Ensure chat session is initialized for creator (API-first)
  useEffect(() => {
    if (!emergencyId) {
      return; // No emergency, nothing to initialize
    }

    const sessionStore = useEmergencySessionStore.getState();
    
    // Check if session needs initialization or update
    const needsInitialization = !sessionEmergencyId || 
      (sessionEmergencyId.toString() !== emergencyId.toString()) ||
      (role !== 'creator');

    if (needsInitialization) {
      // Initialize or reinitialize chat session for creator
      sessionStore.initializeSession(emergencyId, 'creator');
      sessionStore.setChatAvailable(true);
    }
  }, [emergencyId, sessionEmergencyId, role]);

  return (
    <div className="fixed inset-0 bg-sand-100 z-[100] flex flex-col overflow-hidden">
      {/* Background Breathing Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-[20%] -left-[20%] w-[140%] h-[140%] bg-coral-100 rounded-full blur-[100px]"
        />
      </div>

      {/* Header / Status Bar */}
      <div className="relative z-10 px-6 pt-12 pb-6">
        <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] p-4 flex items-center justify-between border border-white shadow-xl">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-coral-500 rounded-2xl flex items-center justify-center text-white">
                <ShieldCheck size={28} />
              </div>
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-coral-500 rounded-2xl -z-10"
              />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-coral-600">
                {status === 'active' ? 'Broadcast Active' : 'Help Responding'}
              </p>
              <h2 className="text-lg font-display text-charcoal-500 capitalize">{emergencyType} Emergency</h2>
              {respondingHelpers.length > 0 && (
                <p className="text-xs text-charcoal-400 mt-1">
                  {respondingHelpers.length} Helper{respondingHelpers.length !== 1 ? 's' : ''} responding
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {respondingHelpers.length > 0 && (
              <div className="px-3 py-2 bg-sage-50 rounded-full">
                <span className="text-xs font-bold text-sage-600">
                  {respondingHelpers.length} Helper{respondingHelpers.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            <div className="px-4 py-2 bg-coral-50 rounded-full">
              <span className="text-xs font-bold text-coral-600">Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area (Mock Map) */}
      <div className="relative flex-1 px-6 pb-6 overflow-hidden">
        <Card className="h-full w-full p-0 overflow-hidden relative border-4 border-white shadow-2xl bg-sage-50">
          {/* Mock Map Grid */}
          <div className="absolute inset-0 opacity-20" 
            style={{ backgroundImage: 'radial-gradient(#7D9D85 1px, transparent 1px)', backgroundSize: '24px 24px' }} 
          />
          
          {/* Creator Marker (Center) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              <div className="w-8 h-8 bg-sage-500 rounded-full border-4 border-white shadow-lg" />
              <motion.div
                animate={{ scale: [1, 4], opacity: [0.5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-sage-500 rounded-full"
              />
            </div>
          </div>

          {/* Helper Markers - Positioned around creator in circular pattern */}
          {respondingHelpers.map((helperData, index) => {
            const helper = helperData.helper;
            if (!helper) return null;
            
            // Calculate position in circular pattern around center
            const totalHelpers = respondingHelpers.length;
            const angle = (index * 360) / totalHelpers; // Distribute evenly in circle
            const radius = Math.min(120, 80 + (totalHelpers * 10)); // Adjust radius based on count
            const radians = (angle * Math.PI) / 180;
            const x = Math.cos(radians) * radius;
            const y = Math.sin(radians) * radius;
            
            // Get helper initials
            const firstName = helper.profile?.firstName || helper.firstName || '';
            const lastName = helper.profile?.lastName || helper.lastName || '';
            const initials = firstName && lastName 
              ? `${firstName[0]}${lastName[0]}`.toUpperCase()
              : firstName 
                ? firstName[0].toUpperCase() 
                : lastName 
                  ? lastName[0].toUpperCase()
                  : 'H';
            
            return (
              <motion.div
                key={helper._id?.toString() || helper.toString() || index}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="absolute"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                }}
              >
                <div className="relative">
                  {/* Helper Avatar */}
                  <div className="w-10 h-10 bg-coral-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">
                    {initials}
                  </div>
                  {/* Pulsing animation */}
                  <motion.div
                    animate={{ scale: [1, 1.3], opacity: [0.6, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                    className="absolute inset-0 bg-coral-500 rounded-full -z-10"
                  />
                  {/* Helper status indicator */}
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm" />
                </div>
              </motion.div>
            );
          })}

      {/* Map Overlay Controls */}
      <div className="absolute bottom-6 left-6 right-6 flex justify-end items-end gap-2">
        {/* Chat Button - Always visible for creator */}
        {chatAvailable && (
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="bg-white/90 backdrop-blur p-3 rounded-2xl shadow-md text-coral-600 hover:bg-white transition-colors relative"
            title={chatOpen ? "Close Chat" : "Open Chat"}
          >
            <MessageSquare size={20} />
            {!chatOpen && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-coral-500 rounded-full animate-pulse" />
            )}
          </button>
        )}
        <button className="bg-white/90 backdrop-blur p-3 rounded-2xl shadow-md text-charcoal-500">
          <MapPin size={20} />
        </button>
      </div>
        </Card>
      </div>

      {/* Footer Actions */}
      <div className="relative z-10 px-6 pb-12 pt-4 bg-gradient-to-t from-sand-100 to-transparent">
        <Button 
          variant="ghost" 
          className="w-full text-coral-600 font-bold"
          onClick={() => setShowStopConfirm(true)}
          disabled={isResolving}
        >
          {isResolving ? 'Resolving...' : 'I am safe now — Stop Emergency'}
        </Button>
      </div>

      {/* Stop Confirmation Overlay */}
      <AnimatePresence>
        {showStopConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-charcoal-900/60 backdrop-blur-md z-[110] flex items-center justify-center px-8"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[3rem] p-8 w-full max-w-sm text-center"
            >
              <div className="w-20 h-20 bg-coral-50 text-coral-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={40} />
              </div>
              <h3 className="text-2xl font-display text-charcoal-500 mb-2">Stop Emergency?</h3>
              <p className="text-sm text-charcoal-300 mb-8 leading-relaxed">
                Confirming you are safe will resolve the emergency.
              </p>
              <div className="space-y-3">
                <Button 
                  variant="alert" 
                  className="w-full py-4 rounded-2xl"
                  onClick={async () => {
                    if (!emergencyId || isResolving) return;
                    
                    setIsResolving(true);
                    try {
                      // API-FIRST: Call resolve endpoint
                      await emergencyApi.resolveEmergency(emergencyId);
                      
                      // Clear local state after API success
                      clearEmergency();
                      
                      // Clear helper notifications and session (emergency is now resolved)
                      const { useEmergencyStore } = await import('../../store/useEmergencyStore');
                      const { useEmergencySessionStore } = await import('../../store/useEmergencySessionStore');
                      useEmergencyStore.getState().clearNotifications();
                      useEmergencyStore.getState().clearHelperEmergency();
                      useEmergencySessionStore.getState().clearSession();
                      
                      setShowStopConfirm(false);
                    } catch (error) {
                      console.error('Failed to resolve emergency:', error);
                      alert('Failed to stop emergency. Please try again.');
                    } finally {
                      setIsResolving(false);
                    }
                  }}
                  disabled={isResolving}
                >
                  {isResolving ? 'Resolving...' : 'Yes, I am safe'}
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full py-4"
                  onClick={() => setShowStopConfirm(false)}
                >
                  Keep Active
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emergency Chat - Always available for creator when emergency is active */}
      {chatAvailable && chatOpen && <EmergencyChat />}
    </div>
  );
};

export default EmergencyActiveView;



