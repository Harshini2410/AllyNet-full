// API utility for contact endpoints
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

export const contactApi = {
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
      if (errorData && errorData.error && Array.isArray(errorData.error.details)) {
        error.details = errorData.error.details;
      }
      throw error;
    }

    return response.json();
  },

  // Submit contact form
  async submitContact(subject, message, category = 'question') {
    return this.request('/api/v1/contact', {
      method: 'POST',
      body: JSON.stringify({ subject, message, category }),
    });
  },
};

