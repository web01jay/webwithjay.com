import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Login from '../Login';
import { AuthProvider } from '../../contexts/AuthContext';

import { vi } from 'vitest';

// Mock the useAuth hook
const mockLogin = vi.fn();
const mockGetIntendedDestination = vi.fn();
const mockClearIntendedDestination = vi.fn();
const mockAuthContext = {
  login: mockLogin,
  isLoading: false,
  error: null,
  isAuthenticated: false,
  user: null,
  getIntendedDestination: mockGetIntendedDestination,
  clearIntendedDestination: mockClearIntendedDestination
};

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockAuthContext
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null, pathname: '/login' })
  };
});

const theme = createTheme();

const renderLogin = (props = {}) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <Login {...props} />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthContext.isLoading = false;
    mockAuthContext.error = null;
    mockGetIntendedDestination.mockReturnValue(null);
  });

  it('renders login form correctly', () => {
    renderLogin();
    
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    expect(screen.getByText(/back to home/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    renderLogin();
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    renderLogin();
    
    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'invalid-email');
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('validates password minimum length', async () => {
    const user = userEvent.setup();
    renderLogin();
    
    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(passwordInput, '123');
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters long/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue();
    renderLogin();
    
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });

  it('displays loading state during submission', async () => {
    const user = userEvent.setup();
    mockAuthContext.isLoading = true;
    renderLogin();
    
    const submitButton = screen.getByRole('button', { name: /signing in/i });
    expect(submitButton).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays authentication error', () => {
    mockAuthContext.error = 'Invalid credentials';
    renderLogin();
    
    expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
  });

  it('displays submit error when login fails', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Login failed';
    mockLogin.mockRejectedValue(new Error(errorMessage));
    renderLogin();
    
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('disables form fields during loading', () => {
    mockAuthContext.isLoading = true;
    renderLogin();
    
    expect(screen.getByLabelText(/email address/i)).toBeDisabled();
    expect(screen.getByLabelText(/password/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
  });

  it('has proper navigation links', () => {
    renderLogin();
    
    const signupLink = screen.getByText(/sign up here/i);
    const homeLink = screen.getByText(/back to home/i);
    
    expect(signupLink.closest('a')).toHaveAttribute('href', '/signup');
    expect(homeLink.closest('a')).toHaveAttribute('href', '/');
  });

  it('clears submit error when form is resubmitted', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValueOnce(new Error('First error'))
             .mockResolvedValueOnce();
    renderLogin();
    
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // First submission with error
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/first error/i)).toBeInTheDocument();
    });
    
    // Second submission should clear the error
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.queryByText(/first error/i)).not.toBeInTheDocument();
    });
  });

  describe('Post-login redirect logic', () => {
    it('redirects to dashboard when no intended destination exists', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValue();
      mockGetIntendedDestination.mockReturnValue(null);
      renderLogin();
      
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
      });
    });

    it('redirects to intended destination when it exists and is not a public route', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValue();
      mockGetIntendedDestination.mockReturnValue('/clients');
      renderLogin();
      
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockClearIntendedDestination).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/clients', { replace: true });
      });
    });

    it('redirects to dashboard when intended destination is a public route', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValue();
      mockGetIntendedDestination.mockReturnValue('/login');
      renderLogin();
      
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockClearIntendedDestination).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
      });
    });

    it('redirects to dashboard when intended destination is home route', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValue();
      mockGetIntendedDestination.mockReturnValue('/');
      renderLogin();
      
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockClearIntendedDestination).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
      });
    });

    it('does not redirect when login fails', async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValue(new Error('Login failed'));
      mockGetIntendedDestination.mockReturnValue('/clients');
      renderLogin();
      
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/login failed/i)).toBeInTheDocument();
      });
      
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(mockClearIntendedDestination).not.toHaveBeenCalled();
    });
  });
});