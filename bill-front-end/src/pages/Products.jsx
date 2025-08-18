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
import LoadingSpinner from '../components/LoadingSpinner';
import ProductForm from '../components/ProductForm';
import productService from '../services/productService';

const Products = () => {
  const [products, setProducts] = useState([]);
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form refs
  const createFormRef = useRef();
  const editFormRef = useRef();

  // Load products
  const loadProducts = async () => {
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

      const response = await productService.getProducts(params);

      if (response.success) {
        setProducts(response.data.products || []);
        setTotalCount(response.data.totalCount || 0);
      } else {
        setError(response.message || 'Failed to load products');
      }
    } catch (err) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Load products on component mount and when dependencies change
  useEffect(() => {
    loadProducts();
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

  // Handle create product
  const handleCreateProduct = () => {
    setSelectedProduct(null);
    setCreateModalOpen(true);
  };

  // Handle edit product
  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setEditModalOpen(true);
  };

  // Handle delete product
  const handleDeleteProduct = (product) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!selectedProduct) return;

    try {
      setLoading(true);
      const response = await productService.deleteProduct(selectedProduct._id);

      if (response.success) {
        setSuccess('Product deleted successfully');
        loadProducts(); // Reload the list
      } else {
        setError(response.message || 'Failed to delete product');
      }
    } catch (err) {
      setError(err.message || 'Failed to delete product');
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setSelectedProduct(null);
    }
  };

  // Handle form submission success
  const handleFormSuccess = (message) => {
    setSuccess(message);
    setCreateModalOpen(false);
    setEditModalOpen(false);
    setSelectedProduct(null);
    setFormLoading(false);
    loadProducts(); // Reload the list
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
    setSelectedProduct(null);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedProduct(null);
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
    }).format(amount);
  };

  // Table columns configuration
  const columns = [
    {
      id: 'name',
      label: 'Product Name',
      sortable: true,
      render: (value, row) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {value}
          </Typography>
          {row.sku && (
            <Typography variant="caption" color="text.secondary">
              SKU: {row.sku}
            </Typography>
          )}
        </Box>
      )
    },
    {
      id: 'category',
      label: 'Category',
      sortable: true,
      render: (value) => (
        <Chip label={value} size="small" variant="outlined" />
      )
    },
    {
      id: 'basePrice',
      label: 'Base Price',
      sortable: true,
      align: 'right',
      render: (value) => formatCurrency(value)
    },
    {
      id: 'hsnCode',
      label: 'HSN Code',
      sortable: false,
      align: 'center'
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
            onClick={() => handleEditProduct(row)}
            title="Edit Product"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDeleteProduct(row)}
            title="Delete Product"
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
          Products
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateProduct}
        >
          Add Product
        </Button>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <SearchBar
          placeholder="Search products by name, category, or SKU..."
          onSearch={handleSearch}
          value={searchQuery}
          fullWidth
        />
      </Box>

      {/* Products Table */}
      <DataTable
        columns={columns}
        data={products}
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

      {/* Create Product Modal */}
      <FormModal
        open={createModalOpen}
        onClose={handleCloseCreateModal}
        title="Add New Product"
        submitLabel="Create Product"
        loading={formLoading}
        onSubmit={() => handleFormSubmit(createFormRef)}
      >
        <ProductForm
          ref={createFormRef}
          product={null}
          onSuccess={handleFormSuccess}
          onError={handleFormError}
          loading={formLoading}
        />
      </FormModal>

      {/* Edit Product Modal */}
      <FormModal
        open={editModalOpen}
        onClose={handleCloseEditModal}
        title="Edit Product"
        submitLabel="Update Product"
        loading={formLoading}
        onSubmit={() => handleFormSubmit(editFormRef)}
      >
        <ProductForm
          ref={editFormRef}
          product={selectedProduct}
          onSuccess={handleFormSuccess}
          onError={handleFormError}
          loading={formLoading}
        />
      </FormModal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Product"
        message={
          selectedProduct
            ? `Are you sure you want to delete "${selectedProduct.name}"? This action cannot be undone.`
            : 'Are you sure you want to delete this product?'
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

export default Products;