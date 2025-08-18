import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  Divider
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { AuthErrorAlert } from '../components/AuthErrorMessages';
import { LoginLoadingState } from '../components/AuthLoadingState';
import { useFormErrorFocus } from '../hooks/useFocusManagement';
import { useModalKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { ScreenReaderOnly, LiveRegion } from '../components/AccessibilityHelper';

const Login = () => {
  const { login, isLoading, error, getIntendedDestination, clearIntendedDestination } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  
  // Accessibility hooks
  const { focusFirstError } = useFormErrorFocus();
  const { elementRef: formRef } = useModalKeyboardNavigation({
    onConfirm: (e) => {
      // Allow Ctrl+Enter to submit form
      const form = formRef.current?.querySelector('form');
      if (form) {
        form.requestSubmit();
      }
    },
    enabled: true
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      email: '',
      password: ''
    }
  });

  // Focus first error when form validation fails
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      focusFirstError(errors);
      setStatusMessage(`Form has ${Object.keys(errors).length} error${Object.keys(errors).length > 1 ? 's' : ''}`);
    }
  }, [errors, focusFirstError]);

  // Handle success message from signup redirect
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      
      // Pre-fill email if provided
      if (location.state.email) {
        setValue('email', location.state.email);
      }
      
      // Clear the state to prevent showing message on refresh
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, setValue, navigate, location.pathname]);

  const onSubmit = async (data) => {
    try {
      setSubmitError('');
      setStatusMessage('Signing you in...');
      await login(data);
      
      setStatusMessage('Login successful! Redirecting...');
      
      // Handle post-login redirect to intended destination
      const intendedDestination = getIntendedDestination();
      
      if (intendedDestination) {
        // Clear the intended destination since we're using it
        clearIntendedDestination();
        
        // Don't redirect to public routes as intended destination
        const publicRoutes = ['/', '/login', '/signup', '/home'];
        if (publicRoutes.includes(intendedDestination)) {
          navigate('/dashboard', { replace: true });
        } else {
          navigate(intendedDestination, { replace: true });
        }
      } else {
        // No intended destination, redirect to default dashboard
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      const errorMessage = error.message || 'Login failed. Please try again.';
      setSubmitError(errorMessage);
      setStatusMessage(`Login failed: ${errorMessage}`);
    }
  };

  const isFormLoading = isLoading || isSubmitting;

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper 
          elevation={3} 
          sx={{ padding: 4, width: '100%', position: 'relative' }}
          ref={formRef}
          role="main"
          aria-labelledby="login-title"
          aria-describedby="login-description"
        >
          {/* Screen reader announcements */}
          <LiveRegion aria-live="polite" aria-atomic="true">
            {statusMessage}
          </LiveRegion>
          
          {/* Loading overlay */}
          {isFormLoading && (
            <LoginLoadingState 
              message="Signing you in..." 
              overlay={true}
            />
          )}
          
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Typography 
              component="h1" 
              variant="h4" 
              gutterBottom
              id="login-title"
            >
              Sign In
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              align="center" 
              sx={{ mb: 3 }}
              id="login-description"
            >
              Welcome back! Please sign in to your account.
              <ScreenReaderOnly>
                Use Tab to navigate between fields, Enter to submit, or Ctrl+Enter as a shortcut.
              </ScreenReaderOnly>
            </Typography>

            {/* Display success message */}
            {successMessage && (
              <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
                {successMessage}
              </Alert>
            )}

            {/* Display authentication errors */}
            {(error || submitError) && (
              <AuthErrorAlert
                error={submitError || error}
                onRetry={() => {
                  setSubmitError('');
                }}
                showDetails={true}
                actionLabel="Clear Error"
              />
            )}

            <Box
              component="form"
              onSubmit={handleSubmit(onSubmit)}
              sx={{ mt: 1, width: '100%' }}
              noValidate
              aria-describedby="form-instructions"
            >
              <ScreenReaderOnly id="form-instructions">
                Fill out the form below to sign in. All fields are required.
              </ScreenReaderOnly>
              
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                name="email"
                label="Email Address"
                type="email"
                autoComplete="email"
                autoFocus
                disabled={isFormLoading}
                error={!!errors.email}
                helperText={errors.email?.message}
                aria-describedby={errors.email ? 'email-error' : undefined}
                inputProps={{
                  'aria-label': 'Email Address',
                  'aria-required': 'true',
                  'aria-invalid': !!errors.email
                }}
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Please enter a valid email address'
                  }
                })}
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                id="password"
                name="password"
                label="Password"
                type="password"
                autoComplete="current-password"
                disabled={isFormLoading}
                error={!!errors.password}
                helperText={errors.password?.message}
                aria-describedby={errors.password ? 'password-error' : undefined}
                inputProps={{
                  'aria-label': 'Password',
                  'aria-required': 'true',
                  'aria-invalid': !!errors.password
                }}
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters long'
                  }
                })}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, py: 1.5 }}
                disabled={isFormLoading}
                startIcon={isFormLoading && <CircularProgress size={20} />}
                aria-describedby="submit-instructions"
              >
                {isFormLoading ? 'Signing In...' : 'Sign In'}
              </Button>
              <ScreenReaderOnly id="submit-instructions">
                Press Enter to submit the form, or use Ctrl+Enter as a keyboard shortcut
              </ScreenReaderOnly>

              <Divider sx={{ my: 2 }} />

              <Grid container justifyContent="center">
                <Grid item>
                  <Typography variant="body2" color="text.secondary">
                    Don't have an account?{' '}
                    <Link 
                      to="/signup" 
                      style={{ 
                        textDecoration: 'none',
                        color: 'inherit',
                        fontWeight: 'bold'
                      }}
                    >
                      Sign up here
                    </Link>
                  </Typography>
                </Grid>
              </Grid>

              <Grid container justifyContent="center" sx={{ mt: 1 }}>
                <Grid item>
                  <Link 
                    to="/" 
                    style={{ 
                      textDecoration: 'none',
                      color: 'inherit'
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      ← Back to Home
                    </Typography>
                  </Link>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;