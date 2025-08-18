import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { AuthProvider } from '../contexts/AuthContext';
import { PublicRoute, PrivateRoute } from '../components/RouteGuards';
import Login from '../pages/Login';
import Home from '../pages/Home';
import { apiWrapper } from '../services/api';

// Mock the API wrapper
vi.mock('../services/api', () => ({
  apiWrapper: {
    get: vi.fn(),
    post: vi.fn(),
    setAuthTokens: vi.fn(),
    clearAuthTokens: vi.fn(),
  },
  setAuthContext: vi.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock components for testing
const MockDashboard = () => <div data-testid="dashboard-page">Dashboard</div>;
const MockClients = () => <div data-testid="clients-page">Clients</div>;
const MockInvoices = () => <div data-testid="invoices-page">Invoices</div>;

// Navigation test component
function NavigationTestComponent() {
  const navigate = useNavigate();
  const location = useLocation();
  
  return (
    <div>
      <div data-testid="current-path">{location.pathname}</div>
      <button onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
      <button onClick={() => navigate('/clients')}>Go to Clients</button>
      <button onClick={() => navigate('/login')}>Go to Login</button>
      <button onClick={() => navigate('/')}>Go to Home</button>
    </div>
  );
}

// Complete app structure for integration testing
function TestApp() {
  return (
    <BrowserRouter>
      <ThemeProvider theme={createTheme()}>
        <AuthProvider>
          <NavigationTestComponent />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={
              <PublicRoute>
                <Home />
              </PublicRoute>
            } />
            <Route path="/login" element={
              <PublicRoute redirectIfAuthenticated={true}>
                <Login />
              </PublicRoute>
            } />
            
            {/* Private Routes */}
            <Route path="/dashboard" element={
              <PrivateRoute>
                <MockDashboard />
              </PrivateRoute>
            } />
            <Route path="/clients" element={
              <PrivateRoute>
                <MockClients />
              </PrivateRoute>
            } />
            <Route path="/invoices" element={
              <PrivateRoute>
                <MockInvoices />
              </PrivateRoute>
            } />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Mock initial session validation failure
    apiWrapper.get.mockRejectedValue(new Error('Not authenticated'));
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('Complete Login/Logout Flow', () => {
    it('should handle complete unauthenticated to authenticated flow', async () => {
      const user = userEvent.setup();
      const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };

      // Mock successful login
      apiWrapper.post.mockResolvedValue({
        success: true,
        data: { user: mockUser, token: 'mock-token' }
      });

      render(<TestApp />);

      // Wait for initial auth check
      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/');
      });

      // Try to access protected route - should redirect to login
      await user.click(screen.getByText('Go to Dashboard'));

      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/login');
      });

      // Should see login form
      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();

      // Fill out and submit login form
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Should redirect to intended destination (dashboard)
      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/dashboard');
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      });

      // Should be able to access other protected routes
      await user.click(screen.getByText('Go to Clients'));

      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/clients');
        expect(screen.getByTestId('clients-page')).toBeInTheDocument();
      });
    });

    it('should handle logout and restrict access to protected routes', async () => {
      const user = userEvent.setup();
      const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };

      // Start with authenticated user
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'authUser') return JSON.stringify(mockUser);
        return null;
      });

      // Mock successful session validation
      apiWrapper.get.mockResolvedValue({ success: true });

      let authHook;
      function AuthTestComponent() {
        authHook = require('../hooks/useAuth').useAuth();
        return <div data-testid="auth-test">Auth Test</div>;
      }

      render(
        <BrowserRouter>
          <AuthProvider>
            <AuthTestComponent />
            <NavigationTestComponent />
            <Routes>
              <Route path="/dashboard" element={
                <PrivateRoute>
                  <MockDashboard />
                </PrivateRoute>
              } />
              <Route path="/login" element={
                <PublicRoute redirectIfAuthenticated={true}>
                  <Login />
                </PublicRoute>
              } />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      );

      // Wait for authentication to be established
      await waitFor(() => {
        expect(screen.getByTestId('auth-test')).toBeInTheDocument();
      });

      // Navigate to dashboard (should work when authenticated)
      await user.click(screen.getByText('Go to Dashboard'));

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      });

      // Logout
      act(() => {
        authHook.logout();
      });

      // Try to access dashboard again - should redirect to login
      await user.click(screen.getByText('Go to Dashboard'));

      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/login');
      });
    });
  });

  describe('Route Transition Scenarios', () => {
    it('should handle direct navigation to protected routes', async () => {
      const user = userEvent.setup();

      render(<TestApp />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/');
      });

      // Direct navigation to protected route
      await user.click(screen.getByText('Go to Clients'));

      // Should redirect to login and store intended destination
      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/login');
      });

      // Verify intended destination was stored
      expect(localStorageMock.setItem).toHaveBeenCalledWith('intendedDestination', '/clients');
    });

    it('should handle authenticated user accessing login page', async () => {
      const user = userEvent.setup();
      const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };

      // Start with authenticated user
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'authUser') return JSON.stringify(mockUser);
        return null;
      });

      apiWrapper.get.mockResolvedValue({ success: true });

      render(<TestApp />);

      // Wait for authentication
      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/');
      });

      // Try to go to login page
      await user.click(screen.getByText('Go to Login'));

      // Should redirect to dashboard instead
      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/dashboard');
      });
    });

    it('should handle rapid route changes during authentication', async () => {
      const user = userEvent.setup();

      render(<TestApp />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/');
      });

      // Rapid navigation attempts
      await user.click(screen.getByText('Go to Dashboard'));
      await user.click(screen.getByText('Go to Clients'));
      await user.click(screen.getByText('Go to Login'));

      // Should end up at login
      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/login');
      });
    });
  });

  describe('Intended Destination Handling', () => {
    it('should redirect to intended destination after login', async () => {
      const user = userEvent.setup();
      const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };

      // Mock intended destination in localStorage
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'intendedDestination') return '/invoices';
        return null;
      });

      // Mock successful login
      apiWrapper.post.mockResolvedValue({
        success: true,
        data: { user: mockUser, token: 'mock-token' }
      });

      render(<TestApp />);

      // Navigate to login
      await user.click(screen.getByText('Go to Login'));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
      });

      // Login
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Should redirect to intended destination
      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/invoices');
        expect(screen.getByTestId('invoices-page')).toBeInTheDocument();
      });

      // Should clear intended destination
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('intendedDestination');
    });

    it('should not redirect to public routes as intended destination', async () => {
      const user = userEvent.setup();
      const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };

      // Mock public route as intended destination
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'intendedDestination') return '/login';
        return null;
      });

      // Mock successful login
      apiWrapper.post.mockResolvedValue({
        success: true,
        data: { user: mockUser, token: 'mock-token' }
      });

      render(<TestApp />);

      // Navigate to login
      await user.click(screen.getByText('Go to Login'));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
      });

      // Login
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Should redirect to dashboard instead of login
      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/dashboard');
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      });
    });

    it('should handle multiple intended destination changes', async () => {
      const user = userEvent.setup();

      render(<TestApp />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/');
      });

      // Try to access multiple protected routes
      await user.click(screen.getByText('Go to Dashboard'));
      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/login');
      });

      await user.click(screen.getByText('Go to Clients'));
      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/login');
      });

      // The last intended destination should be stored
      expect(localStorageMock.setItem).toHaveBeenLastCalledWith('intendedDestination', '/clients');
    });
  });

  describe('Session Persistence', () => {
    it('should restore authentication state on page refresh', async () => {
      const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };

      // Mock stored user data
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'authUser') return JSON.stringify(mockUser);
        return null;
      });

      // Mock successful session validation
      apiWrapper.get.mockResolvedValue({ success: true });

      render(<TestApp />);

      // Should be able to access protected routes immediately
      const user = userEvent.setup();
      await user.click(screen.getByText('Go to Dashboard'));

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      });
    });

    it('should handle expired session gracefully', async () => {
      const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };

      // Mock stored user data
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'authUser') return JSON.stringify(mockUser);
        return null;
      });

      // Mock session validation failure (expired session)
      apiWrapper.get.mockRejectedValue(new Error('Session expired'));

      render(<TestApp />);

      // Wait for session validation to complete
      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/');
      });

      // Try to access protected route - should redirect to login
      const user = userEvent.setup();
      await user.click(screen.getByText('Go to Dashboard'));

      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/login');
      });

      // Should have cleared stored user data
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authUser');
    });
  });

  describe('Error Scenarios', () => {
    it('should handle login API failures gracefully', async () => {
      const user = userEvent.setup();

      // Mock login failure
      apiWrapper.post.mockRejectedValue(new Error('Invalid credentials'));

      render(<TestApp />);

      // Navigate to login
      await user.click(screen.getByText('Go to Login'));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
      });

      // Attempt login
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      // Should show error and stay on login page
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
        expect(screen.getByTestId('current-path')).toHaveTextContent('/login');
      });
    });

    it('should handle network errors during authentication', async () => {
      const user = userEvent.setup();

      // Mock network error
      apiWrapper.post.mockRejectedValue(new Error('Network Error'));

      render(<TestApp />);

      // Navigate to login
      await user.click(screen.getByText('Go to Login'));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
      });

      // Attempt login
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Should show network error
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });
  });
});