// API utility for emergency endpoints
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Get access token from localStorage
const getAccessToken = () => {
  const token = localStorage.getItem('allynet-auth-storage');
  if (token) {
    try {
      const parsed = JSON.parse(token);
      return parsed.state?.accessToken;
    } catch (e) {
      return null;
    }
  }
  return null;
};

export const emergencyApi = {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const accessToken = getAccessToken();

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // Safely attempt to parse JSON error response
      let errorData;
      try {
        const text = await response.text();
        errorData = text ? JSON.parse(text) : {};
      } catch (parseError) {
        // If response is not JSON, create generic error
        errorData = { error: { message: response.statusText || 'Request failed' } };
      }
      
      // Extract error message safely (NO string parsing, NO .split())
      let errorMessage = 'Request failed';
      
      if (errorData && typeof errorData === 'object') {
        if (errorData.error && typeof errorData.error === 'object') {
          if (typeof errorData.error.message === 'string') {
            errorMessage = errorData.error.message;
          }
        } else if (typeof errorData.message === 'string') {
          errorMessage = errorData.message;
        }
      }
      
      // Create error with status code (defensive: ensure errorMessage is always a string)
      const error = new Error(typeof errorMessage === 'string' ? errorMessage : 'Request failed');
      error.status = response.status;
      if (errorData && errorData.error && Array.isArray(errorData.error.details)) {
        error.details = errorData.error.details;
      }
      throw error;
    }

    return response.json();
  },

  // Create emergency (SOS)
  async createEmergency(emergencyData) {
    return this.request('/api/v1/emergencies', {
      method: 'POST',
      body: JSON.stringify(emergencyData),
    });
  },

  // Get user's active emergency
  async getActiveEmergency() {
    return this.request('/api/v1/emergencies/active');
  },

  // Cancel emergency
  async cancelEmergency(emergencyId, reason = null) {
    return this.request(`/api/v1/emergencies/${emergencyId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // Resolve emergency (user confirms safe)
  async resolveEmergency(emergencyId, resolutionType = 'user_resolved', notes = null) {
    return this.request(`/api/v1/emergencies/${emergencyId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolutionType, notes }),
    });
  },

  // Respond to emergency (accept/decline)
  async respondToEmergency(emergencyId, action, estimatedArrival = null) {
    const body = { action }; // 'accept' or 'decline'
    
    // Only include estimatedArrival if it's provided and not null
    if (estimatedArrival) {
      body.estimatedArrival = estimatedArrival;
    }
    
    return this.request(`/api/v1/emergencies/${emergencyId}/respond`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  // Get messages for emergency session
  async getMessages(emergencyId, options = {}) {
    const { limit = 50, before } = options;
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (before) params.append('before', before);
    
    const queryString = params.toString();
    const endpoint = `/api/v1/emergencies/${emergencyId}/messages${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  },

  // Send message in emergency session
  async sendMessage(emergencyId, message) {
    return this.request(`/api/v1/emergencies/${emergencyId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  // Delete a message (only by sender)
  async deleteMessage(emergencyId, messageId) {
    return this.request(`/api/v1/emergencies/${emergencyId}/messages/${messageId}`, {
      method: 'DELETE',
    });
  },

  // Get emergency history (as creator or helper)
  async getEmergencyHistory(options = {}) {
    const { limit = 50, status } = options;
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (status) params.append('status', status);
    
    const queryString = params.toString();
    const endpoint = `/api/v1/emergencies/history${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  },

  // Get emergency by ID (read-only)
  async getEmergencyById(emergencyId) {
    return this.request(`/api/v1/emergencies/${emergencyId}`);
  },

  // Get pending emergencies for helper (for persistent notifications)
  async getPendingEmergenciesForHelper() {
    return this.request('/api/v1/emergencies/pending-for-helper');
  },

  // Get emergency where user is a helper (for state restoration)
  async getHelperActiveEmergency() {
    return this.request('/api/v1/emergencies/helper-active');
  },
};

