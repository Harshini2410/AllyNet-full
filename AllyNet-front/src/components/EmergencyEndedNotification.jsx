import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X } from 'lucide-react';
import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmergencyStore } from '../store/useEmergencyStore';
import Button from './Button';

/**
 * Emergency Ended Notification
 * Shows when a helper's emergency is resolved/cancelled
 * Automatically redirects to home after user acknowledges
 */
const EmergencyEndedNotification = () => {
  const { emergencyEndedNotification, clearEmergencyEndedNotification } = useEmergencyStore();
  const navigate = useNavigate();

  const handleAcknowledge = useCallback(() => {
    clearEmergencyEndedNotification();
    navigate('/');
  }, [clearEmergencyEndedNotification, navigate]);

  useEffect(() => {
    if (emergencyEndedNotification) {
      // Auto-redirect to home after 3 seconds
      const timer = setTimeout(() => {
        handleAcknowledge();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [emergencyEndedNotification, handleAcknowledge]);

  if (!emergencyEndedNotification) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-charcoal-900/60 backdrop-blur-md z-[120] flex items-center justify-center px-6"
        onClick={handleAcknowledge}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-[3rem] p-8 w-full max-w-sm text-center shadow-2xl"
        >
          <div className="w-20 h-20 bg-green-50 text-green-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} />
          </div>
          
          <h3 className="text-2xl font-display text-charcoal-500 mb-2">
            {emergencyEndedNotification.status === 'resolved' 
              ? 'Emergency Resolved' 
              : 'Emergency Ended'}
          </h3>
          
          <p className="text-sm text-charcoal-300 mb-8 leading-relaxed">
            {emergencyEndedNotification.message}
          </p>
          
          <p className="text-xs text-sage-600 mb-6 font-medium">
            Thank you for your help! 🙏
          </p>
          
          <Button
            variant="alert"
            className="w-full py-4 rounded-2xl"
            onClick={handleAcknowledge}
          >
            Return to Home
          </Button>
          
          <p className="text-xs text-charcoal-400 mt-4">
            Redirecting automatically...
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EmergencyEndedNotification;

