import React from 'react';
import { motion } from 'framer-motion';

const TrustScoreRing = ({ score = 0, size = 200 }) => {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 1000) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Background Ring */}
      <svg className="absolute -rotate-90 transform" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-sand-200 dark:stroke-charcoal-700"
          strokeWidth="12"
          fill="transparent"
        />
        {/* Animated Progress Ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-sage-500"
          strokeWidth="12"
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
          strokeLinecap="round"
        />
      </svg>
      
      {/* Score Text */}
      <div className="text-center">
        <motion.span 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="block text-4xl font-display font-bold text-charcoal-500 dark:text-sand-50"
        >
          {score}
        </motion.span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-charcoal-200 dark:text-sand-400">
          Trust Score
        </span>
      </div>
    </div>
  );
};

export default TrustScoreRing;


