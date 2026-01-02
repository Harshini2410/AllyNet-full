// API utility for help request endpoints
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

export const helpRequestApi = {
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
      let errorData;
      try {
        const text = await response.text();
        errorData = text ? JSON.parse(text) : {};
      } catch (parseError) {
        errorData = { error: { message: response.statusText || 'Request failed' } };
      }
      
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
      
      const error = new Error(typeof errorMessage === 'string' ? errorMessage : 'Request failed');
      error.status = response.status;
      error.response = response; // Store response for further parsing
      if (errorData && errorData.error) {
        if (Array.isArray(errorData.error.details)) {
          error.details = errorData.error.details;
        }
        if (errorData.error.message) {
          error.message = errorData.error.message;
        }
      }
      throw error;
    }

    return response.json();
  },

  // Create help request
  async createHelpRequest(requestData) {
    return this.request('/api/v1/help-requests', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  },

  // Get user's help requests
  async getMyHelpRequests(options = {}) {
    const { status, limit } = options;
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (limit) params.append('limit', limit.toString());
    
    const queryString = params.toString();
    const endpoint = `/api/v1/help-requests/my-requests${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  },

  // Get nearby help requests (for helpers)
  async getNearbyHelpRequests(latitude, longitude, options = {}) {
    const { radius = 10000, limit = 50 } = options;
    const params = new URLSearchParams();
    params.append('latitude', latitude.toString());
    params.append('longitude', longitude.toString());
    if (radius) params.append('radius', radius.toString());
    if (limit) params.append('limit', limit.toString());
    
    const endpoint = `/api/v1/help-requests/nearby?${params.toString()}`;
    return this.request(endpoint);
  },

  // Get help request by ID
  async getHelpRequestById(requestId) {
    return this.request(`/api/v1/help-requests/${requestId}`);
  },

  // Respond to help request (helper sends response)
  async respondToHelpRequest(requestId, message) {
    return this.request(`/api/v1/help-requests/${requestId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  // Delete help request (creator only)
  async deleteHelpRequest(requestId) {
    return this.request(`/api/v1/help-requests/${requestId}`, {
      method: 'DELETE',
    });
  },

  // Accept a helper's response (creator chooses helper)
  async acceptHelper(requestId, helperId) {
    return this.request(`/api/v1/help-requests/${requestId}/accept-helper`, {
      method: 'POST',
      body: JSON.stringify({ helperId }),
    });
  },

  // Deny a helper's response (creator rejects helper)
  async denyHelper(requestId, helperId) {
    return this.request(`/api/v1/help-requests/${requestId}/deny-helper`, {
      method: 'POST',
      body: JSON.stringify({ helperId }),
    });
  },

  // Report a helper's response (creator reports helper)
  async reportHelper(requestId, helperId, reason) {
    return this.request(`/api/v1/help-requests/${requestId}/report-helper`, {
      method: 'POST',
      body: JSON.stringify({ helperId, reason }),
    });
  },

  // Reply to a helper's response (creator or helper can reply)
  async replyToResponse(requestId, helperId, message) {
    return this.request(`/api/v1/help-requests/${requestId}/responses/${helperId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },
};

