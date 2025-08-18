import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { apiWrapper, setAuthContext } from '../services/api';

// TypeScript-like interfaces defined as JSDoc comments for better IDE support
/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {string} name
 * @property {string} [role]
 */

/**
 * @typedef {Object} LoginCredentials
 * @property {string} email
 * @property {string} password
 */

/**
 * @typedef {Object} AuthState
 * @property {User|null} user
 * @property {boolean} isAuthenticated
 * @property {boolean} isLoading
 * @property {string|null} error
 * @property {string|null} intendedDestination
 */

/**
 * @typedef {Object} AuthContextType
 * @property {User|null} user
 * @property {boolean} isAuthenticated
 * @property {boolean} isLoading
 * @property {string|null} error
 * @property {(credentials: LoginCredentials) => Promise<void>} login
 * @property {() => void} logout
 * @property {() => Promise<boolean>} checkAuthStatus
 * @property {(destination: string) => void} setIntendedDestination
 * @property {() => string|null} getIntendedDestination
 * @property {() => void} clearIntendedDestination
 */

// Auth action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_USER: 'SET_USER',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_INTENDED_DESTINATION: 'SET_INTENDED_DESTINATION',
  CLEAR_INTENDED_DESTINATION: 'CLEAR_INTENDED_DESTINATION'
};

// Initial auth state
const initialAuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  intendedDestination: null
};

// Auth reducer
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
        error: null
      };
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };
    
    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
        error: null
      };
    
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    
    case AUTH_ACTIONS.SET_INTENDED_DESTINATION:
      return {
        ...state,
        intendedDestination: action.payload
      };
    
    case AUTH_ACTIONS.CLEAR_INTENDED_DESTINATION:
      return {
        ...state,
        intendedDestination: null
      };
    
    default:
      return state;
  }
}

// Create the context
const AuthContext = createContext(null);

// Session and user management utilities (session-based auth)
const USER_KEY = 'authUser';
const INTENDED_DESTINATION_KEY = 'intendedDestination';

const authUtils = {
  getUser: () => {
    try {
      const userData = localStorage.getItem(USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
      return null;
    }
  },
  
  setUser: (user) => {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error storing user data in localStorage:', error);
    }
  },
  
  removeUser: () => localStorage.removeItem(USER_KEY),
  
  getIntendedDestination: () => localStorage.getItem(INTENDED_DESTINATION_KEY),
  setIntendedDestination: (destination) => localStorage.setItem(INTENDED_DESTINATION_KEY, destination),
  removeIntendedDestination: () => localStorage.removeItem(INTENDED_DESTINATION_KEY),
  
  clearAll: () => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(INTENDED_DESTINATION_KEY);
  }
};

// Auth Provider component
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  // Validate session with API
  const validateSession = async () => {
    try {
      // Try to access a protected endpoint to validate session
      const response = await apiWrapper.get('/dashboard/stats');
      // If successful, session is valid - get user from stored data
      return authUtils.getUser();
    } catch (error) {
      console.error('Session validation failed:', error);
      return null;
    }
  };

  // Check authentication status
  const checkAuthStatus = async () => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    
    try {
      const storedUser = authUtils.getUser();
      
      if (!storedUser) {
        console.log('No stored user found, user is not authenticated');
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
        return false;
      }
      
      console.log('Validating stored user session...');
      // Validate session with API
      const validatedUser = await validateSession();
      
      if (validatedUser) {
        console.log('Session validation successful');
        dispatch({ 
          type: AUTH_ACTIONS.SET_USER, 
          payload: validatedUser 
        });
        return true;
      } else {
        // Session is invalid, clear everything
        console.log('Session validation failed, clearing auth data');
        authUtils.clearAll();
        dispatch({ 
          type: AUTH_ACTIONS.LOGIN_FAILURE, 
          payload: 'Your session has expired. Please sign in again.' 
        });
        return false;
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
      
      // Determine error type for better user feedback
      let errorMessage = 'Authentication check failed';
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Unable to verify authentication due to network issues';
        // On network error, use stored user if available
        const storedUser = authUtils.getUser();
        if (storedUser) {
          console.log('Using stored user due to network error');
          dispatch({ 
            type: AUTH_ACTIONS.SET_USER, 
            payload: storedUser 
          });
          return true;
        }
      } else if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
        errorMessage = 'Your session has expired. Please sign in again.';
      }
      
      dispatch({ 
        type: AUTH_ACTIONS.LOGIN_FAILURE, 
        payload: errorMessage 
      });
      return false;
    }
  };

  // Login method
  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
    
    try {
      const response = await apiWrapper.post('/auth/login', credentials);
      
      if (response.success && response.data && response.data.user) {
        // Store user data and tokens
        authUtils.setUser(response.data.user);
        
        // Store authentication tokens if provided
        if (response.data.token) {
          apiWrapper.setAuthTokens(response.data.token, response.data.refreshToken);
        }
        
        dispatch({ 
          type: AUTH_ACTIONS.LOGIN_SUCCESS, 
          payload: { user: response.data.user } 
        });
      } else {
        throw new Error(response.message || 'Invalid response format from login API');
      }
    } catch (error) {
      const errorMessage = error.message || 'Login failed. Please try again.';
      dispatch({ 
        type: AUTH_ACTIONS.LOGIN_FAILURE, 
        payload: errorMessage 
      });
      throw error;
    }
  };

  // Logout method
  const logout = () => {
    // Clear all authentication data
    authUtils.clearAll();
    apiWrapper.clearAuthTokens();
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
    
    // Optional: Call logout API endpoint to clear server session
    try {
      apiWrapper.post('/auth/logout').catch(error => {
        console.warn('Logout API call failed:', error);
      });
    } catch (error) {
      // Ignore logout API errors
    }
  };

  // Intended destination management
  const setIntendedDestination = (destination) => {
    authUtils.setIntendedDestination(destination);
    dispatch({ 
      type: AUTH_ACTIONS.SET_INTENDED_DESTINATION, 
      payload: destination 
    });
  };

  const getIntendedDestination = () => {
    return state.intendedDestination || authUtils.getIntendedDestination();
  };

  const clearIntendedDestination = () => {
    authUtils.removeIntendedDestination();
    dispatch({ type: AUTH_ACTIONS.CLEAR_INTENDED_DESTINATION });
  };

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      // Set auth context reference for API interceptors
      setAuthContext({ logout });
      
      // Load intended destination from localStorage
      const storedDestination = authUtils.getIntendedDestination();
      if (storedDestination) {
        dispatch({ 
          type: AUTH_ACTIONS.SET_INTENDED_DESTINATION, 
          payload: storedDestination 
        });
      }
      
      // Check authentication status
      await checkAuthStatus();
    };

    initializeAuth();
  }, []);

  // Context value
  const contextValue = {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    login,
    logout,
    checkAuthStatus,
    setIntendedDestination,
    getIntendedDestination,
    clearIntendedDestination
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;