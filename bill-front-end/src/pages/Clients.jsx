import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import DataTable from '../components/DataTable';
import SearchBar from '../components/SearchBar';
import FormModal from '../components/FormModal';
import ConfirmDialog from '../components/ConfirmDialog';
import ClientForm from '../components/ClientForm';
import ClientDetail from '../components/ClientDetail';
import clientService from '../services/clientService';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Pagination and filtering
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form refs
  const createFormRef = useRef();
  const editFormRef = useRef();

  // Load clients
  const loadClients = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        page: page + 1, // Backend expects 1-based pagination
        limit: rowsPerPage,
        sortBy,
        sortOrder,
        ...(searchQuery && { search: searchQuery })
      };

      const response = await clientService.getClients(params);
      
      if (response.success) {
        setClients(response.data.clients || []);
        setTotalCount(response.data.totalCount || 0);
      } else {
        setError(response.message || 'Failed to load clients');
      }
    } catch (err) {
      setError(err.message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  // Load clients on component mount and when dependencies change
  useEffect(() => {
    loadClients();
  }, [page, rowsPerPage, searchQuery, sortBy, sortOrder]);

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
    setPage(0); // Reset to first page when searching
  };

  // Handle sorting
  const handleSort = (property, order) => {
    setSortBy(property);
    setSortOrder(order);
    setPage(0); // Reset to first page when sorting
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0); // Reset to first page when changing rows per page
  };

  // Handle create client
  const handleCreateClient = () => {
    setSelectedClient(null);
    setCreateModalOpen(true);
  };

  // Handle view client details
  const handleViewClient = (client) => {
    setSelectedClient(client);
    setDetailModalOpen(true);
  };

  // Handle edit client
  const handleEditClient = (client) => {
    setSelectedClient(client);
    setEditModalOpen(true);
  };

  // Handle delete client
  const handleDeleteClient = (client) => {
    setSelectedClient(client);
    setDeleteDialogOpen(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!selectedClient) return;

    try {
      setLoading(true);
      const response = await clientService.deleteClient(selectedClient._id);
      
      if (response.success) {
        setSuccess('Client deleted successfully');
        loadClients(); // Reload the list
      } else {
        setError(response.message || 'Failed to delete client');
      }
    } catch (err) {
      setError(err.message || 'Failed to delete client');
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setSelectedClient(null);
    }
  };

  // Handle form submission success
  const handleFormSuccess = (message) => {
    setSuccess(message);
    setCreateModalOpen(false);
    setEditModalOpen(false);
    setDetailModalOpen(false);
    setSelectedClient(null);
    setFormLoading(false);
    loadClients(); // Reload the list
  };

  // Handle form submission error
  const handleFormError = (message) => {
    setError(message);
    setFormLoading(false);
  };

  // Handle form submission start
  const handleFormSubmit = async (formRef) => {
    setFormLoading(true);
    if (formRef.current) {
      await formRef.current.submit();
    }
  };

  // Handle modal close
  const handleCloseCreateModal = () => {
    setCreateModalOpen(false);
    setSelectedClient(null);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedClient(null);
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedClient(null);
  };

  // Close alerts
  const handleCloseAlert = () => {
    setError('');
    setSuccess('');
  };

  // Format address for display
  const formatAddress = (address) => {
    if (!address) return 'No address';
    const parts = [address.city, address.state].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'No address';
  };

  // Table columns configuration
  const columns = [
    {
      id: 'name',
      label: 'Client Name',
      sortable: true,
      render: (value, row) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.email}
          </Typography>
        </Box>
      )
    },
    {
      id: 'phone',
      label: 'Phone',
      sortable: true
    },
    {
      id: 'address',
      label: 'Location',
      sortable: false,
      render: (value, row) => formatAddress(row.address)
    },
    {
      id: 'gstNumber',
      label: 'GST Number',
      sortable: false,
      render: (value) => value || 'Not provided'
    },
    {
      id: 'isActive',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <Chip
          label={value ? 'Active' : 'Inactive'}
          color={value ? 'success' : 'default'}
          size="small"
        />
      )
    },
    {
      id: 'actions',
      label: 'Actions',
      sortable: false,
      align: 'center',
      render: (value, row) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton
            size="small"
            onClick={() => handleViewClient(row)}
            title="View Client Details"
          >
            <ViewIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleEditClient(row)}
            title="Edit Client"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDeleteClient(row)}
            title="Delete Client"
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Clients
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateClient}
        >
          Add Client
        </Button>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <SearchBar
          placeholder="Search clients by name, email, or phone..."
          onSearch={handleSearch}
          value={searchQuery}
          fullWidth
        />
      </Box>

      {/* Clients Table */}
      <DataTable
        columns={columns}
        data={clients}
        loading={loading}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        onSort={handleSort}
        sortBy={sortBy}
        sortOrder={sortOrder}
      />

      {/* Create Client Modal */}
      <FormModal
        open={createModalOpen}
        onClose={handleCloseCreateModal}
        title="Add New Client"
        submitLabel="Create Client"
        loading={formLoading}
        onSubmit={() => handleFormSubmit(createFormRef)}
        maxWidth="md"
      >
        <ClientForm
          ref={createFormRef}
          client={null}
          onSuccess={handleFormSuccess}
          onError={handleFormError}
          loading={formLoading}
        />
      </FormModal>

      {/* Edit Client Modal */}
      <FormModal
        open={editModalOpen}
        onClose={handleCloseEditModal}
        title="Edit Client"
        submitLabel="Update Client"
        loading={formLoading}
        onSubmit={() => handleFormSubmit(editFormRef)}
        maxWidth="md"
      >
        <ClientForm
          ref={editFormRef}
          client={selectedClient}
          onSuccess={handleFormSuccess}
          onError={handleFormError}
          loading={formLoading}
        />
      </FormModal>

      {/* Client Detail Modal */}
      <FormModal
        open={detailModalOpen}
        onClose={handleCloseDetailModal}
        title={selectedClient ? `${selectedClient.name} - Details` : 'Client Details'}
        maxWidth="lg"
        submitLabel=""
        cancelLabel="Close"
        onSubmit={null}
      >
        {selectedClient && (
          <ClientDetail
            clientId={selectedClient._id}
            onError={handleFormError}
          />
        )}
      </FormModal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Client"
        message={
          selectedClient
            ? `Are you sure you want to delete "${selectedClient.name}"? This action cannot be undone and will also delete all associated invoices.`
            : 'Are you sure you want to delete this client?'
        }
        confirmLabel="Delete"
        severity="error"
        loading={loading}
      />

      {/* Success/Error Alerts */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseAlert} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseAlert} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Clients;