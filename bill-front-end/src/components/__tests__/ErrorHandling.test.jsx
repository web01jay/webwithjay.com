import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { vi } from 'vitest';
import ErrorBoundary from '../ErrorBoundary';
import ValidatedForm, { ValidatedTextField, commonValidationSchemas } from '../ValidatedForm';

// Mock the error service
vi.mock('../../services/errorService', () => ({
  default: {
    showSuccessToast: vi.fn(),
    showErrorToast: vi.fn(),
    handleApiError: vi.fn(),
    formatValidationErrors: vi.fn()
  }
}));

// Mock react-toastify
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn()
  },
  ToastContainer: () => <div data-testid="toast-container" />
}));

const theme = createTheme();

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  </BrowserRouter>
);

// Component that throws an error for testing ErrorBoundary
const ErrorThrowingComponent = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    throw new Error('Test error for ErrorBoundary');
  }
  return <div>No error</div>;
};

describe('Error Handling Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error for ErrorBoundary tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('ErrorBoundary', () => {
    it('renders children when there is no error', () => {
      render(
        <TestWrapper>
          <ErrorBoundary>
            <ErrorThrowingComponent shouldThrow={false} />
          </ErrorBoundary>
        </TestWrapper>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('renders error UI when there is an error', () => {
      render(
        <TestWrapper>
          <ErrorBoundary>
            <ErrorThrowingComponent shouldThrow={true} />
          </ErrorBoundary>
        </TestWrapper>
      );

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
      expect(screen.getByText(/We're sorry, but something unexpected happened/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('shows error details in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <TestWrapper>
          <ErrorBoundary>
            <ErrorThrowingComponent shouldThrow={true} />
          </ErrorBoundary>
        </TestWrapper>
      );

      expect(screen.getByText('Error Details (Development Only):')).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('handles reload button click', () => {
      // Mock window.location.reload
      const mockReload = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true
      });

      render(
        <TestWrapper>
          <ErrorBoundary>
            <ErrorThrowingComponent shouldThrow={true} />
          </ErrorBoundary>
        </TestWrapper>
      );

      fireEvent.click(screen.getByRole('button', { name: /reload page/i }));
      expect(mockReload).toHaveBeenCalled();
    });
  });

  describe('ValidatedForm', () => {
    const mockOnSubmit = vi.fn();

    beforeEach(() => {
      mockOnSubmit.mockClear();
    });

    it('renders form with validation', async () => {
      const validationSchema = {
        name: ['required', { minLength: 2 }],
        email: ['required', 'email']
      };

      render(
        <TestWrapper>
          <ValidatedForm
            initialValues={{ name: '', email: '' }}
            validationSchema={validationSchema}
            onSubmit={mockOnSubmit}
          >
            {({ getFieldProps }) => (
              <>
                <ValidatedTextField
                  name="name"
                  label="Name"
                  getFieldProps={getFieldProps}
                />
                <ValidatedTextField
                  name="email"
                  label="Email"
                  getFieldProps={getFieldProps}
                />
              </>
            )}
          </ValidatedForm>
        </TestWrapper>
      );

      expect(screen.getByLabelText('Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });

    it('shows validation errors on blur', async () => {
      const validationSchema = {
        name: ['required', { minLength: 2 }],
        email: ['required', 'email']
      };

      render(
        <TestWrapper>
          <ValidatedForm
            initialValues={{ name: '', email: '' }}
            validationSchema={validationSchema}
            onSubmit={mockOnSubmit}
          >
            {({ getFieldProps }) => (
              <>
                <ValidatedTextField
                  name="name"
                  label="Name"
                  getFieldProps={getFieldProps}
                />
                <ValidatedTextField
                  name="email"
                  label="Email"
                  getFieldProps={getFieldProps}
                />
              </>
            )}
          </ValidatedForm>
        </TestWrapper>
      );

      const nameField = screen.getByLabelText('Name');
      const emailField = screen.getByLabelText('Email');

      // Trigger validation by focusing and blurring
      fireEvent.focus(nameField);
      fireEvent.blur(nameField);

      fireEvent.focus(emailField);
      fireEvent.change(emailField, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailField);

      await waitFor(() => {
        expect(screen.getByText('This field is required')).toBeInTheDocument();
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    it('disables submit button when form is invalid', async () => {
      const validationSchema = {
        name: ['required']
      };

      render(
        <TestWrapper>
          <ValidatedForm
            initialValues={{ name: '' }}
            validationSchema={validationSchema}
            onSubmit={mockOnSubmit}
          >
            {({ getFieldProps }) => (
              <ValidatedTextField
                name="name"
                label="Name"
                getFieldProps={getFieldProps}
              />
            )}
          </ValidatedForm>
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /submit/i });
      expect(submitButton).toBeDisabled();
    });

    it('calls onSubmit when form is valid', async () => {
      const validationSchema = {
        name: ['required']
      };

      mockOnSubmit.mockResolvedValue();

      render(
        <TestWrapper>
          <ValidatedForm
            initialValues={{ name: 'Test Name' }}
            validationSchema={validationSchema}
            onSubmit={mockOnSubmit}
          >
            {({ getFieldProps }) => (
              <ValidatedTextField
                name="name"
                label="Name"
                getFieldProps={getFieldProps}
              />
            )}
          </ValidatedForm>
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({ name: 'Test Name' });
      });
    });

    it('handles submission errors', async () => {
      const validationSchema = {
        name: ['required']
      };

      const error = new Error('Submission failed');
      mockOnSubmit.mockRejectedValue(error);

      render(
        <TestWrapper>
          <ValidatedForm
            initialValues={{ name: 'Test Name' }}
            validationSchema={validationSchema}
            onSubmit={mockOnSubmit}
          >
            {({ getFieldProps }) => (
              <ValidatedTextField
                name="name"
                label="Name"
                getFieldProps={getFieldProps}
              />
            )}
          </ValidatedForm>
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Submission failed')).toBeInTheDocument();
      });
    });
  });

  describe('Common Validation Schemas', () => {
    it('provides product validation schema', () => {
      expect(commonValidationSchemas.product).toBeDefined();
      expect(commonValidationSchemas.product.name).toContain('required');
      expect(commonValidationSchemas.product.basePrice).toContain('required');
      expect(commonValidationSchemas.product.basePrice).toContain('positiveNumber');
    });

    it('provides client validation schema', () => {
      expect(commonValidationSchemas.client).toBeDefined();
      expect(commonValidationSchemas.client.name).toContain('required');
      expect(commonValidationSchemas.client.email).toContain('required');
      expect(commonValidationSchemas.client.email).toContain('email');
      expect(commonValidationSchemas.client.phone).toContain('required');
      expect(commonValidationSchemas.client.phone).toContain('phone');
    });

    it('provides address validation schema', () => {
      expect(commonValidationSchemas.address).toBeDefined();
      expect(commonValidationSchemas.address.street).toBeDefined();
      expect(commonValidationSchemas.address.city).toBeDefined();
      expect(commonValidationSchemas.address.state).toBeDefined();
    });

    it('provides invoice validation schema', () => {
      expect(commonValidationSchemas.invoice).toBeDefined();
      expect(commonValidationSchemas.invoice.invoiceDate).toContain('required');
      expect(commonValidationSchemas.invoice.dueDate).toContain('required');
      expect(commonValidationSchemas.invoice.taxType).toContain('required');
    });
  });
});