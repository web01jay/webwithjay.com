import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  Alert,
  Snackbar,
  TextField,
  MenuItem,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  PictureAsPdf as PdfIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import DataTable from '../components/DataTable';
import SearchBar from '../components/SearchBar';
import FormModal from '../components/FormModal';
import ConfirmDialog from '../components/ConfirmDialog';
import StatusBadge from '../components/StatusBadge';
import InvoiceForm from '../components/InvoiceForm';
import InvoiceDetail from '../components/InvoiceDetail';
import invoiceService from '../services/invoiceService';
import { format } from 'date-fns';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Pagination and filtering
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('invoiceDate');
  const [sortOrder, setSortOrder] = useState('desc');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form refs
  const createFormRef = useRef();
  const editFormRef = useRef();

  // Status options
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' }
  ];

  // Load invoices
  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        page: page + 1, // Backend expects 1-based pagination
        limit: rowsPerPage,
        sortBy,
        sortOrder,
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter && { status: statusFilter }),
        ...(clientFilter && { client: clientFilter }),
        ...(startDate && { startDate: format(startDate, 'yyyy-MM-dd') }),
        ...(endDate && { endDate: format(endDate, 'yyyy-MM-dd') })
      };

      const response = await invoiceService.getInvoices(params);
      
      if (response.success) {
        setInvoices(response.data.invoices || []);
        setTotalCount(response.data.totalCount || 0);
      } else {
        setError(response.message || 'Failed to load invoices');
      }
    } catch (err) {
      setError(err.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  // Load invoices on component mount and when dependencies change
  useEffect(() => {
    loadInvoices();
  }, [page, rowsPerPage, searchQuery, sortBy, sortOrder, statusFilter, clientFilter, startDate, endDate]);

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

  // Handle filter changes
  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleClientFilterChange = (event) => {
    setClientFilter(event.target.value);
    setPage(0);
  };

  const handleStartDateChange = (date) => {
    setStartDate(date);
    setPage(0);
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
    setPage(0);
  };

  // Clear filters
  const clearFilters = () => {
    setStatusFilter('');
    setClientFilter('');
    setStartDate(null);
    setEndDate(null);
    setSearchQuery('');
    setPage(0);
  };

  // Handle create invoice
  const handleCreateInvoice = () => {
    setSelectedInvoice(null);
    setCreateModalOpen(true);
  };

  // Handle view invoice details
  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setDetailModalOpen(true);
  };

  // Handle edit from detail view
  const handleEditFromDetail = (invoice) => {
    setSelectedInvoice(invoice);
    setDetailModalOpen(false);
    setEditModalOpen(true);
  };

  // Handle edit invoice
  const handleEditInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setEditModalOpen(true);
  };

  // Handle delete invoice
  const handleDeleteInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setDeleteDialogOpen(true);
  };

  // Handle PDF download
  const handleDownloadPDF = async (invoice) => {
    try {
      setLoading(true);
      await invoiceService.downloadInvoicePDF(
        invoice._id,
        `invoice-${invoice.invoiceNumber}.pdf`
      );
      setSuccess('PDF downloaded successfully');
    } catch (err) {
      setError(err.message || 'Failed to download PDF');
    } finally {
      setLoading(false);
    }
  };

  // Handle status update
  const handleStatusUpdate = async (invoice, newStatus) => {
    try {
      setLoading(true);
      const response = await invoiceService.updateInvoice(invoice._id, {
        ...invoice,
        status: newStatus
      });
      
      if (response.success) {
        setSuccess(`Invoice status updated to ${newStatus}`);
        loadInvoices(); // Reload the list
      } else {
        setError(response.message || 'Failed to update invoice status');
      }
    } catch (err) {
      setError(err.message || 'Failed to update invoice status');
    } finally {
      setLoading(false);
    }
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!selectedInvoice) return;

    try {
      setLoading(true);
      const response = await invoiceService.deleteInvoice(selectedInvoice._id);
      
      if (response.success) {
        setSuccess('Invoice deleted successfully');
        loadInvoices(); // Reload the list
      } else {
        setError(response.message || 'Failed to delete invoice');
      }
    } catch (err) {
      setError(err.message || 'Failed to delete invoice');
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setSelectedInvoice(null);
    }
  };

  // Handle form submission success
  const handleFormSuccess = (message) => {
    setSuccess(message);
    setCreateModalOpen(false);
    setEditModalOpen(false);
    setDetailModalOpen(false);
    setSelectedInvoice(null);
    setFormLoading(false);
    loadInvoices(); // Reload the list
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
    setSelectedInvoice(null);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedInvoice(null);
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedInvoice(null);
  };

  // Close alerts
  const handleCloseAlert = () => {
    setError('');
    setSuccess('');
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'dd/MM/yyyy');
  };

  // Table columns configuration
  const columns = [
    {
      id: 'invoiceNumber',
      label: 'Invoice #',
      sortable: true,
      render: (value, row) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatDate(row.invoiceDate)}
          </Typography>
        </Box>
      )
    },
    {
      id: 'clientId',
      label: 'Client',
      sortable: false,
      render: (value, row) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {row.clientId?.name || 'Unknown Client'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.clientId?.email || ''}
          </Typography>
        </Box>
      )
    },
    {
      id: 'totalAmount',
      label: 'Amount',
      sortable: true,
      align: 'right',
      render: (value) => (
        <Typography variant="body2" fontWeight="medium">
          {formatCurrency(value)}
        </Typography>
      )
    },
    {
      id: 'dueDate',
      label: 'Due Date',
      sortable: true,
      render: (value) => formatDate(value)
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      render: (value, row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <StatusBadge status={value} />
          {value === 'draft' && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleStatusUpdate(row, 'sent')}
            >
              Send
            </Button>
          )}
          {value === 'sent' && (
            <Button
              size="small"
              variant="outlined"
              color="success"
              onClick={() => handleStatusUpdate(row, 'paid')}
            >
              Mark Paid
            </Button>
          )}
        </Box>
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
            onClick={() => handleViewInvoice(row)}
            title="View Invoice Details"
          >
            <ViewIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDownloadPDF(row)}
            title="Download PDF"
            color="primary"
          >
            <PdfIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleEditInvoice(row)}
            title="Edit Invoice"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDeleteInvoice(row)}
            title="Delete Invoice"
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Invoices
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateInvoice}
          >
            Create Invoice
          </Button>
        </Box>

        {/* Search and Filters */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <SearchBar
                placeholder="Search invoices by number, client..."
                onSearch={handleSearch}
                value={searchQuery}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                select
                label="Status"
                value={statusFilter}
                onChange={handleStatusFilterChange}
                fullWidth
                size="small"
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={handleStartDateChange}
                renderInput={(params) => <TextField {...params} size="small" fullWidth />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={handleEndDateChange}
                renderInput={(params) => <TextField {...params} size="small" fullWidth />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                variant="outlined"
                onClick={clearFilters}
                fullWidth
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* Invoices Table */}
        <DataTable
          columns={columns}
          data={invoices}
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

        {/* Create Invoice Modal */}
        <FormModal
          open={createModalOpen}
          onClose={handleCloseCreateModal}
          title="Create New Invoice"
          submitLabel="Create Invoice"
          loading={formLoading}
          onSubmit={() => handleFormSubmit(createFormRef)}
          maxWidth="lg"
        >
          <InvoiceForm
            ref={createFormRef}
            invoice={null}
            onSuccess={handleFormSuccess}
            onError={handleFormError}
            loading={formLoading}
          />
        </FormModal>

        {/* Edit Invoice Modal */}
        <FormModal
          open={editModalOpen}
          onClose={handleCloseEditModal}
          title="Edit Invoice"
          submitLabel="Update Invoice"
          loading={formLoading}
          onSubmit={() => handleFormSubmit(editFormRef)}
          maxWidth="lg"
        >
          <InvoiceForm
            ref={editFormRef}
            invoice={selectedInvoice}
            onSuccess={handleFormSuccess}
            onError={handleFormError}
            loading={formLoading}
          />
        </FormModal>

        {/* Invoice Detail Modal */}
        <FormModal
          open={detailModalOpen}
          onClose={handleCloseDetailModal}
          title={selectedInvoice ? `Invoice ${selectedInvoice.invoiceNumber} - Details` : 'Invoice Details'}
          maxWidth="lg"
          submitLabel=""
          cancelLabel="Close"
          onSubmit={null}
        >
          {selectedInvoice && (
            <InvoiceDetail
              invoiceId={selectedInvoice._id}
              onError={handleFormError}
              onEdit={handleEditFromDetail}
            />
          )}
        </FormModal>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={confirmDelete}
          title="Delete Invoice"
          message={
            selectedInvoice
              ? `Are you sure you want to delete invoice "${selectedInvoice.invoiceNumber}"? This action cannot be undone.`
              : 'Are you sure you want to delete this invoice?'
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
    </LocalizationProvider>
  );
};

export default Invoices;