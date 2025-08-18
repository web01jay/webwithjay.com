import { describe, test, expect, beforeEach, vi } from 'vitest';
import { apiWrapper, setAuthContext } from '../api';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

describe('API Authentication Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  test('should integrate with auth context correctly', () => {
    const mockLogout = vi.fn();
    const authContext = { logout: mockLogout };
    
    // Should not throw when setting auth context
    expect(() => setAuthContext(authContext)).not.toThrow();
  });

  test('should manage tokens correctly', () => {
    const token = 'test-access-token';
    const refreshToken = 'test-refresh-token';

    // Set tokens
    apiWrapper.setAuthTokens(token, refreshToken);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', token);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('refreshToken', refreshToken);

    // Get tokens
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'authToken') return token;
      if (key === 'refreshToken') return refreshToken;
      return null;
    });

    expect(apiWrapper.getAuthToken()).toBe(token);
    expect(apiWrapper.getRefreshToken()).toBe(refreshToken);
    expect(apiWrapper.isAuthenticated()).toBe(true);

    // Clear tokens
    apiWrapper.clearAuthTokens();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
  });

  test('should handle authentication state correctly', () => {
    // Test unauthenticated state
    localStorageMock.getItem.mockReturnValue(null);
    expect(apiWrapper.isAuthenticated()).toBe(false);

    // Test authenticated state
    localStorageMock.getItem.mockReturnValue('some-token');
    expect(apiWrapper.isAuthenticated()).toBe(true);
  });
});