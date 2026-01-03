import { motion } from 'framer-motion';
import { Home, Shield, MessageCircle, User, Search } from 'lucide-react';
import { cn } from '../utils';

const BottomNav = ({ activeTab, onTabChange, onSOSClick }) => {
  const leftTabs = [
    { id: 'home', icon: Home, label: 'HOME' },
    { id: 'discover', icon: Search, label: 'EXPLORE' },
  ];

  const rightTabs = [
    { id: 'help', icon: MessageCircle, label: 'HELP OTHERS' },
    { id: 'profile', icon: User, label: 'PROFILE' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-charcoal-800/80 backdrop-blur-lg border-t border-sand-200 dark:border-charcoal-700 px-6 pb-8 pt-3 z-50">
      <div className="max-w-md mx-auto relative">
        <div className="grid grid-cols-5 items-center gap-0">
          {/* Left tabs */}
          {leftTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 transition-colors',
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

          {/* Center - Shield button */}
          <div className="flex items-center justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              onClick={onSOSClick}
              className="relative -top-8 bg-coral-500 p-4 rounded-full shadow-lg shadow-coral-200 dark:shadow-coral-900/40 border-4 border-sand-100 dark:border-charcoal-900"
            >
              <Shield size={32} className="text-white" />
            </motion.button>
          </div>

          {/* Right tabs */}
          {rightTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 transition-colors',
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
      </div>
    </nav>
  );
};

export default BottomNav;
