import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Visibility, VisibilityOff, KeyboardArrowUp } from '@mui/icons-material';

// Skip to main content link
export const SkipToMain = ({ targetId = 'main-content' }) => (
  <Box
    component="a"
    href={`#${targetId}`}
    sx={{
      position: 'absolute',
      top: -40,
      left: 8,
      zIndex: 10000,
      backgroundColor: 'primary.main',
      color: 'primary.contrastText',
      padding: '8px 16px',
      textDecoration: 'none',
      borderRadius: 1,
      '&:focus': {
        top: 8
      }
    }}
  >
    Skip to main content
  </Box>
);

// Screen reader only text
export const ScreenReaderOnly = ({ children }) => (
  <Box
    component="span"
    sx={{
      position: 'absolute',
      width: 1,
      height: 1,
      padding: 0,
      margin: -1,
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border: 0
    }}
  >
    {children}
  </Box>
);

// Focus trap for modals
export const FocusTrap = ({ children, enabled = true }) => {
  const trapRef = React.useRef(null);

  React.useEffect(() => {
    if (!enabled || !trapRef.current) return;

    const focusableElements = trapRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    trapRef.current.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      trapRef.current?.removeEventListener('keydown', handleTabKey);
    };
  }, [enabled]);

  return (
    <div ref={trapRef} tabIndex={-1}>
      {children}
    </div>
  );
};

// Announcement region for screen readers
export const LiveRegion = ({ 
  children, 
  politeness = 'polite',
  atomic = false 
}) => (
  <div
    role="status"
    aria-live={politeness}
    aria-atomic={atomic}
    style={{
      position: 'absolute',
      left: '-10000px',
      width: '1px',
      height: '1px',
      overflow: 'hidden'
    }}
  >
    {children}
  </div>
);

// High contrast mode detector
export const useHighContrast = () => {
  const [isHighContrast, setIsHighContrast] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(mediaQuery.matches);

    const handleChange = (e) => setIsHighContrast(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isHighContrast;
};

// Reduced motion detector
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

// Accessible button with proper ARIA attributes
export const AccessibleButton = ({
  children,
  onClick,
  disabled = false,
  loading = false,
  ariaLabel,
  ariaDescribedBy,
  variant = 'contained',
  ...props
}) => (
  <Button
    onClick={onClick}
    disabled={disabled || loading}
    aria-label={ariaLabel}
    aria-describedby={ariaDescribedBy}
    aria-busy={loading}
    variant={variant}
    {...props}
  >
    {children}
    {loading && <ScreenReaderOnly>Loading...</ScreenReaderOnly>}
  </Button>
);

// Back to top button
export const BackToTop = ({ threshold = 300 }) => {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.pageYOffset > threshold);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) return null;

  return (
    <Button
      onClick={scrollToTop}
      variant="contained"
      color="primary"
      aria-label="Back to top"
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 1000,
        minWidth: 56,
        height: 56,
        borderRadius: '50%'
      }}
    >
      <KeyboardArrowUp />
    </Button>
  );
};

const AccessibilityHelper = {
  SkipToMain,
  ScreenReaderOnly,
  FocusTrap,
  LiveRegion,
  AccessibleButton,
  BackToTop,
  useHighContrast,
  useReducedMotion
};

export default AccessibilityHelper;