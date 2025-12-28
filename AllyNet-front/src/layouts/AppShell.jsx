import { useState } from 'react';
import BottomNav from '../components/BottomNav';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import SOSOverlay from '../features/emergency/SOSOverlay';
import EmergencyActiveView from '../features/emergency/EmergencyActiveView';
import EmergencyChat from '../features/emergency/EmergencyChat';
import EmergencyChatHistory from '../features/emergency/EmergencyChatHistory';
import { useEmergencyStore } from '../store/useEmergencyStore';
import { useEmergencySessionStore } from '../store/useEmergencySessionStore';
import HelpFeed from '../features/help/HelpFeed';
import CreateHelpRequest from '../features/help/CreateHelpRequest';
import DiscoveryView from '../features/marketplace/DiscoveryView';
import ProfilePage from '../features/profile/ProfilePage';
import { useAuthStore } from '../store/useAuthStore';

const AppShell = ({ children }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [isSOSOverlayOpen, setIsSOSOverlayOpen] = useState(false);
  const [isCreateHelpOpen, setIsCreateHelpOpen] = useState(false);
  const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(false);
  const isActive = useEmergencyStore((state) => state.isActive);
  const chatOpen = useEmergencySessionStore((state) => state.chatOpen);
  const chatAvailable = useEmergencySessionStore((state) => state.chatAvailable);
  const setChatOpen = useEmergencySessionStore((state) => state.setChatOpen);
  const user = useAuthStore((state) => state.user);

  // Derive initials from user profile
  const firstName = user?.profile?.firstName || '';
  const lastName = user?.profile?.lastName || '';
  const initials = firstName && lastName 
    ? `${firstName[0]}${lastName[0]}`.toUpperCase()
    : firstName 
      ? firstName[0].toUpperCase() 
      : lastName 
        ? lastName[0].toUpperCase()
        : user?.email?.[0]?.toUpperCase() || 'U';

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return children;
      case 'help':
        return <HelpFeed />;
      case 'discover':
        return <DiscoveryView />;
      case 'profile':
        return <ProfilePage />;
      default:
        return (
          <div className="flex flex-col items-center justify-center py-20 text-charcoal-200 dark:text-sand-500">
            <p className="text-sm font-medium italic">Coming soon: {activeTab}</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-sand-100 dark:bg-charcoal-900 pb-24 transition-colors duration-300">
      {/* Active Emergency View Overrides Everything */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100]"
          >
            <EmergencyActiveView />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlays */}
      <SOSOverlay 
        isOpen={isSOSOverlayOpen} 
        onClose={() => setIsSOSOverlayOpen(false)} 
      />
      <CreateHelpRequest
        isOpen={isCreateHelpOpen}
        onClose={() => setIsCreateHelpOpen(false)}
      />
      
      {/* Emergency Chat (only if chat is available and open) */}
      {chatOpen && chatAvailable && !isActive && <EmergencyChat />}
      
      {/* Emergency Chat History */}
      <EmergencyChatHistory 
        isOpen={isChatHistoryOpen} 
        onClose={() => setIsChatHistoryOpen(false)} 
      />

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-sand-100/80 dark:bg-charcoal-900/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.2em] text-sage-600 dark:text-sage-400 font-bold">AllyNet</span>
          <h1 className="text-xl text-charcoal-500 dark:text-sand-50 lowercase italic font-display">all is well.</h1>
        </div>
        <div className="flex items-center gap-4">
          {/* Chat button (only show if chat is available) */}
          {chatAvailable && (
            <button
              onClick={() => {
                if (!chatOpen && !isActive) {
                  setChatOpen(true);
                } else {
                  setIsChatHistoryOpen(true);
                }
              }}
              className="relative p-2 text-coral-600 hover:bg-coral-50 rounded-full transition-colors"
              title={!chatOpen && !isActive ? "Open Emergency Chat" : "Emergency Chat History"}
            >
              <MessageSquare size={20} />
              {!chatOpen && !isActive && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-coral-500 rounded-full animate-pulse" />
              )}
            </button>
          )}
          
          <button 
            onClick={() => setIsCreateHelpOpen(true)}
            className="px-4 py-2 bg-sage-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg shadow-sage-200 dark:shadow-sage-900/20"
          >
            Ask Help
          </button>
          <div className="w-10 h-10 rounded-full bg-sage-200 dark:bg-charcoal-700 border-2 border-white dark:border-charcoal-800 shadow-sm flex items-center justify-center text-sage-700 dark:text-sage-300 font-bold">
            {initials}
          </div>
        </div>
      </header>

      <main className="px-6 max-w-2xl mx-auto pt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onSOSClick={() => setIsSOSOverlayOpen(true)}
      />
    </div>
  );
};

export default AppShell;
