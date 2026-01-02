import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Info } from 'lucide-react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { useHelpStore } from '../../store/useHelpStore';
import { useAuthStore } from '../../store/useAuthStore';
import { helpRequestApi } from '../../api/helpRequest';
import { cn } from '../../utils';

const CreateHelpRequest = ({ isOpen, onClose }) => {
  const user = useAuthStore((state) => state.user);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Physical',
    priority: 'low',
    budget: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const categories = ['Physical', 'Auto', 'Delivery', 'Technical', 'General'];
  const priorities = ['low', 'medium', 'high'];

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

      // Prepare request data
      const requestData = {
        title: formData.title,
        description: formData.description || '',
        category: formData.category,
        priority: formData.priority,
        location: {
          latitude,
          longitude,
          address: null,
          description: null
        }
      };

      // Only include budget if it's provided and valid
      if (formData.budget && formData.budget.trim() !== '') {
        const budgetValue = parseFloat(formData.budget);
        if (!isNaN(budgetValue) && budgetValue > 0) {
          requestData.budget = budgetValue;
        }
      }

      // Call API to create help request
      const response = await helpRequestApi.createHelpRequest(requestData);

      if (response?.success) {
        // Reset form and close
        setFormData({ title: '', category: 'Physical', priority: 'low', budget: '', description: '' });
        onClose();
      } else {
        throw new Error('Failed to create help request');
      }
    } catch (err) {
      console.error('Error creating help request:', err);
      
      // Extract detailed error message
      let errorMessage = 'Failed to create help request. Please try again.';
      
      // Check if there are validation details
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
            className="fixed bottom-0 left-0 right-0 bg-sand-100 rounded-t-[3rem] p-8 z-[70] max-w-2xl mx-auto shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-display text-charcoal-500">Ask for Help</h2>
              <button onClick={onClose} className="p-2 bg-white rounded-full shadow-sm">
                <X size={20} className="text-charcoal-300" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 pb-8">
              {/* Error Message */}
              {error && (
                <div className="p-4 bg-coral-50 dark:bg-coral-900/20 border border-coral-200 dark:border-coral-800 rounded-2xl text-sm text-coral-600 dark:text-coral-400">
                  {error}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-sage-600 block mb-2">What do you need help with?</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Need help with groceries"
                  className="w-full bg-white border border-sand-200 rounded-2xl px-5 py-4 text-charcoal-500 focus:outline-none focus:ring-2 focus:ring-sage-500/20"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              {/* Description (Optional) */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-sage-600 block mb-2">
                  Description (Optional)
                </label>
                <textarea
                  placeholder="Add more details about what you need help with..."
                  rows={4}
                  maxLength={2000}
                  className="w-full bg-white border border-sand-200 rounded-2xl px-5 py-4 text-charcoal-500 focus:outline-none focus:ring-2 focus:ring-sage-500/20 resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
                <div className="mt-1 text-right">
                  <span className="text-[10px] text-charcoal-300 dark:text-sand-400">
                    {formData.description.length}/2000
                  </span>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-sage-600 block mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat })}
                      className={cn(
                        'px-4 py-2 rounded-xl text-xs font-bold transition-all',
                        formData.category === cat ? 'bg-sage-500 text-white' : 'bg-white text-charcoal-300 border border-sand-200'
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-sage-600 block mb-2">Urgency</label>
                <div className="grid grid-cols-3 gap-3">
                  {priorities.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormData({ ...formData, priority: p })}
                      className={cn(
                        'flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all',
                        formData.priority === p 
                          ? 'border-sage-500 bg-sage-50 text-sage-600' 
                          : 'border-transparent bg-white text-charcoal-300'
                      )}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-widest">{p}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget (Optional) */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-sage-600 block mb-2">Offer Budget (Optional)</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-charcoal-200">$</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full bg-white border border-sand-200 rounded-2xl pl-10 pr-5 py-4 text-charcoal-500 focus:outline-none focus:ring-2 focus:ring-sage-500/20"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  />
                </div>
                <div className="mt-2 flex items-center gap-2 text-charcoal-200 italic">
                  <Info size={12} />
                  <span className="text-[10px]">Helpers appreciate even small tokens of thanks.</span>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full py-5 text-lg rounded-[2rem] mt-4"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Posting...' : 'Post Help Request'}
              </Button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CreateHelpRequest;


