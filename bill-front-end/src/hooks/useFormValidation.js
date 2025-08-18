import { useState, useCallback, useEffect } from 'react';
import errorService from '../services/errorService';

// Validation rules
const validationRules = {
  required: (value) => {
    if (value === null || value === undefined || value === '') {
      return 'This field is required';
    }
    return null;
  },

  email: (value) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  },

  phone: (value) => {
    if (!value) return null;
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
      return 'Please enter a valid phone number';
    }
    return null;
  },

  minLength: (min) => (value) => {
    if (!value) return null;
    if (value.length < min) {
      return `Must be at least ${min} characters long`;
    }
    return null;
  },

  maxLength: (max) => (value) => {
    if (!value) return null;
    if (value.length > max) {
      return `Must be no more than ${max} characters long`;
    }
    return null;
  },

  min: (min) => (value) => {
    if (value === null || value === undefined || value === '') return null;
    const numValue = Number(value);
    if (isNaN(numValue) || numValue < min) {
      return `Must be at least ${min}`;
    }
    return null;
  },

  max: (max) => (value) => {
    if (value === null || value === undefined || value === '') return null;
    const numValue = Number(value);
    if (isNaN(numValue) || numValue > max) {
      return `Must be no more than ${max}`;
    }
    return null;
  },

  number: (value) => {
    if (!value) return null;
    if (isNaN(Number(value))) {
      return 'Must be a valid number';
    }
    return null;
  },

  positiveNumber: (value) => {
    if (!value) return null;
    const numValue = Number(value);
    if (isNaN(numValue) || numValue <= 0) {
      return 'Must be a positive number';
    }
    return null;
  },

  gst: (value) => {
    if (!value) return null;
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(value)) {
      return 'Please enter a valid GST number (e.g., 22AAAAA0000A1Z5)';
    }
    return null;
  },

  pan: (value) => {
    if (!value) return null;
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(value)) {
      return 'Please enter a valid PAN number (e.g., ABCDE1234F)';
    }
    return null;
  },

  aadhar: (value) => {
    if (!value) return null;
    const aadharRegex = /^[2-9]{1}[0-9]{3}[0-9]{4}[0-9]{4}$/;
    if (!aadharRegex.test(value.replace(/\s/g, ''))) {
      return 'Please enter a valid Aadhar number (12 digits)';
    }
    return null;
  },

  custom: (validatorFn) => (value) => {
    return validatorFn(value);
  }
};

export const useFormValidation = (initialValues = {}, validationSchema = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);

  // Validate a single field
  const validateField = useCallback((name, value) => {
    const fieldRules = validationSchema[name];
    if (!fieldRules) return null;

    for (const rule of fieldRules) {
      let validator;
      let params = null;

      if (typeof rule === 'string') {
        validator = validationRules[rule];
      } else if (typeof rule === 'object') {
        const ruleName = Object.keys(rule)[0];
        params = rule[ruleName];
        validator = validationRules[ruleName];
        
        if (typeof validator === 'function' && params !== undefined) {
          validator = validator(params);
        }
      } else if (typeof rule === 'function') {
        validator = rule;
      }

      if (validator) {
        const error = validator(value);
        if (error) {
          return error;
        }
      }
    }

    return null;
  }, [validationSchema]);

  // Validate all fields
  const validateForm = useCallback(() => {
    const newErrors = {};
    let formIsValid = true;

    Object.keys(validationSchema).forEach(fieldName => {
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        formIsValid = false;
      }
    });

    setErrors(newErrors);
    setIsValid(formIsValid);
    return formIsValid;
  }, [values, validateField, validationSchema]);

  // Handle field value change
  const handleChange = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));

    // Real-time validation for touched fields
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  }, [touched, validateField]);

  // Handle field blur (mark as touched)
  const handleBlur = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Validate field on blur
    const error = validateField(name, values[name]);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  }, [values, validateField]);

  // Handle form submission
  const handleSubmit = useCallback(async (onSubmit) => {
    setIsSubmitting(true);
    
    // Mark all fields as touched
    const allTouched = {};
    Object.keys(validationSchema).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    // Validate form
    const formIsValid = validateForm();
    
    if (formIsValid) {
      try {
        await onSubmit(values);
        // Reset form on successful submission if needed
        // resetForm();
      } catch (error) {
        // Handle API errors
        const errorInfo = errorService.handleApiError(error);
        
        // Set field-specific errors if available
        if (errorInfo.details) {
          const validationErrors = errorService.formatValidationErrors(errorInfo.details);
          const newErrors = {};
          validationErrors.forEach(({ field, message }) => {
            newErrors[field] = message;
          });
          setErrors(prev => ({ ...prev, ...newErrors }));
        } else {
          // Show general error
          errorService.showErrorToast(error);
        }
      }
    }
    
    setIsSubmitting(false);
  }, [values, validationSchema, validateForm]);

  // Reset form
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setIsValid(false);
  }, [initialValues]);

  // Set field error manually
  const setFieldError = useCallback((name, error) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  // Set field value manually
  const setFieldValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  // Get field props for easy integration with form components
  const getFieldProps = useCallback((name) => ({
    name,
    value: values[name] || '',
    error: touched[name] && !!errors[name],
    helperText: touched[name] ? errors[name] : '',
    onChange: (e) => {
      const value = e.target ? e.target.value : e;
      handleChange(name, value);
    },
    onBlur: () => handleBlur(name)
  }), [values, errors, touched, handleChange, handleBlur]);

  // Effect to validate form when values change
  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      validateForm();
    }
  }, [values, touched, validateForm]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldError,
    setFieldValue,
    getFieldProps,
    validateForm,
    validateField
  };
};

// Export validation rules for custom use
export { validationRules };