import { motion } from 'framer-motion';
import { Home, Shield, MessageCircle, User, Search } from 'lucide-react';
import { cn } from '../utils';

const BottomNav = ({ activeTab, onTabChange, onSOSClick }) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'discover', icon: Search, label: 'Explore' },
    { id: 'sos', icon: Shield, label: 'SOS', isCenter: true },
    { id: 'help', icon: MessageCircle, label: 'Help Others' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-charcoal-800/80 backdrop-blur-lg border-t border-sand-200 dark:border-charcoal-700 px-6 pb-8 pt-3 z-50">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isCenter) {
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                onClick={onSOSClick}
                className="relative -top-8 bg-coral-500 p-4 rounded-full shadow-lg shadow-coral-200 dark:shadow-coral-900/40 border-4 border-sand-100 dark:border-charcoal-900"
              >
                <Icon size={32} className="text-white" />
              </motion.button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex flex-col items-center gap-1 transition-colors',
                isActive ? 'text-sage-600 dark:text-sage-400' : 'text-charcoal-300 dark:text-sand-500'
              )}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium uppercase tracking-wider">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
