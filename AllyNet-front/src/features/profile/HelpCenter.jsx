import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, MessageSquare, AlertCircle } from 'lucide-react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { contactApi } from '../../api/contact';

const HelpCenter = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    category: 'question'
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.subject.trim() || !formData.message.trim()) {
      setError('Subject and message are required');
      return;
    }

    if (formData.message.trim().length < 10) {
      setError('Message must be at least 10 characters long');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(false);
      
      const response = await contactApi.submitContact(
        formData.subject.trim(),
        formData.message.trim(),
        formData.category
      );
      
      if (response?.success) {
        setSuccess(true);
        setFormData({ subject: '', message: '', category: 'question' });
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccess(false);
        }, 5000);
      } else {
        throw new Error('Failed to submit message');
      }
    } catch (err) {
      console.error('Error submitting contact form:', err);
      setError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const categoryOptions = [
    { value: 'question', label: 'General Question' },
    { value: 'complaint', label: 'Complaint' },
    { value: 'bug_report', label: 'Bug Report' },
    { value: 'feature_request', label: 'Feature Request' },
    { value: 'other', label: 'Other' }
  ];

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
          <h1 className="text-xl font-display text-charcoal-500 dark:text-sand-50">Help Center</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-4">
        {/* Info Card */}
        <Card className="p-4 bg-sage-50 dark:bg-sage-900/20 border border-sage-200 dark:border-sage-800">
          <div className="flex items-start gap-3">
            <MessageSquare size={20} className="text-sage-600 dark:text-sage-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-sage-800 dark:text-sage-200 font-medium mb-1">
                Need Help or Have a Question?
              </p>
              <p className="text-xs text-sage-700 dark:text-sage-300">
                Fill out the form below and our development team will get back to you as soon as possible.
              </p>
            </div>
          </div>
        </Card>

        {/* Success Message */}
        {success && (
          <Card className="p-4 bg-sage-50 dark:bg-sage-900/20 border border-sage-200 dark:border-sage-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-sage-500 flex items-center justify-center shrink-0">
                <Send size={16} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-sage-800 dark:text-sage-200">
                  Message Sent Successfully!
                </p>
                <p className="text-xs text-sage-700 dark:text-sage-300 mt-0.5">
                  We've received your message and will get back to you soon.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="p-4 bg-coral-50 dark:bg-coral-900/20 border border-coral-200 dark:border-coral-800">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-coral-600 dark:text-coral-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-coral-800 dark:text-coral-200 font-medium">Error</p>
                <p className="text-xs text-coral-700 dark:text-coral-300 mt-1">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Contact Form */}
        <Card className="p-6">
          <h2 className="text-lg font-display font-bold text-charcoal-500 dark:text-sand-50 mb-6">
            Contact Us
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-charcoal-500 dark:text-sand-400 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2.5 border border-sand-300 dark:border-charcoal-600 rounded-lg bg-white dark:bg-charcoal-700 text-charcoal-500 dark:text-sand-50 focus:outline-none focus:ring-2 focus:ring-sage-500"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-charcoal-500 dark:text-sand-400 mb-2">
                Subject <span className="text-coral-500">*</span>
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Brief description of your inquiry"
                className="w-full px-4 py-2.5 border border-sand-300 dark:border-charcoal-600 rounded-lg bg-white dark:bg-charcoal-700 text-charcoal-500 dark:text-sand-50 placeholder:text-charcoal-300 dark:placeholder:text-sand-500 focus:outline-none focus:ring-2 focus:ring-sage-500"
                required
                maxLength={200}
              />
              <p className="text-xs text-charcoal-300 dark:text-sand-500 mt-1">
                {formData.subject.length}/200 characters
              </p>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-charcoal-500 dark:text-sand-400 mb-2">
                Message <span className="text-coral-500">*</span>
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Please provide details about your question, complaint, or feedback..."
                rows={8}
                className="w-full px-4 py-2.5 border border-sand-300 dark:border-charcoal-600 rounded-lg bg-white dark:bg-charcoal-700 text-charcoal-500 dark:text-sand-50 placeholder:text-charcoal-300 dark:placeholder:text-sand-500 focus:outline-none focus:ring-2 focus:ring-sage-500 resize-none"
                required
                maxLength={2000}
              />
              <p className="text-xs text-charcoal-300 dark:text-sand-500 mt-1">
                {formData.message.length}/2000 characters (minimum 10 characters)
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={submitting || !formData.subject.trim() || !formData.message.trim() || formData.message.trim().length < 10}
              className="w-full"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send size={18} className="mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default HelpCenter;
