import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MapPin, Search, Filter, Plus, X, History } from 'lucide-react';
import { adApi } from '../../api/ad';
import { useAuthStore } from '../../store/useAuthStore';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { cn } from '../../utils';
import CreateAdForm from './CreateAdForm';
import AdHistory from '../ads/AdHistory';
import AdDetailView from '../ads/AdDetailView';

const DiscoveryView = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAdHistory, setShowAdHistory] = useState(false);
  const [selectedAdId, setSelectedAdId] = useState(null);
  const [category, setCategory] = useState(null);

  const fetchAds = useCallback(async () => {
    try {
      setLoading(true);
      // Get all active ads (not location-based for explore page)
      const response = await adApi.getAllAds({ category, status: 'active', limit: 100 });
      
      if (response?.success && response?.data?.ads) {
        setAds(response.data.ads);
      } else {
        setAds([]);
      }
    } catch (err) {
      console.error('Error fetching ads:', err);
      setAds([]);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchAds();
    // Refresh ads every 10 seconds to get newly created ads
    const interval = setInterval(fetchAds, 10000);
    return () => clearInterval(interval);
  }, [fetchAds]);

  const categories = [
    { id: null, label: 'All' },
    { id: 'shop', label: 'Shop' },
    { id: 'restaurant', label: 'Restaurant' },
    { id: 'service', label: 'Service' },
    { id: 'brand', label: 'Brand' },
    { id: 'event', label: 'Event' },
    { id: 'other', label: 'Other' }
  ];

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

  return (
    <div className="space-y-6 pb-6">
      {/* Header with Create and History Buttons */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display text-charcoal-500 dark:text-sand-50">Explore Ads</h2>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAdHistory(true)}
            className="flex items-center gap-2 text-sm py-2 px-4 bg-charcoal-500 dark:bg-charcoal-700 hover:bg-charcoal-600 dark:hover:bg-charcoal-600"
          >
            <History size={16} />
            Ad History
          </Button>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 text-sm py-2 px-4"
          >
            <Plus size={16} />
            Create Ad
          </Button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id || 'all'}
            onClick={() => setCategory(cat.id)}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all',
              category === cat.id
                ? 'bg-sage-500 text-white'
                : 'bg-white dark:bg-charcoal-800 text-charcoal-300 dark:text-sand-400 border border-sand-200 dark:border-charcoal-700'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Create Ad Form Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <CreateAdForm
            isOpen={showCreateForm}
            onClose={() => setShowCreateForm(false)}
            onSuccess={async () => {
              setShowCreateForm(false);
              // Refresh ads immediately after creation
              await fetchAds();
            }}
          />
        )}
      </AnimatePresence>

      {/* Ad History Modal */}
      <AdHistory
        isOpen={showAdHistory}
        onClose={() => setShowAdHistory(false)}
      />

      {/* Ads Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-500 mx-auto mb-4"></div>
          <p className="text-charcoal-300 dark:text-sand-400">Loading ads...</p>
        </div>
      ) : ads.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-charcoal-500 dark:text-sand-300">No ads found.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {ads.map((ad) => (
            <AdCard key={ad._id} ad={ad} onNavigate={() => setSelectedAdId(ad._id)} formatDate={formatDate} />
          ))}
        </div>
      )}

      {/* Ad Detail View Modal */}
      <AnimatePresence>
        {selectedAdId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-charcoal-900/40 backdrop-blur-sm"
            onClick={() => setSelectedAdId(null)}
          >
            <div className="absolute inset-0 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <AdDetailView adId={selectedAdId} onClose={() => setSelectedAdId(null)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AdCard = ({ ad, onNavigate, formatDate }) => {
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
    <Card 
      className="p-0 overflow-hidden flex flex-col sm:flex-row h-auto sm:h-48 group cursor-pointer hover:border-sage-200 dark:hover:border-sage-700 transition-all"
      onClick={onNavigate}
    >
      <div className="w-full sm:w-48 h-48 sm:h-full relative shrink-0">
        {ad.image ? (
          <img src={ad.image} alt={ad.businessName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-sage-100 dark:bg-sage-900/20 flex items-center justify-center">
            <span className="text-sage-600 dark:text-sage-400 font-bold text-2xl">
              {ad.businessName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {ad.averageRating > 0 && (
          <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-md rounded-lg flex items-center gap-1">
            <Star size={12} className="text-amber-500 fill-amber-500" />
            <span className="text-[10px] font-bold text-charcoal-500">{ad.averageRating}</span>
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col justify-between flex-1">
        <div>
          <div className="flex justify-between items-start mb-1">
            <span className="text-[10px] font-bold text-sage-600 dark:text-sage-400 uppercase tracking-widest">
              {getCategoryLabel(ad.category)}
            </span>
          </div>
          <h3 className="text-lg font-display text-charcoal-500 dark:text-sand-50 mb-1">{ad.businessName}</h3>
          <p className="text-sm text-charcoal-400 dark:text-sand-400 mb-2 line-clamp-2">{ad.title}</p>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-1.5 text-charcoal-300 dark:text-sand-400">
            <MapPin size={14} />
            <span className="text-xs">
              {ad.location?.city || ad.location?.address || 'Location available'}
            </span>
          </div>
          <span className="text-xs text-charcoal-300 dark:text-sand-400">{formatDate(ad.createdAt)}</span>
        </div>
      </div>
    </Card>
  );
};

export default DiscoveryView;


