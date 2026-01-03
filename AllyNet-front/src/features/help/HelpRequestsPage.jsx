import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Trash2, Clock, CircleDollarSign, CheckCircle, Check, X, Flag, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { helpRequestApi } from '../../api/helpRequest';
import { useAuthStore } from '../../store/useAuthStore';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { cn } from '../../utils';

/**
 * Help Requests Page
 * Shows user's sent help requests with replies from helpers
 * Creator can accept/deny/report helpers and reply to accepted helpers inline
 */
const HelpRequestsPage = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = useAuthStore((state) => state.user?._id?.toString());
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [replyInputs, setReplyInputs] = useState({}); // Track reply inputs: { 'requestId-helperId': 'message text' }
  const [sendingReply, setSendingReply] = useState({}); // Track sending state
  const [reportInputs, setReportInputs] = useState({}); // Track report reason inputs: { 'requestId-helperId': 'reason text' }
  const [showReportInput, setShowReportInput] = useState({}); // Track which response shows report input: { 'requestId-helperId': true/false }

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await helpRequestApi.getMyHelpRequests();
        
        if (response?.success && response?.data?.requests) {
          setRequests(response.data.requests);
        } else {
          setRequests([]);
        }
      } catch (err) {
        console.error('Error fetching help requests:', err);
        setError(err.message || 'Failed to load help requests');
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
    
    // Poll for updates every 5 seconds to get new replies
    const interval = setInterval(fetchRequests, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (requestId) => {
    if (!window.confirm('Are you sure you want to delete this help request? It will be removed from all helpers.')) {
      return;
    }

    try {
      const response = await helpRequestApi.deleteHelpRequest(requestId);
      if (response?.success) {
        setRequests(requests.filter(r => r._id !== requestId));
      } else {
        throw new Error('Failed to delete help request');
      }
    } catch (err) {
      console.error('Error deleting help request:', err);
      alert('Failed to delete help request. Please try again.');
    }
  };

  const handleAcceptHelper = async (requestId, helperId) => {
    const actionKey = `${requestId}-accept-${helperId}`;
    setActionLoading({ ...actionLoading, [actionKey]: true });
    
    try {
      const response = await helpRequestApi.acceptHelper(requestId, helperId);
      if (response?.success) {
        const refreshResponse = await helpRequestApi.getMyHelpRequests();
        if (refreshResponse?.success && refreshResponse?.data?.requests) {
          setRequests(refreshResponse.data.requests);
        }
      } else {
        throw new Error('Failed to accept helper');
      }
    } catch (err) {
      console.error('Error accepting helper:', err);
      alert(err.message || 'Failed to accept helper. Please try again.');
    } finally {
      setActionLoading({ ...actionLoading, [actionKey]: false });
    }
  };

  const handleDenyHelper = async (requestId, helperId) => {
    if (!window.confirm('Are you sure you want to deny this helper? Their response will be removed.')) {
      return;
    }

    const actionKey = `${requestId}-deny-${helperId}`;
    setActionLoading({ ...actionLoading, [actionKey]: true });
    
    try {
      const response = await helpRequestApi.denyHelper(requestId, helperId);
      if (response?.success) {
        const refreshResponse = await helpRequestApi.getMyHelpRequests();
        if (refreshResponse?.success && refreshResponse?.data?.requests) {
          setRequests(refreshResponse.data.requests);
        }
      } else {
        throw new Error('Failed to deny helper');
      }
    } catch (err) {
      console.error('Error denying helper:', err);
      alert(err.message || 'Failed to deny helper. Please try again.');
    } finally {
      setActionLoading({ ...actionLoading, [actionKey]: false });
    }
  };

  const handleReportHelper = async (requestId, helperId, reason) => {
    if (!reason || !reason.trim()) {
      return;
    }

    const actionKey = `${requestId}-report-${helperId}`;
    const reportKey = `${requestId}-${helperId}`;
    setActionLoading({ ...actionLoading, [actionKey]: true });
    
    try {
      const response = await helpRequestApi.reportHelper(requestId, helperId, reason.trim());
      if (response?.success) {
        // Clear report input and hide it
        setReportInputs({ ...reportInputs, [reportKey]: '' });
        setShowReportInput({ ...showReportInput, [reportKey]: false });
        
        // Refresh requests
        const refreshResponse = await helpRequestApi.getMyHelpRequests();
        if (refreshResponse?.success && refreshResponse?.data?.requests) {
          setRequests(refreshResponse.data.requests);
        }
      } else {
        throw new Error('Failed to report helper');
      }
    } catch (err) {
      console.error('Error reporting helper:', err);
      alert(err.message || 'Failed to report helper. Please try again.');
    } finally {
      setActionLoading({ ...actionLoading, [actionKey]: false });
    }
  };

  const handleReplyToResponse = async (requestId, helperId, message) => {
    if (!message || !message.trim()) return;

    const replyKey = `${requestId}-${helperId}`;
    setSendingReply({ ...sendingReply, [replyKey]: true });

    try {
      const response = await helpRequestApi.replyToResponse(requestId, helperId, message.trim());
      if (response?.success) {
        // Clear reply input
        setReplyInputs({ ...replyInputs, [replyKey]: '' });
        // Refresh requests
        const refreshResponse = await helpRequestApi.getMyHelpRequests();
        if (refreshResponse?.success && refreshResponse?.data?.requests) {
          setRequests(refreshResponse.data.requests);
        }
      } else {
        throw new Error('Failed to send reply');
      }
    } catch (err) {
      console.error('Error sending reply:', err);
      alert(err.message || 'Failed to send reply. Please try again.');
    } finally {
      setSendingReply({ ...sendingReply, [replyKey]: false });
    }
  };

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

  const getStatusColor = (status) => {
    const colors = {
      open: 'text-sage-600 bg-sage-50',
      accepted: 'text-amber-600 bg-amber-50',
      in_progress: 'text-blue-600 bg-blue-50',
      completed: 'text-green-600 bg-green-50',
      cancelled: 'text-charcoal-300 bg-sand-100'
    };
    return colors[status] || colors.open;
  };

  if (loading && requests.length === 0) {
    return (
      <div className="min-h-screen bg-sand-100 dark:bg-charcoal-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-500 mx-auto mb-4"></div>
          <p className="text-charcoal-500 dark:text-sand-300">Loading help requests...</p>
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
          <h1 className="text-xl font-display text-charcoal-500 dark:text-sand-50">My Requests</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-4">
        {error && (
          <Card className="p-4 bg-coral-50 dark:bg-coral-900/20 border border-coral-200 dark:border-coral-800">
            <p className="text-sm text-coral-600 dark:text-coral-400">{error}</p>
          </Card>
        )}

        {requests.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-charcoal-500 dark:text-sand-300 mb-4">No help requests yet.</p>
            <p className="text-sm text-charcoal-300 dark:text-sand-400">
              Create a help request to get assistance from nearby helpers.
            </p>
          </Card>
        ) : (
          requests.map((request) => (
            <Card key={request._id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-display text-charcoal-500 dark:text-sand-50">
                      {request.title}
                    </h3>
                    <span className={cn('px-2 py-1 rounded-lg text-[10px] font-bold uppercase', getStatusColor(request.status))}>
                      {request.status}
                    </span>
                  </div>
                  {request.description && (
                    <p className="text-sm text-charcoal-400 dark:text-sand-400 mb-3">
                      {request.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-charcoal-300 dark:text-sand-500">
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>{formatDate(request.createdAt)}</span>
                    </div>
                    {request.budget?.amount > 0 && (
                      <div className="flex items-center gap-1">
                        <CircleDollarSign size={12} />
                        <span>${request.budget.amount}</span>
                      </div>
                    )}
                  </div>
                </div>
                {request.status === 'open' && (
                  <button
                    onClick={() => handleDelete(request._id)}
                    className="p-2 hover:bg-coral-50 dark:hover:bg-coral-900/20 rounded-full transition-colors"
                    title="Delete request"
                  >
                    <Trash2 size={18} className="text-coral-600 dark:text-coral-400" />
                  </button>
                )}
              </div>

              {/* Helper Responses */}
              {request.responses && request.responses.length > 0 && (
                <div className="mt-4 pt-4 border-t border-sand-200 dark:border-charcoal-700">
                  <h4 className="text-sm font-bold text-charcoal-500 dark:text-sand-50 mb-3">
                    {request.responses.filter(r => r.status !== 'denied').length} Helper{request.responses.filter(r => r.status !== 'denied').length !== 1 ? 's' : ''} Responded
                  </h4>
                  <div className="space-y-3">
                    {request.responses
                      .filter(response => response.status !== 'denied') // Don't show denied responses
                      .map((response, index) => {
                      const helper = response.helper;
                      const helperName = helper?.profile?.firstName 
                        ? `${helper.profile.firstName} ${helper.profile.lastName || ''}`.trim()
                        : helper?.email?.split('@')[0] || 'Helper';
                      
                      const isAccepted = response.status === 'accepted';
                      const isPending = response.status === 'pending' || !response.status;
                      const isReported = response.status === 'reported';
                      const isLoading = actionLoading[`${request._id}-accept-${helper._id}`] ||
                                       actionLoading[`${request._id}-deny-${helper._id}`] ||
                                       actionLoading[`${request._id}-report-${helper._id}`];
                      const replyKey = `${request._id}-${helper._id}`;
                      const replyText = replyInputs[replyKey] || '';
                      const isSendingReply = sendingReply[replyKey];
                      
                      return (
                        <div
                          key={index}
                          className={cn(
                            "p-4 rounded-2xl border",
                            isAccepted 
                              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700"
                              : isReported
                              ? "bg-coral-50 dark:bg-coral-900/20 border-coral-200 dark:border-coral-700"
                              : "bg-sage-50 dark:bg-sage-900/20 border-sage-200 dark:border-sage-700"
                          )}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-sage-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                {helperName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-charcoal-500 dark:text-sand-50">
                                  {helperName}
                                </p>
                                <p className="text-xs text-charcoal-300 dark:text-sand-400">
                                  {formatDate(response.respondedAt)}
                                </p>
                              </div>
                            </div>
                            {isAccepted && (
                              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                <CheckCircle size={14} />
                                <span className="font-bold">Accepted</span>
                              </div>
                            )}
                            {isReported && (
                              <div className="flex items-center gap-1 text-xs text-coral-600 dark:text-coral-400">
                                <Flag size={14} />
                                <span className="font-bold">Reported</span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-charcoal-600 dark:text-sand-300 mt-2 mb-3">
                            {response.message}
                          </p>
                          
                          {/* Conversation Messages - Show for accepted and reported responses */}
                          {(isAccepted || isReported) && response.messages && response.messages.length > 0 && (
                            <div className={cn(
                              "mt-3 pt-3 border-t space-y-2",
                              isAccepted ? "border-green-200 dark:border-green-700" : "border-coral-200 dark:border-coral-700"
                            )}>
                              {response.messages.map((msg, msgIndex) => {
                                const isCreator = msg.senderRole === 'creator';
                                const sender = msg.senderId;
                                const senderName = sender?.profile?.firstName 
                                  ? `${sender.profile.firstName} ${sender.profile.lastName || ''}`.trim()
                                  : sender?.email?.split('@')[0] || (isCreator ? 'You' : helperName);
                                
                                return (
                                  <div
                                    key={msgIndex}
                                    className={cn(
                                      "flex",
                                      isCreator ? "justify-end" : "justify-start"
                                    )}
                                  >
                                    <div className={cn(
                                      "max-w-[75%] rounded-lg px-3 py-2",
                                      isCreator
                                        ? "bg-sage-500 text-white"
                                        : "bg-white dark:bg-charcoal-700 text-charcoal-600 dark:text-sand-300 border border-sand-200 dark:border-charcoal-600"
                                    )}>
                                      <p className="text-xs whitespace-pre-wrap break-words">{msg.message}</p>
                                      <p className={cn(
                                        "text-[10px] mt-1",
                                        isCreator ? "text-white/70" : "text-charcoal-400 dark:text-sand-400"
                                      )}>
                                        {formatTime(msg.createdAt)}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Reply Input - Show for accepted responses */}
                          {isAccepted && (
                            <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={replyText}
                                  onChange={(e) => setReplyInputs({ ...replyInputs, [replyKey]: e.target.value })}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter' && replyText.trim() && !isSendingReply) {
                                      handleReplyToResponse(request._id, helper._id, replyText);
                                    }
                                  }}
                                  placeholder="Type a reply..."
                                  className="flex-1 bg-white dark:bg-charcoal-700 border border-sand-200 dark:border-charcoal-600 rounded-lg px-3 py-2 text-sm text-charcoal-500 dark:text-sand-300 placeholder-charcoal-300 dark:placeholder-sand-500 focus:outline-none focus:ring-2 focus:ring-sage-500/20"
                                  disabled={isSendingReply}
                                />
                                <button
                                  onClick={() => handleReplyToResponse(request._id, helper._id, replyText)}
                                  disabled={!replyText.trim() || isSendingReply}
                                  className={cn(
                                    "p-2 rounded-lg transition-colors",
                                    replyText.trim() && !isSendingReply
                                      ? "bg-sage-500 hover:bg-sage-600 text-white"
                                      : "bg-sand-200 dark:bg-charcoal-700 text-charcoal-300 dark:text-sand-500 cursor-not-allowed"
                                  )}
                                >
                                  {isSendingReply ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Send size={16} />
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {/* Action Buttons - Only show for pending responses */}
                          {isPending && request.status === 'open' && (
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-sage-200 dark:border-sage-700">
                              <button
                                onClick={() => handleAcceptHelper(request._id, helper._id)}
                                disabled={isLoading}
                                className={cn(
                                  "flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-colors",
                                  "bg-green-500 hover:bg-green-600 text-white",
                                  "disabled:opacity-50 disabled:cursor-not-allowed",
                                  "flex items-center justify-center gap-1"
                                )}
                              >
                                {actionLoading[`${request._id}-accept-${helper._id}`] ? (
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <Check size={14} />
                                    Accept
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleDenyHelper(request._id, helper._id)}
                                disabled={isLoading}
                                className={cn(
                                  "flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-colors",
                                  "bg-charcoal-300 hover:bg-charcoal-400 text-white",
                                  "disabled:opacity-50 disabled:cursor-not-allowed",
                                  "flex items-center justify-center gap-1"
                                )}
                              >
                                {actionLoading[`${request._id}-deny-${helper._id}`] ? (
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <X size={14} />
                                    Deny
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  const reportKey = `${request._id}-${helper._id}`;
                                  setShowReportInput({ ...showReportInput, [reportKey]: !showReportInput[reportKey] });
                                }}
                                disabled={isLoading}
                                className={cn(
                                  "flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-colors",
                                  "bg-coral-500 hover:bg-coral-600 text-white",
                                  "disabled:opacity-50 disabled:cursor-not-allowed",
                                  "flex items-center justify-center gap-1"
                                )}
                              >
                                <Flag size={14} />
                                Report
                              </button>
                            </div>
                          )}

                          {/* Report Reason Input - Show when Report button is clicked */}
                          {isPending && request.status === 'open' && showReportInput[`${request._id}-${helper._id}`] && (
                            <div className="mt-3 pt-3 border-t border-sage-200 dark:border-sage-700">
                              <div className="space-y-2">
                                <label className="text-xs font-bold text-charcoal-500 dark:text-sand-50">
                                  Why are you reporting this helper?
                                </label>
                                <textarea
                                  value={reportInputs[`${request._id}-${helper._id}`] || ''}
                                  onChange={(e) => setReportInputs({ ...reportInputs, [`${request._id}-${helper._id}`]: e.target.value })}
                                  placeholder="Please provide a brief reason..."
                                  className="w-full bg-white dark:bg-charcoal-700 border border-sand-200 dark:border-charcoal-600 rounded-lg px-3 py-2 text-sm text-charcoal-500 dark:text-sand-300 placeholder-charcoal-300 dark:placeholder-sand-500 focus:outline-none focus:ring-2 focus:ring-coral-500/20 resize-none"
                                  rows={2}
                                  maxLength={500}
                                />
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      const reportKey = `${request._id}-${helper._id}`;
                                      setShowReportInput({ ...showReportInput, [reportKey]: false });
                                      setReportInputs({ ...reportInputs, [reportKey]: '' });
                                    }}
                                    className="px-3 py-1.5 text-xs text-charcoal-400 dark:text-sand-400 hover:text-charcoal-600 dark:hover:text-sand-200 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => {
                                      const reportKey = `${request._id}-${helper._id}`;
                                      const reason = reportInputs[reportKey] || '';
                                      if (reason.trim()) {
                                        handleReportHelper(request._id, helper._id, reason);
                                      }
                                    }}
                                    disabled={!reportInputs[`${request._id}-${helper._id}`]?.trim() || actionLoading[`${request._id}-report-${helper._id}`]}
                                    className={cn(
                                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                                      reportInputs[`${request._id}-${helper._id}`]?.trim() && !actionLoading[`${request._id}-report-${helper._id}`]
                                        ? "bg-coral-500 hover:bg-coral-600 text-white"
                                        : "bg-sand-200 dark:bg-charcoal-700 text-charcoal-300 dark:text-sand-500 cursor-not-allowed"
                                    )}
                                  >
                                    {actionLoading[`${request._id}-report-${helper._id}`] ? (
                                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                                    ) : (
                                      'Submit Report'
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {(!request.responses || request.responses.length === 0) && request.status === 'open' && (
                <div className="mt-4 pt-4 border-t border-sand-200 dark:border-charcoal-700">
                  <p className="text-sm text-charcoal-300 dark:text-sand-400 text-center">
                    No responses yet. Waiting for helpers...
                  </p>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default HelpRequestsPage;
