import React, { useEffect, useState } from 'react';
import { Star, MapPin, Clock } from 'lucide-react';
import { adApi } from '../api/ad';
import { useAuthStore } from '../store/useAuthStore';
import { useTabStore } from '../store/useTabStore';
import Card from './Card';
import AdDetailView from '../features/ads/AdDetailView';
import { cn } from '../utils';

/**
 * Nearby Ads Preview Component
 * Shows nearby ads on home page
 */
const NearbyAdsPreview = () => {
  const setActiveTab = useTabStore((state) => state.setActiveTab);
  const currentUser = useAuthStore((state) => state.user);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdId, setSelectedAdId] = useState(null);

  const fetchRandomAds = async () => {
    try {
      setLoading(true);

      // Get 2 random ads (excludes creator's own ads)
      const response = await adApi.getRandomAds(2);
      
      if (response?.success && response?.data?.ads) {
        setAds(response.data.ads);
      } else {
        setAds([]);
      }
    } catch (err) {
      console.error('Error fetching random ads:', err);
      setAds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomAds();
    // Refresh every 5 minutes (300000 ms) to get new random ads
    const interval = setInterval(fetchRandomAds, 300000);
    return () => clearInterval(interval);
  }, [currentUser]);

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

  if (loading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg text-charcoal-500 dark:text-sand-50">Nearby Ads</h3>
          <button 
            onClick={() => setActiveTab('discover')}
            className="text-sage-600 dark:text-sage-400 text-sm font-medium hover:underline"
          >
            View all
          </button>
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Card key={i} className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-sand-200 dark:bg-charcoal-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-sand-200 dark:bg-charcoal-700 rounded w-1/2"></div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg text-charcoal-500 dark:text-sand-50">Nearby Ads</h3>
          <button 
            onClick={() => setActiveTab('discover')}
            className="text-sage-600 dark:text-sage-400 text-sm font-medium hover:underline"
          >
            View all
          </button>
        </div>
      
      {ads.length === 0 ? (
        <Card className="p-4 text-center">
          <p className="text-sm text-charcoal-400 dark:text-sand-500">No ads available at the moment.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {ads.map((ad) => (
            <Card 
              key={ad._id} 
              className="p-4 flex gap-4 items-center cursor-pointer hover:bg-white dark:hover:bg-charcoal-700 transition-colors"
              onClick={() => setSelectedAdId(ad._id)}
            >
              <div className="w-12 h-12 rounded-2xl bg-sage-100 dark:bg-sage-900/20 flex items-center justify-center shrink-0">
                {ad.image ? (
                  <img src={ad.image} alt={ad.businessName} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <span className="text-sage-600 dark:text-sage-400 font-bold text-xs">
                    {ad.businessName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-charcoal-500 dark:text-sand-50 truncate">
                    {ad.businessName}
                  </h4>
                  {ad.averageRating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star size={12} className="text-amber-500 fill-amber-500" />
                      <span className="text-xs text-charcoal-400 dark:text-sand-400">
                        {ad.averageRating}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-charcoal-300 dark:text-sand-400 line-clamp-1">
                  {ad.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-sage-600 dark:text-sage-400 font-medium">
                    {getCategoryLabel(ad.category)}
                  </span>
                  <span className="text-[10px] text-charcoal-200 dark:text-sand-500">•</span>
                  <div className="flex items-center gap-1 text-[10px] text-charcoal-300 dark:text-sand-400">
                    <Clock size={10} />
                    <span>{formatDate(ad.createdAt)}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Ad Detail View Modal */}
      {selectedAdId && (
        <div className="fixed inset-0 z-[80] bg-charcoal-900/40 backdrop-blur-sm" onClick={() => setSelectedAdId(null)}>
          <div className="absolute inset-0 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <AdDetailView adId={selectedAdId} onClose={() => setSelectedAdId(null)} />
          </div>
        </div>
      )}
    </section>
  );
};

export default NearbyAdsPreview;

