import { useContext } from 'react';
import AuthContext from '../contexts/AuthContext';

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
 * @typedef {Object} UseAuthReturn
 * @property {User|null} user - Current authenticated user
 * @property {boolean} isAuthenticated - Whether user is authenticated
 * @property {boolean} isLoading - Whether authentication check is in progress
 * @property {string|null} error - Current authentication error message
 * @property {(credentials: LoginCredentials) => Promise<void>} login - Login function
 * @property {() => void} logout - Logout function
 * @property {() => Promise<boolean>} checkAuthStatus - Check current auth status
 * @property {(destination: string) => void} setIntendedDestination - Store intended destination
 * @property {() => string|null} getIntendedDestination - Get stored intended destination
 * @property {() => void} clearIntendedDestination - Clear stored intended destination
 */

/**
 * Custom hook for accessing authentication context
 * 
 * This hook provides access to the authentication state and methods.
 * It must be used within an AuthProvider component tree.
 * 
 * @returns {UseAuthReturn} Authentication context value
 * @throws {Error} When used outside of AuthProvider
 * 
 * @example
 * ```javascript
 * function LoginForm() {
 *   const { login, isLoading, error } = useAuth();
 *   
 *   const handleSubmit = async (credentials) => {
 *     try {
 *       await login(credentials);
 *     } catch (err) {
 *       console.error('Login failed:', err);
 *     }
 *   };
 *   
 *   // Returns JSX with form elements and error display
 *   return React.createElement('form', { onSubmit: handleSubmit }, ...);
 * }
 * ```
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  // Error handling for context usage outside provider
  if (context === null || context === undefined) {
    throw new Error(
      'useAuth must be used within an AuthProvider. ' +
      'Make sure your component is wrapped with <AuthProvider>.'
    );
  }
  
  return context;
}

export default useAuth;