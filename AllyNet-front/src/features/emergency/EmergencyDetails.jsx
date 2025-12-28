import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, MapPin, Clock, ShieldAlert, ArrowLeft, CheckCircle, MessageSquare } from 'lucide-react';
import { emergencyApi } from '../../api/emergency';
import { useAuthStore } from '../../store/useAuthStore';
import { useEmergencySessionStore } from '../../store/useEmergencySessionStore';
import Button from '../../components/Button';
import Card from '../../components/Card';
import EmergencyChat from './EmergencyChat';

/**
 * Emergency Details Page with Helper Acceptance
 * - Displays emergency information for helpers
 * - Allows helpers to accept emergency via API
 * - No socket emits, no auto-join, API-first
 */
const EmergencyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const { chatAvailable, chatOpen, setChatOpen, emergencyId: sessionEmergencyId, role } = useEmergencySessionStore();
  const [emergency, setEmergency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState(null);
  const [acceptSuccess, setAcceptSuccess] = useState(false);
  const [isHelper, setIsHelper] = useState(false); // Track if current user is already a helper

  useEffect(() => {
    const fetchEmergency = async () => {
      if (!id) {
        setError('Emergency ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await emergencyApi.getEmergencyById(id);
        
        if (response?.success && response?.data?.emergency) {
          const emergencyData = response.data.emergency;
          setEmergency(emergencyData);
          
          // Check if current user is already a helper
          const currentUserId = currentUser?._id?.toString();
          const isAlreadyHelper = emergencyData.respondingHelpers?.some(
            h => (h.helper?._id?.toString() || h.helper?.toString()) === currentUserId
          );
          setIsHelper(isAlreadyHelper);
        } else {
          setError('Emergency not found');
        }
      } catch (err) {
        console.error('Error fetching emergency:', err);
        setError(err.message || 'Failed to load emergency details');
      } finally {
        setLoading(false);
      }
    };

    fetchEmergency();
  }, [id, currentUser]);

  const getEmergencyTypeLabel = (type) => {
    const typeLabels = {
      medical: 'Medical Emergency',
      safety: 'Safety Emergency',
      harassment: 'Harassment',
      accident: 'Accident',
      assault: 'Assault',
      natural_disaster: 'Natural Disaster',
      other: 'Emergency'
    };
    return typeLabels[type] || type || 'Emergency';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return 'N/A';
    }
  };

  const getLocationText = (location) => {
    if (!location) return 'Location not available';
    
    if (location.address) {
      return location.address;
    }
    
    if (location.latitude && location.longitude) {
      return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
    }
    
    return 'Location not available';
  };

  // Check if current user is the creator
  const isCreator = () => {
    if (!emergency || !currentUser) return false;
    const emergencyUserId = emergency.user?._id?.toString() || emergency.user?.toString();
    const currentUserId = currentUser._id?.toString();
    return emergencyUserId === currentUserId;
  };

  // Check if accept button should be shown
  const shouldShowAcceptButton = () => {
    if (!emergency || !currentUser) return false;
    return emergency.status === 'active' && !isCreator() && !isHelper && !acceptSuccess;
  };

  // Handle accept emergency
  const handleAccept = async () => {
    if (!id || isAccepting) return;
    
    setIsAccepting(true);
    setAcceptError(null);
    
    try {
      const response = await emergencyApi.respondToEmergency(id, 'accept');
      
      if (response?.success) {
        setAcceptSuccess(true);
        setIsHelper(true);
        
        // Update helper state in store
        const { useEmergencyStore } = await import('../../store/useEmergencyStore');
        const emergencyStore = useEmergencyStore.getState();
        emergencyStore.setHelperEmergency(id);
        // Clear notification immediately and prevent it from showing again
        emergencyStore.dismissEmergencyNotification();
        emergencyStore.clearNotifications(); // Ensure it's fully cleared
        
        // Initialize chat session for helper
        const { useEmergencySessionStore } = await import('../../store/useEmergencySessionStore');
        useEmergencySessionStore.getState().initializeSession(id, 'helper');
        useEmergencySessionStore.getState().setChatAvailable(true);
        
        // Optionally refresh emergency data to get updated state
        const refreshResponse = await emergencyApi.getEmergencyById(id);
        if (refreshResponse?.success && refreshResponse?.data?.emergency) {
          setEmergency(refreshResponse.data.emergency);
        }
      } else {
        throw new Error(response?.error?.message || 'Failed to accept emergency');
      }
    } catch (err) {
      console.error('Error accepting emergency:', err);
      setAcceptError(err.message || 'Failed to accept emergency. Please try again.');
    } finally {
      setIsAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sand-100 dark:bg-charcoal-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-500 mx-auto mb-4"></div>
          <p className="text-charcoal-500 dark:text-sand-300">Loading emergency details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-sand-100 dark:bg-charcoal-900 flex items-center justify-center px-6">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertCircle className="text-coral-500 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-display text-charcoal-500 dark:text-sand-50 mb-2">Error</h2>
          <p className="text-charcoal-300 dark:text-sand-400 mb-6">{error}</p>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  if (!emergency) {
    return (
      <div className="min-h-screen bg-sand-100 dark:bg-charcoal-900 flex items-center justify-center px-6">
        <Card className="max-w-md w-full p-8 text-center">
          <h2 className="text-xl font-display text-charcoal-500 dark:text-sand-50 mb-2">Emergency Not Found</h2>
          <p className="text-charcoal-300 dark:text-sand-400 mb-6">The emergency you're looking for doesn't exist or has been resolved.</p>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand-100 dark:bg-charcoal-900 pb-24">
      {/* Header */}
      <div className="bg-white dark:bg-charcoal-800 border-b border-sand-200 dark:border-charcoal-700 sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-sand-100 dark:hover:bg-charcoal-700 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-charcoal-500 dark:text-sand-300" />
          </button>
          <h1 className="text-xl font-display text-charcoal-500 dark:text-sand-50">Emergency Details</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-4">
        {/* Emergency Type */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-coral-50 dark:bg-coral-900/20 rounded-xl">
              <ShieldAlert className="text-coral-600 dark:text-coral-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-display text-charcoal-500 dark:text-sand-50">
                {getEmergencyTypeLabel(emergency.type)}
              </h2>
              <p className="text-sm text-charcoal-300 dark:text-sand-400 capitalize">
                Status: {emergency.status || 'unknown'}
              </p>
            </div>
          </div>
        </Card>

        {/* Severity */}
        {emergency.severity && (
          <Card className="p-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-sage-600 dark:text-sage-400 mb-3">
              Severity
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-sand-200 dark:bg-charcoal-700 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-coral-500 transition-all"
                  style={{ width: `${(emergency.severity / 10) * 100}%` }}
                />
              </div>
              <span className="text-lg font-bold text-charcoal-500 dark:text-sand-50">
                {emergency.severity}/10
              </span>
            </div>
          </Card>
        )}

        {/* Location */}
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-sage-50 dark:bg-sage-900/20 rounded-lg mt-1">
              <MapPin className="text-sage-600 dark:text-sage-400" size={20} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold uppercase tracking-widest text-sage-600 dark:text-sage-400 mb-2">
                Location
              </h3>
              <p className="text-charcoal-500 dark:text-sand-300">
                {getLocationText(emergency.location)}
              </p>
            </div>
          </div>
        </Card>

        {/* Time Created */}
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-sage-50 dark:bg-sage-900/20 rounded-lg mt-1">
              <Clock className="text-sage-600 dark:text-sage-400" size={20} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold uppercase tracking-widest text-sage-600 dark:text-sage-400 mb-2">
                Created At
              </h3>
              <p className="text-charcoal-500 dark:text-sand-300">
                {formatDate(emergency.createdAt || emergency.activatedAt)}
              </p>
            </div>
          </div>
        </Card>

        {/* Description (if available) */}
        {emergency.description && (
          <Card className="p-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-sage-600 dark:text-sage-400 mb-3">
              Description
            </h3>
            <p className="text-charcoal-500 dark:text-sand-300 whitespace-pre-wrap">
              {emergency.description}
            </p>
          </Card>
        )}

        {/* Accept & Help Button (for helpers only, if emergency is active) */}
        {shouldShowAcceptButton() && (
          <Card className="p-6">
            <div className="space-y-4">
              <Button
                variant="alert"
                className="w-full py-4 text-lg"
                onClick={handleAccept}
                disabled={isAccepting}
              >
                {isAccepting ? 'Accepting...' : 'Accept & Help'}
              </Button>
              
              {acceptError && (
                <div className="p-3 bg-coral-50 dark:bg-coral-900/20 border border-coral-200 dark:border-coral-800 rounded-lg">
                  <p className="text-sm text-coral-600 dark:text-coral-400">{acceptError}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Success message (after acceptance) */}
        {acceptSuccess && (
          <Card className="p-6 bg-sage-50 dark:bg-sage-900/20 border-2 border-sage-300 dark:border-sage-700">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-sage-600 dark:text-sage-400" size={24} />
                <div>
                  <h3 className="font-bold text-sage-900 dark:text-sage-100 mb-1">
                    You are now helping
                  </h3>
                  <p className="text-sm text-sage-700 dark:text-sage-300">
                    You've successfully accepted this emergency.
                  </p>
                </div>
              </div>
              
              {/* Chat Button - Available immediately after acceptance */}
              {chatAvailable && (
                <Button
                  variant="outline"
                  className="w-full py-3 border-sage-300 dark:border-sage-700 text-sage-700 dark:text-sage-300 hover:bg-sage-100 dark:hover:bg-sage-900/40"
                  onClick={() => setChatOpen(true)}
                >
                  <div className="flex items-center justify-center gap-2">
                    <MessageSquare size={20} />
                    <span>Open Chat</span>
                  </div>
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Helper status (if already a helper) */}
        {isHelper && !acceptSuccess && (
          <Card className="p-6 bg-sage-50 dark:bg-sage-900/20 border-2 border-sage-300 dark:border-sage-700">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-sage-600 dark:text-sage-400" size={24} />
                <div>
                  <h3 className="font-bold text-sage-900 dark:text-sage-100 mb-1">
                    You are helping
                  </h3>
                  <p className="text-sm text-sage-700 dark:text-sage-300">
                    You're already responding to this emergency.
                  </p>
                </div>
              </div>
              
              {/* Chat Button - Available for helpers */}
              {chatAvailable && (
                <Button
                  variant="outline"
                  className="w-full py-3 border-sage-300 dark:border-sage-700 text-sage-700 dark:text-sage-300 hover:bg-sage-100 dark:hover:bg-sage-900/40"
                  onClick={() => setChatOpen(true)}
                >
                  <div className="flex items-center justify-center gap-2">
                    <MessageSquare size={20} />
                    <span>Open Chat</span>
                  </div>
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Emergency Chat - Renders when chat is open */}
      {chatAvailable && chatOpen && <EmergencyChat />}
    </div>
  );
};

export default EmergencyDetails;

