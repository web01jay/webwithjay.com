import React from 'react';
import { Box, Typography, Button, Alert, Container } from '@mui/material';
import { ErrorOutline, Refresh, Login } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

class AuthErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      isAuthError: false
    };
  }

  static getDerivedStateFromError(error) {
    // Check if this is an authentication-related error
    const isAuthError = error.message?.includes('auth') || 
                       error.message?.includes('token') || 
                       error.message?.includes('login') ||
                       error.message?.includes('unauthorized') ||
                       error.name === 'AuthenticationError';
    
    return { 
      hasError: true,
      isAuthError
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('Auth Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log authentication errors to service if needed
    if (this.state.isAuthError) {
      console.error('Authentication error occurred:', {
        error: error.message,
        stack: error.stack,
        component: errorInfo.componentStack
      });
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      isAuthError: false
    });
  };

  handleGoToLogin = () => {
    // Clear any stored auth data and redirect to login
    localStorage.removeItem('authUser');
    localStorage.removeItem('intendedDestination');
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      const { isAuthError, error } = this.state;
      
      return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            minHeight="60vh"
            textAlign="center"
          >
            <ErrorOutline sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
            
            <Typography variant="h4" gutterBottom>
              {isAuthError ? 'Authentication Error' : 'Something went wrong'}
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {isAuthError 
                ? 'There was a problem with your authentication. Please try signing in again.'
                : 'We\'re sorry, but something unexpected happened. Please try refreshing the page.'
              }
            </Typography>

            <Alert 
              severity={isAuthError ? 'warning' : 'error'} 
              sx={{ mb: 3, textAlign: 'left', maxWidth: '100%' }}
            >
              <Typography variant="body2">
                <strong>Error:</strong> {error?.message || 'Unknown error'}
              </Typography>
              {isAuthError && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  This might be due to an expired session or invalid authentication state.
                </Typography>
              )}
            </Alert>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
              {isAuthError ? (
                <>
                  <Button
                    variant="contained"
                    startIcon={<Login />}
                    onClick={this.handleGoToLogin}
                  >
                    Go to Login
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={this.handleReload}
                  >
                    Reload Page
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="contained"
                    startIcon={<Refresh />}
                    onClick={this.handleReload}
                  >
                    Reload Page
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={this.handleReset}
                  >
                    Try Again
                  </Button>
                </>
              )}
            </Box>

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <Box sx={{ mt: 4, textAlign: 'left', width: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Error Details (Development Only):
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    backgroundColor: 'grey.100',
                    p: 2,
                    borderRadius: 1,
                    overflow: 'auto',
                    fontSize: '0.875rem',
                    maxHeight: '300px'
                  }}
                >
                  {error && error.stack}
                  {this.state.errorInfo.componentStack}
                </Box>
              </Box>
            )}
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default AuthErrorBoundary;