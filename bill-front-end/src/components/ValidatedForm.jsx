import React from 'react';
import { Box, TextField, Button, Alert, CircularProgress } from '@mui/material';
import { useFormValidation, validationRules } from '../hooks/useFormValidation';
import errorService from '../services/errorService';

const ValidatedForm = ({
  initialValues = {},
  validationSchema = {},
  onSubmit,
  children,
  submitButtonText = 'Submit',
  showResetButton = false,
  resetButtonText = 'Reset',
  disabled = false,
  ...props
}) => {
  const {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    getFieldProps
  } = useFormValidation(initialValues, validationSchema);

  const [submitError, setSubmitError] = React.useState(null);

  const onFormSubmit = async (formValues) => {
    try {
      setSubmitError(null);
      await onSubmit(formValues);
      errorService.showSuccessToast('Operation completed successfully');
    } catch (error) {
      setSubmitError(error.message || 'An error occurred while submitting the form');
      throw error; // Re-throw to let the form validation handle it
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSubmit(onFormSubmit);
  };

  const handleReset = () => {
    setSubmitError(null);
    resetForm();
  };

  return (
    <Box component="form" onSubmit={handleFormSubmit} {...props}>
      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {submitError}
        </Alert>
      )}
      
      {children({
        values,
        errors,
        touched,
        isSubmitting,
        isValid,
        handleChange,
        handleBlur,
        getFieldProps,
        disabled: disabled || isSubmitting
      })}
      
      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <Button
          type="submit"
          variant="contained"
          disabled={disabled || isSubmitting || !isValid}
          startIcon={isSubmitting && <CircularProgress size={20} />}
        >
          {isSubmitting ? 'Submitting...' : submitButtonText}
        </Button>
        
        {showResetButton && (
          <Button
            type="button"
            variant="outlined"
            onClick={handleReset}
            disabled={disabled || isSubmitting}
          >
            {resetButtonText}
          </Button>
        )}
      </Box>
    </Box>
  );
};

// Pre-configured form fields with validation
export const ValidatedTextField = ({ 
  name, 
  label, 
  getFieldProps, 
  disabled = false,
  ...props 
}) => {
  const fieldProps = getFieldProps(name);
  
  return (
    <TextField
      {...fieldProps}
      {...props}
      label={label}
      disabled={disabled}
      fullWidth
      margin="normal"
    />
  );
};

export const ValidatedNumberField = ({ 
  name, 
  label, 
  getFieldProps, 
  disabled = false,
  min,
  max,
  step = 0.01,
  ...props 
}) => {
  const fieldProps = getFieldProps(name);
  
  return (
    <TextField
      {...fieldProps}
      {...props}
      label={label}
      type="number"
      disabled={disabled}
      fullWidth
      margin="normal"
      inputProps={{
        min,
        max,
        step,
        ...props.inputProps
      }}
    />
  );
};

export const ValidatedEmailField = ({ 
  name, 
  label, 
  getFieldProps, 
  disabled = false,
  ...props 
}) => {
  const fieldProps = getFieldProps(name);
  
  return (
    <TextField
      {...fieldProps}
      {...props}
      label={label}
      type="email"
      disabled={disabled}
      fullWidth
      margin="normal"
      autoComplete="email"
    />
  );
};

export const ValidatedPhoneField = ({ 
  name, 
  label, 
  getFieldProps, 
  disabled = false,
  ...props 
}) => {
  const fieldProps = getFieldProps(name);
  
  return (
    <TextField
      {...fieldProps}
      {...props}
      label={label}
      type="tel"
      disabled={disabled}
      fullWidth
      margin="normal"
      autoComplete="tel"
    />
  );
};

// Common validation schemas for reuse
export const commonValidationSchemas = {
  product: {
    name: ['required', { minLength: 2 }, { maxLength: 100 }],
    description: [{ maxLength: 500 }],
    basePrice: ['required', 'positiveNumber', { min: 0.01 }, { max: 1000000 }],
    category: ['required', { minLength: 2 }, { maxLength: 50 }],
    sku: [{ minLength: 3 }, { maxLength: 20 }],
    hsnCode: ['number', { min: 1000 }, { max: 99999999 }]
  },
  
  client: {
    name: ['required', { minLength: 2 }, { maxLength: 100 }],
    email: ['required', 'email'],
    phone: ['required', 'phone'],
    gstNumber: ['gst'],
    panNumber: ['pan'],
    aadharNumber: ['aadhar']
  },
  
  address: {
    street: [{ minLength: 5 }, { maxLength: 200 }],
    city: [{ minLength: 2 }, { maxLength: 100 }],
    state: [{ minLength: 2 }, { maxLength: 100 }],
    zipCode: [{ minLength: 3 }, { maxLength: 20 }],
    country: [{ minLength: 2 }, { maxLength: 100 }]
  },
  
  invoice: {
    invoiceDate: ['required'],
    dueDate: ['required'],
    taxType: ['required'],
    notes: [{ maxLength: 1000 }]
  },
  
  invoiceItem: {
    productId: ['required'],
    size: ['required'],
    quantity: ['required', 'positiveNumber', { min: 1 }],
    customPrice: ['required', 'number', { min: 0 }]
  }
};

export default ValidatedForm;