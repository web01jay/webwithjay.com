import { useState, useEffect, useCallback } from 'react';
import errorService from '../services/errorService';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState('unknown');
  const [retryCount, setRetryCount] = useState(0);

  // Update online status
  const updateOnlineStatus = useCallback(() => {
    setIsOnline(navigator.onLine);
    
    // Reset retry count when back online
    if (navigator.onLine) {
      setRetryCount(0);
    }
  }, []);

  // Update connection type if available
  const updateConnectionType = useCallback(() => {
    if ('connection' in navigator) {
      setConnectionType(navigator.connection.effectiveType || 'unknown');
    }
  }, []);

  useEffect(() => {
    // Add event listeners for online/offline status
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Add event listener for connection change if available
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', updateConnectionType);
    }

    // Initial setup
    updateOnlineStatus();
    updateConnectionType();

    // Cleanup
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      
      if ('connection' in navigator) {
        navigator.connection.removeEventListener('change', updateConnectionType);
      }
    };
  }, [updateOnlineStatus, updateConnectionType]);

  // Retry failed request with exponential backoff
  const retryRequest = useCallback(async (requestFn, maxRetries = 3) => {
    if (!isOnline) {
      throw new Error('No internet connection');
    }

    try {
      const result = await errorService.retryRequest(requestFn, maxRetries);
      setRetryCount(0); // Reset on success
      return result;
    } catch (error) {
      setRetryCount(prev => prev + 1);
      throw error;
    }
  }, [isOnline]);

  // Check if connection is slow
  const isSlowConnection = useCallback(() => {
    return connectionType === 'slow-2g' || connectionType === '2g';
  }, [connectionType]);

  return {
    isOnline,
    connectionType,
    retryCount,
    retryRequest,
    isSlowConnection
  };
};

// Hook for handling API requests with network awareness
export const useApiRequest = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isOnline, retryRequest } = useNetworkStatus();

  const execute = useCallback(async (requestFn, options = {}) => {
    const {
      showErrorToast = true,
      maxRetries = 3,
      onSuccess,
      onError
    } = options;

    setLoading(true);
    setError(null);

    try {
      if (!isOnline) {
        throw new Error('No internet connection. Please check your network and try again.');
      }

      const result = await retryRequest(requestFn, maxRetries);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const errorInfo = errorService.handleApiError(err);
      setError(errorInfo);
      
      if (showErrorToast) {
        errorService.showErrorToast(err);
      }
      
      if (onError) {
        onError(errorInfo);
      }
      
      throw errorInfo;
    } finally {
      setLoading(false);
    }
  }, [isOnline, retryRequest]);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return {
    loading,
    error,
    execute,
    reset
  };
};