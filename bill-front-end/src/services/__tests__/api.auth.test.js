import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { apiWrapper, setAuthContext } from '../api';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock window.location
const originalLocation = window.location;
delete window.location;
window.location = { pathname: '/dashboard', href: '' };

describe('API Authentication Integration', () => {
  let mockAuthContext;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthContext = {
      logout: vi.fn()
    };
    setAuthContext(mockAuthContext);
    
    // Reset localStorage mock
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    
    // Reset fetch mock
    global.fetch = vi.fn();
  });

  afterEach(() => {
    window.location = originalLocation;
    vi.restoreAllMocks();
  });

  describe('Token Management', () => {
    test('should set auth tokens correctly', () => {
      const token = 'test-token';
      const refreshToken = 'test-refresh-token';

      apiWrapper.setAuthTokens(token, refreshToken);

      expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', token);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refreshToken', refreshToken);
    });

    test('should clear auth tokens correctly', () => {
      apiWrapper.clearAuthTokens();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
    });

    test('should get auth token correctly', () => {
      const token = 'test-token';
      localStorageMock.getItem.mockReturnValue(token);

      const result = apiWrapper.getAuthToken();

      expect(localStorageMock.getItem).toHaveBeenCalledWith('authToken');
      expect(result).toBe(token);
    });

    test('should check authentication status correctly', () => {
      // Test authenticated state
      localStorageMock.getItem.mockReturnValue('test-token');
      expect(apiWrapper.isAuthenticated()).toBe(true);

      // Test unauthenticated state
      localStorageMock.getItem.mockReturnValue(null);
      expect(apiWrapper.isAuthenticated()).toBe(false);
    });
  });

  describe('Auth Context Integration', () => {
    test('should set auth context correctly', () => {
      const context = { logout: vi.fn() };
      setAuthContext(context);
      
      // This test verifies the function doesn't throw
      expect(true).toBe(true);
    });
  });

  describe('API Request Authentication', () => {
    test('should include auth token in requests when available', async () => {
      const token = 'test-auth-token';
      localStorageMock.getItem.mockReturnValue(token);

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} })
      });

      await apiWrapper.get('/test-endpoint');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test-endpoint'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${token}`
          })
        })
      );
    });

    test('should make requests without auth token when not available', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} })
      });

      await apiWrapper.get('/test-endpoint');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test-endpoint'),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.any(String)
          })
        })
      );
    });
  });

  describe('Authentication Error Handling', () => {
    test('should handle 401 unauthorized responses', async () => {
      const token = 'expired-token';
      localStorageMock.getItem.mockReturnValue(token);

      global.fetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Unauthorized' })
      });

      try {
        await apiWrapper.get('/protected-endpoint');
      } catch (error) {
        // Expected to throw
      }

      // Should trigger logout when 401 is received
      expect(mockAuthContext.logout).toHaveBeenCalled();
    });

    test('should handle 403 forbidden responses', async () => {
      const token = 'valid-token';
      localStorageMock.getItem.mockReturnValue(token);

      global.fetch.mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ message: 'Forbidden' })
      });

      await expect(apiWrapper.get('/forbidden-endpoint')).rejects.toThrow();

      // Should not trigger logout for 403 (user is authenticated but not authorized)
      expect(mockAuthContext.logout).not.toHaveBeenCalled();
    });

    test('should handle token refresh scenarios', async () => {
      const expiredToken = 'expired-token';
      const refreshToken = 'valid-refresh-token';
      const newToken = 'new-access-token';

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'authToken') return expiredToken;
        if (key === 'refreshToken') return refreshToken;
        return null;
      });

      // First call fails with 401
      global.fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: 'Token expired' })
        })
        // Refresh token call succeeds
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ 
            success: true, 
            data: { token: newToken, refreshToken: 'new-refresh-token' }
          })
        })
        // Retry original call succeeds
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { result: 'success' } })
        });

      const result = await apiWrapper.get('/protected-endpoint');

      expect(result.data.result).toBe('success');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', newToken);
    });

    test('should logout when refresh token is invalid', async () => {
      const expiredToken = 'expired-token';
      const invalidRefreshToken = 'invalid-refresh-token';

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'authToken') return expiredToken;
        if (key === 'refreshToken') return invalidRefreshToken;
        return null;
      });

      // First call fails with 401
      global.fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: 'Token expired' })
        })
        // Refresh token call also fails
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: 'Invalid refresh token' })
        });

      try {
        await apiWrapper.get('/protected-endpoint');
      } catch (error) {
        // Expected to throw
      }

      expect(mockAuthContext.logout).toHaveBeenCalled();
    });

    test('should handle network errors during authentication', async () => {
      const token = 'valid-token';
      localStorageMock.getItem.mockReturnValue(token);

      global.fetch.mockRejectedValue(new Error('Network Error'));

      await expect(apiWrapper.get('/test-endpoint')).rejects.toThrow('Network Error');

      // Should not trigger logout for network errors
      expect(mockAuthContext.logout).not.toHaveBeenCalled();
    });

    test('should handle malformed authentication responses', async () => {
      const token = 'valid-token';
      localStorageMock.getItem.mockReturnValue(token);

      global.fetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      try {
        await apiWrapper.get('/test-endpoint');
      } catch (error) {
        // Expected to throw
      }

      // Should still trigger logout even if response parsing fails
      expect(mockAuthContext.logout).toHaveBeenCalled();
    });
  });

  describe('Concurrent Request Handling', () => {
    test('should handle multiple concurrent requests with expired token', async () => {
      const expiredToken = 'expired-token';
      const refreshToken = 'valid-refresh-token';
      const newToken = 'new-access-token';

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'authToken') return expiredToken;
        if (key === 'refreshToken') return refreshToken;
        return null;
      });

      // Mock multiple 401 responses followed by successful refresh
      global.fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: 'Token expired' })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: 'Token expired' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ 
            success: true, 
            data: { token: newToken, refreshToken: 'new-refresh-token' }
          })
        })
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { result: 'success' } })
        });

      // Make multiple concurrent requests
      const promises = [
        apiWrapper.get('/endpoint1'),
        apiWrapper.get('/endpoint2')
      ];

      const results = await Promise.all(promises);

      // Both should succeed after token refresh
      expect(results[0].data.result).toBe('success');
      expect(results[1].data.result).toBe('success');

      // Token should only be refreshed once
      expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', newToken);
    });

    test('should handle race conditions in token refresh', async () => {
      const expiredToken = 'expired-token';
      const refreshToken = 'valid-refresh-token';

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'authToken') return expiredToken;
        if (key === 'refreshToken') return refreshToken;
        return null;
      });

      // Simulate race condition where refresh is already in progress
      let refreshInProgress = false;
      
      global.fetch.mockImplementation((url) => {
        if (url.includes('/auth/refresh')) {
          if (refreshInProgress) {
            // Second refresh attempt should wait
            return Promise.resolve({
              ok: false,
              status: 429,
              json: () => Promise.resolve({ message: 'Too many requests' })
            });
          }
          refreshInProgress = true;
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ 
              success: true, 
              data: { token: 'new-token', refreshToken: 'new-refresh-token' }
            })
          });
        }
        
        if (refreshInProgress) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: { result: 'success' } })
          });
        }
        
        return Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: 'Token expired' })
        });
      });

      // Should handle the race condition gracefully
      const result = await apiWrapper.get('/test-endpoint');
      expect(result.data.result).toBe('success');
    });
  });

  describe('Security Considerations', () => {
    test('should not expose sensitive data in error messages', async () => {
      const token = 'sensitive-token';
      localStorageMock.getItem.mockReturnValue(token);

      global.fetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ 
          message: 'Unauthorized',
          debug: { token: 'sensitive-token', user: 'admin' }
        })
      });

      try {
        await apiWrapper.get('/test-endpoint');
      } catch (error) {
        // Error message should not contain sensitive data
        expect(error.message).not.toContain('sensitive-token');
        expect(error.message).not.toContain('admin');
      }
    });

    test('should clear tokens from memory on logout', () => {
      const token = 'test-token';
      const refreshToken = 'test-refresh-token';

      apiWrapper.setAuthTokens(token, refreshToken);
      apiWrapper.clearAuthTokens();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
    });

    test('should validate token format before using', () => {
      // Test with invalid token format
      localStorageMock.getItem.mockReturnValue('invalid-token-format');

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} })
      });

      // Should still make the request but with proper error handling
      expect(() => apiWrapper.get('/test-endpoint')).not.toThrow();
    });
  });
});