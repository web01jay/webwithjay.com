import React, { Suspense } from 'react';
import { AuthLoadingSpinner } from './AuthLoadingState';
import ErrorBoundary from './ErrorBoundary';

// Lazy load authentication-related components
const Login = React.lazy(() => import('../pages/Login'));
const Signup = React.lazy(() => import('../pages/Signup'));
const AuthContext = React.lazy(() => import('../contexts/AuthContext'));

// Lazy wrapper component with error boundary and loading state
const LazyAuthWrapper = ({ children, fallback, errorFallback }) => (
  <ErrorBoundary fallback={errorFallback}>
    <Suspense fallback={fallback || <AuthLoadingSpinner message="Loading authentication..." />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

// Lazy Login component
export const LazyLogin = (props) => (
  <LazyAuthWrapper 
    fallback={<AuthLoadingSpinner message="Loading login page..." />}
    errorFallback={<div>Error loading login page. Please refresh.</div>}
  >
    <Login {...props} />
  </LazyAuthWrapper>
);

// Lazy Signup component
export const LazySignup = (props) => (
  <LazyAuthWrapper 
    fallback={<AuthLoadingSpinner message="Loading signup page..." />}
    errorFallback={<div>Error loading signup page. Please refresh.</div>}
  >
    <Signup {...props} />
  </LazyAuthWrapper>
);

// Preload authentication components for better UX
export const preloadAuthComponents = () => {
  // Preload when user hovers over auth links or when app is idle
  const preloadLogin = () => import('../pages/Login');
  const preloadSignup = () => import('../pages/Signup');
  
  return {
    preloadLogin,
    preloadSignup
  };
};

// Hook to preload components on user interaction
export const useAuthPreloader = () => {
  const { preloadLogin, preloadSignup } = preloadAuthComponents();
  
  const handleLoginHover = React.useCallback(() => {
    preloadLogin();
  }, [preloadLogin]);
  
  const handleSignupHover = React.useCallback(() => {
    preloadSignup();
  }, [preloadSignup]);
  
  return {
    handleLoginHover,
    handleSignupHover
  };
};

export default {
  LazyLogin,
  LazySignup,
  LazyAuthWrapper,
  preloadAuthComponents,
  useAuthPreloader
};