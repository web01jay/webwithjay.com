import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ErrorBoundary from './components/ErrorBoundary';
import AuthErrorBoundary from './components/AuthErrorBoundary';
import NetworkStatus from './components/NetworkStatus';
import RouteTransitionLoader from './components/RouteTransitionLoader';
import Navigation from './components/Navigation';
import Breadcrumbs from './components/Breadcrumbs';
import { BackToTop, useReducedMotion, SkipToMain } from './components/AccessibilityHelper';
import { AuthProvider } from './contexts/AuthContext';
import { PublicRoute, PrivateRoute } from './components/RouteGuards';
import { LazyLogin, LazySignup } from './components/LazyAuthComponents';
import { useFocusManagement } from './hooks/useFocusManagement';
import Home from './pages/Home';

// Lazy load protected components for better performance
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Products = React.lazy(() => import('./pages/Products'));
const Clients = React.lazy(() => import('./pages/Clients'));
const Invoices = React.lazy(() => import('./pages/Invoices'));

// Inner component that uses Router context
function AppContent() {
  const { mainContentRef, announceRef } = useFocusManagement({
    focusOnRouteChange: true,
    skipToMainContent: true,
    announceRouteChange: true
  });

  return (
    <>
      {/* Skip to main content link for keyboard users */}
      <SkipToMain targetId="main-content" />

      {/* Screen reader announcements for route changes */}
      <div
        ref={announceRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute',
          left: '-10000px',
          width: '1px',
          height: '1px',
          overflow: 'hidden'
        }}
      />

      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navigation />
        <Breadcrumbs />
        <Box
          component="main"
          id="main-content"
          ref={mainContentRef}
          sx={{
            flex: 1,
            p: { xs: 2, sm: 3 },
            '&:focus': {
              outline: '2px solid transparent',
              outlineOffset: '2px'
            }
          }}
          tabIndex={-1}
          role="main"
          aria-label="Main content"
        >
          <Suspense fallback={<RouteTransitionLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route
                path="/"
                element={
                  <PublicRoute>
                    <Home />
                  </PublicRoute>
                }
              />
              <Route
                path="/login"
                element={
                  <PublicRoute redirectIfAuthenticated={true}>
                    <LazyLogin />
                  </PublicRoute>
                }
              />
              <Route
                path="/signup"
                element={
                  <PublicRoute redirectIfAuthenticated={true}>
                    <LazySignup />
                  </PublicRoute>
                }
              />

              {/* Private Routes - Lazy loaded for better performance */}
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/clients"
                element={
                  <PrivateRoute>
                    <Clients />
                  </PrivateRoute>
                }
              />
              <Route
                path="/invoices"
                element={
                  <PrivateRoute>
                    <Invoices />
                  </PrivateRoute>
                }
              />
              <Route
                path="/products"
                element={
                  <PrivateRoute>
                    <Products />
                  </PrivateRoute>
                }
              />

              {/* Default redirects and 404 handling */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Box>
      </Box>

      {/* Route transition loading */}
      <RouteTransitionLoader />

      {/* Accessibility features */}
      <BackToTop />

      {/* Network status indicator */}
      <NetworkStatus />

      {/* Toast notifications with accessibility */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        role="alert"
        aria-live="polite"
      />
    </>
  );
}

function App() {
  const prefersReducedMotion = useReducedMotion();

  const theme = createTheme({
    palette: {
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
    },
    transitions: {
      // Respect user's motion preferences
      duration: {
        shortest: prefersReducedMotion ? 0 : 150,
        shorter: prefersReducedMotion ? 0 : 200,
        short: prefersReducedMotion ? 0 : 250,
        standard: prefersReducedMotion ? 0 : 300,
        complex: prefersReducedMotion ? 0 : 375,
        enteringScreen: prefersReducedMotion ? 0 : 225,
        leavingScreen: prefersReducedMotion ? 0 : 195,
      },
    },
    components: {
      // Enhanced focus indicators
      MuiButton: {
        styleOverrides: {
          root: {
            '&:focus-visible': {
              outline: '2px solid',
              outlineColor: 'primary.main',
              outlineOffset: '2px',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderWidth: '2px',
              },
            },
          },
        },
      },
    },
  });

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <AuthErrorBoundary>
            <Router>
              <AppContent />
            </Router>
          </AuthErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App
