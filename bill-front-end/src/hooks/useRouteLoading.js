import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook to manage loading states during route transitions
 * Provides loading state that can be used to show loading indicators
 * during navigation between routes
 */
export const useRouteLoading = (delay = 100) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const location = useLocation();

  useEffect(() => {
    // Start loading when location changes
    setIsLoading(true);
    setLoadingProgress(0);

    // Simulate loading progress
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 30;
      });
    }, 50);

    // Complete loading after a short delay to allow components to render
    const timer = setTimeout(() => {
      setLoadingProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setLoadingProgress(0);
      }, 100);
    }, delay);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [location.pathname, delay]);

  return {
    isLoading,
    loadingProgress
  };
};

/**
 * Hook to manage authentication-specific loading states
 * Provides loading states for auth operations and route protection
 */
export const useAuthLoading = () => {
  const [authOperationLoading, setAuthOperationLoading] = useState(false);
  const [routeProtectionLoading, setRouteProtectionLoading] = useState(false);

  const startAuthOperation = (operation = 'authentication') => {
    setAuthOperationLoading(true);
    console.log(`Started ${operation} operation`);
  };

  const stopAuthOperation = () => {
    setAuthOperationLoading(false);
    console.log('Completed authentication operation');
  };

  const startRouteProtection = () => {
    setRouteProtectionLoading(true);
    console.log('Started route protection check');
  };

  const stopRouteProtection = () => {
    setRouteProtectionLoading(false);
    console.log('Completed route protection check');
  };

  return {
    authOperationLoading,
    routeProtectionLoading,
    startAuthOperation,
    stopAuthOperation,
    startRouteProtection,
    stopRouteProtection,
    isAnyLoading: authOperationLoading || routeProtectionLoading
  };
};

export default useRouteLoading;