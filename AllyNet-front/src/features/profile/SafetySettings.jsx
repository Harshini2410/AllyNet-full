import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Mail, User as UserIcon } from 'lucide-react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { api } from '../../api/auth';
import { cn } from '../../utils';

const SafetySettings = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [deleteLoading, setDeleteLoading] = useState({});

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getEmergencyContacts();
      if (response?.success && response?.data?.contacts) {
        setContacts(response.data.contacts);
      } else {
        setContacts([]);
      }
    } catch (err) {
      console.error('Error fetching emergency contacts:', err);
      setError(err.message || 'Failed to load emergency contacts');
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Name and email are required');
      return;
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setAdding(true);
      setError(null);
      const response = await api.addEmergencyContact(formData.name.trim(), formData.email.trim());
      if (response?.success) {
        setFormData({ name: '', email: '' });
        setShowAddForm(false);
        fetchContacts(); // Refresh list
      } else {
        throw new Error('Failed to add contact');
      }
    } catch (err) {
      console.error('Error adding emergency contact:', err);
      setError(err.message || 'Failed to add emergency contact');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteContact = async (contactId) => {
    if (!window.confirm('Are you sure you want to delete this emergency contact?')) {
      return;
    }

    try {
      setDeleteLoading({ ...deleteLoading, [contactId]: true });
      setError(null);
      const response = await api.deleteEmergencyContact(contactId);
      if (response?.success) {
        fetchContacts(); // Refresh list
      } else {
        throw new Error('Failed to delete contact');
      }
    } catch (err) {
      console.error('Error deleting emergency contact:', err);
      setError(err.message || 'Failed to delete emergency contact');
    } finally {
      setDeleteLoading({ ...deleteLoading, [contactId]: false });
    }
  };

  if (loading && contacts.length === 0) {
    return (
      <div className="min-h-screen bg-sand-100 dark:bg-charcoal-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-500 mx-auto mb-4"></div>
          <p className="text-charcoal-500 dark:text-sand-300">Loading emergency contacts...</p>
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
          <h1 className="text-xl font-display text-charcoal-500 dark:text-sand-50">Safety Settings</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-4">
        {/* Info Card */}
        <Card className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Emergency Contacts:</strong> Add trusted contacts who will receive email notifications with your location when you trigger an emergency. These contacts will be notified regardless of distance.
          </p>
        </Card>

        {error && (
          <Card className="p-4 bg-coral-50 dark:bg-coral-900/20 border border-coral-200 dark:border-coral-800">
            <p className="text-sm text-coral-600 dark:text-coral-400">{error}</p>
          </Card>
        )}

        {/* Add Contact Button */}
        {!showAddForm && (
          <Button
            onClick={() => setShowAddForm(true)}
            className="w-full"
          >
            <Plus size={18} className="mr-2" />
            Add Emergency Contact
          </Button>
        )}

        {/* Add Contact Form */}
        {showAddForm && (
          <Card className="p-4">
            <h3 className="text-lg font-display text-charcoal-500 dark:text-sand-50 mb-4">
              Add Emergency Contact
            </h3>
            <form onSubmit={handleAddContact} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal-500 dark:text-sand-400 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contact name"
                  className="w-full px-4 py-2 border border-sand-300 dark:border-charcoal-600 rounded-lg bg-white dark:bg-charcoal-700 text-charcoal-500 dark:text-sand-50 focus:outline-none focus:ring-2 focus:ring-sage-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal-500 dark:text-sand-400 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@example.com"
                  className="w-full px-4 py-2 border border-sand-300 dark:border-charcoal-600 rounded-lg bg-white dark:bg-charcoal-700 text-charcoal-500 dark:text-sand-50 focus:outline-none focus:ring-2 focus:ring-sage-500"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={adding}
                  className="flex-1"
                >
                  {adding ? 'Adding...' : 'Add Contact'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({ name: '', email: '' });
                    setError(null);
                  }}
                  disabled={adding}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Contacts List */}
        <div>
          <h2 className="text-lg font-display text-charcoal-500 dark:text-sand-50 mb-4">
            Emergency Contacts ({contacts.length})
          </h2>
          {contacts.length === 0 ? (
            <Card className="p-8 text-center">
              <Mail size={48} className="mx-auto mb-4 text-charcoal-300 dark:text-sand-500" />
              <p className="text-charcoal-500 dark:text-sand-300 mb-2">No emergency contacts yet.</p>
              <p className="text-sm text-charcoal-300 dark:text-sand-400">
                Add contacts to receive email notifications when you trigger an emergency.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {contacts.map((contact) => (
                <Card key={contact._id} className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-sage-100 dark:bg-sage-900/30 text-sage-600 dark:text-sage-400 rounded-xl">
                        <UserIcon size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-charcoal-500 dark:text-sand-50">
                          {contact.name}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Mail size={14} className="text-charcoal-300 dark:text-sand-500" />
                          <p className="text-sm text-charcoal-400 dark:text-sand-400">
                            {contact.email}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteContact(contact._id)}
                      disabled={deleteLoading[contact._id]}
                      className={cn(
                        "p-2 hover:bg-coral-50 dark:hover:bg-coral-900/20 rounded-lg transition-colors",
                        deleteLoading[contact._id] && "opacity-50 cursor-not-allowed"
                      )}
                      title="Delete contact"
                    >
                      {deleteLoading[contact._id] ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-coral-500"></div>
                      ) : (
                        <Trash2 size={18} className="text-coral-600 dark:text-coral-400" />
                      )}
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SafetySettings;
