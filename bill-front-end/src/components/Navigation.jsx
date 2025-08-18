import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  Inventory as ProductsIcon,
  People as ClientsIcon,
  Receipt as InvoicesIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Login as LoginIcon,
  PersonAdd as SignupIcon,
  Logout as LogoutIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { SkipToMain } from './AccessibilityHelper';
import { useAuth } from '../hooks/useAuth';
import { useAuthPreloader } from './LazyAuthComponents';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const { handleLoginHover, handleSignupHover } = useAuthPreloader();

  // Protected menu items - only shown to authenticated users
  const protectedMenuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { label: 'Products', path: '/products', icon: <ProductsIcon /> },
    { label: 'Clients', path: '/clients', icon: <ClientsIcon /> },
    { label: 'Invoices', path: '/invoices', icon: <InvoicesIcon /> },
  ];

  // Public menu items - shown to unauthenticated users
  const publicMenuItems = [
    { label: 'Home', path: '/', icon: <HomeIcon /> },
    { label: 'Login', path: '/login', icon: <LoginIcon /> },
    { label: 'Sign Up', path: '/signup', icon: <SignupIcon /> },
  ];

  // Get appropriate menu items based on authentication status
  const menuItems = isAuthenticated ? protectedMenuItems : publicMenuItems;

  const handleMenuItemClick = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const MobileDrawer = () => (
    <Drawer
      anchor="left"
      open={mobileMenuOpen}
      onClose={() => setMobileMenuOpen(false)}
      sx={{
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="div">
          {isAuthenticated ? `Welcome, ${user?.name || user?.email || 'User'}` : 'Menu'}
        </Typography>
        <IconButton 
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close menu"
        >
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              onClick={() => handleMenuItemClick(item.path)}
              onMouseEnter={() => {
                // Preload auth components on hover
                if (item.path === '/login') {
                  handleLoginHover();
                } else if (item.path === '/signup') {
                  handleSignupHover();
                }
              }}
              selected={location.pathname === item.path}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.light,
                  color: theme.palette.primary.contrastText,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.main,
                  },
                },
              }}
            >
              <ListItemIcon 
                sx={{ 
                  color: location.pathname === item.path ? 'inherit' : 'inherit' 
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
        {isAuthenticated && (
          <>
            <Divider />
            <ListItem disablePadding>
              <ListItemButton
                onClick={handleLogout}
                sx={{
                  color: theme.palette.error.main,
                  '&:hover': {
                    backgroundColor: theme.palette.error.light,
                    color: theme.palette.error.contrastText,
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'inherit' }}>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary="Logout" />
              </ListItemButton>
            </ListItem>
          </>
        )}
      </List>
    </Drawer>
  );

  return (
    <>
      <SkipToMain />
      <AppBar position="static">
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="Open menu"
              edge="start"
              onClick={toggleMobileMenu}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography 
            variant={isMobile ? "h6" : "h5"} 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontSize: isMobile ? '1.1rem' : '1.5rem'
            }}
          >
            {isMobile ? 'BMS' : 'Billing Management System'}
          </Typography>
          
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {isAuthenticated && user && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mr: 2, 
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '0.875rem'
                  }}
                >
                  Welcome, {user.name || user.email}
                </Typography>
              )}
              
              {menuItems.map((item) => (
                <Button
                  key={item.path}
                  color="inherit"
                  startIcon={item.icon}
                  onClick={() => handleMenuItemClick(item.path)}
                  onMouseEnter={() => {
                    // Preload auth components on hover
                    if (item.path === '/login') {
                      handleLoginHover();
                    } else if (item.path === '/signup') {
                      handleSignupHover();
                    }
                  }}
                  aria-current={location.pathname === item.path ? 'page' : undefined}
                  sx={{
                    backgroundColor: location.pathname === item.path ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&:focus': {
                      outline: '2px solid white',
                      outlineOffset: '2px',
                    },
                  }}
                >
                  {item.label}
                </Button>
              ))}
              
              {isAuthenticated && (
                <Button
                  color="inherit"
                  startIcon={<LogoutIcon />}
                  onClick={handleLogout}
                  sx={{
                    ml: 1,
                    color: theme.palette.error.light,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: theme.palette.error.main,
                    },
                    '&:focus': {
                      outline: '2px solid white',
                      outlineOffset: '2px',
                    },
                  }}
                >
                  Logout
                </Button>
              )}
            </Box>
          )}
        </Toolbar>
      </AppBar>
      
      {isMobile && <MobileDrawer />}
    </>
  );
};

export default Navigation;