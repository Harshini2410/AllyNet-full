import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../../components/Card';
import { Clock, MapPin, CircleDollarSign, ChevronRight, Send, X, CheckCircle, Flag } from 'lucide-react';
import { helpRequestApi } from '../../api/helpRequest';
import { useAuthStore } from '../../store/useAuthStore';
import Button from '../../components/Button';
import { cn } from '../../utils';

const HelpFeed = () => {
  const currentUser = useAuthStore((state) => state.user);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Trigger for manual refresh

  const fetchNearbyRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user location
      let latitude, longitude;
      
      if (navigator.geolocation) {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            maximumAge: 60000
          });
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } else if (currentUser?.location?.latitude && currentUser?.location?.longitude) {
        latitude = currentUser.location.latitude;
        longitude = currentUser.location.longitude;
      } else {
        setError('Location is required to find nearby help requests');
        setLoading(false);
        return;
      }

      const response = await helpRequestApi.getNearbyHelpRequests(latitude, longitude);
      
      if (response?.success && response?.data?.requests) {
        // Filter out requests created by current user (double-check on frontend)
        const filteredRequests = response.data.requests.filter(request => {
          const creatorId = request.user?._id?.toString() || request.user?.toString();
          const currentUserId = currentUser?._id?.toString();
          return creatorId !== currentUserId;
        });
        setRequests(filteredRequests);
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.error('Error fetching nearby help requests:', err);
      setError(err.message || 'Failed to load help requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNearbyRequests();
    
    // Poll for updates every 5 seconds (reduced from 10 for better responsiveness)
    const interval = setInterval(fetchNearbyRequests, 5000);
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, refreshTrigger]);

  if (loading && requests.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-display text-charcoal-500 dark:text-sand-50">Help Others</h2>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-500 mx-auto mb-4"></div>
          <p className="text-charcoal-300 dark:text-sand-400">Loading nearby requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-display text-charcoal-500 dark:text-sand-50">Help Others</h2>
      </div>

      {error && (
        <Card className="p-4 bg-coral-50 dark:bg-coral-900/20 border border-coral-200 dark:border-coral-800">
          <p className="text-sm text-coral-600 dark:text-coral-400">{error}</p>
        </Card>
      )}

      {requests.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-charcoal-500 dark:text-sand-300">No nearby requests at the moment.</p>
        </Card>
      ) : (
        requests.map((request) => (
          <HelpRequestCard 
            key={request._id || request.id} 
            request={request} 
            onRefresh={() => setRefreshTrigger(prev => prev + 1)}
          />
        ))
      )}
    </div>
  );
};

const HelpRequestCard = ({ request, onRefresh }) => {
  const currentUser = useAuthStore((state) => state.user);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [responseError, setResponseError] = useState('');

  const priorityColors = {
    high: 'text-coral-500 bg-coral-50 dark:bg-coral-900/20',
    medium: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
    low: 'text-sage-500 bg-sage-50 dark:bg-sage-900/20',
  };

  // Check if current user already responded and get their response
  const userResponse = request.responses?.find(
    r => (r.helper?._id?.toString() || r.helper?.toString()) === currentUser?._id?.toString()
  );
  const hasResponded = !!userResponse;

  const formatDate = (dateString) => {
    if (!dateString) return 'Just now';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch (e) {
      return 'Just now';
    }
  };

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

  const handleRespond = async () => {
    if (!responseMessage.trim() || isResponding) return;

    setIsResponding(true);
    setResponseError('');

    try {
      const response = await helpRequestApi.respondToHelpRequest(
        request._id || request.id,
        responseMessage.trim()
      );

      if (response?.success) {
        setResponseMessage('');
        setShowResponseForm(false);
        // Refresh will happen via polling
      } else {
        throw new Error('Failed to send response');
      }
    } catch (err) {
      console.error('Error responding to help request:', err);
      setResponseError(err.message || 'Failed to send response. Please try again.');
    } finally {
      setIsResponding(false);
    }
  };

  const userName = request.user?.profile?.firstName
    ? `${request.user.profile.firstName} ${request.user.profile.lastName || ''}`.trim()
    : request.user?.email?.split('@')[0] || 'User';

  return (
    <Card className="group hover:border-sage-200 dark:hover:border-sage-700 transition-all">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-sage-500 dark:bg-sage-600 flex items-center justify-center text-[10px] font-bold text-white">
            {userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div>
            <p className="text-sm font-bold text-charcoal-500 dark:text-sand-50">{userName}</p>
            <div className="flex items-center gap-1 text-[10px] text-charcoal-300 dark:text-sand-400">
              <Clock size={10} />
              <span>{formatDate(request.createdAt)}</span>
            </div>
          </div>
        </div>
        <span className={cn('px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider', priorityColors[request.priority])}>
          {request.priority}
        </span>
      </div>

      <h3 className="text-md font-semibold text-charcoal-500 dark:text-sand-50 mb-2">{request.title}</h3>
      
      {request.description && (
        <p className="text-sm text-charcoal-400 dark:text-sand-400 mb-3">{request.description}</p>
      )}
      
      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-sand-100 dark:border-charcoal-700">
        {request.location && (
          <div className="flex items-center gap-1.5 text-charcoal-300 dark:text-sand-400">
            <MapPin size={14} className="text-sage-500" />
            <span className="text-xs font-medium">Location available</span>
          </div>
        )}
        {request.budget?.amount > 0 && (
          <div className="flex items-center gap-1.5 text-charcoal-300 dark:text-sand-400">
            <CircleDollarSign size={14} className="text-amber-500" />
            <span className="text-xs font-medium">${request.budget.amount}</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="px-3 py-1 bg-sand-100 dark:bg-charcoal-700 rounded-lg">
          <span className="text-[10px] font-bold text-charcoal-300 dark:text-sand-400 uppercase">{request.category}</span>
        </div>
        {!hasResponded && request.status === 'open' && (
          <button
            onClick={() => setShowResponseForm(!showResponseForm)}
            className="flex items-center gap-1 text-sage-600 dark:text-sage-400 text-sm font-bold group-hover:gap-2 transition-all"
          >
            I can help
            <ChevronRight size={16} />
          </button>
        )}
        {hasResponded && (
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-sage-600 dark:text-sage-400 font-medium">You responded</span>
          </div>
        )}
      </div>

      {/* Show helper's response message if they responded */}
      {hasResponded && userResponse?.message && (
        <div className="mt-3 pt-3 border-t border-sand-200 dark:border-charcoal-700">
          <div className={cn(
            "p-3 rounded-xl border",
            userResponse.status === 'reported'
              ? "bg-coral-50 dark:bg-coral-900/20 border-coral-200 dark:border-coral-700"
              : userResponse.status === 'accepted'
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700"
              : "bg-sage-50 dark:bg-sage-900/20 border-sage-200 dark:border-sage-700"
          )}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-sage-600 dark:text-sage-400">Your Response:</p>
              {userResponse.status === 'accepted' && (
                <span className="text-xs text-green-600 dark:text-green-400 font-bold flex items-center gap-1">
                  <CheckCircle size={12} />
                  Accepted
                </span>
              )}
              {userResponse.status === 'reported' && (
                <span className="text-xs text-coral-600 dark:text-coral-400 font-bold flex items-center gap-1">
                  <Flag size={12} />
                  Reported
                </span>
              )}
            </div>
            <p className="text-sm text-charcoal-600 dark:text-sand-300">{userResponse.message}</p>
            <p className="text-xs text-charcoal-300 dark:text-sand-400 mt-2">
              {formatDate(userResponse.respondedAt)}
            </p>
          </div>
        </div>
      )}

      {/* Show conversation messages if helper's response is accepted or reported */}
      {hasResponded && (userResponse?.status === 'accepted' || userResponse?.status === 'reported') && userResponse?.messages && userResponse.messages.length > 0 && (
        <div className="mt-3 pt-3 border-t border-sage-200 dark:border-sage-700 space-y-2">
          {userResponse.messages.map((msg, msgIndex) => {
            const isHelper = msg.senderRole === 'helper';
            const sender = msg.senderId;
            const senderName = sender?.profile?.firstName 
              ? `${sender.profile.firstName} ${sender.profile.lastName || ''}`.trim()
              : sender?.email?.split('@')[0] || (isHelper ? 'You' : userName);
            
            return (
              <div
                key={msgIndex}
                className={cn(
                  "flex",
                  isHelper ? "justify-end" : "justify-start"
                )}
              >
                <div className={cn(
                  "max-w-[75%] rounded-lg px-3 py-2",
                  isHelper
                    ? "bg-sage-500 text-white"
                    : "bg-white dark:bg-charcoal-700 text-charcoal-600 dark:text-sand-300 border border-sand-200 dark:border-charcoal-600"
                )}>
                  <p className="text-xs whitespace-pre-wrap break-words">{msg.message}</p>
                  <p className={cn(
                    "text-[10px] mt-1",
                    isHelper ? "text-white/70" : "text-charcoal-400 dark:text-sand-400"
                  )}>
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reply input for accepted responses */}
      {hasResponded && userResponse?.status === 'accepted' && (
        <HelperReplyInput 
          requestId={request._id || request.id} 
          helperId={currentUser?._id}
          onReplySent={onRefresh}
        />
      )}

      {/* Response Form */}
      <AnimatePresence>
        {showResponseForm && !hasResponded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 pt-4 border-t border-sand-200 dark:border-charcoal-700 overflow-hidden"
          >
            {responseError && (
              <div className="mb-3 p-3 bg-coral-50 dark:bg-coral-900/20 border border-coral-200 dark:border-coral-800 rounded-lg text-sm text-coral-600 dark:text-coral-400">
                {responseError}
              </div>
            )}
            <div className="space-y-3">
              <textarea
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                placeholder="Type your response here..."
                className="w-full bg-white dark:bg-charcoal-700 border border-sand-200 dark:border-charcoal-600 rounded-xl px-4 py-3 text-sm text-charcoal-500 dark:text-sand-300 focus:outline-none focus:ring-2 focus:ring-sage-500/20 resize-none"
                rows={3}
                maxLength={500}
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-charcoal-300 dark:text-sand-500">
                  {responseMessage.length}/500
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowResponseForm(false);
                      setResponseMessage('');
                      setResponseError('');
                    }}
                    className="px-4 py-2 text-sm text-charcoal-400 dark:text-sand-400 hover:text-charcoal-600 dark:hover:text-sand-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <Button
                    onClick={handleRespond}
                    disabled={!responseMessage.trim() || isResponding}
                    className="px-4 py-2 text-sm"
                  >
                    {isResponding ? 'Sending...' : 'Send Response'}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

// Helper Reply Input Component
const HelperReplyInput = ({ requestId, helperId, onReplySent }) => {
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const handleReply = async () => {
    if (!replyText.trim() || sendingReply || !requestId || !helperId) return;

    setSendingReply(true);
    try {
      const response = await helpRequestApi.replyToResponse(requestId, helperId, replyText.trim());
      if (response?.success) {
        setReplyText('');
        // Trigger immediate refresh
        if (onReplySent) {
          onReplySent();
        }
      } else {
        throw new Error('Failed to send reply');
      }
    } catch (err) {
      console.error('Error sending reply:', err);
      alert(err.message || 'Failed to send reply. Please try again.');
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-sage-200 dark:border-sage-700">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && replyText.trim() && !sendingReply) {
              handleReply();
            }
          }}
          placeholder="Type a reply..."
          className="flex-1 bg-white dark:bg-charcoal-700 border border-sand-200 dark:border-charcoal-600 rounded-lg px-3 py-2 text-sm text-charcoal-500 dark:text-sand-300 placeholder-charcoal-300 dark:placeholder-sand-500 focus:outline-none focus:ring-2 focus:ring-sage-500/20"
          disabled={sendingReply}
        />
        <button
          onClick={handleReply}
          disabled={!replyText.trim() || sendingReply}
          className={cn(
            "p-2 rounded-lg transition-colors",
            replyText.trim() && !sendingReply
              ? "bg-sage-500 hover:bg-sage-600 text-white"
              : "bg-sand-200 dark:bg-charcoal-700 text-charcoal-300 dark:text-sand-500 cursor-not-allowed"
          )}
        >
          {sendingReply ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send size={16} />
          )}
        </button>
      </div>
    </div>
  );
};

export default HelpFeed;


