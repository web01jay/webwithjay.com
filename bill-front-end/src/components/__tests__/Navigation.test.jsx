import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { vi } from 'vitest';
import Navigation from '../Navigation';
import AuthContext from '../../contexts/AuthContext';

const theme = createTheme();

const TestWrapper = ({ children, authValue }) => (
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <AuthContext.Provider value={authValue}>
        {children}
      </AuthContext.Provider>
    </ThemeProvider>
  </BrowserRouter>
);

describe('Navigation Component', () => {
  const mockLogout = vi.fn();

  beforeEach(() => {
    mockLogout.mockClear();
  });

  describe('when user is not authenticated', () => {
    const unauthenticatedAuthValue = {
      isAuthenticated: false,
      user: null,
      logout: mockLogout
    };

    it('should show public navigation items', () => {
      render(
        <TestWrapper authValue={unauthenticatedAuthValue}>
          <Navigation />
        </TestWrapper>
      );

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByText('Sign Up')).toBeInTheDocument();
      
      // Should not show protected items
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
      expect(screen.queryByText('Products')).not.toBeInTheDocument();
      expect(screen.queryByText('Clients')).not.toBeInTheDocument();
      expect(screen.queryByText('Invoices')).not.toBeInTheDocument();
      expect(screen.queryByText('Logout')).not.toBeInTheDocument();
    });


  });

  describe('when user is authenticated', () => {
    const authenticatedAuthValue = {
      isAuthenticated: true,
      user: { name: 'John Doe', email: 'john@example.com' },
      logout: mockLogout
    };

    it('should show protected navigation items', () => {
      render(
        <TestWrapper authValue={authenticatedAuthValue}>
          <Navigation />
        </TestWrapper>
      );

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Products')).toBeInTheDocument();
      expect(screen.getByText('Clients')).toBeInTheDocument();
      expect(screen.getByText('Invoices')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
      
      // Should not show public auth items
      expect(screen.queryByText('Login')).not.toBeInTheDocument();
      expect(screen.queryByText('Sign Up')).not.toBeInTheDocument();
    });

    it('should show user welcome message', () => {
      render(
        <TestWrapper authValue={authenticatedAuthValue}>
          <Navigation />
        </TestWrapper>
      );

      expect(screen.getByText('Welcome, John Doe')).toBeInTheDocument();
    });

    it('should call logout when logout button is clicked', () => {
      render(
        <TestWrapper authValue={authenticatedAuthValue}>
          <Navigation />
        </TestWrapper>
      );

      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);

      expect(mockLogout).toHaveBeenCalledTimes(1);
    });


  });

  describe('when user has no name', () => {
    const authValueWithEmailOnly = {
      isAuthenticated: true,
      user: { email: 'john@example.com' },
      logout: mockLogout
    };

    it('should show email in welcome message when name is not available', () => {
      render(
        <TestWrapper authValue={authValueWithEmailOnly}>
          <Navigation />
        </TestWrapper>
      );

      expect(screen.getByText('Welcome, john@example.com')).toBeInTheDocument();
    });
  });
});