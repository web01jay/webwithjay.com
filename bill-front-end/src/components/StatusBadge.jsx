import React from 'react';
import { Chip } from '@mui/material';

const StatusBadge = ({ status, variant = 'filled', size = 'small' }) => {
  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    
    switch (statusLower) {
      case 'active':
      case 'paid':
      case 'completed':
      case 'success':
        return 'success';
      case 'inactive':
      case 'draft':
      case 'pending':
        return 'warning';
      case 'overdue':
      case 'failed':
      case 'error':
      case 'cancelled':
        return 'error';
      case 'sent':
      case 'processing':
      case 'info':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    if (!status) return 'Unknown';
    
    // Capitalize first letter and handle camelCase
    return status
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  return (
    <Chip
      label={getStatusLabel(status)}
      color={getStatusColor(status)}
      variant={variant}
      size={size}
    />
  );
};

export default StatusBadge;