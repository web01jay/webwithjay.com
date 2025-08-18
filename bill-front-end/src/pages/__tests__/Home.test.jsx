import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Home from '../Home';
import { vi } from 'vitest';

// Mock the API service
vi.mock('../../services/api', () => ({
  apiWrapper: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

// Mock react-router-dom hooks
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Mock useAuth hook
const mockUseAuth = vi.fn();
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth()
}));

const theme = createTheme();

const TestWrapper = ({ children }) => {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('Home Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should display loading message when authentication is loading', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
        user: null,
        error: null
      });

      render(
        <TestWrapper>
          <Home />
        </TestWrapper>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Unauthenticated User Experience', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null
      });
    });

    it('should display welcome message and app description', () => {
      render(
        <TestWrapper>
          <Home />
        </TestWrapper>
      );

      expect(screen.getByText('Welcome to BillPower')).toBeInTheDocument();
      expect(screen.getByText(/Your comprehensive billing and invoice management solution/)).toBeInTheDocument();
    });

    it('should display Sign In and Sign Up buttons for unauthenticated users', () => {
      render(
        <TestWrapper>
          <Home />
        </TestWrapper>
      );

      const signInLinks = screen.getAllByRole('link', { name: /sign in/i });
      const signUpLinks = screen.getAllByRole('link', { name: /sign up/i });
      
      expect(signInLinks.length).toBeGreaterThan(0);
      expect(signUpLinks.length).toBeGreaterThan(0);
    });

    it('should have correct navigation links for login and signup', () => {
      render(
        <TestWrapper>
          <Home />
        </TestWrapper>
      );

      const signInLinks = screen.getAllByRole('link', { name: /sign in/i });
      const signUpLinks = screen.getAllByRole('link', { name: /sign up/i });

      // Check that at least one sign in link points to /login
      expect(signInLinks.some(link => link.getAttribute('href') === '/login')).toBe(true);
      // Check that at least one sign up link points to /signup
      expect(signUpLinks.some(link => link.getAttribute('href') === '/signup')).toBe(true);
    });

    it('should not display quick access section for unauthenticated users', () => {
      render(
        <TestWrapper>
          <Home />
        </TestWrapper>
      );

      expect(screen.queryByText('Quick Access')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated User Experience', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: '1', name: 'John Doe', email: 'john@example.com' },
        error: null
      });
    });

    it('should display personalized welcome message for authenticated users', () => {
      render(
        <TestWrapper>
          <Home />
        </TestWrapper>
      );

      expect(screen.getByText('Welcome back, John Doe!')).toBeInTheDocument();
    });

    it('should display Go to Dashboard button for authenticated users', () => {
      render(
        <TestWrapper>
          <Home />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /go to dashboard/i })).toBeInTheDocument();
    });

    it('should navigate to dashboard when Go to Dashboard button is clicked', () => {
      render(
        <TestWrapper>
          <Home />
        </TestWrapper>
      );

      const dashboardButton = screen.getByRole('button', { name: /go to dashboard/i });
      fireEvent.click(dashboardButton);

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('should display Quick Access section with navigation links', () => {
      render(
        <TestWrapper>
          <Home />
        </TestWrapper>
      );

      expect(screen.getByText('Quick Access')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /clients/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /invoices/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /products/i })).toBeInTheDocument();
    });

    it('should have correct href attributes for quick access links', () => {
      render(
        <TestWrapper>
          <Home />
        </TestWrapper>
      );

      expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/dashboard');
      expect(screen.getByRole('link', { name: /clients/i })).toHaveAttribute('href', '/clients');
      expect(screen.getByRole('link', { name: /invoices/i })).toHaveAttribute('href', '/invoices');
      expect(screen.getByRole('link', { name: /products/i })).toHaveAttribute('href', '/products');
    });

    it('should not display Sign In and Sign Up buttons for authenticated users', () => {
      render(
        <TestWrapper>
          <Home />
        </TestWrapper>
      );

      // Should not find the main CTA Sign In/Sign Up buttons
      const signInButtons = screen.queryAllByText(/sign in/i);
      const signUpButtons = screen.queryAllByText(/sign up/i);
      
      // Filter out any that might be in footer or other contexts
      const mainSignInButton = signInButtons.find(button => 
        button.closest('button') || (button.closest('a') && button.textContent.trim() === 'Sign In')
      );
      const mainSignUpButton = signUpButtons.find(button => 
        button.closest('button') || (button.closest('a') && button.textContent.trim() === 'Sign Up')
      );

      expect(mainSignInButton).toBeUndefined();
      expect(mainSignUpButton).toBeUndefined();
    });

    it('should not display footer authentication links for authenticated users', () => {
      render(
        <TestWrapper>
          <Home />
        </TestWrapper>
      );

      expect(screen.queryByText(/sign in or create an account to get started/i)).not.toBeInTheDocument();
    });
  });

  describe('Features Section', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null
      });
    });

    it('should display all feature cards', () => {
      render(
        <TestWrapper>
          <Home />
        </TestWrapper>
      );

      expect(screen.getByText('Powerful Features')).toBeInTheDocument();
      expect(screen.getByText('Client Management')).toBeInTheDocument();
      expect(screen.getByText('Invoice Generation')).toBeInTheDocument();
      expect(screen.getByText('Product Catalog')).toBeInTheDocument();
    });

    it('should display feature descriptions', () => {
      render(
        <TestWrapper>
          <Home />
        </TestWrapper>
      );

      expect(screen.getByText(/Organize and manage your client information/)).toBeInTheDocument();
      expect(screen.getByText(/Create professional invoices quickly/)).toBeInTheDocument();
      expect(screen.getByText(/Maintain a comprehensive catalog/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null
      });
    });

    it('should have proper heading hierarchy', () => {
      render(
        <TestWrapper>
          <Home />
        </TestWrapper>
      );

      const h1 = screen.getByRole('heading', { level: 1 });
      const h2Elements = screen.getAllByRole('heading', { level: 2 });
      const h3Elements = screen.getAllByRole('heading', { level: 3 });

      expect(h1).toHaveTextContent('Welcome to BillPower');
      expect(h2Elements).toHaveLength(1);
      expect(h2Elements[0]).toHaveTextContent('Powerful Features');
      expect(h3Elements).toHaveLength(3); // Feature card headings
    });

    it('should have accessible navigation links', () => {
      render(
        <TestWrapper>
          <Home />
        </TestWrapper>
      );

      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveAttribute('href');
      });
    });
  });

  describe('User with email only', () => {
    it('should display email when name is not available', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: '1', email: 'john@example.com' }, // No name property
        error: null
      });

      render(
        <TestWrapper>
          <Home />
        </TestWrapper>
      );

      expect(screen.getByText('Welcome back, john@example.com!')).toBeInTheDocument();
    });
  });
});