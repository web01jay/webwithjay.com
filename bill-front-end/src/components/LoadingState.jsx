import React from 'react';
import {
  Box,
  CircularProgress,
  LinearProgress,
  Typography,
  Skeleton,
  Card,
  CardContent,
  Grid
} from '@mui/material';

// Basic loading spinner
export const LoadingSpinner = ({ 
  size = 40, 
  message = 'Loading...', 
  showMessage = true,
  color = 'primary'
}) => (
  <Box 
    display="flex" 
    flexDirection="column" 
    alignItems="center" 
    justifyContent="center" 
    gap={2}
    py={4}
  >
    <CircularProgress size={size} color={color} />
    {showMessage && (
      <Typography variant="body2" color="textSecondary">
        {message}
      </Typography>
    )}
  </Box>
);

// Linear progress bar
export const LoadingBar = ({ 
  progress, 
  message, 
  showPercentage = false,
  color = 'primary'
}) => (
  <Box sx={{ width: '100%', py: 2 }}>
    {message && (
      <Typography variant="body2" color="textSecondary" gutterBottom>
        {message}
      </Typography>
    )}
    <LinearProgress 
      variant={progress !== undefined ? 'determinate' : 'indeterminate'}
      value={progress}
      color={color}
    />
    {showPercentage && progress !== undefined && (
      <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
        {Math.round(progress)}%
      </Typography>
    )}
  </Box>
);

// Skeleton loading for cards
export const CardSkeleton = ({ count = 1, height = 200 }) => (
  <Grid container spacing={3}>
    {Array.from({ length: count }, (_, index) => (
      <Grid item xs={12} sm={6} md={4} key={index}>
        <Card>
          <CardContent>
            <Skeleton variant="text" width="60%" height={24} />
            <Skeleton variant="text" width="40%" height={20} sx={{ mt: 1 }} />
            <Skeleton variant="rectangular" width="100%" height={height - 80} sx={{ mt: 2 }} />
          </CardContent>
        </Card>
      </Grid>
    ))}
  </Grid>
);

// Table skeleton
export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <Box>
    {Array.from({ length: rows }, (_, rowIndex) => (
      <Box key={rowIndex} display="flex" gap={2} py={1}>
        {Array.from({ length: columns }, (_, colIndex) => (
          <Skeleton 
            key={colIndex} 
            variant="text" 
            width={`${100 / columns}%`} 
            height={40}
          />
        ))}
      </Box>
    ))}
  </Box>
);

// Page loading overlay
export const PageLoading = ({ 
  message = 'Loading page...', 
  backdrop = true,
  fullScreen = false 
}) => (
  <Box
    sx={{
      position: fullScreen ? 'fixed' : 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: backdrop ? 'rgba(255, 255, 255, 0.8)' : 'transparent',
      zIndex: fullScreen ? 9999 : 1000,
      backdropFilter: backdrop ? 'blur(2px)' : 'none'
    }}
  >
    <LoadingSpinner message={message} size={60} />
  </Box>
);

// Button loading state
export const ButtonLoading = ({ 
  loading = false, 
  children, 
  size = 20,
  ...props 
}) => (
  <Box position="relative" display="inline-flex" alignItems="center">
    {children}
    {loading && (
      <CircularProgress
        size={size}
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          marginTop: `-${size / 2}px`,
          marginLeft: `-${size / 2}px`,
        }}
      />
    )}
  </Box>
);

const LoadingState = {
  Spinner: LoadingSpinner,
  Bar: LoadingBar,
  CardSkeleton,
  TableSkeleton,
  PageLoading,
  ButtonLoading
};

export default LoadingState;