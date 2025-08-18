import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthProvider } from '../AuthContext';
import { useAuth } from '../../hooks/useAuth';
import { apiWrapper } from '../../services/api';

// Mock the API wrapper
vi.mock('../../services/api', () => ({
  apiWrapper: {
    get: vi.fn(),
    post: vi.fn(),
    setAuthTokens: vi.fn(),
    clearAuthTokens: vi.fn(),
    getAuthToken: vi.fn(),
    getRefreshToken: vi.fn(),
    isAuthenticated: vi.fn(),
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

// Test component that uses the auth context
function TestComponent() {
  const { user, isAuthenticated, isLoading, login, logout, error } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <div data-testid="user">{user ? user.name : 'no-user'}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <button onClick={() => login({ email: 'test@example.com', password: 'password' })}>
        Login
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    // Clean up any pending timers or promises
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should throw error when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');
    
    consoleSpy.mockRestore();
  });

  it('should provide initial auth state', async () => {
    // Mock API call for session validation
    apiWrapper.get.mockRejectedValue(new Error('Not authenticated'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Initially should be loading
    expect(screen.getByTestId('loading')).toHaveTextContent('loading');

    // Wait for auth check to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    expect(screen.getByTestId('error')).toHaveTextContent('no-error');
  });

  it('should handle successful login', async () => {
    const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };
    
    // Mock successful login response
    apiWrapper.post.mockResolvedValue({
      success: true,
      data: { user: mockUser }
    });

    // Mock session validation failure initially
    apiWrapper.get.mockRejectedValue(new Error('Not authenticated'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initial auth check
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    // Perform login
    await act(async () => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
    });

    // Verify localStorage was called
    expect(localStorageMock.setItem).toHaveBeenCalledWith('authUser', JSON.stringify(mockUser));
  });

  it('should handle login failure', async () => {
    // Mock failed login response
    apiWrapper.post.mockRejectedValue(new Error('Invalid credentials'));

    // Mock session validation failure
    apiWrapper.get.mockRejectedValue(new Error('Not authenticated'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initial auth check
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    // Perform login
    await act(async () => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
    });
  });

  it('should handle logout', async () => {
    const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };
    
    // Mock stored user data
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'authUser') return JSON.stringify(mockUser);
      return null;
    });

    // Mock successful session validation
    apiWrapper.get.mockResolvedValue({ success: true });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for auth check to complete and user to be loaded
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
    });

    // Perform logout
    act(() => {
      screen.getByText('Logout').click();
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    
    // Verify localStorage was cleared
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('authUser');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('intendedDestination');
  });

  it('should restore user from localStorage on initialization', async () => {
    const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };
    
    // Mock stored user data
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'authUser') return JSON.stringify(mockUser);
      return null;
    });

    // Mock successful session validation
    apiWrapper.get.mockResolvedValue({ success: true });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for auth check to complete
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
    });
  });

  describe('State Management', () => {
    it('should handle loading states correctly', async () => {
      // Mock delayed API response
      apiWrapper.get.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Initially should be loading
      expect(screen.getByTestId('loading')).toHaveTextContent('loading');

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });
    });

    it('should clear error state on successful login', async () => {
      const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };
      
      // Mock initial failed session validation
      apiWrapper.get.mockRejectedValue(new Error('Not authenticated'));
      
      // Mock failed login first, then successful
      apiWrapper.post
        .mockRejectedValueOnce(new Error('Invalid credentials'))
        .mockResolvedValueOnce({
          success: true,
          data: { user: mockUser }
        });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initial auth check
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      // First login attempt (should fail)
      await act(async () => {
        screen.getByText('Login').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials');
      });

      // Second login attempt (should succeed and clear error)
      await act(async () => {
        screen.getByText('Login').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('no-error');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      });
    });

    it('should handle corrupted localStorage data gracefully', async () => {
      // Mock corrupted JSON in localStorage
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'authUser') return 'invalid-json{';
        return null;
      });

      // Mock session validation failure
      apiWrapper.get.mockRejectedValue(new Error('Not authenticated'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Should handle corrupted data and not crash
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
      });
    });
  });

  describe('Session Validation', () => {
    it('should validate session on initialization', async () => {
      const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'authUser') return JSON.stringify(mockUser);
        return null;
      });

      apiWrapper.get.mockResolvedValue({ success: true });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(apiWrapper.get).toHaveBeenCalledWith('/dashboard/stats');
      });
    });

    it('should logout user when session validation fails', async () => {
      const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'authUser') return JSON.stringify(mockUser);
        return null;
      });

      // Mock session validation failure
      apiWrapper.get.mockRejectedValue(new Error('Session expired'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('authUser');
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('intendedDestination');
      });
    });

    it('should handle network errors during session validation gracefully', async () => {
      const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'authUser') return JSON.stringify(mockUser);
        return null;
      });

      // Mock network error
      apiWrapper.get.mockRejectedValue(new Error('Network Error'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Should still authenticate user based on stored data during network issues
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
        expect(screen.getByTestId('user')).toHaveTextContent('Test User');
      });
    });
  });

  describe('Intended Destination Management', () => {
    it('should store and retrieve intended destination', async () => {
      apiWrapper.get.mockRejectedValue(new Error('Not authenticated'));

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

      await waitFor(() => {
        expect(screen.getByText('Test')).toBeInTheDocument();
      });

      // Set intended destination
      act(() => {
        authHook.setIntendedDestination('/clients');
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('intendedDestination', '/clients');
      expect(authHook.getIntendedDestination()).toBe('/clients');
    });

    it('should clear intended destination', async () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'intendedDestination') return '/clients';
        return null;
      });

      apiWrapper.get.mockRejectedValue(new Error('Not authenticated'));

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

      await waitFor(() => {
        expect(screen.getByText('Test')).toBeInTheDocument();
      });

      // Clear intended destination
      act(() => {
        authHook.clearIntendedDestination();
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('intendedDestination');
      expect(authHook.getIntendedDestination()).toBe(null);
    });

    it('should restore intended destination from localStorage on initialization', async () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'intendedDestination') return '/clients';
        return null;
      });

      apiWrapper.get.mockRejectedValue(new Error('Not authenticated'));

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

      await waitFor(() => {
        expect(authHook.getIntendedDestination()).toBe('/clients');
      });
    });
  });

  describe('Token Management Integration', () => {
    it('should set auth tokens on successful login', async () => {
      const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };
      const mockToken = 'mock-jwt-token';
      const mockRefreshToken = 'mock-refresh-token';
      
      apiWrapper.get.mockRejectedValue(new Error('Not authenticated'));
      apiWrapper.post.mockResolvedValue({
        success: true,
        data: { 
          user: mockUser,
          token: mockToken,
          refreshToken: mockRefreshToken
        }
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      await act(async () => {
        screen.getByText('Login').click();
      });

      await waitFor(() => {
        expect(apiWrapper.setAuthTokens).toHaveBeenCalledWith(mockToken, mockRefreshToken);
      });
    });

    it('should clear auth tokens on logout', async () => {
      const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'authUser') return JSON.stringify(mockUser);
        return null;
      });

      apiWrapper.get.mockResolvedValue({ success: true });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      });

      act(() => {
        screen.getByText('Logout').click();
      });

      expect(apiWrapper.clearAuthTokens).toHaveBeenCalled();
    });

    it('should call logout API endpoint on logout', async () => {
      const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'authUser') return JSON.stringify(mockUser);
        return null;
      });

      apiWrapper.get.mockResolvedValue({ success: true });
      apiWrapper.post.mockResolvedValue({ success: true });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      });

      act(() => {
        screen.getByText('Logout').click();
      });

      // Should call logout API (but not fail if it errors)
      await waitFor(() => {
        expect(apiWrapper.post).toHaveBeenCalledWith('/auth/logout');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle login with invalid response format', async () => {
      apiWrapper.get.mockRejectedValue(new Error('Not authenticated'));
      apiWrapper.post.mockResolvedValue({
        success: true,
        data: {} // Missing user data
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      await act(async () => {
        screen.getByText('Login').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Invalid response format from login API');
      });
    });

    it('should handle login API network errors', async () => {
      apiWrapper.get.mockRejectedValue(new Error('Not authenticated'));
      apiWrapper.post.mockRejectedValue(new Error('Network Error'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      await act(async () => {
        screen.getByText('Login').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Network Error');
      });
    });

    it('should handle logout API errors gracefully', async () => {
      const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'authUser') return JSON.stringify(mockUser);
        return null;
      });

      apiWrapper.get.mockResolvedValue({ success: true });
      apiWrapper.post.mockRejectedValue(new Error('Logout API failed'));

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      });

      act(() => {
        screen.getByText('Logout').click();
      });

      // Should still logout locally even if API fails
      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
      
      consoleSpy.mockRestore();
    });
  });
});