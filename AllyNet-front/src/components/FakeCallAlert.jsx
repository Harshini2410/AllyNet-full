import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Fake Call Alert Component
 * Shows a realistic incoming call interface for safety purposes
 */
const FakeCallAlert = ({ isActive, onDismiss }) => {
  const [ringing, setRinging] = useState(false);
  const [callerName] = useState('Emergency Contact');
  const [callerNumber] = useState('+1 (555) 123-4567');

  useEffect(() => {
    if (isActive) {
      setRinging(true);
      
      // Auto-dismiss after 30 seconds if not answered
      const autoDismiss = setTimeout(() => {
        handleDecline();
      }, 30000);

      return () => clearTimeout(autoDismiss);
    }
  }, [isActive]);

  const handleAnswer = () => {
    setRinging(false);
    // Show a brief "call connected" message
    setTimeout(() => {
      if (onDismiss) onDismiss();
    }, 2000);
  };

  const handleDecline = () => {
    setRinging(false);
    if (onDismiss) onDismiss();
  };

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-[3rem] p-8 w-full max-w-sm mx-4 text-center"
        >
          {/* Caller Avatar */}
          <motion.div
            animate={ringing ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 1, repeat: ringing ? Infinity : 0 }}
            className="w-24 h-24 bg-coral-500 rounded-full flex items-center justify-center text-white mx-auto mb-6"
          >
            <Phone size={40} />
          </motion.div>

          {/* Caller Info */}
          <h3 className="text-2xl font-display text-charcoal-500 mb-2">
            {callerName}
          </h3>
          <p className="text-charcoal-400 mb-8">{callerNumber}</p>

          {/* Call Status */}
          {ringing && (
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-coral-600 font-semibold mb-8"
            >
              Incoming Call...
            </motion.p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            {/* Decline Button */}
            <button
              onClick={handleDecline}
              className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-red-600 transition-colors"
              title="Decline"
            >
              <PhoneOff size={24} />
            </button>

            {/* Answer Button */}
            <button
              onClick={handleAnswer}
              className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-green-600 transition-colors"
              title="Answer"
            >
              <Phone size={24} />
            </button>
          </div>

          <p className="text-xs text-charcoal-300 mt-6">
            This is a fake call alert for your safety
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FakeCallAlert;

