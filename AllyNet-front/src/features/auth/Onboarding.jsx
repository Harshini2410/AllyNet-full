import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

const Onboarding = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2600);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-sand-100 dark:bg-charcoal-900 z-[999] flex items-center justify-center overflow-hidden">
      
      {/* Background atmosphere (z-0) */}
      <motion.div
        aria-hidden
        animate={{ scale: [1, 1.15, 1], opacity: [0.08, 0.14, 0.08] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 bg-sage-500/10 blur-[140px] z-0"
      />

      {/* Foreground content (z-10) */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-sm">
        
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7 }}
          className="relative mb-8"
        >
          <div className="w-28 h-28 bg-sage-500 rounded-[2.5rem] shadow-2xl flex items-center justify-center text-white relative z-10">
            <Shield size={56} strokeWidth={1.5} />
          </div>

          {/* Breathing ring */}
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.25, 0, 0.25] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 bg-sage-500 rounded-[2.5rem] z-0"
          />
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6 }}
        >
          <h1 className="text-3xl font-display font-semibold text-charcoal-600 dark:text-sand-50 mb-3">
            Welcome to AllyNet
          </h1>
          <p className="text-charcoal-400 dark:text-sand-400 leading-relaxed">
            Your community safety network.
            <br />
            Always connected. Always safe.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Onboarding;
