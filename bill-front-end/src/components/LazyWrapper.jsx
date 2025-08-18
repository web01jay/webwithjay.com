import React, { Suspense } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const LazyWrapper = ({ 
  children, 
  fallback, 
  minHeight = '200px',
  showText = true 
}) => {
  const defaultFallback = (
    <Box 
      display="flex" 
      flexDirection="column"
      justifyContent="center" 
      alignItems="center" 
      minHeight={minHeight}
      gap={2}
    >
      <CircularProgress size={40} />
      {showText && (
        <Typography variant="body2" color="textSecondary">
          Loading component...
        </Typography>
      )}
    </Box>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
};

export default LazyWrapper;