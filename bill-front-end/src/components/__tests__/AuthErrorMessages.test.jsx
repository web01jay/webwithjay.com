import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  AuthErrorAlert,
  InlineAuthError,
  AuthNetworkError
} from '../AuthErrorMessages';

describe('AuthErrorMessages Components', () => {
  describe('AuthErrorAlert', () => {
    it('should not render when no error is provided', () => {
      const { container } = render(<AuthErrorAlert error={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render error message', () => {
      render(<AuthErrorAlert error="Test error message" />);
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('should detect network errors and customize message', () => {
      render(<AuthErrorAlert error="Network error occurred" />);
      expect(screen.getByText('Connection Error')).toBeInTheDocument();
      expect(screen.getByText('Unable to connect to the server. Please check your internet connection.')).toBeInTheDocument();
    });

    it('should detect unauthorized errors', () => {
      render(<AuthErrorAlert error="Unauthorized access - 401" />);
      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
      expect(screen.getByText('Your session has expired or you need to sign in.')).toBeInTheDocument();
    });

    it('should detect invalid credentials errors', () => {
      render(<AuthErrorAlert error="Invalid credentials provided" />);
      expect(screen.getByText('Invalid Credentials')).toBeInTheDocument();
      expect(screen.getByText('The email or password you entered is incorrect.')).toBeInTheDocument();
    });

    it('should detect token expiration errors', () => {
      render(<AuthErrorAlert error="Token has expired" />);
      expect(screen.getByText('Session Expired')).toBeInTheDocument();
      expect(screen.getByText('Your session has expired. Please sign in again.')).toBeInTheDocument();
    });

    it('should call onRetry when retry button is clicked', () => {
      const onRetry = vi.fn();
      render(<AuthErrorAlert error="Test error" onRetry={onRetry} />);
      
      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);
      
      expect(onRetry).toHaveBeenCalledOnce();
    });

    it('should show details when showDetails is true', () => {
      render(<AuthErrorAlert error="Test error" showDetails={true} />);
      
      const expandButton = screen.getByLabelText('Show details');
      fireEvent.click(expandButton);
      
      expect(screen.getByText('What you can try:')).toBeInTheDocument();
    });

    it('should show sign in button for authentication errors', () => {
      const onGoToLogin = vi.fn();
      render(<AuthErrorAlert error="Unauthorized - 401" onGoToLogin={onGoToLogin} />);
      
      const signInButton = screen.getByText('Sign In');
      fireEvent.click(signInButton);
      
      expect(onGoToLogin).toHaveBeenCalledOnce();
    });
  });

  describe('InlineAuthError', () => {
    it('should not render when no error is provided', () => {
      const { container } = render(<InlineAuthError error={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render error message', () => {
      render(<InlineAuthError error="Inline error message" />);
      expect(screen.getByText('Inline error message')).toBeInTheDocument();
    });

    it('should render with custom severity', () => {
      render(<InlineAuthError error="Warning message" severity="warning" />);
      const alert = document.querySelector('.MuiAlert-root');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveClass('MuiAlert-outlinedWarning');
    });
  });

  describe('AuthNetworkError', () => {
    it('should not render when online', () => {
      const { container } = render(<AuthNetworkError isOnline={true} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render when offline', () => {
      render(<AuthNetworkError isOnline={false} />);
      expect(screen.getByText('Connection Lost')).toBeInTheDocument();
      expect(screen.getByText('You\'re currently offline. Authentication features may not work properly.')).toBeInTheDocument();
    });

    it('should call onRetry when retry button is clicked', () => {
      const onRetry = vi.fn();
      render(<AuthNetworkError isOnline={false} onRetry={onRetry} />);
      
      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);
      
      expect(onRetry).toHaveBeenCalledOnce();
    });
  });
});