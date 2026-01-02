// API utility for ad endpoints
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
import { api as authApi } from './auth';
import { useAuthStore } from '../store/useAuthStore';

// Get tokens from localStorage
const getTokens = () => {
  const token = localStorage.getItem('allynet-auth-storage');
  if (token) {
    try {
      const parsed = JSON.parse(token);
      return {
        accessToken: parsed.state?.accessToken,
        refreshToken: parsed.state?.refreshToken,
      };
    } catch (e) {
      return { accessToken: null, refreshToken: null };
    }
  }
  return { accessToken: null, refreshToken: null };
};

// Refresh access token
const refreshAccessToken = async () => {
  const { refreshToken } = getTokens();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const response = await authApi.refreshToken(refreshToken);
    if (response?.success && response?.data?.accessToken) {
      // Update auth store with new access token
      const { setTokens } = useAuthStore.getState();
      const tokens = getTokens();
      setTokens(response.data.accessToken, tokens.refreshToken);
      return response.data.accessToken;
    }
    throw new Error('Failed to refresh token');
  } catch (error) {
    // If refresh fails, logout user
    const { logout } = useAuthStore.getState();
    logout();
    throw error;
  }
};

export const adApi = {
  async request(endpoint, options = {}, retryCount = 0) {
    const url = `${API_BASE_URL}${endpoint}`;
    const { accessToken } = getTokens();

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
      
      // Handle token expiration - try to refresh and retry once
      if (response.status === 401 && (errorMessage === 'Token expired' || errorMessage.includes('expired')) && retryCount === 0) {
        try {
          const newAccessToken = await refreshAccessToken();
          // Retry the request with new token
          return this.request(endpoint, options, retryCount + 1);
        } catch (refreshError) {
          // Refresh failed, throw original error
          const error = new Error('Session expired. Please login again.');
          error.status = response.status;
          error.response = response;
          throw error;
        }
      }
      
      const error = new Error(typeof errorMessage === 'string' ? errorMessage : 'Request failed');
      error.status = response.status;
      error.response = response;
      if (errorData && errorData.error && Array.isArray(errorData.error.details)) {
        error.details = errorData.error.details;
      }
      throw error;
    }

    return response.json();
  },

  // Create ad
  async createAd(adData) {
    return this.request('/api/v1/ads', {
      method: 'POST',
      body: JSON.stringify(adData),
    });
  },

  // Get nearby ads
  async getNearbyAds(latitude, longitude, options = {}) {
    const { radius = 10000, limit = 50 } = options;
    const params = new URLSearchParams();
    params.append('latitude', latitude.toString());
    params.append('longitude', longitude.toString());
    if (radius) params.append('radius', radius.toString());
    if (limit) params.append('limit', limit.toString());
    
    const endpoint = `/api/v1/ads/nearby?${params.toString()}`;
    return this.request(endpoint);
  },

  // Get all ads (for explore page)
  async getAllAds(options = {}) {
    const { category, status = 'active', limit = 50, skip = 0 } = options;
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (status) params.append('status', status);
    if (limit) params.append('limit', limit.toString());
    if (skip) params.append('skip', skip.toString());
    
    const queryString = params.toString();
    const endpoint = `/api/v1/ads${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  },

  // Get top rated ads (for home page)
  async getTopRatedAds(limit = 2) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    
    const endpoint = `/api/v1/ads/top-rated${params.toString() ? `?${params.toString()}` : ''}`;
    return this.request(endpoint);
  },

  // Get random ads (for home page)
  async getRandomAds(limit = 2) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    
    const endpoint = `/api/v1/ads/random${params.toString() ? `?${params.toString()}` : ''}`;
    return this.request(endpoint);
  },

  // Get ad by ID
  async getAdById(adId) {
    return this.request(`/api/v1/ads/${adId}`);
  },

  // Get user's ads (ad history)
  async getMyAds() {
    return this.request('/api/v1/ads/my-ads');
  },

  // Rate ad
  async rateAd(adId, rating, review = null) {
    return this.request(`/api/v1/ads/${adId}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating, review }),
    });
  },

  // Update ad
  async updateAd(adId, updateData) {
    return this.request(`/api/v1/ads/${adId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },

  // Delete ad
  async deleteAd(adId) {
    return this.request(`/api/v1/ads/${adId}`, {
      method: 'DELETE',
    });
  },
};

