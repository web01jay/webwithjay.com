import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
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
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText
} from '@mui/material';
import { apiWrapper } from '../services/api';
import { AuthErrorAlert } from '../components/AuthErrorMessages';
import { SignupLoadingState } from '../components/AuthLoadingState';
import { useFormErrorFocus } from '../hooks/useFocusManagement';
import { useModalKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { ScreenReaderOnly, LiveRegion } from '../components/AccessibilityHelper';

const Signup = () => {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      gender: ''
    }
  });

  const password = watch('password');

  // Focus first error when form validation fails
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      focusFirstError(errors);
      setStatusMessage(`Form has ${Object.keys(errors).length} error${Object.keys(errors).length > 1 ? 's' : ''}`);
    }
  }, [errors, focusFirstError]);

  const onSubmit = async (data) => {
    try {
      setSubmitError('');
      setSuccessMessage('');
      setIsSubmitting(true);
      setStatusMessage('Creating your account...');

      // Remove confirmPassword from the data sent to API
      const { confirmPassword, ...signupData } = data;

      const response = await apiWrapper.post('/auth/signup', signupData);
      
      if (response.success) {
        const successMsg = 'Account created successfully! Please sign in to continue.';
        setSuccessMessage(successMsg);
        setStatusMessage(successMsg);
        
        // Redirect to login after a short delay
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Account created successfully! Please sign in.',
              email: data.email 
            }
          });
        }, 2000);
      } else {
        const errorMsg = response.message || 'Signup failed. Please try again.';
        setSubmitError(errorMsg);
        setStatusMessage(`Signup failed: ${errorMsg}`);
      }
    } catch (error) {
      const errorMsg = error.message || 'Signup failed. Please try again.';
      setSubmitError(errorMsg);
      setStatusMessage(`Signup failed: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          aria-labelledby="signup-title"
          aria-describedby="signup-description"
        >
          {/* Screen reader announcements */}
          <LiveRegion aria-live="polite" aria-atomic="true">
            {statusMessage}
          </LiveRegion>
          
          {/* Loading overlay */}
          {isSubmitting && (
            <SignupLoadingState 
              message="Creating your account..." 
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
              id="signup-title"
            >
              Sign Up
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              align="center" 
              sx={{ mb: 3 }}
              id="signup-description"
            >
              Create your account to get started with our billing system.
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

            {/* Display error message */}
            {submitError && (
              <AuthErrorAlert
                error={submitError}
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
            >
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    id="firstName"
                    label="First Name"
                    autoComplete="given-name"
                    autoFocus
                    disabled={isSubmitting}
                    error={!!errors.firstName}
                    helperText={errors.firstName?.message}
                    {...register('firstName', {
                      required: 'First name is required',
                      minLength: {
                        value: 2,
                        message: 'First name must be at least 2 characters long'
                      },
                      pattern: {
                        value: /^[A-Za-z\s]+$/,
                        message: 'First name can only contain letters and spaces'
                      }
                    })}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    id="lastName"
                    label="Last Name"
                    autoComplete="family-name"
                    disabled={isSubmitting}
                    error={!!errors.lastName}
                    helperText={errors.lastName?.message}
                    {...register('lastName', {
                      required: 'Last name is required',
                      minLength: {
                        value: 2,
                        message: 'Last name must be at least 2 characters long'
                      },
                      pattern: {
                        value: /^[A-Za-z\s]+$/,
                        message: 'Last name can only contain letters and spaces'
                      }
                    })}
                  />
                </Grid>
              </Grid>

              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                type="email"
                autoComplete="email"
                disabled={isSubmitting}
                error={!!errors.email}
                helperText={errors.email?.message}
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
                id="phone"
                label="Phone Number"
                type="tel"
                autoComplete="tel"
                disabled={isSubmitting}
                error={!!errors.phone}
                helperText={errors.phone?.message}
                {...register('phone', {
                  required: 'Phone number is required',
                  pattern: {
                    value: /^[+]?[\d\s\-()]{10,}$/,
                    message: 'Please enter a valid phone number'
                  }
                })}
              />

              <FormControl 
                fullWidth 
                margin="normal" 
                required 
                error={!!errors.gender}
                disabled={isSubmitting}
              >
                <InputLabel id="gender-label">Gender</InputLabel>
                <Select
                  labelId="gender-label"
                  id="gender"
                  label="Gender"
                  {...register('gender', {
                    required: 'Please select your gender'
                  })}
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                  <MenuItem value="prefer-not-to-say">Prefer not to say</MenuItem>
                </Select>
                {errors.gender && (
                  <FormHelperText>{errors.gender.message}</FormHelperText>
                )}
              </FormControl>

              <TextField
                margin="normal"
                required
                fullWidth
                id="password"
                label="Password"
                type="password"
                autoComplete="new-password"
                disabled={isSubmitting}
                error={!!errors.password}
                helperText={errors.password?.message}
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters long'
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
                  }
                })}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                id="confirmPassword"
                label="Confirm Password"
                type="password"
                autoComplete="new-password"
                disabled={isSubmitting}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) =>
                    value === password || 'Passwords do not match'
                })}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, py: 1.5 }}
                disabled={isSubmitting}
                startIcon={isSubmitting && <CircularProgress size={20} />}
              >
                {isSubmitting ? 'Creating Account...' : 'Sign Up'}
              </Button>

              <Divider sx={{ my: 2 }} />

              <Grid container justifyContent="center">
                <Grid item>
                  <Typography variant="body2" color="text.secondary">
                    Already have an account?{' '}
                    <Link 
                      to="/login" 
                      style={{ 
                        textDecoration: 'none',
                        color: 'inherit',
                        fontWeight: 'bold'
                      }}
                    >
                      Sign in here
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

export default Signup;