import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  AuthLoadingSpinner,
  RouteLoadingState,
  LoginLoadingState,
  SignupLoadingState,
  InlineAuthLoading,
  ProtectedContentLoading
} from '../AuthLoadingState';

describe('AuthLoadingState Components', () => {
  describe('AuthLoadingSpinner', () => {
    it('should render with default message', () => {
      render(<AuthLoadingSpinner />);
      expect(screen.getByText('Checking authentication...')).toBeInTheDocument();
    });

    it('should render with custom message', () => {
      render(<AuthLoadingSpinner message="Custom loading message" />);
      expect(screen.getByText('Custom loading message')).toBeInTheDocument();
    });

    it('should show security icon by default', () => {
      render(<AuthLoadingSpinner />);
      const securityIcon = document.querySelector('[data-testid="SecurityIcon"]');
      expect(securityIcon).toBeInTheDocument();
    });

    it('should hide icon when showIcon is false', () => {
      render(<AuthLoadingSpinner showIcon={false} />);
      const securityIcon = document.querySelector('[data-testid="SecurityIcon"]');
      expect(securityIcon).not.toBeInTheDocument();
    });
  });

  describe('LoginLoadingState', () => {
    it('should render with default message', () => {
      render(<LoginLoadingState />);
      expect(screen.getByText('Signing in...')).toBeInTheDocument();
    });

    it('should render with custom message', () => {
      render(<LoginLoadingState message="Authenticating user..." />);
      expect(screen.getByText('Authenticating user...')).toBeInTheDocument();
    });
  });

  describe('SignupLoadingState', () => {
    it('should render with default message', () => {
      render(<SignupLoadingState />);
      expect(screen.getByText('Creating account...')).toBeInTheDocument();
    });

    it('should render with custom message', () => {
      render(<SignupLoadingState message="Setting up account..." />);
      expect(screen.getByText('Setting up account...')).toBeInTheDocument();
    });
  });

  describe('InlineAuthLoading', () => {
    it('should render loading spinner', () => {
      render(<InlineAuthLoading />);
      const spinner = document.querySelector('.MuiCircularProgress-root');
      expect(spinner).toBeInTheDocument();
    });

    it('should show message when enabled', () => {
      render(<InlineAuthLoading message="Loading..." showMessage={true} />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should not show message by default', () => {
      render(<InlineAuthLoading message="Loading..." />);
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  describe('ProtectedContentLoading', () => {
    it('should render with default message', () => {
      render(<ProtectedContentLoading />);
      expect(screen.getByText('Verifying access permissions...')).toBeInTheDocument();
    });

    it('should render with custom message', () => {
      render(<ProtectedContentLoading message="Checking authorization..." />);
      expect(screen.getByText('Checking authorization...')).toBeInTheDocument();
    });
  });

  describe('RouteLoadingState', () => {
    it('should render with default message', () => {
      render(<RouteLoadingState />);
      expect(screen.getByText('Loading page...')).toBeInTheDocument();
    });

    it('should render with custom message', () => {
      render(<RouteLoadingState message="Navigating..." />);
      expect(screen.getByText('Navigating...')).toBeInTheDocument();
    });

    it('should show progress bar', () => {
      render(<RouteLoadingState />);
      const progressBar = document.querySelector('.MuiLinearProgress-root');
      expect(progressBar).toBeInTheDocument();
    });

    it('should show determinate progress when progress is provided', () => {
      render(<RouteLoadingState progress={50} />);
      const progressBar = document.querySelector('.MuiLinearProgress-determinate');
      expect(progressBar).toBeInTheDocument();
    });
  });
});