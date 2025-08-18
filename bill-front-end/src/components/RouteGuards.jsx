import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AuthLoadingSpinner, ProtectedContentLoading } from './AuthLoadingState';
import AuthErrorBoundary from './AuthErrorBoundary';
import { LiveRegion, ScreenReaderOnly } from './AccessibilityHelper';
import { useRenderOptimization } from '../hooks/usePerformanceOptimization';

/**
 * @typedef {Object} PublicRouteProps
 * @property {React.ReactNode} children - Child components to render
 * @property {string} [redirectTo='/dashboard'] - Where to redirect authenticated users
 * @property {boolean} [redirectIfAuthenticated=false] - Whether to redirect authenticated users
 */

/**
 * @typedef {Object} PrivateRouteProps
 * @property {React.ReactNode} children - Child components to render
 * @property {React.ReactNode} [fallback] - Loading component to show while checking auth
 * @property {string} [redirectTo='/login'] - Where to redirect unauthenticated users
 */

/**
 * PublicRoute component that allows unauthenticated access
 * 
 * This component wraps routes that should be accessible without authentication,
 * such as login, signup, and home pages. It can optionally redirect authenticated
 * users away from auth-specific pages like login/signup.
 * 
 * @param {PublicRouteProps} props - Component props
 * @returns {React.ReactElement} The route content or redirect
 * 
 * @example
 * ```jsx
 * <PublicRoute redirectIfAuthenticated={true}>
 *   <LoginPage />
 * </PublicRoute>
 * ```
 */
const PublicRouteComponent = ({ 
  children, 
  redirectTo = '/dashboard', 
  redirectIfAuthenticated = false 
}) => {
  const { isAuthenticated, isLoading, getIntendedDestination, clearIntendedDestination } = useAuth();
  const announceRef = useRef(null);
  
  // Performance monitoring
  useRenderOptimization('PublicRoute');

  // Announce route changes to screen readers
  useEffect(() => {
    if (!isLoading) {
      const message = isAuthenticated && redirectIfAuthenticated 
        ? 'Redirecting to dashboard...' 
        : 'Public page loaded';
      
      if (announceRef.current) {
        announceRef.current.textContent = message;
      }
    }
  }, [isLoading, isAuthenticated, redirectIfAuthenticated]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <AuthErrorBoundary>
        <LiveRegion ref={announceRef}>Verifying authentication status...</LiveRegion>
        <AuthLoadingSpinner 
          message="Verifying authentication status..." 
          size={40}
          showIcon={true}
        />
      </AuthErrorBoundary>
    );
  }

  // If user is authenticated and we should redirect them away from this public route
  if (isAuthenticated && redirectIfAuthenticated) {
    // Check if there's an intended destination (for post-login redirects)
    const intendedDestination = getIntendedDestination();
    
    if (intendedDestination) {
      // Clear the intended destination since we're using it
      clearIntendedDestination();
      
      // Don't redirect to public routes as intended destination
      const publicRoutes = ['/', '/login', '/signup', '/home'];
      if (publicRoutes.includes(intendedDestination)) {
        return (
          <>
            <LiveRegion ref={announceRef}>Redirecting to dashboard...</LiveRegion>
            <Navigate to={redirectTo} replace />
          </>
        );
      }
      
      return (
        <>
          <LiveRegion ref={announceRef}>Redirecting to your intended destination...</LiveRegion>
          <Navigate to={intendedDestination} replace />
        </>
      );
    }
    
    // No intended destination, redirect to default
    return (
      <>
        <LiveRegion ref={announceRef}>Redirecting to dashboard...</LiveRegion>
        <Navigate to={redirectTo} replace />
      </>
    );
  }

  // Allow access to public route
  return (
    <>
      <LiveRegion ref={announceRef} />
      <ScreenReaderOnly>Public page content loaded</ScreenReaderOnly>
      {children}
    </>
  );
};

// Memoize PublicRoute to prevent unnecessary re-renders
export const PublicRoute = React.memo(PublicRouteComponent);

/**
 * PrivateRoute component that requires authentication
 * 
 * This component wraps routes that should only be accessible to authenticated users.
 * It redirects unauthenticated users to the login page and stores the intended
 * destination for post-login redirection.
 * 
 * @param {PrivateRouteProps} props - Component props
 * @returns {React.ReactElement} The route content, loading state, or redirect
 * 
 * @example
 * ```jsx
 * <PrivateRoute>
 *   <DashboardPage />
 * </PrivateRoute>
 * ```
 */
const PrivateRouteComponent = ({ 
  children, 
  fallback = <ProtectedContentLoading message="Verifying access permissions..." />, 
  redirectTo = '/login' 
}) => {
  const { isAuthenticated, isLoading, setIntendedDestination, getIntendedDestination } = useAuth();
  const location = useLocation();
  const announceRef = useRef(null);
  
  // Performance monitoring
  useRenderOptimization('PrivateRoute');

  // Announce route changes to screen readers
  useEffect(() => {
    if (!isLoading) {
      const message = isAuthenticated 
        ? 'Protected page loaded successfully' 
        : 'Redirecting to login for authentication...';
      
      if (announceRef.current) {
        announceRef.current.textContent = message;
      }
    }
  }, [isLoading, isAuthenticated]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <AuthErrorBoundary>
        <LiveRegion ref={announceRef}>Verifying access permissions...</LiveRegion>
        {fallback}
      </AuthErrorBoundary>
    );
  }

  // If user is not authenticated, store intended destination and redirect to login
  if (!isAuthenticated) {
    // Store the current location as intended destination for post-login redirect
    const currentPath = location.pathname + location.search + location.hash;
    
    // Only set intended destination if it's different from current to avoid infinite loops
    const currentIntended = getIntendedDestination();
    if (currentIntended !== currentPath) {
      setIntendedDestination(currentPath);
    }
    
    return (
      <>
        <LiveRegion ref={announceRef}>Redirecting to login for authentication...</LiveRegion>
        <Navigate to={redirectTo} replace />
      </>
    );
  }

  // User is authenticated, allow access to private route
  return (
    <AuthErrorBoundary>
      <LiveRegion ref={announceRef} />
      <ScreenReaderOnly>Protected content loaded successfully</ScreenReaderOnly>
      {children}
    </AuthErrorBoundary>
  );
};

// Memoize PrivateRoute to prevent unnecessary re-renders
export const PrivateRoute = React.memo(PrivateRouteComponent);

export default { PublicRoute, PrivateRoute };