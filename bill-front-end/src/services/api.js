import axios from 'axios';
import errorService from './errorService';

// Auth utilities for API integration
let authContext = null;

// Function to set auth context reference for API interceptors
const setAuthContext = (context) => {
  authContext = context;
};

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding headers and enabling credentials
api.interceptors.request.use(
  (config) => {
    // Enable credentials for session-based auth
    config.withCredentials = true;

    // Add API key if available
    const apiKey = import.meta.env.VITE_API_ACCESS;
    if (apiKey) {
      config.headers['auth'] = apiKey;
    }

    // Add authorization token if available (for token-based auth)
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() };

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Token refresh state management
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Response interceptor for handling errors globally
api.interceptors.response.use(
  (response) => {
    // Log response time in development
    if (process.env.NODE_ENV === 'development' && response.config.metadata) {
      const endTime = new Date();
      const duration = endTime - response.config.metadata.startTime;
      console.log(`API Request: ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`);
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 authentication errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Check if this is a token refresh request to avoid infinite loops
      if (originalRequest.url?.includes('/auth/refresh')) {
        // Token refresh failed, trigger logout
        handleAuthenticationFailure();
        return Promise.reject(error);
      }

      // Try to refresh token if available
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken && !isRefreshing) {
        isRefreshing = true;
        originalRequest._retry = true;

        try {
          const response = await refreshAuthToken(refreshToken);
          const newToken = response.data.token;
          
          // Update stored tokens
          localStorage.setItem('authToken', newToken);
          if (response.data.refreshToken) {
            localStorage.setItem('refreshToken', response.data.refreshToken);
          }

          // Update the authorization header for the original request
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          
          // Process queued requests
          processQueue(null, newToken);
          
          // Retry the original request
          return api(originalRequest);
        } catch (refreshError) {
          // Token refresh failed, trigger logout
          processQueue(refreshError, null);
          handleAuthenticationFailure();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else if (isRefreshing) {
        // If token is being refreshed, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      } else {
        // No refresh token available or already retried, trigger logout
        handleAuthenticationFailure();
        return Promise.reject(error);
      }
    }

    // Handle network errors with retry
    if (errorService.isNetworkError(error) && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Retry the request after a short delay
        await errorService.sleep(1000);
        return api(originalRequest);
      } catch (retryError) {
        console.error('Retry failed:', retryError);
        return Promise.reject(retryError);
      }
    }

    // Handle server errors with retry
    if (errorService.isServerError(error) && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Retry server errors after a longer delay
        await errorService.sleep(2000);
        return api(originalRequest);
      } catch (retryError) {
        console.error('Server error retry failed:', retryError);
        return Promise.reject(retryError);
      }
    }

    // Log error details for debugging
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      details: error.response?.data?.error?.details
    });

    return Promise.reject(error);
  }
);

// Authentication helper functions
const refreshAuthToken = async (refreshToken) => {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/auth/refresh`,
      { refreshToken },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': import.meta.env.VITE_API_ACCESS
        },
        withCredentials: true
      }
    );
    return response;
  } catch (error) {
    console.error('Token refresh failed:', error);
    throw error;
  }
};

const handleAuthenticationFailure = () => {
  // Clear all authentication data
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('authUser');
  
  // Store current location as intended destination (if not already on auth pages)
  const currentPath = window.location.pathname;
  const authPages = ['/login', '/signup', '/'];
  
  if (!authPages.includes(currentPath)) {
    localStorage.setItem('intendedDestination', currentPath);
  }
  
  // Trigger logout through auth context if available
  if (authContext && typeof authContext.logout === 'function') {
    authContext.logout();
  }
  
  // Redirect to login page
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

// Enhanced API wrapper with error handling
const apiWrapper = {
  // GET request with error handling
  async get(url, config = {}) {
    try {
      const response = await api.get(url, config);
      return response.data;
    } catch (error) {
      throw errorService.handleApiError(error);
    }
  },

  // POST request with error handling
  async post(url, data = {}, config = {}) {
    try {
      const response = await api.post(url, data, config);
      return response.data;
    } catch (error) {
      throw errorService.handleApiError(error);
    }
  },

  // PUT request with error handling
  async put(url, data = {}, config = {}) {
    try {
      const response = await api.put(url, data, config);
      return response.data;
    } catch (error) {
      throw errorService.handleApiError(error);
    }
  },

  // DELETE request with error handling
  async delete(url, config = {}) {
    try {
      const response = await api.delete(url, config);
      return response.data;
    } catch (error) {
      throw errorService.handleApiError(error);
    }
  },

  // PATCH request with error handling
  async patch(url, data = {}, config = {}) {
    try {
      const response = await api.patch(url, data, config);
      return response.data;
    } catch (error) {
      throw errorService.handleApiError(error);
    }
  },

  // Request with retry logic
  async requestWithRetry(requestFn, maxRetries = 3) {
    return errorService.retryRequest(requestFn, maxRetries);
  },

  // Authentication token management
  setAuthTokens(token, refreshToken = null) {
    if (token) {
      localStorage.setItem('authToken', token);
    }
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  },

  clearAuthTokens() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
  },

  getAuthToken() {
    return localStorage.getItem('authToken');
  },

  getRefreshToken() {
    return localStorage.getItem('refreshToken');
  },

  // Check if user is authenticated (has valid token)
  isAuthenticated() {
    const token = this.getAuthToken();
    return !!token;
  }
};

export default api;
export { apiWrapper, setAuthContext };