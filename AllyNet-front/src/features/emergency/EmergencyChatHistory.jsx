import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Clock } from 'lucide-react';
import { emergencyApi } from '../../api/emergency';
import { useEmergencySessionStore } from '../../store/useEmergencySessionStore';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '../../utils';

const EmergencyChatHistory = ({ isOpen, onClose }) => {
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { initializeSession, setChatOpen } = useEmergencySessionStore();
  const currentUserId = useAuthStore((state) => state.user?._id?.toString());

  useEffect(() => {
    if (isOpen) {
      loadEmergencyHistory();
    }
  }, [isOpen]);

  const loadEmergencyHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await emergencyApi.getEmergencyHistory({ limit: 50 });
      if (response?.success && response?.data?.emergencies) {
        setEmergencies(response.data.emergencies);
      } else {
        setEmergencies([]);
      }
    } catch (err) {
      console.error('Error loading emergency history:', err);
      setError('Failed to load emergency history');
      setEmergencies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChat = async (emergency) => {
    const emergencyId = emergency._id?.toString() || emergency.id?.toString();
    if (!emergencyId) return;

    const creatorId = emergency.user?._id?.toString() || emergency.user?.toString();
    const isCreator = creatorId === currentUserId;
    
    initializeSession(emergencyId, isCreator ? 'creator' : 'helper');
    
    try {
      const messagesResponse = await emergencyApi.getMessages(emergencyId);
      if (messagesResponse?.success && messagesResponse?.data?.messages) {
        const sessionStore = useEmergencySessionStore.getState();
        sessionStore.loadMessages(messagesResponse.data.messages);
      }
    } catch (err) {
      console.warn('Failed to load messages:', err);
    }
    
    setChatOpen(true);
    onClose();
  };

  const getStatusTag = (emergency) => {
    const status = emergency.status;
    
    if (status === 'active' || status === 'responding') {
      return (
        <span className="px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full">
          ACTIVE
        </span>
      );
    } else if (status === 'resolved' || status === 'cancelled') {
      return (
        <span className="px-2 py-1 text-xs font-bold text-white bg-charcoal-700 rounded-full">
          SOLVED SOS
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 text-xs font-bold text-charcoal-600 bg-sand-300 rounded-full">
          GREY HELP
        </span>
      );
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (err) {
      return '';
    }
  };

  const getEmergencyType = (emergency) => {
    return emergency.type || emergency.category || 'Emergency';
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-charcoal-900/60 backdrop-blur-md z-[120] flex items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-[2rem] w-full h-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-sand-200">
          <div className="flex items-center gap-3">
            <MessageSquare size={24} className="text-coral-500" />
            <div>
              <h2 className="text-xl font-display text-charcoal-500">Emergency Chat History</h2>
              <p className="text-sm text-charcoal-300">View and reopen emergency conversations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-sand-100 rounded-full transition-colors"
          >
            <X size={20} className="text-charcoal-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-charcoal-300">Loading...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-red-500">{error}</p>
            </div>
          ) : emergencies.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare size={48} className="text-sand-300 mb-4" />
              <p className="text-charcoal-400 font-medium">No emergency history</p>
              <p className="text-sm text-charcoal-300 mt-2">
                You haven't participated in any emergencies yet
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {emergencies.map((emergency) => {
                const emergencyId = emergency._id?.toString() || emergency.id?.toString();
                const isActive = emergency.status === 'active' || emergency.status === 'responding';
                
                return (
                  <motion.div
                    key={emergencyId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "p-4 rounded-2xl border-2 cursor-pointer transition-all",
                      isActive
                        ? "border-red-200 bg-red-50 hover:bg-red-100"
                        : "border-sand-200 bg-white hover:bg-sand-50"
                    )}
                    onClick={() => handleOpenChat(emergency)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusTag(emergency)}
                          <span className="text-xs text-charcoal-400 flex items-center gap-1">
                            <Clock size={12} />
                            {formatDate(emergency.createdAt)}
                          </span>
                        </div>
                        <h3 className="font-semibold text-charcoal-700 mb-1">
                          {getEmergencyType(emergency)}
                        </h3>
                        {emergency.description && (
                          <p className="text-sm text-charcoal-500 line-clamp-2">
                            {emergency.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-charcoal-400">
                          {emergency.respondingHelpers?.length > 0 && (
                            <span>
                              {emergency.respondingHelpers.length} Helper{emergency.respondingHelpers.length !== 1 ? 's' : ''}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <MessageSquare size={12} />
                            Open Chat
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-coral-100 rounded-full flex items-center justify-center">
                          <MessageSquare size={20} className="text-coral-600" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EmergencyChatHistory;

