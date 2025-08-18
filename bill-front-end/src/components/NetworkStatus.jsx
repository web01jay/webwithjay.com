import React from 'react';
import { Alert, Snackbar, Box, Typography, IconButton } from '@mui/material';
import { WifiOff, Wifi, Refresh, SignalWifi4Bar, SignalWifi2Bar } from '@mui/icons-material';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const NetworkStatus = () => {
  const { isOnline, connectionType, retryCount, isSlowConnection } = useNetworkStatus();
  const [showOfflineAlert, setShowOfflineAlert] = React.useState(false);
  const [showSlowAlert, setShowSlowAlert] = React.useState(false);

  React.useEffect(() => {
    if (!isOnline) {
      setShowOfflineAlert(true);
      setShowSlowAlert(false);
    } else {
      setShowOfflineAlert(false);
      if (isSlowConnection()) {
        setShowSlowAlert(true);
      } else {
        setShowSlowAlert(false);
      }
    }
  }, [isOnline, isSlowConnection]);

  const handleRetry = () => {
    window.location.reload();
  };

  const getConnectionIcon = () => {
    if (!isOnline) return <WifiOff />;
    if (isSlowConnection()) return <SignalWifi2Bar />;
    return <SignalWifi4Bar />;
  };

  const getConnectionText = () => {
    if (!isOnline) return 'No internet connection';
    if (isSlowConnection()) return 'Slow connection detected';
    return 'Connected';
  };

  return (
    <>
      {/* Offline Alert */}
      <Snackbar
        open={showOfflineAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity="error"
          variant="filled"
          icon={<WifiOff />}
          action={
            <IconButton
              size="small"
              color="inherit"
              onClick={handleRetry}
              title="Retry connection"
            >
              <Refresh />
            </IconButton>
          }
        >
          <Box>
            <Typography variant="body2" fontWeight="bold">
              No Internet Connection
            </Typography>
            <Typography variant="caption">
              Please check your network and try again
              {retryCount > 0 && ` (Retry attempts: ${retryCount})`}
            </Typography>
          </Box>
        </Alert>
      </Snackbar>

      {/* Slow Connection Alert */}
      <Snackbar
        open={showSlowAlert}
        autoHideDuration={6000}
        onClose={() => setShowSlowAlert(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity="warning"
          variant="filled"
          icon={<SignalWifi2Bar />}
          onClose={() => setShowSlowAlert(false)}
        >
          <Box>
            <Typography variant="body2" fontWeight="bold">
              Slow Connection Detected
            </Typography>
            <Typography variant="caption">
              Some features may load slowly
            </Typography>
          </Box>
        </Alert>
      </Snackbar>

      {/* Connection Status Indicator (for development) */}
      {process.env.NODE_ENV === 'development' && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 9999,
            backgroundColor: isOnline ? 'success.main' : 'error.main',
            color: 'white',
            p: 1,
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            fontSize: '0.75rem'
          }}
        >
          {getConnectionIcon()}
          <Typography variant="caption">
            {getConnectionText()}
            {connectionType !== 'unknown' && ` (${connectionType})`}
          </Typography>
        </Box>
      )}
    </>
  );
};

export default NetworkStatus;