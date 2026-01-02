import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Button from '../../components/Button';
import { adApi } from '../../api/ad';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '../../utils';

const CreateAdForm = ({ isOpen, onClose, onSuccess, editData = null }) => {
  const user = useAuthStore((state) => state.user);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    category: 'shop',
    businessName: '',
    businessType: '',
    location: {
      address: '',
      city: '',
      state: '',
      zipCode: ''
    },
    contact: {
      phone: '',
      email: '',
      website: '',
      socialMedia: {
        facebook: '',
        instagram: '',
        twitter: ''
      }
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Initialize form data from editData if editing
  useEffect(() => {
    if (editData && isOpen) {
      setFormData({
        title: editData.title || '',
        description: editData.description || '',
        image: editData.image || '',
        category: editData.category || 'shop',
        businessName: editData.businessName || '',
        businessType: editData.businessType || '',
        location: {
          address: editData.location?.address || '',
          city: editData.location?.city || '',
          state: editData.location?.state || '',
          zipCode: editData.location?.zipCode || ''
        },
        contact: {
          phone: editData.contact?.phone || '',
          email: editData.contact?.email || '',
          website: editData.contact?.website || '',
          socialMedia: {
            facebook: editData.contact?.socialMedia?.facebook || '',
            instagram: editData.contact?.socialMedia?.instagram || '',
            twitter: editData.contact?.socialMedia?.twitter || ''
          }
        }
      });
    } else if (!editData && isOpen) {
      // Reset form for new ad
      setFormData({
        title: '',
        description: '',
        image: '',
        category: 'shop',
        businessName: '',
        businessType: '',
        location: { address: '', city: '', state: '', zipCode: '' },
        contact: { phone: '', email: '', website: '', socialMedia: { facebook: '', instagram: '', twitter: '' } }
      });
    }
  }, [editData, isOpen]);

  const categories = [
    { id: 'shop', label: 'Shop' },
    { id: 'restaurant', label: 'Restaurant' },
    { id: 'service', label: 'Service' },
    { id: 'brand', label: 'Brand' },
    { id: 'event', label: 'Event' },
    { id: 'other', label: 'Other' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setError('');

    try {
      // Get user location (required)
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
      } else if (user?.location?.latitude && user?.location?.longitude) {
        latitude = user.location.latitude;
        longitude = user.location.longitude;
      } else {
        throw new Error('Location is required. Please enable location services.');
      }

      // Call API to create or update ad
      let response;
      if (editData && editData._id) {
        // Update existing ad
        response = await adApi.updateAd(editData._id, {
          title: formData.title,
          description: formData.description,
          image: formData.image || null,
          category: formData.category,
          businessName: formData.businessName,
          businessType: formData.businessType || null,
          location: {
            latitude,
            longitude,
            address: formData.location.address || null,
            city: formData.location.city || null,
            state: formData.location.state || null,
            zipCode: formData.location.zipCode || null
          },
          contact: {
            phone: formData.contact.phone || null,
            email: formData.contact.email || null,
            website: formData.contact.website || null,
            socialMedia: {
              facebook: formData.contact.socialMedia.facebook || null,
              instagram: formData.contact.socialMedia.instagram || null,
              twitter: formData.contact.socialMedia.twitter || null
            }
          }
        });
      } else {
        // Create new ad
        response = await adApi.createAd({
          title: formData.title,
          description: formData.description,
          image: formData.image || null,
          category: formData.category,
          businessName: formData.businessName,
          businessType: formData.businessType || null,
          location: {
            latitude,
            longitude,
            address: formData.location.address || null,
            city: formData.location.city || null,
            state: formData.location.state || null,
            zipCode: formData.location.zipCode || null
          },
          contact: {
            phone: formData.contact.phone || null,
            email: formData.contact.email || null,
            website: formData.contact.website || null,
            socialMedia: {
              facebook: formData.contact.socialMedia.facebook || null,
              instagram: formData.contact.socialMedia.instagram || null,
              twitter: formData.contact.socialMedia.twitter || null
            }
          }
        });
      }

      if (response?.success) {
        // Reset form and close
        if (!editData) {
          setFormData({
            title: '',
            description: '',
            image: '',
            category: 'shop',
            businessName: '',
            businessType: '',
            location: { address: '', city: '', state: '', zipCode: '' },
            contact: { phone: '', email: '', website: '', socialMedia: { facebook: '', instagram: '', twitter: '' } }
          });
        }
        if (onSuccess) onSuccess();
        onClose();
      } else {
        throw new Error(editData ? 'Failed to update ad' : 'Failed to create ad');
      }
    } catch (err) {
      console.error('Error creating ad:', err);
      
      let errorMessage = 'Failed to create ad. Please try again.';
      if (err.details && Array.isArray(err.details) && err.details.length > 0) {
        const validationErrors = err.details.map(d => d.msg || d.message || JSON.stringify(d)).join(', ');
        errorMessage = `Validation error: ${validationErrors}`;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
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
              <h2 className="text-2xl font-display text-charcoal-500 dark:text-sand-50">
                {editData ? 'Edit Ad' : 'Create Ad'}
              </h2>
              <button onClick={onClose} className="p-2 bg-white dark:bg-charcoal-700 rounded-full shadow-sm">
                <X size={20} className="text-charcoal-300 dark:text-sand-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 pb-8">
              {error && (
                <div className="p-4 bg-coral-50 dark:bg-coral-900/20 border border-coral-200 dark:border-coral-800 rounded-2xl text-sm text-coral-600 dark:text-coral-400">
                  {error}
                </div>
              )}

              {/* Business Name */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-sage-600 dark:text-sage-400 block mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Joe's Coffee Shop"
                  className="w-full bg-white dark:bg-charcoal-700 border border-sand-200 dark:border-charcoal-600 rounded-2xl px-5 py-4 text-charcoal-500 dark:text-sand-300 focus:outline-none focus:ring-2 focus:ring-sage-500/20"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                />
              </div>

              {/* Title */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-sage-600 dark:text-sage-400 block mb-2">
                  Ad Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fresh coffee and pastries daily"
                  className="w-full bg-white dark:bg-charcoal-700 border border-sand-200 dark:border-charcoal-600 rounded-2xl px-5 py-4 text-charcoal-500 dark:text-sand-300 focus:outline-none focus:ring-2 focus:ring-sage-500/20"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-sage-600 dark:text-sage-400 block mb-2">
                  Description *
                </label>
                <textarea
                  required
                  placeholder="Describe your business, products, or services..."
                  rows={4}
                  maxLength={2000}
                  className="w-full bg-white dark:bg-charcoal-700 border border-sand-200 dark:border-charcoal-600 rounded-2xl px-5 py-4 text-charcoal-500 dark:text-sand-300 focus:outline-none focus:ring-2 focus:ring-sage-500/20 resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
                <div className="mt-1 text-right">
                  <span className="text-[10px] text-charcoal-300 dark:text-sand-500">
                    {formData.description.length}/2000
                  </span>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-sage-600 dark:text-sage-400 block mb-2">
                  Category *
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat.id })}
                      className={cn(
                        'px-4 py-2 rounded-xl text-xs font-bold transition-all',
                        formData.category === cat.id
                          ? 'bg-sage-500 text-white'
                          : 'bg-white dark:bg-charcoal-700 text-charcoal-300 dark:text-sand-400 border border-sand-200 dark:border-charcoal-600'
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Image URL (Optional) */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-sage-600 dark:text-sage-400 block mb-2">
                  Image URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  className="w-full bg-white dark:bg-charcoal-700 border border-sand-200 dark:border-charcoal-600 rounded-2xl px-5 py-4 text-charcoal-500 dark:text-sand-300 focus:outline-none focus:ring-2 focus:ring-sage-500/20"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                />
              </div>

              {/* Contact Information */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-sage-600 dark:text-sage-400 block mb-2">
                  Contact Information (Optional)
                </label>
                <div className="space-y-3">
                  <input
                    type="tel"
                    placeholder="Phone"
                    className="w-full bg-white dark:bg-charcoal-700 border border-sand-200 dark:border-charcoal-600 rounded-2xl px-5 py-4 text-charcoal-500 dark:text-sand-300 focus:outline-none focus:ring-2 focus:ring-sage-500/20"
                    value={formData.contact.phone}
                    onChange={(e) => setFormData({
                      ...formData,
                      contact: { ...formData.contact, phone: e.target.value }
                    })}
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    className="w-full bg-white dark:bg-charcoal-700 border border-sand-200 dark:border-charcoal-600 rounded-2xl px-5 py-4 text-charcoal-500 dark:text-sand-300 focus:outline-none focus:ring-2 focus:ring-sage-500/20"
                    value={formData.contact.email}
                    onChange={(e) => setFormData({
                      ...formData,
                      contact: { ...formData.contact, email: e.target.value }
                    })}
                  />
                  <input
                    type="url"
                    placeholder="Website"
                    className="w-full bg-white dark:bg-charcoal-700 border border-sand-200 dark:border-charcoal-600 rounded-2xl px-5 py-4 text-charcoal-500 dark:text-sand-300 focus:outline-none focus:ring-2 focus:ring-sage-500/20"
                    value={formData.contact.website}
                    onChange={(e) => setFormData({
                      ...formData,
                      contact: { ...formData.contact, website: e.target.value }
                    })}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full py-5 text-lg rounded-[2rem] mt-4"
                disabled={isSubmitting}
              >
                {isSubmitting 
                  ? (editData ? 'Updating...' : 'Creating...') 
                  : (editData ? 'Update Ad' : 'Create Ad')
                }
              </Button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CreateAdForm;

