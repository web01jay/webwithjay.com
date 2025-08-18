import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook for managing focus during route transitions and redirects
 * Ensures proper focus management for accessibility
 */
export const useFocusManagement = ({
  focusOnRouteChange = true,
  skipToMainContent = true,
  announceRouteChange = true
}) => {
  const location = useLocation();
  const previousLocationRef = useRef(location);
  const mainContentRef = useRef(null);
  const announceRef = useRef(null);

  // Focus the main content area when route changes
  const focusMainContent = useCallback(() => {
    if (skipToMainContent) {
      const mainContent = document.getElementById('main-content') || mainContentRef.current;
      if (mainContent) {
        mainContent.focus();
        mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [skipToMainContent]);

  // Announce route changes to screen readers
  const announceRouteChangeToScreenReader = useCallback((newPath, oldPath) => {
    if (!announceRouteChange) return;

    const routeNames = {
      '/': 'Home',
      '/login': 'Login',
      '/signup': 'Sign Up',
      '/dashboard': 'Dashboard',
      '/clients': 'Clients',
      '/invoices': 'Invoices',
      '/products': 'Products'
    };

    const newRouteName = routeNames[newPath] || 'Page';
    const message = `Navigated to ${newRouteName}`;

    if (announceRef.current) {
      announceRef.current.textContent = message;
    }
  }, [announceRouteChange]);

  // Handle route changes
  useEffect(() => {
    const currentLocation = location.pathname;
    const previousLocation = previousLocationRef.current.pathname;

    if (currentLocation !== previousLocation) {
      // Small delay to ensure DOM is updated
      const timeoutId = setTimeout(() => {
        if (focusOnRouteChange) {
          focusMainContent();
        }
        
        announceRouteChangeToScreenReader(currentLocation, previousLocation);
      }, 100);

      previousLocationRef.current = location;

      return () => clearTimeout(timeoutId);
    }
  }, [location, focusOnRouteChange, focusMainContent, announceRouteChangeToScreenReader]);

  return {
    mainContentRef,
    announceRef,
    focusMainContent
  };
};

/**
 * Hook for managing focus traps in modals and dialogs
 */
export const useFocusTrap = (isActive = true) => {
  const containerRef = useRef(null);
  const previousActiveElementRef = useRef(null);

  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    
    const focusableSelectors = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"]):not([disabled])',
      '[contenteditable="true"]'
    ].join(', ');

    return Array.from(containerRef.current.querySelectorAll(focusableSelectors));
  }, []);

  const handleKeyDown = useCallback((event) => {
    if (!isActive || event.key !== 'Tab') return;

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }, [isActive, getFocusableElements]);

  useEffect(() => {
    if (isActive && containerRef.current) {
      // Store the previously focused element
      previousActiveElementRef.current = document.activeElement;

      // Focus the first focusable element
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }

      // Add event listener
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        
        // Restore focus to the previously focused element
        if (previousActiveElementRef.current && 
            typeof previousActiveElementRef.current.focus === 'function') {
          previousActiveElementRef.current.focus();
        }
      };
    }
  }, [isActive, handleKeyDown, getFocusableElements]);

  return containerRef;
};

/**
 * Hook for managing focus on form errors
 */
export const useFormErrorFocus = () => {
  const focusFirstError = useCallback((errors) => {
    if (!errors || Object.keys(errors).length === 0) return;

    // Get the first error field name
    const firstErrorField = Object.keys(errors)[0];
    
    // Try to focus the field
    const fieldElement = document.getElementById(firstErrorField) || 
                        document.querySelector(`[name="${firstErrorField}"]`);
    
    if (fieldElement) {
      fieldElement.focus();
      if (typeof fieldElement.scrollIntoView === 'function') {
        fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, []);

  return { focusFirstError };
};

export default useFocusManagement;