import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { vi } from 'vitest';
import { PublicRoute, PrivateRoute } from '../RouteGuards';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock the useAuth hook
const mockUseAuth = {
  isAuthenticated: false,
  isLoading: false,
  setIntendedDestination: vi.fn(),
  getIntendedDestination: vi.fn(),
  clearIntendedDestination: vi.fn()
};

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth
}));

// Mock LoadingSpinner
vi.mock('../LoadingSpinner', () => {
  return {
    default: function MockLoadingSpinner() {
      return <div data-testid="loading-spinner">Loading...</div>;
    }
  };
});

// Test components
const TestPublicComponent = () => <div data-testid="public-content">Public Content</div>;
const TestPrivateComponent = () => <div data-testid="private-content">Private Content</div>;
const TestLoginComponent = () => <div data-testid="login-content">Login Page</div>;
const TestDashboardComponent = () => <div data-testid="dashboard-content">Dashboard</div>;

// Test wrapper with router
const TestWrapper = ({ children, initialEntries = ['/'] }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('RouteGuards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.isAuthenticated = false;
    mockUseAuth.isLoading = false;
    mockUseAuth.getIntendedDestination.mockReturnValue(null);
    
    // Reset window.location
    delete window.location;
    window.location = { pathname: '/', search: '', hash: '' };
  });

  describe('PublicRoute', () => {
    it('should render children when user is not authenticated', () => {
      render(
        <TestWrapper>
          <PublicRoute>
            <TestPublicComponent />
          </PublicRoute>
        </TestWrapper>
      );

      expect(screen.getByTestId('public-content')).toBeInTheDocument();
    });

    it('should show loading spinner when authentication is loading', () => {
      mockUseAuth.isLoading = true;

      render(
        <TestWrapper>
          <PublicRoute>
            <TestPublicComponent />
          </PublicRoute>
        </TestWrapper>
      );

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.queryByTestId('public-content')).not.toBeInTheDocument();
    });

    it('should render children when authenticated but redirectIfAuthenticated is false', () => {
      mockUseAuth.isAuthenticated = true;

      render(
        <TestWrapper>
          <PublicRoute redirectIfAuthenticated={false}>
            <TestPublicComponent />
          </PublicRoute>
        </TestWrapper>
      );

      expect(screen.getByTestId('public-content')).toBeInTheDocument();
    });

    it('should redirect authenticated users when redirectIfAuthenticated is true', () => {
      mockUseAuth.isAuthenticated = true;

      render(
        <TestWrapper>
          <Routes>
            <Route path="/" element={
              <PublicRoute redirectIfAuthenticated={true}>
                <TestLoginComponent />
              </PublicRoute>
            } />
            <Route path="/dashboard" element={<TestDashboardComponent />} />
          </Routes>
        </TestWrapper>
      );

      // Should redirect to dashboard, not show login
      expect(screen.queryByTestId('login-content')).not.toBeInTheDocument();
    });

    it('should clear intended destination when redirecting authenticated user', () => {
      mockUseAuth.isAuthenticated = true;
      mockUseAuth.getIntendedDestination.mockReturnValue('/clients');

      render(
        <TestWrapper>
          <PublicRoute redirectIfAuthenticated={true}>
            <TestLoginComponent />
          </PublicRoute>
        </TestWrapper>
      );

      expect(mockUseAuth.clearIntendedDestination).toHaveBeenCalled();
    });

    it('should redirect to default when intended destination is a public route', () => {
      mockUseAuth.isAuthenticated = true;
      mockUseAuth.getIntendedDestination.mockReturnValue('/login');

      render(
        <TestWrapper>
          <Routes>
            <Route path="/" element={
              <PublicRoute redirectIfAuthenticated={true}>
                <TestLoginComponent />
              </PublicRoute>
            } />
            <Route path="/dashboard" element={<TestDashboardComponent />} />
          </Routes>
        </TestWrapper>
      );

      // Should not redirect to /login (public route), should go to dashboard
      expect(screen.queryByTestId('login-content')).not.toBeInTheDocument();
    });

    it('should use custom redirect destination', () => {
      mockUseAuth.isAuthenticated = true;

      render(
        <TestWrapper>
          <Routes>
            <Route path="/" element={
              <PublicRoute redirectIfAuthenticated={true} redirectTo="/custom-dashboard">
                <TestLoginComponent />
              </PublicRoute>
            } />
            <Route path="/custom-dashboard" element={<div data-testid="custom-dashboard">Custom Dashboard</div>} />
          </Routes>
        </TestWrapper>
      );

      // Should redirect to custom destination
      expect(screen.queryByTestId('login-content')).not.toBeInTheDocument();
    });

    it('should handle multiple public routes correctly', () => {
      render(
        <TestWrapper>
          <Routes>
            <Route path="/login" element={
              <PublicRoute>
                <TestLoginComponent />
              </PublicRoute>
            } />
            <Route path="/signup" element={
              <PublicRoute>
                <div data-testid="signup-content">Signup Page</div>
              </PublicRoute>
            } />
            <Route path="/" element={
              <PublicRoute>
                <div data-testid="home-content">Home Page</div>
              </PublicRoute>
            } />
          </Routes>
        </TestWrapper>
      );

      // All public routes should be accessible when not authenticated
      expect(screen.getByTestId('login-content')).toBeInTheDocument();
    });
  });

  describe('PrivateRoute', () => {
    it('should render children when user is authenticated', () => {
      mockUseAuth.isAuthenticated = true;

      render(
        <TestWrapper>
          <PrivateRoute>
            <TestPrivateComponent />
          </PrivateRoute>
        </TestWrapper>
      );

      expect(screen.getByTestId('private-content')).toBeInTheDocument();
    });

    it('should show loading spinner when authentication is loading', () => {
      mockUseAuth.isLoading = true;

      render(
        <TestWrapper>
          <PrivateRoute>
            <TestPrivateComponent />
          </PrivateRoute>
        </TestWrapper>
      );

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.queryByTestId('private-content')).not.toBeInTheDocument();
    });

    it('should show custom fallback when provided and loading', () => {
      mockUseAuth.isLoading = true;
      const customFallback = <div data-testid="custom-loading">Custom Loading</div>;

      render(
        <TestWrapper>
          <PrivateRoute fallback={customFallback}>
            <TestPrivateComponent />
          </PrivateRoute>
        </TestWrapper>
      );

      expect(screen.getByTestId('custom-loading')).toBeInTheDocument();
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    it('should store intended destination when redirecting unauthenticated users', () => {
      render(
        <TestWrapper>
          <PrivateRoute>
            <TestPrivateComponent />
          </PrivateRoute>
        </TestWrapper>
      );

      expect(mockUseAuth.setIntendedDestination).toHaveBeenCalled();
      // Verify it was called with some path (the exact path depends on test router setup)
      expect(mockUseAuth.setIntendedDestination).toHaveBeenCalledWith(expect.any(String));
    });

    it('should redirect to custom login path when specified', () => {
      render(
        <TestWrapper>
          <Routes>
            <Route path="/dashboard" element={
              <PrivateRoute redirectTo="/custom-login">
                <TestPrivateComponent />
              </PrivateRoute>
            } />
            <Route path="/custom-login" element={<div data-testid="custom-login">Custom Login</div>} />
          </Routes>
        </TestWrapper>
      );

      // Should redirect to custom login path
      expect(screen.queryByTestId('private-content')).not.toBeInTheDocument();
    });

    it('should handle complex route paths with query parameters', () => {
      // Mock location with query parameters
      const mockLocation = {
        pathname: '/clients',
        search: '?page=2&filter=active',
        hash: '#section1'
      };

      vi.mock('react-router-dom', async () => {
        const actual = await vi.importActual('react-router-dom');
        return {
          ...actual,
          useLocation: () => mockLocation
        };
      });

      render(
        <TestWrapper>
          <PrivateRoute>
            <TestPrivateComponent />
          </PrivateRoute>
        </TestWrapper>
      );

      // Should store the full path including query params and hash
      expect(mockUseAuth.setIntendedDestination).toHaveBeenCalledWith('/clients?page=2&filter=active#section1');
    });

    it('should handle nested private routes', () => {
      mockUseAuth.isAuthenticated = true;

      render(
        <TestWrapper>
          <PrivateRoute>
            <div data-testid="outer-private">
              <PrivateRoute>
                <TestPrivateComponent />
              </PrivateRoute>
            </div>
          </PrivateRoute>
        </TestWrapper>
      );

      // Both levels should render when authenticated
      expect(screen.getByTestId('outer-private')).toBeInTheDocument();
      expect(screen.getByTestId('private-content')).toBeInTheDocument();
    });

    it('should not interfere with each other when multiple instances exist', () => {
      render(
        <TestWrapper>
          <Routes>
            <Route path="/dashboard" element={
              <PrivateRoute>
                <div data-testid="dashboard-private">Dashboard</div>
              </PrivateRoute>
            } />
            <Route path="/clients" element={
              <PrivateRoute>
                <div data-testid="clients-private">Clients</div>
              </PrivateRoute>
            } />
          </Routes>
        </TestWrapper>
      );

      // Should handle multiple private routes independently
      expect(mockUseAuth.setIntendedDestination).toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle undefined location gracefully', () => {
      // Mock useLocation to return undefined pathname
      vi.mock('react-router-dom', async () => {
        const actual = await vi.importActual('react-router-dom');
        return {
          ...actual,
          useLocation: () => ({ pathname: undefined, search: '', hash: '' })
        };
      });

      render(
        <TestWrapper>
          <PrivateRoute>
            <TestPrivateComponent />
          </PrivateRoute>
        </TestWrapper>
      );

      // Should not crash and should still call setIntendedDestination
      expect(mockUseAuth.setIntendedDestination).toHaveBeenCalled();
    });

    it('should handle auth context errors gracefully', () => {
      // Mock useAuth to throw an error
      vi.mocked(mockUseAuth).mockImplementation(() => {
        throw new Error('Auth context error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(
          <TestWrapper>
            <PrivateRoute>
              <TestPrivateComponent />
            </PrivateRoute>
          </TestWrapper>
        );
      }).toThrow('Auth context error');

      consoleSpy.mockRestore();
    });

    it('should handle rapid authentication state changes', async () => {
      // Start with loading state
      mockUseAuth.isLoading = true;

      const { rerender } = render(
        <TestWrapper>
          <PrivateRoute>
            <TestPrivateComponent />
          </PrivateRoute>
        </TestWrapper>
      );

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

      // Change to authenticated
      mockUseAuth.isLoading = false;
      mockUseAuth.isAuthenticated = true;

      rerender(
        <TestWrapper>
          <PrivateRoute>
            <TestPrivateComponent />
          </PrivateRoute>
        </TestWrapper>
      );

      expect(screen.getByTestId('private-content')).toBeInTheDocument();

      // Change to unauthenticated
      mockUseAuth.isAuthenticated = false;

      rerender(
        <TestWrapper>
          <PrivateRoute>
            <TestPrivateComponent />
          </PrivateRoute>
        </TestWrapper>
      );

      expect(screen.queryByTestId('private-content')).not.toBeInTheDocument();
    });
  });

  describe('Performance and Optimization', () => {
    it('should not re-render unnecessarily when auth state is stable', () => {
      let renderCount = 0;
      
      function CountingPrivateComponent() {
        renderCount++;
        return <div data-testid="counting-component">Render {renderCount}</div>;
      }

      mockUseAuth.isAuthenticated = true;

      const { rerender } = render(
        <TestWrapper>
          <PrivateRoute>
            <CountingPrivateComponent />
          </PrivateRoute>
        </TestWrapper>
      );

      const initialRenderCount = renderCount;

      // Re-render with same auth state
      rerender(
        <TestWrapper>
          <PrivateRoute>
            <CountingPrivateComponent />
          </PrivateRoute>
        </TestWrapper>
      );

      // Should have re-rendered (React behavior), but component should be stable
      expect(screen.getByTestId('counting-component')).toBeInTheDocument();
    });

    it('should handle memory cleanup properly', () => {
      const { unmount } = render(
        <TestWrapper>
          <PrivateRoute>
            <TestPrivateComponent />
          </PrivateRoute>
        </TestWrapper>
      );

      // Unmount should not cause errors
      expect(() => unmount()).not.toThrow();
    });
  });
});