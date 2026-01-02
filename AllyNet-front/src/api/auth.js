// API utility for auth endpoints
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const api = {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('allynet-auth-storage');
    let accessToken = null;
    
    if (token) {
      try {
        const parsed = JSON.parse(token);
        accessToken = parsed.state?.accessToken;
      } catch (e) {
        // Ignore parse errors
      }
    }

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    let response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch (networkError) {
      // Handle network errors (backend not reachable, CORS, etc.)
      if (networkError instanceof TypeError && networkError.message === 'Failed to fetch') {
        throw new Error('Unable to connect to server. Please check if the backend is running.');
      }
      throw networkError;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        error: { message: response.statusText || 'Request failed' }
      }));
      // Extract error message from standardized error format
      const errorMessage = errorData.error?.message || errorData.message || `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return response.json();
  },

  // Auth endpoints
  async login(email, password) {
    const response = await this.request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return response;
  },

  async signup(email, password, name) {
    const url = `${API_BASE_URL}/api/v1/auth/register`;
    
    const headers = {
      'Content-Type': 'application/json',
    };

    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, password, name }),
      });
    } catch (networkError) {
      if (networkError instanceof TypeError && networkError.message === 'Failed to fetch') {
        throw new Error('Unable to connect to server. Please check if the backend is running.');
      }
      throw networkError;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        error: { message: response.statusText || 'Request failed' }
      }));
      
      if (response.status === 409) {
        throw new Error('Account already exists. Please sign in.');
      }
      
      const errorMessage = errorData.error?.message || errorData.message || `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return response.json();
  },

  async getMe() {
    const response = await this.request('/api/v1/auth/me');
    return response;
  },

  async getUserStats() {
    const response = await this.request('/api/v1/auth/stats');
    return response;
  },

  async getEmergencyContacts() {
    const response = await this.request('/api/v1/auth/emergency-contacts');
    return response;
  },

  async addEmergencyContact(name, phone) {
    const response = await this.request('/api/v1/auth/emergency-contacts', {
      method: 'POST',
      body: JSON.stringify({ name, phone }),
    });
    return response;
  },

  async deleteEmergencyContact(contactId) {
    const response = await this.request(`/api/v1/auth/emergency-contacts/${contactId}`, {
      method: 'DELETE',
    });
    return response;
  },

  async refreshToken(refreshToken) {
    const url = `${API_BASE_URL}/api/v1/auth/refresh`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        error: { message: response.statusText || 'Token refresh failed' }
      }));
      const errorMessage = errorData.error?.message || errorData.message || 'Token refresh failed';
      throw new Error(errorMessage);
    }

    return response.json();
  },
};

