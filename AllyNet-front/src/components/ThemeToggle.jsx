import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../store/useThemeStore';
import { cn } from '../utils';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative flex items-center w-14 h-8 p-1 rounded-full transition-colors duration-300 focus:outline-none ring-offset-2 focus:ring-2 ring-sage-500/20",
        isDark ? "bg-charcoal-700" : "bg-sand-200"
      )}
    >
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={cn(
          "flex items-center justify-center w-6 h-6 rounded-full shadow-sm",
          isDark ? "bg-charcoal-500 text-amber-400 ml-auto" : "bg-white text-sage-500 mr-auto"
        )}
      >
        {isDark ? <Moon size={14} fill="currentColor" /> : <Sun size={14} fill="currentColor" />}
      </motion.div>
    </button>
  );
};

export default ThemeToggle;


