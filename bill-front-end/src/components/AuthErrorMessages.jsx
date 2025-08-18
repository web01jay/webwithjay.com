import React from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Typography,
  Button,
  Collapse,
  IconButton
} from '@mui/material';
import {
  Error,
  Warning,
  Info,
  Security,
  Refresh,
  ExpandMore,
  ExpandLess,
  Login
} from '@mui/icons-material';

/**
 * Enhanced error message component for authentication failures
 */
export const AuthErrorAlert = ({ 
  error, 
  onRetry, 
  onGoToLogin,
  showDetails = false,
  severity = 'error',
  title = null,
  actionLabel = 'Try Again'
}) => {
  const [expanded, setExpanded] = React.useState(false);

  if (!error) return null;

  // Determine error type and customize message
  const getErrorInfo = (errorMessage) => {
    const message = errorMessage.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return {
        title: 'Connection Error',
        message: 'Unable to connect to the server. Please check your internet connection.',
        severity: 'warning',
        icon: <Warning />,
        suggestions: ['Check your internet connection', 'Try refreshing the page', 'Contact support if the problem persists']
      };
    }
    
    if (message.includes('unauthorized') || message.includes('401')) {
      return {
        title: 'Authentication Required',
        message: 'Your session has expired or you need to sign in.',
        severity: 'warning',
        icon: <Security />,
        suggestions: ['Sign in to your account', 'Check if your session has expired']
      };
    }
    
    if (message.includes('forbidden') || message.includes('403')) {
      return {
        title: 'Access Denied',
        message: 'You don\'t have permission to access this resource.',
        severity: 'error',
        icon: <Error />,
        suggestions: ['Contact your administrator', 'Verify your account permissions']
      };
    }
    
    if (message.includes('invalid credentials') || message.includes('login failed')) {
      return {
        title: 'Invalid Credentials',
        message: 'The email or password you entered is incorrect.',
        severity: 'error',
        icon: <Error />,
        suggestions: ['Double-check your email and password', 'Use the forgot password option if needed']
      };
    }
    
    if (message.includes('token') || message.includes('expired')) {
      return {
        title: 'Session Expired',
        message: 'Your session has expired. Please sign in again.',
        severity: 'warning',
        icon: <Security />,
        suggestions: ['Sign in again', 'Enable "Remember me" for longer sessions']
      };
    }
    
    // Default error
    return {
      title: 'Authentication Error',
      message: errorMessage,
      severity: 'error',
      icon: <Error />,
      suggestions: ['Try again', 'Refresh the page', 'Contact support if the problem continues']
    };
  };

  const errorInfo = getErrorInfo(error);
  const displaySeverity = severity || errorInfo.severity;
  const displayTitle = title || errorInfo.title;

  return (
    <Alert 
      severity={displaySeverity}
      icon={errorInfo.icon}
      sx={{ mb: 2 }}
      action={
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {showDetails && (
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              aria-label={expanded ? 'Hide details' : 'Show details'}
            >
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          )}
          {errorInfo.title === 'Authentication Required' && onGoToLogin && (
            <Button
              size="small"
              startIcon={<Login />}
              onClick={onGoToLogin}
            >
              Sign In
            </Button>
          )}
          {onRetry && (
            <Button
              size="small"
              startIcon={<Refresh />}
              onClick={onRetry}
            >
              {actionLabel}
            </Button>
          )}
        </Box>
      }
    >
      <AlertTitle>{displayTitle}</AlertTitle>
      <Typography variant="body2">
        {errorInfo.message}
      </Typography>
      
      {showDetails && (
        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" fontWeight="medium" gutterBottom>
              What you can try:
            </Typography>
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              {errorInfo.suggestions.map((suggestion, index) => (
                <Typography component="li" variant="body2" key={index}>
                  {suggestion}
                </Typography>
              ))}
            </Box>
            {process.env.NODE_ENV === 'development' && (
              <Box sx={{ mt: 2, p: 1, backgroundColor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  <strong>Debug Info:</strong> {error}
                </Typography>
              </Box>
            )}
          </Box>
        </Collapse>
      )}
    </Alert>
  );
};

/**
 * Simple inline error message for forms
 */
export const InlineAuthError = ({ 
  error, 
  severity = 'error',
  sx = {} 
}) => {
  if (!error) return null;

  return (
    <Alert 
      severity={severity} 
      variant="outlined"
      sx={{ 
        mt: 1, 
        '& .MuiAlert-message': { 
          fontSize: '0.875rem' 
        },
        ...sx 
      }}
    >
      {error}
    </Alert>
  );
};

/**
 * Toast-style error notification
 */
export const AuthErrorToast = ({ 
  error, 
  onClose,
  autoHideDuration = 6000 
}) => {
  const [open, setOpen] = React.useState(!!error);

  React.useEffect(() => {
    if (error) {
      setOpen(true);
      if (autoHideDuration > 0) {
        const timer = setTimeout(() => {
          setOpen(false);
          onClose?.();
        }, autoHideDuration);
        return () => clearTimeout(timer);
      }
    }
  }, [error, autoHideDuration, onClose]);

  if (!error) return null;

  return (
    <Collapse in={open}>
      <Alert 
        severity="error"
        onClose={() => {
          setOpen(false);
          onClose?.();
        }}
        sx={{ 
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 9999,
          minWidth: 300,
          maxWidth: 500
        }}
      >
        <AlertTitle>Authentication Error</AlertTitle>
        {error}
      </Alert>
    </Collapse>
  );
};

/**
 * Network status error for authentication
 */
export const AuthNetworkError = ({ 
  isOnline = true,
  onRetry 
}) => {
  if (isOnline) return null;

  return (
    <Alert 
      severity="warning"
      icon={<Warning />}
      action={
        onRetry && (
          <Button
            size="small"
            startIcon={<Refresh />}
            onClick={onRetry}
          >
            Retry
          </Button>
        )
      }
    >
      <AlertTitle>Connection Lost</AlertTitle>
      You're currently offline. Authentication features may not work properly.
    </Alert>
  );
};

const AuthErrorMessages = {
  Alert: AuthErrorAlert,
  Inline: InlineAuthError,
  Toast: AuthErrorToast,
  Network: AuthNetworkError
};

export default AuthErrorMessages;