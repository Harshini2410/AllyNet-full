import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, MapPin, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Card from '../../components/Card';
import { emergencyApi } from '../../api/emergency';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '../../utils';

const EmergencyHistory = () => {
  const navigate = useNavigate();
  const currentUserId = useAuthStore((state) => state.user?._id?.toString());
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEmergency, setSelectedEmergency] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await emergencyApi.getEmergencyHistory({ limit: 100 });
        if (response?.success && response?.data?.emergencies) {
          setEmergencies(response.data.emergencies);
        } else {
          setEmergencies([]);
        }
      } catch (err) {
        console.error('Error fetching emergency history:', err);
        setError(err.message || 'Failed to load emergency history');
        setEmergencies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getEmergencyTypeLabel = (type) => {
    const labels = {
      medical: 'Medical',
      safety: 'Safety',
      accident: 'Accident',
      assault: 'Assault',
      natural_disaster: 'Natural Disaster',
      other: 'Other'
    };
    return labels[type] || type;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle size={18} className="text-sage-500" />;
      case 'cancelled':
        return <XCircle size={18} className="text-coral-500" />;
      default:
        return <AlertCircle size={18} className="text-amber-500" />;
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      active: 'Active',
      responding: 'Responding',
      resolved: 'Resolved',
      cancelled: 'Cancelled'
    };
    return labels[status] || status;
  };

  const isUserCreator = (emergency) => {
    return emergency.user?._id?.toString() === currentUserId;
  };

  const isUserHelper = (emergency) => {
    return emergency.respondingHelpers?.some(
      h => h.helper?._id?.toString() === currentUserId
    );
  };

  const getUserRole = (emergency) => {
    if (isUserCreator(emergency)) return 'creator';
    if (isUserHelper(emergency)) return 'helper';
    return null;
  };

  const sosRequested = emergencies.filter(e => isUserCreator(e));
  const sosHelped = emergencies.filter(e => isUserHelper(e) && !isUserCreator(e));

  if (loading && emergencies.length === 0) {
    return (
      <div className="min-h-screen bg-sand-100 dark:bg-charcoal-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-500 mx-auto mb-4"></div>
          <p className="text-charcoal-500 dark:text-sand-300">Loading emergency history...</p>
        </div>
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
          <h1 className="text-xl font-display text-charcoal-500 dark:text-sand-50">Emergency History</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-6">
        {error && (
          <Card className="p-4 bg-coral-50 dark:bg-coral-900/20 border border-coral-200 dark:border-coral-800">
            <p className="text-sm text-coral-600 dark:text-coral-400">{error}</p>
          </Card>
        )}

        {/* SOS Requested Section */}
        <div>
          <h2 className="text-lg font-display text-charcoal-500 dark:text-sand-50 mb-4">
            SOS Requested ({sosRequested.length})
          </h2>
          {sosRequested.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-charcoal-500 dark:text-sand-300">No SOS requests yet.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {sosRequested.map((emergency) => (
                <EmergencyCard
                  key={emergency._id}
                  emergency={emergency}
                  role="creator"
                  onClick={() => setSelectedEmergency(emergency)}
                />
              ))}
            </div>
          )}
        </div>

        {/* SOS Helped Section */}
        <div>
          <h2 className="text-lg font-display text-charcoal-500 dark:text-sand-50 mb-4">
            SOS Helped ({sosHelped.length})
          </h2>
          {sosHelped.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-charcoal-500 dark:text-sand-300">No SOS helped yet.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {sosHelped.map((emergency) => (
                <EmergencyCard
                  key={emergency._id}
                  emergency={emergency}
                  role="helper"
                  onClick={() => setSelectedEmergency(emergency)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedEmergency && (
        <EmergencyDetailModal
          emergency={selectedEmergency}
          onClose={() => setSelectedEmergency(null)}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
};

const EmergencyCard = ({ emergency, role, onClick }) => {
  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle size={18} className="text-sage-500" />;
      case 'cancelled':
        return <XCircle size={18} className="text-coral-500" />;
      default:
        return <AlertCircle size={18} className="text-amber-500" />;
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      active: 'Active',
      responding: 'Responding',
      resolved: 'Resolved',
      cancelled: 'Cancelled'
    };
    return labels[status] || status;
  };

  return (
    <Card
      className="p-4 cursor-pointer hover:bg-sand-50 dark:hover:bg-charcoal-700 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={20} className="text-coral-500" />
            <span className="font-semibold text-charcoal-500 dark:text-sand-50">
              {emergency.type ? emergency.type.charAt(0).toUpperCase() + emergency.type.slice(1) : 'Emergency'}
            </span>
            {getStatusIcon(emergency.status)}
            <span className={cn(
              "text-xs font-medium px-2 py-0.5 rounded",
              emergency.status === 'resolved' && "bg-sage-100 dark:bg-sage-900/30 text-sage-600 dark:text-sage-400",
              emergency.status === 'cancelled' && "bg-coral-100 dark:bg-coral-900/30 text-coral-600 dark:text-coral-400",
              (emergency.status === 'active' || emergency.status === 'responding') && "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
            )}>
              {getStatusLabel(emergency.status)}
            </span>
          </div>
          {emergency.description && (
            <p className="text-sm text-charcoal-400 dark:text-sand-400 mb-2 line-clamp-2">
              {emergency.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-xs text-charcoal-300 dark:text-sand-500">
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>{formatTime(emergency.createdAt)}</span>
            </div>
            {emergency.location?.address && (
              <div className="flex items-center gap-1">
                <MapPin size={14} />
                <span className="truncate max-w-[200px]">{emergency.location.address}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

const EmergencyDetailModal = ({ emergency, onClose, currentUserId }) => {
  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusLabel = (status) => {
    const labels = {
      active: 'Active',
      responding: 'Responding',
      resolved: 'Resolved',
      cancelled: 'Cancelled'
    };
    return labels[status] || status;
  };

  const getEmergencyTypeLabel = (type) => {
    const labels = {
      medical: 'Medical',
      safety: 'Safety',
      accident: 'Accident',
      assault: 'Assault',
      natural_disaster: 'Natural Disaster',
      other: 'Other'
    };
    return labels[type] || type;
  };

  const isUserCreator = emergency.user?._id?.toString() === currentUserId;
  const userHelper = emergency.respondingHelpers?.find(
    h => h.helper?._id?.toString() === currentUserId
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-charcoal-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display text-charcoal-500 dark:text-sand-50">Emergency Details</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-sand-100 dark:hover:bg-charcoal-700 rounded-full transition-colors"
            >
              <XCircle size={20} className="text-charcoal-400" />
            </button>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-sm font-medium px-3 py-1 rounded-lg",
              emergency.status === 'resolved' && "bg-sage-100 dark:bg-sage-900/30 text-sage-600 dark:text-sage-400",
              emergency.status === 'cancelled' && "bg-coral-100 dark:bg-coral-900/30 text-coral-600 dark:text-coral-400",
              (emergency.status === 'active' || emergency.status === 'responding') && "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
            )}>
              {getStatusLabel(emergency.status)}
            </span>
            {isUserCreator && (
              <span className="text-xs px-2 py-1 bg-charcoal-100 dark:bg-charcoal-700 text-charcoal-600 dark:text-charcoal-300 rounded">
                You requested
              </span>
            )}
            {userHelper && (
              <span className="text-xs px-2 py-1 bg-sage-100 dark:bg-sage-900/30 text-sage-600 dark:text-sage-400 rounded">
                You helped
              </span>
            )}
          </div>

          {/* Type */}
          <div>
            <span className="text-xs text-charcoal-300 dark:text-sand-500 uppercase tracking-wide">Type</span>
            <p className="text-charcoal-500 dark:text-sand-50 font-medium">
              {getEmergencyTypeLabel(emergency.type)}
            </p>
          </div>

          {/* Description */}
          {emergency.description && (
            <div>
              <span className="text-xs text-charcoal-300 dark:text-sand-500 uppercase tracking-wide">Description</span>
              <p className="text-charcoal-500 dark:text-sand-50 mt-1">{emergency.description}</p>
            </div>
          )}

          {/* Location */}
          {emergency.location && (
            <div>
              <span className="text-xs text-charcoal-300 dark:text-sand-500 uppercase tracking-wide">Location</span>
              <p className="text-charcoal-500 dark:text-sand-50 mt-1">
                {emergency.location.address || `${emergency.location.latitude}, ${emergency.location.longitude}`}
              </p>
              {emergency.location.description && (
                <p className="text-sm text-charcoal-400 dark:text-sand-400 mt-1">
                  {emergency.location.description}
                </p>
              )}
            </div>
          )}

          {/* Timestamps */}
          <div className="space-y-2 pt-2 border-t border-sand-200 dark:border-charcoal-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-charcoal-300 dark:text-sand-500">Created</span>
              <span className="text-charcoal-500 dark:text-sand-50">{formatTime(emergency.createdAt)}</span>
            </div>
            {emergency.firstResponseAt && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-charcoal-300 dark:text-sand-500">First Response</span>
                <span className="text-charcoal-500 dark:text-sand-50">{formatTime(emergency.firstResponseAt)}</span>
              </div>
            )}
            {emergency.resolvedAt && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-charcoal-300 dark:text-sand-500">Resolved</span>
                <span className="text-charcoal-500 dark:text-sand-50">{formatTime(emergency.resolvedAt)}</span>
              </div>
            )}
          </div>

          {/* Resolution Notes */}
          {emergency.resolutionNotes && (
            <div className="pt-2 border-t border-sand-200 dark:border-charcoal-700">
              <span className="text-xs text-charcoal-300 dark:text-sand-500 uppercase tracking-wide">Resolution Notes</span>
              <p className="text-charcoal-500 dark:text-sand-50 mt-1">{emergency.resolutionNotes}</p>
            </div>
          )}

          {/* Helper Status (if user was a helper) */}
          {userHelper && (
            <div className="pt-2 border-t border-sand-200 dark:border-charcoal-700">
              <span className="text-xs text-charcoal-300 dark:text-sand-500 uppercase tracking-wide">Your Response</span>
              <p className="text-charcoal-500 dark:text-sand-50 mt-1">Status: {userHelper.status}</p>
              <p className="text-sm text-charcoal-400 dark:text-sand-400 mt-1">
                Responded at: {formatTime(userHelper.respondedAt)}
              </p>
            </div>
          )}

          {/* Responding Helpers Count */}
          {emergency.respondingHelpers && emergency.respondingHelpers.length > 0 && (
            <div className="pt-2 border-t border-sand-200 dark:border-charcoal-700">
              <span className="text-xs text-charcoal-300 dark:text-sand-500 uppercase tracking-wide">Helpers</span>
              <p className="text-charcoal-500 dark:text-sand-50 mt-1">
                {emergency.respondingHelpers.length} helper{emergency.respondingHelpers.length !== 1 ? 's' : ''} responded
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmergencyHistory;

