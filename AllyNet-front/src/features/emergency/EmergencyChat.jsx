import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, AlertCircle, Trash2, Phone, MapPin } from 'lucide-react';
import { useEmergencySessionStore } from '../../store/useEmergencySessionStore';
import { emergencyApi } from '../../api/emergency';
import { useAuthStore } from '../../store/useAuthStore';
import { useEmergencyStore } from '../../store/useEmergencyStore';
import Button from '../../components/Button';
import { cn } from '../../utils';

const EmergencyChat = () => {
  const {
    emergencyId,
    role,
    messages,
    chatOpen,
    loading,
    error,
    isResolved,
    setChatOpen,
    loadMessages,
    addMessage,
    removeMessage,
    setLoading,
    setError,
    setResolved
  } = useEmergencySessionStore();
  
  const currentUserId = useAuthStore((state) => state.user?._id?.toString());
  const currentUser = useAuthStore((state) => state.user);
  const isAnonymous = useEmergencyStore((state) => state.isAnonymous);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState(null);
  const [sharingLocation, setSharingLocation] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const lastLoadedEmergencyId = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Load messages when chat opens (API-first)
  useEffect(() => {
    if (chatOpen && emergencyId && !loading) {
      const shouldReload = lastLoadedEmergencyId.current !== emergencyId || messages.length === 0;
      
      if (shouldReload) {
        const fetchMessages = async () => {
          setLoading(true);
          setError(null);
          try {
            const response = await emergencyApi.getMessages(emergencyId);
            if (response?.success && response?.data?.messages) {
              loadMessages(response.data.messages);
              lastLoadedEmergencyId.current = emergencyId;
            } else {
              loadMessages([]);
              lastLoadedEmergencyId.current = emergencyId;
            }
          } catch (err) {
            console.error('Error loading messages:', err);
            setError('Failed to load messages');
            loadMessages([]);
          } finally {
            setLoading(false);
          }
        };
        fetchMessages();
      }
    }
  }, [chatOpen, emergencyId, loading, loadMessages, setLoading, setError, messages.length]);

  // Handle sending message (API-first)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageText.trim() || !emergencyId || isResolved || sending) {
      return;
    }

    const text = messageText.trim();
    setMessageText('');
    setSending(true);
    setError(null);

    try {
      const response = await emergencyApi.sendMessage(emergencyId, text);
      
      if (response?.success && response?.data?.message) {
        addMessage(response.data.message);
      } else {
        throw new Error('Message send failed');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
      setMessageText(text);
    } finally {
      setSending(false);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  // Format message time
  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch (err) {
      return '';
    }
  };

  // Handle message deletion
  const handleDeleteMessage = async (messageId) => {
    if (!emergencyId || !messageId || deletingMessageId) return;

    setDeletingMessageId(messageId);
    try {
      const response = await emergencyApi.deleteMessage(emergencyId, messageId);
      if (response?.success) {
        removeMessage(messageId);
      } else {
        throw new Error('Failed to delete message');
      }
    } catch (err) {
      console.error('Error deleting message:', err);
      setError('Failed to delete message. Please try again.');
    } finally {
      setDeletingMessageId(null);
    }
  };

  // Handle call action
  const handleCall = async () => {
    if (!emergencyId) return;

    try {
      // Fetch emergency details to get participant information
      const response = await emergencyApi.getEmergencyById(emergencyId);
      
      if (!response?.success || !response?.data?.emergency) {
        alert('Unable to get contact information. Please try again.');
        return;
      }

      const emergency = response.data.emergency;
      let phoneNumber = null;

      if (role === 'creator') {
        // Creator wants to call helpers - get first helper's phone
        if (emergency.respondingHelpers && emergency.respondingHelpers.length > 0) {
          const firstHelper = emergency.respondingHelpers[0].helper;
          phoneNumber = firstHelper?.phone || firstHelper?.profile?.phone;
        }
      } else {
        // Helper wants to call creator - get creator's phone
        const creator = emergency.user;
        phoneNumber = creator?.phone || creator?.profile?.phone;
      }

      if (phoneNumber) {
        window.location.href = `tel:${phoneNumber}`;
      } else {
        alert('Phone number not available for this contact. Please use the chat to communicate.');
      }
    } catch (error) {
      console.error('Error getting contact information:', error);
      alert('Unable to get contact information. Please try again.');
    }
  };

  // Handle location share
  const handleShareLocation = async () => {
    if (!emergencyId || sharingLocation || isResolved) return;

    setSharingLocation(true);
    setError(null);

    try {
      // Get user's current location
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Create location message
          const locationMessage = `📍 My current location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}\n\nView on map: https://www.google.com/maps?q=${latitude},${longitude}`;
          
          // Send location as a message
          const response = await emergencyApi.sendMessage(emergencyId, locationMessage);
          
          if (response?.success && response?.data?.message) {
            addMessage(response.data.message);
            setMessageText(''); // Clear input if there was any text
          } else {
            throw new Error('Failed to share location');
          }
          
          setSharingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Failed to get your location. Please enable location permissions.');
          setSharingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } catch (err) {
      console.error('Error sharing location:', err);
      setError(err.message || 'Failed to share location. Please try again.');
      setSharingLocation(false);
    }
  };

  if (!chatOpen) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-charcoal-900/60 backdrop-blur-md z-[110] flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-[2rem] w-full h-full max-w-md max-h-[90vh] flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-sand-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-coral-500 rounded-full flex items-center justify-center text-white font-bold">
              {role === 'creator' ? 'V' : 'H'}
            </div>
            <div>
              <h3 className="text-lg font-display text-charcoal-500">Emergency Chat</h3>
              <p className="text-xs text-charcoal-300">
                {role === 'creator' ? 'Talking to helpers' : 'Talking to emergency creator'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Call Button */}
            <button
              onClick={handleCall}
              className="p-2 hover:bg-sand-100 rounded-full transition-colors"
              title="Call"
            >
              <Phone size={20} className="text-charcoal-400" />
            </button>
            
            {/* Share Location Button */}
            <button
              onClick={handleShareLocation}
              disabled={sharingLocation || isResolved}
              className={cn(
                "p-2 rounded-full transition-colors",
                sharingLocation || isResolved
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-sand-100"
              )}
              title="Share my location"
            >
              <MapPin size={20} className={cn(
                sharingLocation ? "text-charcoal-300" : "text-charcoal-400"
              )} />
            </button>
            
            {/* Close Button */}
            <button
              onClick={() => setChatOpen(false)}
              className="p-2 hover:bg-sand-100 rounded-full transition-colors"
              title="Close chat"
            >
              <X size={20} className="text-charcoal-400" />
            </button>
          </div>
        </div>

        {/* Resolved Banner */}
        <AnimatePresence>
          {isResolved && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-amber-50 border-b border-amber-200 px-4 py-2"
            >
              <div className="flex items-center gap-2 text-amber-700 text-sm">
                <AlertCircle size={16} />
                <span className="font-medium">Emergency Resolved - Chat is read-only</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-sand-50">
          {loading && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-charcoal-300">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-charcoal-300 text-center">
                No messages yet.<br />
                Start the conversation!
              </p>
            </div>
          ) : (
            messages.map((message) => {
              // Determine if message is from current user
              // Priority 1: Use backend's isMine field (computed correctly on server for API messages)
              // Priority 2: Compute isMine from senderId (for socket messages that don't have isMine)
              let isMine = false;
              
              if (message.isMine !== undefined) {
                // Backend computed isMine - use it directly
                isMine = Boolean(message.isMine);
              } else if (currentUserId) {
                // Compute isMine from senderId (for socket messages)
                const messageSenderId = message.senderId?.toString() || message.userId?.toString();
                const currentUserIdStr = currentUserId.toString();
                isMine = Boolean(messageSenderId && currentUserIdStr && messageSenderId === currentUserIdStr);
              }
              
              // FIX 2: Enforce anonymity - never show real names if anonymousMode
              let displayName = 'User';
              let displayInitials = '?';
              
              if (isAnonymous) {
                // Anonymous mode: mask all identities
                if (isMine) {
                  displayName = 'You';
                  displayInitials = 'Y';
                } else if (message.senderRole === 'creator') {
                  displayName = 'Emergency Creator';
                  displayInitials = 'E';
                } else {
                  displayName = 'Anonymous Helper';
                  displayInitials = 'H';
                }
              } else {
                // Non-anonymous: use backend-provided displayName (already anonymized by backend)
                displayName = message.displayName || 'User';
                displayInitials = message.displayInitials || displayName?.[0]?.toUpperCase() || '?';
              }

              return (
                <motion.div
                  key={message._id || message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex gap-2 w-full",
                    isMine ? "justify-end" : "justify-start"
                  )}
                >
                  {!isMine && (
                    <div className="w-8 h-8 bg-coral-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {displayInitials}
                    </div>
                  )}
                  
                  <div className={cn(
                    "max-w-[70%] rounded-2xl px-4 py-2 relative",
                    isMine 
                      ? "bg-coral-500 text-white rounded-br-sm" 
                      : "bg-white text-charcoal-700 border border-sand-200 rounded-bl-sm"
                  )}>
                    {!isMine && (
                      <div className="flex items-center gap-2 mb-1">
                        {!isAnonymous && (
                          <span className="text-xs font-bold">
                            {message.senderRole === 'creator' ? 'Creator' : 'Helper'}
                          </span>
                        )}
                        <span className="text-xs opacity-70">{displayName}</span>
                      </div>
                    )}
                    
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words pr-8">
                      {message.message}
                    </p>
                    
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p className={cn(
                        "text-xs",
                        isMine ? "text-white/70" : "text-charcoal-400"
                      )}>
                        {formatTime(message.createdAt)}
                      </p>
                      
                      {isMine && !isResolved && (
                        <button
                          onClick={() => handleDeleteMessage(message._id || message.id)}
                          disabled={deletingMessageId === (message._id || message.id)}
                          className={cn(
                            "p-1 rounded-full transition-all",
                            isMine 
                              ? "text-white/70 hover:text-white hover:bg-white/20" 
                              : "text-charcoal-400 hover:text-charcoal-600 hover:bg-sand-100",
                            deletingMessageId === (message._id || message.id) && "opacity-50 cursor-not-allowed"
                          )}
                          title="Delete message"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {isMine && (
                    <div className="w-8 h-8 bg-coral-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {displayInitials}
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 py-2 bg-red-50 border-t border-red-200"
            >
              <p className="text-red-700 text-sm">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        {!isResolved && (
          <form onSubmit={handleSendMessage} className="p-4 border-t border-sand-200 bg-white">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message..."
                disabled={sending || !emergencyId}
                maxLength={1000}
                className="flex-1 px-4 py-3 rounded-2xl border border-sand-200 focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-transparent disabled:bg-sand-100 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!messageText.trim() || sending || !emergencyId}
                className={cn(
                  "p-3 rounded-2xl text-white transition-colors",
                  messageText.trim() && !sending && emergencyId
                    ? "bg-coral-500 hover:bg-coral-600"
                    : "bg-sand-300 cursor-not-allowed"
                )}
              >
                <Send size={20} />
              </button>
            </div>
            <p className="text-xs text-charcoal-300 mt-2 text-right">
              {messageText.length}/1000
            </p>
          </form>
        )}

        {isResolved && (
          <div className="p-4 border-t border-sand-200 bg-sand-100">
            <p className="text-sm text-charcoal-400 text-center">
              This emergency has been resolved. Chat is read-only.
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default EmergencyChat;

