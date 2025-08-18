import React from 'react';
import {
  CircularProgress,
  Box,
  Typography,
  Backdrop
} from '@mui/material';

const LoadingSpinner = ({
  size = 40,
  message = '',
  overlay = false,
  color = 'primary',
  thickness = 3.6
}) => {
  const spinner = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 2
      }}
    >
      <CircularProgress
        size={size}
        color={color}
        thickness={thickness}
      />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );

  if (overlay) {
    return (
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={true}
      >
        {spinner}
      </Backdrop>
    );
  }

  return spinner;
};

export default LoadingSpinner;