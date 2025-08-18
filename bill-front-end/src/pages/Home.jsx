import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Paper,
  Stack
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Login as LoginIcon,
  PersonAdd as SignupIcon,
  Business as BusinessIcon,
  Receipt as InvoiceIcon,
  Inventory as ProductIcon
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';

const Home = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <Container component="main" maxWidth="lg">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minHeight: '60vh',
            justifyContent: 'center'
          }}
        >
          <Typography variant="h6" color="text.secondary">
            Loading...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="lg">
      <Box
        sx={{
          marginTop: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Hero Section */}
        <Paper 
          elevation={0} 
          sx={{ 
            padding: 6, 
            width: '100%', 
            textAlign: 'center',
            backgroundColor: 'transparent'
          }}
        >
          <Typography 
            component="h1" 
            variant="h2" 
            gutterBottom
            sx={{ 
              fontWeight: 'bold',
              color: 'primary.main',
              mb: 2
            }}
          >
            Welcome to BillPower
          </Typography>
          
          <Typography 
            variant="h5" 
            color="text.secondary" 
            paragraph
            sx={{ mb: 4, maxWidth: '800px', mx: 'auto' }}
          >
            Your comprehensive billing and invoice management solution. 
            Streamline your business operations with powerful tools for client management, 
            invoicing, and product tracking.
          </Typography>

          {/* Authentication-based Call to Action */}
          {isAuthenticated ? (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Welcome back, {user?.name || user?.email}!
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<DashboardIcon />}
                onClick={handleGetStarted}
                sx={{ mt: 2, px: 4, py: 1.5 }}
              >
                Go to Dashboard
              </Button>
            </Box>
          ) : (
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 4 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<LoginIcon />}
                component={Link}
                to="/login"
                sx={{ px: 4, py: 1.5 }}
              >
                Sign In
              </Button>
              <Button
                variant="outlined"
                size="large"
                startIcon={<SignupIcon />}
                component={Link}
                to="/signup"
                sx={{ px: 4, py: 1.5 }}
              >
                Sign Up
              </Button>
            </Stack>
          )}
        </Paper>

        {/* Features Section */}
        <Box sx={{ mt: 6, width: '100%' }}>
          <Typography 
            variant="h4" 
            component="h2" 
            align="center" 
            gutterBottom
            sx={{ mb: 4, fontWeight: 'bold' }}
          >
            Powerful Features
          </Typography>
          
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card 
                elevation={2}
                sx={{ 
                  height: '100%',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <BusinessIcon 
                    sx={{ 
                      fontSize: 48, 
                      color: 'primary.main', 
                      mb: 2 
                    }} 
                  />
                  <Typography variant="h6" component="h3" gutterBottom>
                    Client Management
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Organize and manage your client information with ease. 
                    Keep track of contact details, billing preferences, and project history.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card 
                elevation={2}
                sx={{ 
                  height: '100%',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <InvoiceIcon 
                    sx={{ 
                      fontSize: 48, 
                      color: 'primary.main', 
                      mb: 2 
                    }} 
                  />
                  <Typography variant="h6" component="h3" gutterBottom>
                    Invoice Generation
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Create professional invoices quickly and efficiently. 
                    Track payment status and send automated reminders.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card 
                elevation={2}
                sx={{ 
                  height: '100%',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <ProductIcon 
                    sx={{ 
                      fontSize: 48, 
                      color: 'primary.main', 
                      mb: 2 
                    }} 
                  />
                  <Typography variant="h6" component="h3" gutterBottom>
                    Product Catalog
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Maintain a comprehensive catalog of your products and services. 
                    Set pricing, track inventory, and manage product details.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Navigation Section for Authenticated Users */}
        {isAuthenticated && (
          <Box sx={{ mt: 6, width: '100%' }}>
            <Typography 
              variant="h5" 
              component="h2" 
              align="center" 
              gutterBottom
              sx={{ mb: 3 }}
            >
              Quick Access
            </Typography>
            
            <Grid container spacing={3} justifyContent="center">
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  startIcon={<DashboardIcon />}
                  component={Link}
                  to="/dashboard"
                  sx={{ py: 2 }}
                >
                  Dashboard
                </Button>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  startIcon={<BusinessIcon />}
                  component={Link}
                  to="/clients"
                  sx={{ py: 2 }}
                >
                  Clients
                </Button>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  startIcon={<InvoiceIcon />}
                  component={Link}
                  to="/invoices"
                  sx={{ py: 2 }}
                >
                  Invoices
                </Button>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  startIcon={<ProductIcon />}
                  component={Link}
                  to="/products"
                  sx={{ py: 2 }}
                >
                  Products
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Footer Section */}
        <Box 
          sx={{ 
            mt: 8, 
            mb: 4, 
            textAlign: 'center',
            borderTop: 1,
            borderColor: 'divider',
            pt: 4,
            width: '100%'
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © 2024 BillPower. Streamline your business operations with confidence.
          </Typography>
          
          {!isAuthenticated && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              <Link 
                to="/login" 
                style={{ 
                  textDecoration: 'none',
                  color: 'inherit',
                  fontWeight: 'bold'
                }}
              >
                Sign in
              </Link>
              {' or '}
              <Link 
                to="/signup" 
                style={{ 
                  textDecoration: 'none',
                  color: 'inherit',
                  fontWeight: 'bold'
                }}
              >
                create an account
              </Link>
              {' to get started.'}
            </Typography>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default Home;