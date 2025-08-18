import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import DataTable from './DataTable';
import StatusBadge from './StatusBadge';
import clientService from '../services/clientService';

const ClientDetail = ({ clientId, onError }) => {
  const [client, setClient] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Load client details
  const loadClient = async () => {
    try {
      setLoading(true);
      const response = await clientService.getClient(clientId);
      
      if (response.success) {
        setClient(response.data);
      } else {
        onError(response.message || 'Failed to load client details');
      }
    } catch (err) {
      onError(err.message || 'Failed to load client details');
    } finally {
      setLoading(false);
    }
  };

  // Load client invoices
  const loadInvoices = async () => {
    try {
      setInvoicesLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage
      };

      const response = await clientService.getClientInvoices(clientId, params);
      
      if (response.success) {
        setInvoices(response.data.invoices || []);
        setTotalCount(response.data.totalCount || 0);
      } else {
        onError(response.message || 'Failed to load client invoices');
      }
    } catch (err) {
      onError(err.message || 'Failed to load client invoices');
    } finally {
      setInvoicesLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      loadClient();
    }
  }, [clientId]);

  useEffect(() => {
    if (clientId) {
      loadInvoices();
    }
  }, [clientId, page, rowsPerPage]);

  // Handle pagination
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  // Format address
  const formatAddress = (address) => {
    if (!address) return 'No address provided';
    
    const parts = [
      address.street,
      address.city,
      address.state,
      address.zipCode,
      address.country
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : 'No address provided';
  };

  // Invoice table columns
  const invoiceColumns = [
    {
      id: 'invoiceNumber',
      label: 'Invoice #',
      sortable: false,
      render: (value) => (
        <Typography variant="body2" fontWeight="medium">
          {value}
        </Typography>
      )
    },
    {
      id: 'invoiceDate',
      label: 'Date',
      sortable: false,
      render: (value) => formatDate(value)
    },
    {
      id: 'dueDate',
      label: 'Due Date',
      sortable: false,
      render: (value) => formatDate(value)
    },
    {
      id: 'status',
      label: 'Status',
      sortable: false,
      render: (value) => (
        <StatusBadge status={value} />
      )
    },
    {
      id: 'totalAmount',
      label: 'Amount',
      sortable: false,
      align: 'right',
      render: (value) => formatCurrency(value)
    }
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!client) {
    return (
      <Alert severity="error">
        Client not found
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Client Information Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="h5" component="h2">
              {client.name}
            </Typography>
            <Chip
              label={client.isActive ? 'Active' : 'Inactive'}
              color={client.isActive ? 'success' : 'default'}
              size="small"
            />
          </Box>

          <Grid container spacing={3}>
            {/* Contact Information */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon fontSize="small" />
                Contact Information
              </Typography>
              
              <Box sx={{ ml: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <EmailIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    {client.email}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <PhoneIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    {client.phone}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <LocationIcon fontSize="small" color="action" sx={{ mt: 0.5 }} />
                  <Typography variant="body2">
                    {formatAddress(client.address)}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Tax Information */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessIcon fontSize="small" />
                Tax Information
              </Typography>
              
              <Box sx={{ ml: 3 }}>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    GST Number
                  </Typography>
                  <Typography variant="body2">
                    {client.gstNumber || 'Not provided'}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    PAN Number
                  </Typography>
                  <Typography variant="body2">
                    {client.panNumber || 'Not provided'}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Aadhar Number
                  </Typography>
                  <Typography variant="body2">
                    {client.aadharNumber || 'Not provided'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Invoice History */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Invoice History
          </Typography>
          
          <DataTable
            columns={invoiceColumns}
            data={invoices}
            loading={invoicesLoading}
            page={page}
            rowsPerPage={rowsPerPage}
            totalCount={totalCount}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default ClientDetail;