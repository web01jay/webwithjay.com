import React, { useState, useEffect } from 'react';
import {
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  InputAdornment,
  Box,
  Typography,
  Alert
} from '@mui/material';
import productService from '../services/productService';

const ProductForm = React.forwardRef(({ 
  product = null, 
  onSuccess, 
  onError,
  loading: externalLoading = false 
}, ref) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    basePrice: '',
    category: '',
    sku: '',
    hsnCode: '9021',
    isActive: true
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});

  // Product categories - these could be fetched from backend in the future
  const categories = [
    'Medical Equipment',
    'Surgical Instruments',
    'Diagnostic Tools',
    'Rehabilitation Equipment',
    'Mobility Aids',
    'Therapeutic Devices',
    'Other'
  ];

  // Initialize form with product data if editing
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        basePrice: product.basePrice?.toString() || '',
        category: product.category || '',
        sku: product.sku || '',
        hsnCode: product.hsnCode?.toString() || '9021',
        isActive: product.isActive !== undefined ? product.isActive : true
      });
    }
  }, [product]);

  // Validation rules
  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Product name is required';
        if (value.length < 2) return 'Product name must be at least 2 characters';
        if (value.length > 100) return 'Product name must be less than 100 characters';
        return '';

      case 'basePrice':
        if (!value) return 'Base price is required';
        const price = parseFloat(value);
        if (isNaN(price)) return 'Base price must be a valid number';
        if (price < 0) return 'Base price cannot be negative';
        if (price > 1000000) return 'Base price cannot exceed ₹10,00,000';
        return '';

      case 'category':
        if (!value) return 'Category is required';
        return '';

      case 'sku':
        if (value && value.length > 50) return 'SKU must be less than 50 characters';
        return '';

      case 'hsnCode':
        if (!value) return 'HSN code is required';
        const hsn = parseInt(value);
        if (isNaN(hsn)) return 'HSN code must be a valid number';
        if (hsn < 1000 || hsn > 9999) return 'HSN code must be a 4-digit number';
        return '';

      case 'description':
        if (value && value.length > 500) return 'Description must be less than 500 characters';
        return '';

      default:
        return '';
    }
  };

  // Handle input changes
  const handleChange = (event) => {
    const { name, value, checked, type } = event.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    // Validate field in real-time
    if (touched[name] || value) {
      const error = validateField(name, newValue);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  // Handle field blur
  const handleBlur = (event) => {
    const { name, value } = event.target;
    
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  // Validate entire form
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    if (event) {
      event.preventDefault();
    }
    
    if (!validateForm()) {
      onError?.('Please fix the validation errors before submitting');
      return false;
    }

    try {
      setLoading(true);
      
      // Prepare data for submission
      const submitData = {
        ...formData,
        basePrice: parseFloat(formData.basePrice),
        hsnCode: parseInt(formData.hsnCode),
        // Remove empty SKU to avoid unique constraint issues
        ...(formData.sku.trim() === '' && { sku: undefined })
      };

      let response;
      if (product) {
        // Update existing product
        response = await productService.updateProduct(product._id, submitData);
      } else {
        // Create new product
        response = await productService.createProduct(submitData);
      }

      if (response.success) {
        onSuccess?.(
          product 
            ? 'Product updated successfully' 
            : 'Product created successfully'
        );
        
        // Reset form if creating new product
        if (!product) {
          setFormData({
            name: '',
            description: '',
            basePrice: '',
            category: '',
            sku: '',
            hsnCode: '9021',
            isActive: true
          });
          setTouched({});
          setErrors({});
        }
        return true;
      } else {
        onError?.(response.message || 'Failed to save product');
        return false;
      }
    } catch (err) {
      onError?.(err.message || 'Failed to save product');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Expose submit function to parent
  React.useImperativeHandle(ref, () => ({
    submit: handleSubmit
  }));

  const isSubmitDisabled = loading || externalLoading || Object.values(errors).some(error => error);

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Grid container spacing={3}>
        {/* Product Name */}
        <Grid item xs={12}>
          <TextField
            name="name"
            label="Product Name"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.name && !!errors.name}
            helperText={touched.name && errors.name}
            fullWidth
            required
            placeholder="Enter product name"
          />
        </Grid>

        {/* Category and SKU */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required error={touched.category && !!errors.category}>
            <InputLabel>Category</InputLabel>
            <Select
              name="category"
              value={formData.category}
              onChange={handleChange}
              onBlur={handleBlur}
              label="Category"
            >
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
            {touched.category && errors.category && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                {errors.category}
              </Typography>
            )}
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            name="sku"
            label="SKU"
            value={formData.sku}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.sku && !!errors.sku}
            helperText={touched.sku && errors.sku || 'Optional - Stock Keeping Unit'}
            fullWidth
            placeholder="Enter SKU (optional)"
          />
        </Grid>

        {/* Base Price and HSN Code */}
        <Grid item xs={12} sm={6}>
          <TextField
            name="basePrice"
            label="Base Price"
            type="number"
            value={formData.basePrice}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.basePrice && !!errors.basePrice}
            helperText={touched.basePrice && errors.basePrice}
            fullWidth
            required
            InputProps={{
              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
            }}
            inputProps={{
              min: 0,
              step: 0.01
            }}
            placeholder="0.00"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            name="hsnCode"
            label="HSN Code"
            type="number"
            value={formData.hsnCode}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.hsnCode && !!errors.hsnCode}
            helperText={touched.hsnCode && errors.hsnCode || 'Harmonized System of Nomenclature'}
            fullWidth
            required
            inputProps={{
              min: 1000,
              max: 9999
            }}
            placeholder="9021"
          />
        </Grid>

        {/* Description */}
        <Grid item xs={12}>
          <TextField
            name="description"
            label="Description"
            value={formData.description}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.description && !!errors.description}
            helperText={touched.description && errors.description || 'Optional product description'}
            fullWidth
            multiline
            rows={3}
            placeholder="Enter product description (optional)"
          />
        </Grid>

        {/* Active Status */}
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body2">
                  Active Status
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formData.isActive ? 'Product is active and available' : 'Product is inactive and hidden'}
                </Typography>
              </Box>
            }
          />
        </Grid>

        {/* Form validation summary */}
        {Object.keys(errors).length > 0 && Object.values(errors).some(error => error) && (
          <Grid item xs={12}>
            <Alert severity="error">
              Please fix the validation errors above before submitting.
            </Alert>
          </Grid>
        )}
      </Grid>


    </Box>
  );
});

export default ProductForm;