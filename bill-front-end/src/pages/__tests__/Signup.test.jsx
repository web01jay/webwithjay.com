import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Signup from '../Signup';
import { apiWrapper } from '../../services/api';

import { vi } from 'vitest';

// Mock the API service
vi.mock('../../services/api', () => ({
  apiWrapper: {
    post: vi.fn()
  }
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

const theme = createTheme();

const renderSignup = (props = {}) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <Signup {...props} />
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('Signup Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders signup form correctly', () => {
    renderSignup();
    
    expect(screen.getByRole('heading', { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/gender/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
    expect(screen.getByText(/back to home/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    renderSignup();
    
    const submitButton = screen.getByRole('button', { name: /sign up/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/phone number is required/i)).toBeInTheDocument();
      expect(screen.getByText(/please select your gender/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      expect(screen.getByText(/please confirm your password/i)).toBeInTheDocument();
    });
  });

  it('validates name fields format', async () => {
    const user = userEvent.setup();
    renderSignup();
    
    const firstNameInput = screen.getByLabelText(/first name/i);
    const lastNameInput = screen.getByLabelText(/last name/i);
    
    await user.type(firstNameInput, '123');
    await user.type(lastNameInput, 'Test@');
    
    const submitButton = screen.getByRole('button', { name: /sign up/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/first name can only contain letters and spaces/i)).toBeInTheDocument();
      expect(screen.getByText(/last name can only contain letters and spaces/i)).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    renderSignup();
    
    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'invalid-email');
    
    const submitButton = screen.getByRole('button', { name: /sign up/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('validates phone number format', async () => {
    const user = userEvent.setup();
    renderSignup();
    
    const phoneInput = screen.getByLabelText(/phone number/i);
    await user.type(phoneInput, '123');
    
    const submitButton = screen.getByRole('button', { name: /sign up/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid phone number/i)).toBeInTheDocument();
    });
  });

  it('validates password requirements', async () => {
    const user = userEvent.setup();
    renderSignup();
    
    const passwordInput = screen.getByLabelText(/^password$/i);
    await user.type(passwordInput, 'weak');
    
    const submitButton = screen.getByRole('button', { name: /sign up/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/password must contain at least one uppercase letter, one lowercase letter, and one number/i)).toBeInTheDocument();
    });
  });

  it('validates password confirmation', async () => {
    const user = userEvent.setup();
    renderSignup();
    
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    
    await user.type(passwordInput, 'Password123');
    await user.type(confirmPasswordInput, 'DifferentPassword123');
    
    const submitButton = screen.getByRole('button', { name: /sign up/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    apiWrapper.post.mockResolvedValue({ success: true });
    renderSignup();
    
    // Fill out the form
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
    await user.type(screen.getByLabelText(/phone number/i), '1234567890');
    
    // Select gender
    const genderSelect = screen.getByLabelText(/gender/i);
    await user.click(genderSelect);
    await user.click(screen.getByText('Male'));
    
    await user.type(screen.getByLabelText('Password'), 'Password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123');
    
    const submitButton = screen.getByRole('button', { name: /sign up/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(apiWrapper.post).toHaveBeenCalledWith('/auth/signup', {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        gender: 'male',
        password: 'Password123'
      });
    });
  });

  it('displays success message and redirects on successful signup', async () => {
    const user = userEvent.setup();
    apiWrapper.post.mockResolvedValue({ success: true });
    renderSignup();
    
    // Fill out the form with valid data
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
    await user.type(screen.getByLabelText(/phone number/i), '1234567890');
    
    const genderSelect = screen.getByLabelText(/gender/i);
    await user.click(genderSelect);
    await user.click(screen.getByText('Male'));
    
    await user.type(screen.getByLabelText('Password'), 'Password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123');
    
    const submitButton = screen.getByRole('button', { name: /sign up/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/account created successfully/i)).toBeInTheDocument();
    });
    
    // Check that navigation is called after delay
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', {
        state: {
          message: 'Account created successfully! Please sign in.',
          email: 'john@example.com'
        }
      });
    }, { timeout: 3000 });
  });

  it('displays error message on signup failure', async () => {
    const user = userEvent.setup();
    const errorMessage = 'User already exists';
    apiWrapper.post.mockRejectedValue(new Error(errorMessage));
    renderSignup();
    
    // Fill out the form with valid data
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
    await user.type(screen.getByLabelText(/phone number/i), '1234567890');
    
    const genderSelect = screen.getByLabelText(/gender/i);
    await user.click(genderSelect);
    await user.click(screen.getByText('Male'));
    
    await user.type(screen.getByLabelText('Password'), 'Password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123');
    
    const submitButton = screen.getByRole('button', { name: /sign up/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('displays loading state during submission', async () => {
    const user = userEvent.setup();
    apiWrapper.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
    renderSignup();
    
    // Fill out the form with valid data
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
    await user.type(screen.getByLabelText(/phone number/i), '1234567890');
    
    const genderSelect = screen.getByLabelText(/gender/i);
    await user.click(genderSelect);
    await user.click(screen.getByText('Male'));
    
    await user.type(screen.getByLabelText('Password'), 'Password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123');
    
    const submitButton = screen.getByRole('button', { name: /sign up/i });
    await user.click(submitButton);
    
    // Check loading state
    expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('has proper navigation links', () => {
    renderSignup();
    
    const loginLink = screen.getByText(/sign in here/i);
    const homeLink = screen.getByText(/back to home/i);
    
    expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
    expect(homeLink.closest('a')).toHaveAttribute('href', '/');
  });

  it('disables form fields during submission', async () => {
    const user = userEvent.setup();
    apiWrapper.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
    renderSignup();
    
    // Fill out the form and submit
    await user.type(screen.getByLabelText(/first name/i), 'John');
    const submitButton = screen.getByRole('button', { name: /sign up/i });
    await user.click(submitButton);
    
    // Check that fields are disabled
    expect(screen.getByLabelText(/first name/i)).toBeDisabled();
    expect(screen.getByLabelText(/last name/i)).toBeDisabled();
    expect(screen.getByLabelText(/email address/i)).toBeDisabled();
    expect(screen.getByLabelText(/phone number/i)).toBeDisabled();
    expect(screen.getByLabelText(/gender/i)).toBeDisabled();
    expect(screen.getByLabelText('Password')).toBeDisabled();
    expect(screen.getByLabelText(/confirm password/i)).toBeDisabled();
  });
});