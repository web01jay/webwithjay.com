import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  TrendingUp,
  People,
  Receipt,
  Inventory,
  AttachMoney,
  Schedule,
  CheckCircle,
  Warning
} from '@mui/icons-material';
import { format } from 'date-fns';
import dashboardService from '../services/dashboardService';
import { 
  StatusBadge, 
  RevenueChart, 
  InvoiceStatusChart, 
  ClientPerformanceChart,
  LoadingState,
  LazyWrapper
} from '../components';
import useResponsive from '../hooks/useResponsive';
import usePerformanceMonitor from '../hooks/usePerformanceMonitor';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [topClients, setTopClients] = useState([]);
  const [revenueTrends, setRevenueTrends] = useState(null);
  const [invoiceStatusData, setInvoiceStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  
  const { isMobile, isTablet, getGridColumns, getCardSpacing } = useResponsive();
  const { measureAsync } = usePerformanceMonitor('Dashboard');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        await measureAsync(async () => {
          const [statsData, invoicesData, clientsData, trendsData, statusData] = await Promise.all([
            dashboardService.getStats(),
            dashboardService.getRecentInvoices(isMobile ? 3 : 5),
            dashboardService.getTopClients(isMobile ? 3 : 5),
            dashboardService.getRevenueTrends(),
            dashboardService.getInvoiceStatusDistribution()
          ]);

          setStats(statsData.data);
          setRecentInvoices(invoicesData.data);
          setTopClients(clientsData.data);
          setRevenueTrends(trendsData.data);
          setInvoiceStatusData(statusData.data);
        }, 'Dashboard data fetch');
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isMobile, measureAsync]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const StatCard = ({ title, value, icon: Icon, color = 'primary', subtitle }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" color={color}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}.light`, width: 56, height: 56 }}>
            <Icon sx={{ color: `${color}.main` }} />
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return <LoadingState.CardSkeleton count={getGridColumns(2, 4, 4)} height={150} />;
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Welcome to your Billing Management System
      </Typography>

      {/* Summary Statistics Cards */}
      <Grid container spacing={getCardSpacing()} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Clients"
            value={stats?.overview?.totalClients || 0}
            icon={People}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Products"
            value={stats?.overview?.totalProducts || 0}
            icon={Inventory}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Invoices"
            value={stats?.overview?.totalInvoices || 0}
            icon={Receipt}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats?.overview?.totalRevenue || 0)}
            icon={AttachMoney}
            color="success"
          />
        </Grid>
      </Grid>

      {/* Invoice Statistics */}
      <Grid container spacing={getCardSpacing()} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Paid Invoices"
            value={stats?.invoices?.paid || 0}
            icon={CheckCircle}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Invoices"
            value={stats?.invoices?.pending || 0}
            icon={Schedule}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Overdue Invoices"
            value={stats?.invoices?.overdue || 0}
            icon={Warning}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Average Invoice"
            value={formatCurrency(stats?.invoices?.averageValue || 0)}
            icon={TrendingUp}
            color="info"
          />
        </Grid>
      </Grid>

      {/* Charts and Analytics Section */}
      <Box sx={{ mb: 4 }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ mb: 3 }}
        >
          <Tab label="Overview" />
          <Tab label="Analytics" />
        </Tabs>

        {tabValue === 0 && (
          <Grid container spacing={getCardSpacing()}>
            {/* Recent Invoices */}
            <Grid item xs={12} lg={isMobile ? 12 : 7}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Invoices
                  </Typography>
                  <TableContainer>
                    <Table size={isMobile ? 'small' : 'medium'}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Invoice #</TableCell>
                          {!isMobile && <TableCell>Client</TableCell>}
                          <TableCell>Date</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {recentInvoices.length > 0 ? (
                          recentInvoices.map((invoice) => (
                            <TableRow key={invoice._id}>
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                  {invoice.invoiceNumber}
                                </Typography>
                                {isMobile && (
                                  <Typography variant="caption" color="textSecondary" display="block">
                                    {invoice.clientId?.name || 'Unknown Client'}
                                  </Typography>
                                )}
                              </TableCell>
                              {!isMobile && (
                                <TableCell>
                                  <Box>
                                    <Typography variant="body2">
                                      {invoice.clientId?.name || 'Unknown Client'}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      {invoice.clientId?.email}
                                    </Typography>
                                  </Box>
                                </TableCell>
                              )}
                              <TableCell>
                                <Typography variant="body2">
                                  {format(new Date(invoice.invoiceDate), isMobile ? 'MMM dd' : 'MMM dd, yyyy')}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                  {formatCurrency(invoice.totalAmount)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={invoice.status} />
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={isMobile ? 4 : 5} align="center">
                              <Typography variant="body2" color="textSecondary">
                                No recent invoices found
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Top Clients */}
            <Grid item xs={12} lg={isMobile ? 12 : 5}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Top Clients by Revenue
                  </Typography>
                  <List dense={isMobile}>
                    {topClients.length > 0 ? (
                      topClients.map((client, index) => (
                        <React.Fragment key={client._id}>
                          <ListItem>
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: 'primary.light', width: isMobile ? 32 : 40, height: isMobile ? 32 : 40 }}>
                                {client.clientName?.charAt(0) || '?'}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                  <Typography variant={isMobile ? "body2" : "body1"}>
                                    {client.clientName}
                                  </Typography>
                                  <Typography variant={isMobile ? "body2" : "h6"} color="primary" fontWeight="bold">
                                    {formatCurrency(client.totalRevenue)}
                                  </Typography>
                                </Box>
                              }
                              secondary={
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                  <Typography variant="caption" color="textSecondary">
                                    {client.invoiceCount} invoice{client.invoiceCount !== 1 ? 's' : ''}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    Avg: {formatCurrency(client.averageInvoiceValue)}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                          {index < topClients.length - 1 && <Divider />}
                        </React.Fragment>
                      ))
                    ) : (
                      <ListItem>
                        <ListItemText
                          primary={
                            <Typography variant="body2" color="textSecondary" align="center">
                              No client data available
                            </Typography>
                          }
                        />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {tabValue === 1 && (
          <Grid container spacing={getCardSpacing()}>
            {/* Revenue Trends Chart */}
            <Grid item xs={12} lg={isMobile ? 12 : 8}>
              <LazyWrapper minHeight="300px">
                <RevenueChart 
                  data={revenueTrends} 
                  title="Revenue Trends (Last 12 Months)" 
                />
              </LazyWrapper>
            </Grid>

            {/* Invoice Status Distribution */}
            <Grid item xs={12} lg={isMobile ? 12 : 4}>
              <LazyWrapper minHeight="300px">
                <InvoiceStatusChart 
                  data={invoiceStatusData} 
                  title="Invoice Status Distribution" 
                />
              </LazyWrapper>
            </Grid>

            {/* Client Performance Chart */}
            <Grid item xs={12}>
              <LazyWrapper minHeight="400px">
                <ClientPerformanceChart 
                  data={topClients} 
                  title="Top 5 Clients Performance" 
                />
              </LazyWrapper>
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default Dashboard;