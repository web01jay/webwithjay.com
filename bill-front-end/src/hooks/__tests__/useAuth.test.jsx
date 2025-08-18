import React from 'react';
import { render } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { useAuth } from '../useAuth';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock the API wrapper
vi.mock('../../services/api', () => ({
  apiWrapper: {
    get: vi.fn(),
    post: vi.fn(),
  }
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Test component that uses the useAuth hook
function TestComponent() {
  const auth = useAuth();
  
  return (
    <div>
      <div data-testid="hook-result">
        {JSON.stringify({
          hasUser: !!auth.user,
          isAuthenticated: auth.isAuthenticated,
          isLoading: auth.isLoading,
          hasLogin: typeof auth.login === 'function',
          hasLogout: typeof auth.logout === 'function',
          hasCheckAuthStatus: typeof auth.checkAuthStatus === 'function'
        })}
      </div>
    </div>
  );
}

describe('useAuth hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Error Handling', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider. Make sure your component is wrapped with <AuthProvider>.');
      
      consoleSpy.mockRestore();
    });

    it('should throw error with null context', () => {
      // Mock useContext to return null
      const originalUseContext = React.useContext;
      React.useContext = vi.fn().mockReturnValue(null);
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');
      
      consoleSpy.mockRestore();
      React.useContext = originalUseContext;
    });

    it('should throw error with undefined context', () => {
      // Mock useContext to return undefined
      const originalUseContext = React.useContext;
      React.useContext = vi.fn().mockReturnValue(undefined);
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');
      
      consoleSpy.mockRestore();
      React.useContext = originalUseContext;
    });
  });

  describe('Context Integration', () => {
    it('should return auth context when used within AuthProvider', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const result = JSON.parse(document.querySelector('[data-testid="hook-result"]').textContent);
      
      expect(result.hasUser).toBe(false); // Initially no user
      expect(result.isAuthenticated).toBe(false); // Initially not authenticated
      // Note: isLoading can be either true or false depending on timing
      expect(typeof result.isLoading).toBe('boolean'); // Should be a boolean
      expect(result.hasLogin).toBe(true); // Should have login function
      expect(result.hasLogout).toBe(true); // Should have logout function
      expect(result.hasCheckAuthStatus).toBe(true); // Should have checkAuthStatus function
    });

    it('should provide proper TypeScript-like interface', () => {
      let authHook;
      
      function TestComponentWithHook() {
        authHook = useAuth();
        return <div>Test</div>;
      }

      render(
        <AuthProvider>
          <TestComponentWithHook />
        </AuthProvider>
      );

      // Verify all expected properties exist
      expect(authHook).toHaveProperty('user');
      expect(authHook).toHaveProperty('isAuthenticated');
      expect(authHook).toHaveProperty('isLoading');
      expect(authHook).toHaveProperty('error');
      expect(authHook).toHaveProperty('login');
      expect(authHook).toHaveProperty('logout');
      expect(authHook).toHaveProperty('checkAuthStatus');
      expect(authHook).toHaveProperty('setIntendedDestination');
      expect(authHook).toHaveProperty('getIntendedDestination');
      expect(authHook).toHaveProperty('clearIntendedDestination');

      // Verify function types
      expect(typeof authHook.login).toBe('function');
      expect(typeof authHook.logout).toBe('function');
      expect(typeof authHook.checkAuthStatus).toBe('function');
      expect(typeof authHook.setIntendedDestination).toBe('function');
      expect(typeof authHook.getIntendedDestination).toBe('function');
      expect(typeof authHook.clearIntendedDestination).toBe('function');
    });

    it('should maintain consistent reference across re-renders', () => {
      let authHook1, authHook2;
      let renderCount = 0;
      
      function TestComponentWithHook() {
        renderCount++;
        const auth = useAuth();
        if (renderCount === 1) authHook1 = auth;
        if (renderCount === 2) authHook2 = auth;
        return <div>Render {renderCount}</div>;
      }

      const { rerender } = render(
        <AuthProvider>
          <TestComponentWithHook />
        </AuthProvider>
      );

      rerender(
        <AuthProvider>
          <TestComponentWithHook />
        </AuthProvider>
      );

      // Functions should be the same reference (memoized)
      expect(authHook1.login).toBe(authHook2.login);
      expect(authHook1.logout).toBe(authHook2.logout);
      expect(authHook1.checkAuthStatus).toBe(authHook2.checkAuthStatus);
    });
  });

  describe('Hook Functionality', () => {
    it('should allow calling all auth methods', async () => {
      let authHook;
      
      function TestComponentWithHook() {
        authHook = useAuth();
        return <div>Test</div>;
      }

      render(
        <AuthProvider>
          <TestComponentWithHook />
        </AuthProvider>
      );

      // Test that methods can be called without throwing
      expect(() => {
        authHook.logout();
        authHook.setIntendedDestination('/test');
        authHook.getIntendedDestination();
        authHook.clearIntendedDestination();
      }).not.toThrow();

      // Test async methods
      await expect(authHook.checkAuthStatus()).resolves.toBeDefined();
      await expect(authHook.login({ email: 'test@example.com', password: 'password' }))
        .rejects.toThrow(); // Will throw because API is mocked to fail
    });

    it('should reflect state changes from context', async () => {
      const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };
      let authHook;
      
      function TestComponentWithHook() {
        authHook = useAuth();
        return (
          <div>
            <span data-testid="hook-user">{authHook.user ? authHook.user.name : 'no-user'}</span>
            <span data-testid="hook-auth">{authHook.isAuthenticated ? 'authenticated' : 'not-authenticated'}</span>
          </div>
        );
      }

      // Mock successful login
      apiWrapper.post.mockResolvedValue({
        success: true,
        data: { user: mockUser }
      });

      render(
        <AuthProvider>
          <TestComponentWithHook />
        </AuthProvider>
      );

      // Initially not authenticated
      await waitFor(() => {
        expect(screen.getByTestId('hook-auth')).toHaveTextContent('not-authenticated');
      });

      // Perform login
      await act(async () => {
        await authHook.login({ email: 'test@example.com', password: 'password' });
      });

      // Should reflect authenticated state
      await waitFor(() => {
        expect(screen.getByTestId('hook-auth')).toHaveTextContent('authenticated');
        expect(screen.getByTestId('hook-user')).toHaveTextContent('Test User');
      });
    });
  });

  describe('Multiple Hook Instances', () => {
    it('should share state between multiple hook instances', async () => {
      const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };
      
      function Component1() {
        const { user, isAuthenticated } = useAuth();
        return (
          <div>
            <span data-testid="comp1-user">{user ? user.name : 'no-user'}</span>
            <span data-testid="comp1-auth">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</span>
          </div>
        );
      }

      function Component2() {
        const { login } = useAuth();
        return (
          <button onClick={() => login({ email: 'test@example.com', password: 'password' })}>
            Login
          </button>
        );
      }

      // Mock successful login
      apiWrapper.post.mockResolvedValue({
        success: true,
        data: { user: mockUser }
      });

      render(
        <AuthProvider>
          <Component1 />
          <Component2 />
        </AuthProvider>
      );

      // Initially not authenticated
      await waitFor(() => {
        expect(screen.getByTestId('comp1-auth')).toHaveTextContent('not-authenticated');
      });

      // Login from component 2
      await act(async () => {
        screen.getByText('Login').click();
      });

      // Component 1 should reflect the change
      await waitFor(() => {
        expect(screen.getByTestId('comp1-auth')).toHaveTextContent('authenticated');
        expect(screen.getByTestId('comp1-user')).toHaveTextContent('Test User');
      });
    });
  });
});