import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Backdrop,
  LinearProgress,
  Fade,
  Card,
  CardContent
} from '@mui/material';
import { Security, Login, VpnKey } from '@mui/icons-material';

/**
 * Loading spinner specifically for authentication checks
 */
export const AuthLoadingSpinner = ({ 
  message = 'Checking authentication...', 
  size = 40,
  showIcon = true,
  overlay = false 
}) => {
  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 3
      }}
    >
      {showIcon && (
        <Security sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
      )}
      <CircularProgress size={size} color="primary" />
      <Typography variant="body2" color="text.secondary" textAlign="center">
        {message}
      </Typography>
    </Box>
  );

  if (overlay) {
    return (
      <Backdrop
        sx={{ 
          color: '#fff', 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(255, 255, 255, 0.9)'
        }}
        open={true}
      >
        <Box sx={{ color: 'text.primary' }}>
          {content}
        </Box>
      </Backdrop>
    );
  }

  return content;
};

/**
 * Loading state for route transitions
 */
export const RouteLoadingState = ({ 
  message = 'Loading page...',
  progress = null 
}) => (
  <Fade in={true} timeout={300}>
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1300,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(2px)'
      }}
    >
      <LinearProgress 
        variant={progress !== null ? 'determinate' : 'indeterminate'}
        value={progress}
        sx={{ height: 3 }}
      />
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
          gap: 2
        }}
      >
        <CircularProgress size={20} />
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </Box>
    </Box>
  </Fade>
);

/**
 * Loading state for login form
 */
export const LoginLoadingState = ({ 
  message = 'Signing in...',
  overlay = true 
}) => (
  <Box
    sx={{
      position: overlay ? 'absolute' : 'relative',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: overlay ? 'rgba(255, 255, 255, 0.9)' : 'transparent',
      zIndex: overlay ? 1000 : 'auto',
      gap: 2,
      p: 3
    }}
  >
    <Login sx={{ fontSize: 40, color: 'primary.main' }} />
    <CircularProgress size={30} />
    <Typography variant="body2" color="text.secondary">
      {message}
    </Typography>
  </Box>
);

/**
 * Loading state for signup form
 */
export const SignupLoadingState = ({ 
  message = 'Creating account...',
  overlay = true 
}) => (
  <Box
    sx={{
      position: overlay ? 'absolute' : 'relative',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: overlay ? 'rgba(255, 255, 255, 0.9)' : 'transparent',
      zIndex: overlay ? 1000 : 'auto',
      gap: 2,
      p: 3
    }}
  >
    <VpnKey sx={{ fontSize: 40, color: 'primary.main' }} />
    <CircularProgress size={30} />
    <Typography variant="body2" color="text.secondary">
      {message}
    </Typography>
  </Box>
);

/**
 * Inline loading state for buttons and small components
 */
export const InlineAuthLoading = ({ 
  size = 16, 
  message = '',
  showMessage = false 
}) => (
  <Box 
    sx={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: 1 
    }}
  >
    <CircularProgress size={size} />
    {showMessage && message && (
      <Typography variant="caption" color="text.secondary">
        {message}
      </Typography>
    )}
  </Box>
);

/**
 * Card-based loading state for protected content
 */
export const ProtectedContentLoading = ({ 
  message = 'Verifying access permissions...',
  height = 200 
}) => (
  <Card sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <CardContent>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2
        }}
      >
        <Security sx={{ fontSize: 32, color: 'primary.main' }} />
        <CircularProgress size={24} />
        <Typography variant="body2" color="text.secondary" textAlign="center">
          {message}
        </Typography>
      </Box>
    </CardContent>
  </Card>
);

const AuthLoadingState = {
  Spinner: AuthLoadingSpinner,
  Route: RouteLoadingState,
  Login: LoginLoadingState,
  Signup: SignupLoadingState,
  Inline: InlineAuthLoading,
  ProtectedContent: ProtectedContentLoading
};

export default AuthLoadingState;