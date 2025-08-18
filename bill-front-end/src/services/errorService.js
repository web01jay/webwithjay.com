import { toast } from 'react-toastify';

class ErrorService {
  // Handle API errors with user-friendly messages
  handleApiError(error, customMessage = null) {
    let message = customMessage || 'An unexpected error occurred';
    let details = null;

    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          message = data.message || 'Invalid request. Please check your input.';
          details = data.error?.details || null;
          break;
        case 401:
          message = 'You are not authorized. Please log in again.';
          this.handleAuthError();
          break;
        case 403:
          message = 'Access forbidden. You don\'t have permission for this action.';
          break;
        case 404:
          message = 'The requested resource was not found.';
          break;
        case 409:
          message = data.message || 'This resource already exists or conflicts with existing data.';
          details = data.error?.details || null;
          break;
        case 422:
          message = data.message || 'Validation failed. Please check your input.';
          details = data.error?.details || null;
          break;
        case 429:
          message = 'Too many requests. Please try again later.';
          break;
        case 500:
          message = 'Server error. Please try again later.';
          break;
        default:
          message = data.message || `Server error (${status}). Please try again.`;
      }
    } else if (error.request) {
      // Network error
      message = 'Network error. Please check your connection and try again.';
    } else {
      // Other error
      message = error.message || 'An unexpected error occurred.';
    }

    return {
      message,
      details,
      status: error.response?.status,
      originalError: error
    };
  }

  // Handle authentication errors
  handleAuthError() {
    // Clear all authentication data
    localStorage.removeItem('authUser');
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    
    // Store current location as intended destination (if not already on auth pages)
    const currentPath = window.location.pathname;
    const authPages = ['/login', '/signup', '/'];
    
    if (!authPages.includes(currentPath)) {
      localStorage.setItem('intendedDestination', currentPath);
    }
    
    // Redirect to login or show auth modal
    // This could be customized based on your auth flow
    console.warn('Authentication error - user data cleared, redirecting to login');
    
    // Redirect to login if not already there
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  // Show error toast notification
  showErrorToast(error, customMessage = null) {
    const errorInfo = this.handleApiError(error, customMessage);
    toast.error(errorInfo.message);
    
    // Log details for debugging
    if (errorInfo.details) {
      console.error('Error details:', errorInfo.details);
    }
    
    return errorInfo;
  }

  // Show success toast notification
  showSuccessToast(message) {
    toast.success(message);
  }

  // Show info toast notification
  showInfoToast(message) {
    toast.info(message);
  }

  // Show warning toast notification
  showWarningToast(message) {
    toast.warning(message);
  }

  // Format validation errors for display
  formatValidationErrors(errors) {
    if (!errors || typeof errors !== 'object') {
      return [];
    }

    return Object.entries(errors).map(([field, message]) => ({
      field,
      message: Array.isArray(message) ? message[0] : message
    }));
  }

  // Handle form validation errors
  handleFormErrors(error, setFieldError = null) {
    const errorInfo = this.handleApiError(error);
    
    if (errorInfo.details && setFieldError) {
      // Set individual field errors if setFieldError function is provided
      const validationErrors = this.formatValidationErrors(errorInfo.details);
      validationErrors.forEach(({ field, message }) => {
        setFieldError(field, message);
      });
    } else {
      // Show general error toast
      this.showErrorToast(error);
    }
    
    return errorInfo;
  }

  // Retry mechanism for failed requests
  async retryRequest(requestFn, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        // Don't retry on client errors (4xx) except for 408, 429
        if (error.response?.status >= 400 && error.response?.status < 500) {
          if (![408, 429].includes(error.response.status)) {
            throw error;
          }
        }
        
        if (attempt < maxRetries) {
          console.warn(`Request failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
          await this.sleep(delay);
          delay *= 2; // Exponential backoff
        }
      }
    }
    
    throw lastError;
  }

  // Utility function for delays
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Check if error is a network error
  isNetworkError(error) {
    return !error.response && error.request;
  }

  // Check if error is a server error (5xx)
  isServerError(error) {
    return error.response?.status >= 500;
  }

  // Check if error is a client error (4xx)
  isClientError(error) {
    return error.response?.status >= 400 && error.response?.status < 500;
  }
}

// Create singleton instance
const errorService = new ErrorService();

export default errorService;