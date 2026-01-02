import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, MapPin, Phone, Mail, Globe, Facebook, Instagram, Twitter, Clock } from 'lucide-react';
import { adApi } from '../../api/ad';
import { useAuthStore } from '../../store/useAuthStore';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { cn } from '../../utils';

/**
 * Ad Detail View
 * Shows full ad details with ratings and reviews
 * Can be used as a route component (with useParams) or as a modal (with adId prop)
 */
const AdDetailView = ({ adId: propAdId = null, onClose = null }) => {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use prop adId if provided (modal mode), otherwise use route param (route mode)
  const adId = propAdId || routeId;

  useEffect(() => {
    const fetchAd = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await adApi.getAdById(adId);
        
        if (response?.success && response?.data?.ad) {
          setAd(response.data.ad);
        } else {
          setError('Ad not found');
        }
      } catch (err) {
        console.error('Error fetching ad:', err);
        setError(err.message || 'Failed to load ad');
      } finally {
        setLoading(false);
      }
    };

    if (adId) {
      fetchAd();
    }
  }, [adId]);

  const handleRateAd = async () => {
    if (rating === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await adApi.rateAd(adId, rating, review.trim() || null);
      if (response?.success && response?.data?.ad) {
        setAd(response.data.ad);
        setShowRatingForm(false);
        setRating(0);
        setReview('');
      } else {
        throw new Error('Failed to submit rating');
      }
    } catch (err) {
      console.error('Error rating ad:', err);
      alert(err.message || 'Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
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

  // Check if current user already rated
  const userRating = ad?.ratings?.find(
    r => (r.user?._id?.toString() || r.user?.toString()) === currentUser?._id?.toString()
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-sand-100 dark:bg-charcoal-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-500 mx-auto mb-4"></div>
          <p className="text-charcoal-500 dark:text-sand-300">Loading ad...</p>
        </div>
      </div>
    );
  }

  if (error || !ad) {
    return (
      <div className="min-h-screen bg-sand-100 dark:bg-charcoal-900 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <p className="text-charcoal-500 dark:text-sand-300 mb-4">{error || 'Ad not found'}</p>
          <Button onClick={() => {
            if (onClose) {
              onClose();
            } else {
              navigate(-1);
            }
          }}>Go Back</Button>
        </Card>
      </div>
    );
  }

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

  return (
    <div className={`${onClose ? 'bg-white dark:bg-charcoal-800 rounded-t-3xl mt-20' : 'min-h-screen bg-sand-100 dark:bg-charcoal-900'} pb-24`}>
      {/* Header */}
      <div className="bg-white dark:bg-charcoal-800 border-b border-sand-200 dark:border-charcoal-700 sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => {
              if (onClose) {
                onClose();
              } else {
                navigate(-1);
              }
            }}
            className="p-2 hover:bg-sand-100 dark:hover:bg-charcoal-700 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-charcoal-500 dark:text-sand-300" />
          </button>
          <h1 className="text-xl font-display text-charcoal-500 dark:text-sand-50">Ad Details</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-4">
        {/* Ad Image */}
        {ad.image && (
          <div className="w-full h-48 rounded-2xl overflow-hidden">
            <img src={ad.image} alt={ad.businessName} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Business Info */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-display text-charcoal-500 dark:text-sand-50 mb-2">
                {ad.businessName}
              </h2>
              <p className="text-sm text-charcoal-400 dark:text-sand-400 mb-3">{ad.title}</p>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-sage-100 dark:bg-sage-900/20 text-sage-600 dark:text-sage-400 text-xs font-bold rounded-full uppercase">
                  {getCategoryLabel(ad.category)}
                </span>
                {ad.averageRating > 0 && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-full">
                    <Star size={14} className="text-amber-500 fill-amber-500" />
                    <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                      {ad.averageRating}
                    </span>
                    <span className="text-xs text-charcoal-400 dark:text-sand-400">
                      ({ad.totalRatings})
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {ad.description && (
            <div className="mt-4 pt-4 border-t border-sand-200 dark:border-charcoal-700">
              <p className="text-sm text-charcoal-600 dark:text-sand-300 leading-relaxed">
                {ad.description}
              </p>
            </div>
          )}

          {/* Location */}
          {ad.location && (
            <div className="mt-4 pt-4 border-t border-sand-200 dark:border-charcoal-700">
              <div className="flex items-start gap-2">
                <MapPin size={18} className="text-sage-500 mt-1" />
                <div>
                  {ad.location.address && (
                    <p className="text-sm text-charcoal-600 dark:text-sand-300">{ad.location.address}</p>
                  )}
                  {(ad.location.city || ad.location.state) && (
                    <p className="text-xs text-charcoal-400 dark:text-sand-400">
                      {[ad.location.city, ad.location.state, ad.location.zipCode].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Contact Information */}
          {ad.contact && (ad.contact.phone || ad.contact.email || ad.contact.website || ad.contact.socialMedia) && (
            <div className="mt-4 pt-4 border-t border-sand-200 dark:border-charcoal-700">
              <h3 className="text-sm font-bold text-charcoal-500 dark:text-sand-50 mb-3">Contact</h3>
              <div className="space-y-2">
                {ad.contact.phone && (
                  <div className="flex items-center gap-2 text-sm text-charcoal-600 dark:text-sand-300">
                    <Phone size={16} className="text-sage-500" />
                    <a href={`tel:${ad.contact.phone}`} className="hover:underline">
                      {ad.contact.phone}
                    </a>
                  </div>
                )}
                {ad.contact.email && (
                  <div className="flex items-center gap-2 text-sm text-charcoal-600 dark:text-sand-300">
                    <Mail size={16} className="text-sage-500" />
                    <a href={`mailto:${ad.contact.email}`} className="hover:underline">
                      {ad.contact.email}
                    </a>
                  </div>
                )}
                {ad.contact.website && (
                  <div className="flex items-center gap-2 text-sm text-charcoal-600 dark:text-sand-300">
                    <Globe size={16} className="text-sage-500" />
                    <a href={ad.contact.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {ad.contact.website}
                    </a>
                  </div>
                )}
                {ad.contact.socialMedia && (
                  <div className="flex items-center gap-3 mt-2">
                    {ad.contact.socialMedia.facebook && (
                      <a href={ad.contact.socialMedia.facebook} target="_blank" rel="noopener noreferrer">
                        <Facebook size={18} className="text-blue-600" />
                      </a>
                    )}
                    {ad.contact.socialMedia.instagram && (
                      <a href={ad.contact.socialMedia.instagram} target="_blank" rel="noopener noreferrer">
                        <Instagram size={18} className="text-pink-600" />
                      </a>
                    )}
                    {ad.contact.socialMedia.twitter && (
                      <a href={ad.contact.socialMedia.twitter} target="_blank" rel="noopener noreferrer">
                        <Twitter size={18} className="text-blue-400" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Ratings and Reviews */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-display text-charcoal-500 dark:text-sand-50">
              Ratings & Reviews ({ad.totalRatings})
            </h3>
            {!userRating && (
              <Button
                onClick={() => setShowRatingForm(!showRatingForm)}
                className="text-sm py-2 px-4"
              >
                Rate this Ad
              </Button>
            )}
          </div>

          {/* Rating Form */}
          {showRatingForm && !userRating && (
            <div className="mb-6 p-4 bg-sage-50 dark:bg-sage-900/20 rounded-xl border border-sage-200 dark:border-sage-700">
              <h4 className="text-sm font-bold text-charcoal-500 dark:text-sand-50 mb-3">Your Rating</h4>
              <div className="flex items-center gap-2 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={cn(
                      'transition-colors',
                      star <= rating ? 'text-amber-500' : 'text-charcoal-300 dark:text-sand-500'
                    )}
                  >
                    <Star size={24} className={star <= rating ? 'fill-amber-500' : ''} />
                  </button>
                ))}
              </div>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Write a review (optional)..."
                className="w-full bg-white dark:bg-charcoal-700 border border-sand-200 dark:border-charcoal-600 rounded-xl px-4 py-3 text-sm text-charcoal-500 dark:text-sand-300 focus:outline-none focus:ring-2 focus:ring-sage-500/20 resize-none mb-3"
                rows={3}
                maxLength={500}
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-charcoal-300 dark:text-sand-500">
                  {review.length}/500
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowRatingForm(false);
                      setRating(0);
                      setReview('');
                    }}
                    className="px-4 py-2 text-sm text-charcoal-400 dark:text-sand-400 hover:text-charcoal-600 dark:hover:text-sand-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <Button
                    onClick={handleRateAd}
                    disabled={rating === 0 || isSubmitting}
                    className="text-sm py-2 px-4"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* User's Rating */}
          {userRating && (
            <div className="mb-4 p-4 bg-sage-50 dark:bg-sage-900/20 rounded-xl border border-sage-200 dark:border-sage-700">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      className={cn(
                        star <= userRating.rating
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-charcoal-300 dark:text-sand-500'
                      )}
                    />
                  ))}
                </div>
                <span className="text-xs text-charcoal-400 dark:text-sand-400">
                  Your rating • {formatDate(userRating.createdAt)}
                </span>
              </div>
              {userRating.review && (
                <p className="text-sm text-charcoal-600 dark:text-sand-300 mt-2">{userRating.review}</p>
              )}
            </div>
          )}

          {/* All Reviews */}
          {ad.ratings && ad.ratings.length > 0 ? (
            <div className="space-y-4">
              {ad.ratings.map((ratingItem, index) => {
                const reviewer = ratingItem.user;
                const reviewerName = reviewer?.profile?.firstName
                  ? `${reviewer.profile.firstName} ${reviewer.profile.lastName || ''}`.trim()
                  : reviewer?.email?.split('@')[0] || 'User';

                return (
                  <div key={index} className="p-4 bg-white dark:bg-charcoal-800 rounded-xl border border-sand-200 dark:border-charcoal-700">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-sage-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {reviewerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-charcoal-500 dark:text-sand-50">{reviewerName}</p>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={12}
                                className={cn(
                                  star <= ratingItem.rating
                                    ? 'text-amber-500 fill-amber-500'
                                    : 'text-charcoal-300 dark:text-sand-500'
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-charcoal-300 dark:text-sand-400">
                        {formatDate(ratingItem.createdAt)}
                      </span>
                    </div>
                    {ratingItem.review && (
                      <p className="text-sm text-charcoal-600 dark:text-sand-300 mt-2">
                        {ratingItem.review}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-charcoal-400 dark:text-sand-500 text-center py-4">
              No ratings yet. Be the first to rate!
            </p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdDetailView;

