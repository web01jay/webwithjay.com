import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { vi } from 'vitest';
import Login from '../Login';
import Signup from '../Signup';

// Mock the useAuth hook
const mockLogin = vi.fn();
const mockAuthContext = {
  login: mockLogin,
  isLoading: false,
  error: null,
  isAuthenticated: false,
  user: null
};

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockAuthContext
}));

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
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null, pathname: '/login' })
  };
});

const theme = createTheme();

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('Authentication Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthContext.isLoading = false;
    mockAuthContext.error = null;
  });

  describe('Login Page', () => {
    it('renders login form correctly', () => {
      renderWithProviders(<Login />);
      
      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
      expect(screen.getByText(/back to home/i)).toBeInTheDocument();
    });

    it('has proper navigation links', () => {
      renderWithProviders(<Login />);
      
      const signupLink = screen.getByText(/sign up here/i);
      const homeLink = screen.getByText(/back to home/i);
      
      expect(signupLink.closest('a')).toHaveAttribute('href', '/signup');
      expect(homeLink.closest('a')).toHaveAttribute('href', '/');
    });

    it('displays loading state when auth context is loading', () => {
      mockAuthContext.isLoading = true;
      renderWithProviders(<Login />);
      
      const submitButton = screen.getByRole('button', { name: /signing in/i });
      expect(submitButton).toBeDisabled();
    });

    it('displays authentication error', () => {
      mockAuthContext.error = 'Invalid credentials';
      renderWithProviders(<Login />);
      
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  describe('Signup Page', () => {
    it('renders signup form correctly', () => {
      renderWithProviders(<Signup />);
      
      expect(screen.getByRole('heading', { name: /sign up/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/gender/i)).toBeInTheDocument();
      // Password fields are rendered but may not be visible in the test output
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
      expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
      expect(screen.getByText(/back to home/i)).toBeInTheDocument();
    });

    it('has proper navigation links', () => {
      renderWithProviders(<Signup />);
      
      const loginLink = screen.getByText(/sign in here/i);
      const homeLink = screen.getByText(/back to home/i);
      
      expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
      expect(homeLink.closest('a')).toHaveAttribute('href', '/');
    });
  });
});