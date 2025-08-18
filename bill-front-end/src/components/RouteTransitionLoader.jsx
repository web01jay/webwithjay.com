import React from 'react';
import { useRouteLoading } from '../hooks/useRouteLoading';
import { RouteLoadingState } from './AuthLoadingState';

/**
 * Component that shows loading state during route transitions
 * Automatically detects route changes and displays loading indicator
 */
const RouteTransitionLoader = () => {
  const { isLoading, loadingProgress } = useRouteLoading(150);

  if (!isLoading) return null;

  return (
    <RouteLoadingState 
      message="Loading page..." 
      progress={loadingProgress}
    />
  );
};

export default RouteTransitionLoader;