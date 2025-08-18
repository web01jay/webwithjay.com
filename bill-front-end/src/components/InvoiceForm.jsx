import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  Button,
  Typography,
  Paper,
  IconButton,
  Divider,
  Alert,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { format, addDays } from 'date-fns';
import invoiceService from '../services/invoiceService';
import clientService from '../services/clientService';
import productService from '../services/productService';

const InvoiceForm = forwardRef(({ invoice, onSuccess, onError, loading }, ref) => {
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  // Size options for products
  const sizeOptions = [
    'pediatric',
    'x-small',
    'small',
    'medium',
    'large',
    'x-large',
    'xxl',
    'xxxl',
    'universal'
  ];

  // Tax types
  const taxTypes = [
    { value: 'in-state', label: 'In-State (CGST + SGST)' },
    { value: 'out-state', label: 'Out-State (IGST)' }
  ];

  // Form setup
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      clientId: '',
      invoiceDate: new Date(),
      dueDate: addDays(new Date(), 30),
      taxType: 'in-state',
      items: [
        {
          productId: '',
          size: 'medium',
          quantity: 1,
          customPrice: 0
        }
      ],
      notes: ''
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  // Watch form values for calculations
  const watchedItems = watch('items');
  const watchedTaxType = watch('taxType');

  // Load clients and products
  useEffect(() => {
    loadClients();
    loadProducts();
  }, []);

  // Load form data if editing
  useEffect(() => {
    if (invoice) {
      reset({
        clientId: invoice.clientId?._id || invoice.clientId,
        invoiceDate: new Date(invoice.invoiceDate),
        dueDate: new Date(invoice.dueDate),
        taxType: invoice.taxType,
        items: invoice.items.map(item => ({
          productId: item.productId?._id || item.productId,
          size: item.size,
          quantity: item.quantity,
          customPrice: item.customPrice
        })),
        notes: invoice.notes || ''
      });
      
      if (invoice.clientId) {
        setSelectedClient(invoice.clientId);
      }
    }
  }, [invoice, reset]);

  const loadClients = async () => {
    try {
      setClientsLoading(true);
      const response = await clientService.getClients({ limit: 100 });
      if (response.success) {
        setClients(response.data.clients || []);
      }
    } catch (err) {
      console.error('Failed to load clients:', err);
    } finally {
      setClientsLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await productService.getProducts({ limit: 100 });
      if (response.success) {
        setProducts(response.data.products || []);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setProductsLoading(false);
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = watchedItems.reduce((sum, item) => {
      return sum + (item.quantity * item.customPrice);
    }, 0);

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (watchedTaxType === 'in-state') {
      cgst = subtotal * 0.025; // 2.5%
      sgst = subtotal * 0.025; // 2.5%
    } else {
      igst = subtotal * 0.05; // 5%
    }

    const totalTaxAmount = cgst + sgst + igst;
    const totalAmount = subtotal + totalTaxAmount;

    return {
      subtotal,
      cgst,
      sgst,
      igst,
      totalTaxAmount,
      totalAmount
    };
  };

  const totals = calculateTotals();

  // Handle client selection
  const handleClientChange = (event, newValue) => {
    setSelectedClient(newValue);
    setValue('clientId', newValue?._id || '');
    
    // Auto-set tax type based on client location
    if (newValue?.address?.state) {
      // This is a simplified logic - in real app, you'd compare with business state
      const businessState = 'Maharashtra'; // This should come from app config
      const taxType = newValue.address.state === businessState ? 'in-state' : 'out-state';
      setValue('taxType', taxType);
    }
  };

  // Handle product selection for an item
  const handleProductChange = (index, product) => {
    if (product) {
      setValue(`items.${index}.productId`, product._id);
      setValue(`items.${index}.customPrice`, product.basePrice);
    }
  };

  // Add new item
  const addItem = () => {
    append({
      productId: '',
      size: 'medium',
      quantity: 1,
      customPrice: 0
    });
  };

  // Remove item
  const removeItem = (index) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  // Get product by ID
  const getProductById = (productId) => {
    return products.find(p => p._id === productId);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  // Submit form
  const onSubmit = async (data) => {
    try {
      const invoiceData = {
        ...data,
        invoiceDate: format(data.invoiceDate, 'yyyy-MM-dd'),
        dueDate: format(data.dueDate, 'yyyy-MM-dd'),
        items: data.items.map(item => ({
          productId: item.productId,
          size: item.size,
          quantity: item.quantity,
          customPrice: item.customPrice
          // Remove totalPrice - backend will calculate it
        }))
        // Remove all calculated fields - backend will calculate them automatically
        // subtotal, cgst, sgst, igst, totalTaxAmount, totalAmount
      };

      let response;
      if (invoice) {
        response = await invoiceService.updateInvoice(invoice._id, invoiceData);
      } else {
        response = await invoiceService.createInvoice(invoiceData);
      }

      if (response.success) {
        onSuccess(invoice ? 'Invoice updated successfully' : 'Invoice created successfully');
      } else {
        onError(response.message || 'Failed to save invoice');
      }
    } catch (err) {
      onError(err.message || 'Failed to save invoice');
    }
  };

  // Expose submit method to parent
  useImperativeHandle(ref, () => ({
    submit: handleSubmit(onSubmit)
  }));

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        {/* Basic Invoice Information */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Invoice Information
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={clients}
                getOptionLabel={(option) => option.name || ''}
                value={selectedClient}
                onChange={handleClientChange}
                loading={clientsLoading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Client *"
                    error={!!errors.clientId}
                    helperText={errors.clientId?.message}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box>
                      <Typography variant="body2">{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.email}
                      </Typography>
                    </Box>
                  </Box>
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="taxType"
                control={control}
                rules={{ required: 'Tax type is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Tax Type *"
                    fullWidth
                    error={!!errors.taxType}
                    helperText={errors.taxType?.message}
                  >
                    {taxTypes.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="invoiceDate"
                control={control}
                rules={{ required: 'Invoice date is required' }}
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    label="Invoice Date *"
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        error={!!errors.invoiceDate}
                        helperText={errors.invoiceDate?.message}
                      />
                    )}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="dueDate"
                control={control}
                rules={{ required: 'Due date is required' }}
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    label="Due Date *"
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        error={!!errors.dueDate}
                        helperText={errors.dueDate?.message}
                      />
                    )}
                  />
                )}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Invoice Items */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Invoice Items
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addItem}
            >
              Add Item
            </Button>
          </Box>

          {fields.length === 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Please add at least one item to the invoice.
            </Alert>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fields.map((field, index) => {
                  const selectedProduct = getProductById(watchedItems[index]?.productId);
                  const itemTotal = (watchedItems[index]?.quantity || 0) * (watchedItems[index]?.customPrice || 0);

                  return (
                    <TableRow key={field.id}>
                      <TableCell>
                        <Controller
                          name={`items.${index}.productId`}
                          control={control}
                          rules={{ required: 'Product is required' }}
                          render={({ field: productField }) => (
                            <Autocomplete
                              {...productField}
                              options={products}
                              getOptionLabel={(option) => option.name || ''}
                              value={selectedProduct || null}
                              onChange={(event, newValue) => {
                                handleProductChange(index, newValue);
                              }}
                              loading={productsLoading}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  size="small"
                                  error={!!errors.items?.[index]?.productId}
                                  helperText={errors.items?.[index]?.productId?.message}
                                />
                              )}
                              renderOption={(props, option) => (
                                <Box component="li" {...props}>
                                  <Box>
                                    <Typography variant="body2">{option.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Base Price: {formatCurrency(option.basePrice)}
                                    </Typography>
                                  </Box>
                                </Box>
                              )}
                            />
                          )}
                        />
                      </TableCell>

                      <TableCell>
                        <Controller
                          name={`items.${index}.size`}
                          control={control}
                          rules={{ required: 'Size is required' }}
                          render={({ field: sizeField }) => (
                            <TextField
                              {...sizeField}
                              select
                              size="small"
                              error={!!errors.items?.[index]?.size}
                              helperText={errors.items?.[index]?.size?.message}
                              sx={{ minWidth: 120 }}
                            >
                              {sizeOptions.map((size) => (
                                <MenuItem key={size} value={size}>
                                  {size.charAt(0).toUpperCase() + size.slice(1)}
                                </MenuItem>
                              ))}
                            </TextField>
                          )}
                        />
                      </TableCell>

                      <TableCell align="right">
                        <Controller
                          name={`items.${index}.quantity`}
                          control={control}
                          rules={{ 
                            required: 'Quantity is required',
                            min: { value: 1, message: 'Quantity must be at least 1' }
                          }}
                          render={({ field: quantityField }) => (
                            <TextField
                              {...quantityField}
                              type="number"
                              size="small"
                              inputProps={{ min: 1 }}
                              error={!!errors.items?.[index]?.quantity}
                              helperText={errors.items?.[index]?.quantity?.message}
                              sx={{ width: 80 }}
                            />
                          )}
                        />
                      </TableCell>

                      <TableCell align="right">
                        <Controller
                          name={`items.${index}.customPrice`}
                          control={control}
                          rules={{ 
                            required: 'Price is required',
                            min: { value: 0, message: 'Price must be positive' }
                          }}
                          render={({ field: priceField }) => (
                            <TextField
                              {...priceField}
                              type="number"
                              size="small"
                              inputProps={{ min: 0, step: 0.01 }}
                              error={!!errors.items?.[index]?.customPrice}
                              helperText={errors.items?.[index]?.customPrice?.message}
                              sx={{ width: 100 }}
                            />
                          )}
                        />
                      </TableCell>

                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(itemTotal)}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => removeItem(index)}
                          disabled={fields.length === 1}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Tax Calculation and Totals */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Tax Calculation & Totals
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Notes"
                    multiline
                    rows={4}
                    fullWidth
                    placeholder="Additional notes or terms..."
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Subtotal:</Typography>
                  <Typography variant="body2">{formatCurrency(totals.subtotal)}</Typography>
                </Box>

                {watchedTaxType === 'in-state' ? (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">CGST (2.5%):</Typography>
                      <Typography variant="body2">{formatCurrency(totals.cgst)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">SGST (2.5%):</Typography>
                      <Typography variant="body2">{formatCurrency(totals.sgst)}</Typography>
                    </Box>
                  </>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">IGST (5%):</Typography>
                    <Typography variant="body2">{formatCurrency(totals.igst)}</Typography>
                  </Box>
                )}

                <Divider sx={{ my: 1 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6">Total Amount:</Typography>
                  <Typography variant="h6" color="primary">
                    {formatCurrency(totals.totalAmount)}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </LocalizationProvider>
  );
});

InvoiceForm.displayName = 'InvoiceForm';

export default InvoiceForm;