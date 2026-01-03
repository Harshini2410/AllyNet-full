import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Eye, Edit2, Trash2, MapPin, Clock } from 'lucide-react';
import { adApi } from '../../api/ad';
import { useAuthStore } from '../../store/useAuthStore';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { cn } from '../../utils';
import CreateAdForm from '../marketplace/CreateAdForm';

/**
 * Ad History Component
 * Shows user's created ads with reach, ratings, and edit functionality
 */
const AdHistory = ({ isOpen, onClose }) => {
  const currentUser = useAuthStore((state) => state.user);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingAd, setEditingAd] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMyAds();
    }
  }, [isOpen]);

  const fetchMyAds = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adApi.getMyAds();
      
      if (response?.success && response?.data?.ads) {
        setAds(response.data.ads);
      } else {
        setAds([]);
      }
    } catch (err) {
      console.error('Error fetching my ads:', err);
      setError(err.message || 'Failed to load ads');
      setAds([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (adId) => {
    if (!window.confirm('Are you sure you want to delete this ad? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await adApi.deleteAd(adId);
      if (response?.success) {
        setAds(ads.filter(ad => ad._id !== adId));
      } else {
        throw new Error('Failed to delete ad');
      }
    } catch (err) {
      console.error('Error deleting ad:', err);
      alert('Failed to delete ad. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Just now';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return 'Just now';
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      shop: 'Shop',
      restaurant: 'Restaurant',
      service: 'Service',
      brand: 'Brand',
      event: 'Event',
      other: 'Other'
    };
    return labels[category] || category;
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'text-green-600 bg-green-50 dark:bg-green-900/20',
      inactive: 'text-charcoal-400 bg-sand-100 dark:bg-charcoal-700',
      expired: 'text-coral-600 bg-coral-50 dark:bg-coral-900/20'
    };
    return colors[status] || colors.inactive;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-charcoal-900/40 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-sand-100 dark:bg-charcoal-800 rounded-t-[3rem] p-8 z-[70] max-w-2xl mx-auto shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-display text-charcoal-500 dark:text-sand-50">My Ad History</h2>
              <button onClick={onClose} className="p-2 bg-white dark:bg-charcoal-700 rounded-full shadow-sm">
                <X size={20} className="text-charcoal-300 dark:text-sand-400" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-coral-50 dark:bg-coral-900/20 border border-coral-200 dark:border-coral-800 rounded-2xl text-sm text-coral-600 dark:text-coral-400">
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-500 mx-auto mb-4"></div>
                <p className="text-charcoal-300 dark:text-sand-400">Loading your ads...</p>
              </div>
            ) : ads.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-charcoal-500 dark:text-sand-300 mb-4">No ads created yet.</p>
                <p className="text-sm text-charcoal-400 dark:text-sand-400">
                  Create your first ad to promote your business!
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {ads.map((ad) => (
                  <Card key={ad._id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-display text-charcoal-500 dark:text-sand-50">
                            {ad.businessName}
                          </h3>
                          <span className={cn('px-2 py-1 rounded-lg text-[10px] font-bold uppercase', getStatusColor(ad.status))}>
                            {ad.status}
                          </span>
                        </div>
                        <p className="text-sm text-charcoal-400 dark:text-sand-400 mb-2">{ad.title}</p>
                        <div className="flex items-center gap-3 text-xs text-charcoal-300 dark:text-sand-400 flex-wrap">
                          <span className="px-2 py-1 bg-sage-100 dark:bg-sage-900/20 rounded-lg">
                            {getCategoryLabel(ad.category)}
                          </span>
                          {ad.adType && (
                            <span className={cn(
                              'px-2 py-1 text-[10px] font-bold rounded-lg uppercase',
                              ad.adType === 'global'
                                ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                                : 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            )}>
                              {ad.adType === 'global' ? 'Global' : `${ad.radiusKm || 10}km`}
                            </span>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock size={12} />
                            <span>{formatDate(ad.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingAd(ad);
                            setShowEditForm(true);
                          }}
                          className="p-2 hover:bg-sage-50 dark:hover:bg-sage-900/20 rounded-lg transition-colors"
                          title="Edit ad"
                        >
                          <Edit2 size={18} className="text-sage-600 dark:text-sage-400" />
                        </button>
                        <button
                          onClick={() => handleDelete(ad._id)}
                          className="p-2 hover:bg-coral-50 dark:hover:bg-coral-900/20 rounded-lg transition-colors"
                          title="Delete ad"
                        >
                          <Trash2 size={18} className="text-coral-600 dark:text-coral-400" />
                        </button>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-sand-200 dark:border-charcoal-700">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Eye size={16} className="text-sage-500" />
                          <span className="text-lg font-bold text-charcoal-500 dark:text-sand-50">
                            {ad.views || 0}
                          </span>
                        </div>
                        <p className="text-xs text-charcoal-400 dark:text-sand-400">Reach</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Star size={16} className="text-amber-500 fill-amber-500" />
                          <span className="text-lg font-bold text-charcoal-500 dark:text-sand-50">
                            {ad.averageRating > 0 ? ad.averageRating.toFixed(1) : '0.0'}
                          </span>
                        </div>
                        <p className="text-xs text-charcoal-400 dark:text-sand-400">Rating</p>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-charcoal-500 dark:text-sand-50 mb-1">
                          {ad.totalRatings || 0}
                        </div>
                        <p className="text-xs text-charcoal-400 dark:text-sand-400">Reviews</p>
                      </div>
                    </div>

                    {/* Recent Reviews Preview */}
                    {ad.ratings && ad.ratings.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-sand-200 dark:border-charcoal-700">
                        <h4 className="text-sm font-bold text-charcoal-500 dark:text-sand-50 mb-3">
                          Recent Reviews ({ad.ratings.length})
                        </h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {ad.ratings.slice(0, 3).map((rating, index) => {
                            const reviewer = rating.user;
                            const reviewerName = reviewer?.profile?.firstName
                              ? `${reviewer.profile.firstName} ${reviewer.profile.lastName || ''}`.trim()
                              : reviewer?.email?.split('@')[0] || 'User';

                            return (
                              <div key={index} className="p-2 bg-sage-50 dark:bg-sage-900/20 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        size={10}
                                        className={cn(
                                          star <= rating.rating
                                            ? 'text-amber-500 fill-amber-500'
                                            : 'text-charcoal-300 dark:text-sand-500'
                                        )}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-xs font-bold text-charcoal-500 dark:text-sand-50">
                                    {reviewerName}
                                  </span>
                                </div>
                                {rating.review && (
                                  <p className="text-xs text-charcoal-600 dark:text-sand-300 line-clamp-1">
                                    {rating.review}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {ad.ratings.length > 3 && (
                          <p className="text-xs text-charcoal-400 dark:text-sand-400 mt-2 text-center">
                            +{ad.ratings.length - 3} more reviews
                          </p>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </motion.div>

          {/* Edit Ad Form */}
          {showEditForm && editingAd && (
            <CreateAdForm
              isOpen={showEditForm}
              onClose={() => {
                setShowEditForm(false);
                setEditingAd(null);
              }}
              onSuccess={() => {
                setShowEditForm(false);
                setEditingAd(null);
                fetchMyAds();
              }}
              editData={editingAd}
            />
          )}
        </>
      )}
    </AnimatePresence>
  );
};

export default AdHistory;

