import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  Grid,
  TextField,
  FormControlLabel,
  Switch,
  Box,
  Typography,
  Divider
} from '@mui/material';
import clientService from '../services/clientService';

const ClientForm = forwardRef(({ client, onSuccess, onError, loading }, ref) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gstNumber: '',
    panNumber: '',
    aadharNumber: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India'
    },
    isActive: true
  });

  const [errors, setErrors] = useState({});

  // Initialize form data when client prop changes
  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        gstNumber: client.gstNumber || '',
        panNumber: client.panNumber || '',
        aadharNumber: client.aadharNumber || '',
        address: {
          street: client.address?.street || '',
          city: client.address?.city || '',
          state: client.address?.state || '',
          zipCode: client.address?.zipCode || '',
          country: client.address?.country || 'India'
        },
        isActive: client.isActive !== undefined ? client.isActive : true
      });
    } else {
      // Reset form for new client
      setFormData({
        name: '',
        email: '',
        phone: '',
        gstNumber: '',
        panNumber: '',
        aadharNumber: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'India'
        },
        isActive: true
      });
    }
    setErrors({});
  }, [client]);

  // Handle input changes
  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Client name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[+]?[\d\s\-()]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Optional field validations
    if (formData.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstNumber)) {
      newErrors.gstNumber = 'Please enter a valid GST number';
    }

    if (formData.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber)) {
      newErrors.panNumber = 'Please enter a valid PAN number';
    }

    if (formData.aadharNumber && !/^[0-9]{12}$/.test(formData.aadharNumber.replace(/\s/g, ''))) {
      newErrors.aadharNumber = 'Please enter a valid Aadhar number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      let response;
      if (client) {
        // Update existing client
        response = await clientService.updateClient(client._id, formData);
      } else {
        // Create new client
        response = await clientService.createClient(formData);
      }

      if (response.success) {
        onSuccess(client ? 'Client updated successfully' : 'Client created successfully');
      } else {
        onError(response.message || 'Failed to save client');
      }
    } catch (error) {
      onError(error.message || 'Failed to save client');
    }
  };

  // Expose submit method to parent
  useImperativeHandle(ref, () => ({
    submit: handleSubmit
  }));

  return (
    <Box sx={{ pt: 1 }}>
      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Basic Information
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            name="name"
            label="Client Name"
            value={formData.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name}
            fullWidth
            required
            disabled={loading}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            name="email"
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={!!errors.email}
            helperText={errors.email}
            fullWidth
            required
            disabled={loading}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            name="phone"
            label="Phone Number"
            value={formData.phone}
            onChange={handleChange}
            error={!!errors.phone}
            helperText={errors.phone}
            fullWidth
            required
            disabled={loading}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                disabled={loading}
              />
            }
            label="Active Client"
          />
        </Grid>

        {/* Tax Information */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>
            Tax Information
          </Typography>
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            name="gstNumber"
            label="GST Number"
            value={formData.gstNumber}
            onChange={handleChange}
            error={!!errors.gstNumber}
            helperText={errors.gstNumber}
            fullWidth
            disabled={loading}
            placeholder="22AAAAA0000A1Z5"
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            name="panNumber"
            label="PAN Number"
            value={formData.panNumber}
            onChange={handleChange}
            error={!!errors.panNumber}
            helperText={errors.panNumber}
            fullWidth
            disabled={loading}
            placeholder="ABCDE1234F"
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            name="aadharNumber"
            label="Aadhar Number"
            value={formData.aadharNumber}
            onChange={handleChange}
            error={!!errors.aadharNumber}
            helperText={errors.aadharNumber}
            fullWidth
            disabled={loading}
            placeholder="1234 5678 9012"
          />
        </Grid>

        {/* Address Information */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>
            Address Information
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <TextField
            name="address.street"
            label="Street Address"
            value={formData.address.street}
            onChange={handleChange}
            fullWidth
            disabled={loading}
            multiline
            rows={2}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            name="address.city"
            label="City"
            value={formData.address.city}
            onChange={handleChange}
            fullWidth
            disabled={loading}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            name="address.state"
            label="State"
            value={formData.address.state}
            onChange={handleChange}
            fullWidth
            disabled={loading}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            name="address.zipCode"
            label="ZIP Code"
            value={formData.address.zipCode}
            onChange={handleChange}
            fullWidth
            disabled={loading}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            name="address.country"
            label="Country"
            value={formData.address.country}
            onChange={handleChange}
            fullWidth
            disabled={loading}
          />
        </Grid>
      </Grid>
    </Box>
  );
});

ClientForm.displayName = 'ClientForm';

export default ClientForm;