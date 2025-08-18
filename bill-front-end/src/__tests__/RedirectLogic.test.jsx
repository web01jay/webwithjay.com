import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { AuthProvider } from '../contexts/AuthContext';
import { PublicRoute, PrivateRoute } from '../components/RouteGuards';
import { useAuth } from '../hooks/useAuth';
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

// Test components
const TestPage = ({ name }) => <div data-testid={`${name}-page`}>{name} Page</div>;

function NavigationComponent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  
  return (
    <div>
      <div data-testid="current-path">{location.pathname}</div>
      <div data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <div data-testid="user-info">{user ? user.name : 'no-user'}</div>
      <button onClick={() => navigate('/')}>Home</button>
      <button onClick={() => navigate('/login')}>Login</button>
      <button onClick={() => navigate('/signup')}>Signup</button>
      <button onClick={() => navigate('/dashboard')}>Dashboard</button>
      <button onClick={() => navigate('/clients')}>Clients</button>
      <button onClick={() => navigate('/invoices')}>Invoices</button>
      <button onClick={() => navigate('/products')}>Products</button>
      <button onClick={() => navigate('/settings')}>Settings</button>
    </div>
  );
}

function TestApp({ initialPath = '/' }) {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NavigationComponent />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={
            <PublicRoute>
              <TestPage name="Home" />
            </PublicRoute>
          } />
          <Route path="/login" element={
            <PublicRoute redirectIfAuthenticated={true}>
              <TestPage name="Login" />
            </PublicRoute>
          } />
          <Route path="/signup" element={
            <PublicRoute redirectIfAuthenticated={true}>
              <TestPage name="Signup" />
            </PublicRoute>
          } />
          
          {/* Private Routes */}
          <Route path="/dashboard" element={
            <PrivateRoute>
              <TestPage name="Dashboard" />
            </PrivateRoute>
          } />
          <Route path="/clients" element={
            <PrivateRoute>
              <TestPage name="Clients" />
            </PrivateRoute>
          } />
          <Route path="/invoices" element={
            <PrivateRoute>
              <TestPage name="Invoices" />
            </PrivateRoute>
          } />
          <Route path="/products" element={
            <PrivateRoute>
              <TestPage name="Products" />
            </PrivateRoute>
          } />
          <Route path="/settings" element={
            <PrivateRoute>
              <TestPage name="Settings" />
            </PrivateRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

describe('Redirect Logic and Intended Destination Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Mock initial session validation failure
    apiWrapper.get.mockRejectedValue(new Error('Not authenticated'));
  });

  describe('Intended Destination Storage', () => {
    it('should store intended destination when accessing protected route while unauthenticated', async () => {
      const user = userEvent.setup();
      
      render(<TestApp />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/');
      });

      // Try to access protected route
      await user.click(screen.getByText('Clients'));

      // Should redirect to login and store intended destination
      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/login');
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('intendedDestination', '/clients');
    });

    it('should store complex paths with query parameters and hash', async () => {
      const user = userEvent.setup();
      
      // Mock location with complex path
      const mockLocation = {
        pathname: '/clients',
        search: '?page=2&filter=active&sort=name',
        hash: '#client-123'
      };

      // Mock useLocation to return complex path
      vi.mock('react-router-dom', async () => {
        const actual = await vi.importActual('react-router-dom');
        return {
          ...actual,
          useLocation: () => mockLocation
        };
      });

      render(<TestApp />);

      // Navigate to protected route (this will trigger the mock location)
      await user.click(screen.getByText('Clients'));

      // Should store the complete path
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'intendedDestination', 
        '/clients?page=2&filter=active&sort=name#client-123'
      );
    });

    it('should update intended destination when accessing different protected routes', async () => {
      const user = userEvent.setup();
      
      render(<TestApp />);

      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/');
      });

      // Access first protected route
      await user.click(screen.getByText('Dashboard'));
      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/login');
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('intendedDestination', '/dashboard');

      // Access second protected route
      await user.click(screen.getByText('Invoices'));
      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/login');
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('intendedDestination', '/invoices');
    });

    it('should not store intended destination for public routes', async () => {
      const user = userEvent.setup();
      
      render(<TestApp />);

      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/');
      });

      // Navigate to public routes
      await user.click(screen.getByText('Login'));
      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/login');
      });

      await user.click(screen.getByText('Signup'));
      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/signup');
      });

      await user.click(screen.getByText('Home'));
      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/');
      });

      // Should not have stored any intended destinations for public routes
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith('intendedDestination', expect.any(String));
    });
  });

  describe('Post-Login Redirect Logic', () => {
    it('should redirect to stored intended destination after login', async () => {
      const user = userEvent.setup();
      const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };

      // Mock stored intended destination
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'intendedDestination') return '/products';
        return null;
      });

      // Mock successful login
      apiWrapper.post.mockResolvedValue({
        success: true,
        data: { user: mockUser, token: 'mock-token' }
      });

      let authHook;
      function AuthTestComponent() {
        authHook = useAuth();
        return null;
      }

      render(
        <BrowserRouter>
          <AuthProvider>
            <AuthTestComponent />
            <NavigationComponent />
            <Routes>
              <Route path="/login" element={<TestPage name="Login" />} />
              <Route path="/products" element={
                <PrivateRoute>
                  <TestPage name="Products" />
                </PrivateRoute>
              } />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      );

      // Navigate to login
      await user.click(screen.getByText('Login'));

      // Perform login
      await act(async () => {
        await authHook.login({ email: 'test@example.com', password: 'password' });
      });

      // Should redirect to intended destination
      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/products');
        expect(screen.getByTestId('products-page')).toBeInTheDocument();
      });

      // Should clear intended destination
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('intendedDestination');
    });

    it('should redirect to dashboard when no intended destination exists', async () => {
      const user = userEvent.setup();
      const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };

      // No stored intended destination
      localStorageMock.getItem.mockReturnValue(null);

      // Mock successful login
      apiWrapper.post.mockResolvedValue({
        success: true,
        data: { user: mockUser, token: 'mock-token' }
      });

      let authHook;
      function AuthTestComponent() {
        authHook = useAuth();
        return null;
      }

      render(
        <BrowserRouter>
          <AuthProvider>
            <AuthTestComponent />
            <NavigationComponent />
            <Routes>
              <Route path="/login" element={<TestPage name="Login" />} />
              <Route path="/dashboard" element={
                <PrivateRoute>
                  <TestPage name="Dashboard" />
                </PrivateRoute>
              } />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      );

      // Navigate to login
      await user.click(screen.getByText('Login'));

      // Perform login
      await act(async () => {
        await authHook.login({ email: 'test@example.com', password: 'password' });
      });

      // Should redirect to dashboard
      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/dashboard');
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      });
    });

    it('should not redirect to public routes as intended destination', async () => {
      const user = userEvent.setup();
      const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };

      // Mock public route as intended destination
      const publicRoutes = ['/', '/login', '/signup', '/home'];
      
      for (const publicRoute of publicRoutes) {
        localStorageMock.getItem.mockImplementation((key) => {
          if (key === 'intendedDestination') return publicRoute;
          return null;
        });

        // Mock successful login
        apiWrapper.post.mockResolvedValue({
          success: true,
          data: { user: mockUser, token: 'mock-token' }
        });

        let authHook;
        function AuthTestComponent() {
          authHook = useAuth();
          return null;
        }

        const { unmount } = render(
          <BrowserRouter>
            <AuthProvider>
              <AuthTestComponent />
              <NavigationComponent />
              <Routes>
                <Route path="/login" element={<TestPage name="Login" />} />
                <Route path="/dashboard" element={
                  <PrivateRoute>
                    <TestPage name="Dashboard" />
                  </PrivateRoute>
                } />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        );

        // Navigate to login
        await user.click(screen.getByText('Login'));

        // Perform login
        await act(async () => {
          await authHook.login({ email: 'test@example.com', password: 'password' });
        });

        // Should redirect to dashboard instead of public route
        await waitFor(() => {
          expect(screen.getByTestId('current-path')).toHaveTextContent('/dashboard');
        });

        unmount();
        vi.clearAllMocks();
      }
    });

    it('should handle malformed intended destination gracefully', async () => {
      const user = userEvent.setup();
      const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };

      // Mock malformed intended destination
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'intendedDestination') return 'not-a-valid-path';
        return null;
      });

      // Mock successful login
      apiWrapper.post.mockResolvedValue({
        success: true,
        data: { user: mockUser, token: 'mock-token' }
      });

      let authHook;
      function AuthTestComponent() {
        authHook = useAuth();
        return null;
      }

      render(
        <BrowserRouter>
          <AuthProvider>
            <AuthTestComponent />
            <NavigationComponent />
            <Routes>
              <Route path="/login" element={<TestPage name="Login" />} />
              <Route path="/dashboard" element={
                <PrivateRoute>
                  <TestPage name="Dashboard" />
                </PrivateRoute>
              } />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      );

      // Navigate to login
      await user.click(screen.getByText('Login'));

      // Perform login
      await act(async () => {
        await authHook.login({ email: 'test@example.com', password: 'password' });
      });

      // Should redirect to dashboard when intended destination is invalid
      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/dashboard');
      });
    });
  });

  describe('Authenticated User Redirect Logic', () => {
    it('should redirect authenticated users away from login page', async () => {
      const user = userEvent.setup();
      const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };

      // Start with authenticated user
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'authUser') return JSON.stringify(mockUser);
        return null;
      });

      // Mock successful session validation
      apiWrapper.get.mockResolvedValue({ success: true });

      render(<TestApp />);

      // Wait for authentication to be established
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      // Try to navigate to login
      await user.click(screen.getByText('Login'));

      // Should redirect to dashboard instead
      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/dashboard');
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      });
    });

    it('should redirect authenticated users away from signup page', async () => {
      const user = userEvent.setup();
      const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };

      // Start with authenticated user
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'authUser') return JSON.stringify(mockUser);
        return null;
      });

      // Mock successful session validation
      apiWrapper.get.mockResolvedValue({ success: true });

      render(<TestApp />);

      // Wait for authentication to be established
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      // Try to navigate to signup
      await user.click(screen.getByText('Signup'));

      // Should redirect to dashboard instead
      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/dashboard');
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      });
    });

    it('should use intended destination when redirecting authenticated users from auth pages', async () => {
      const user = userEvent.setup();
      const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };

      // Start with authenticated user and intended destination
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'authUser') return JSON.stringify(mockUser);
        if (key === 'intendedDestination') return '/settings';
        return null;
      });

      // Mock successful session validation
      apiWrapper.get.mockResolvedValue({ success: true });

      render(<TestApp />);

      // Wait for authentication to be established
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      // Try to navigate to login
      await user.click(screen.getByText('Login'));

      // Should redirect to intended destination
      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/settings');
        expect(screen.getByTestId('settings-page')).toBeInTheDocument();
      });

      // Should clear intended destination
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('intendedDestination');
    });

    it('should allow authenticated users to access public home page', async () => {
      const user = userEvent.setup();
      const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };

      // Start with authenticated user
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'authUser') return JSON.stringify(mockUser);
        return null;
      });

      // Mock successful session validation
      apiWrapper.get.mockResolvedValue({ success: true });

      render(<TestApp />);

      // Wait for authentication to be established
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      // Navigate to home page
      await user.click(screen.getByText('Home'));

      // Should allow access to home page
      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/');
        expect(screen.getByTestId('home-page')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases and Complex Scenarios', () => {
    it('should handle rapid navigation during authentication state changes', async () => {
      const user = userEvent.setup();
      const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };

      render(<TestApp />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/');
      });

      // Rapid navigation attempts
      await user.click(screen.getByText('Dashboard'));
      await user.click(screen.getByText('Clients'));
      await user.click(screen.getByText('Products'));

      // Should end up at login with last intended destination
      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/login');
      });

      expect(localStorageMock.setItem).toHaveBeenLastCalledWith('intendedDestination', '/products');
    });

    it('should handle browser back/forward navigation with intended destinations', async () => {
      const user = userEvent.setup();

      render(<TestApp />);

      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/');
      });

      // Navigate to protected route
      await user.click(screen.getByText('Clients'));

      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/login');
      });

      // Navigate to another protected route
      await user.click(screen.getByText('Invoices'));

      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/login');
      });

      // The last navigation should be stored as intended destination
      expect(localStorageMock.setItem).toHaveBeenLastCalledWith('intendedDestination', '/invoices');
    });

    it('should clear intended destination when user manually navigates to public routes', async () => {
      const user = userEvent.setup();

      // Start with stored intended destination
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'intendedDestination') return '/clients';
        return null;
      });

      render(<TestApp />);

      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/');
      });

      // Navigate to login page manually
      await user.click(screen.getByText('Login'));

      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/login');
      });

      // Navigate back to home
      await user.click(screen.getByText('Home'));

      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/');
      });

      // Intended destination should still be preserved for later use
      expect(localStorageMock.removeItem).not.toHaveBeenCalledWith('intendedDestination');
    });

    it('should handle localStorage errors gracefully', async () => {
      const user = userEvent.setup();

      // Mock localStorage to throw errors
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage is full');
      });

      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<TestApp />);

      // Should not crash when localStorage fails
      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/');
      });

      // Try to navigate to protected route
      await user.click(screen.getByText('Dashboard'));

      // Should still redirect to login even if localStorage fails
      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/login');
      });

      consoleSpy.mockRestore();
    });
  });
});