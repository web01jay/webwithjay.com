import api from './api';

const dashboardService = {
  // Get dashboard statistics
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  // Get recent invoices
  getRecentInvoices: async (limit = 10) => {
    const response = await api.get('/dashboard/recent-invoices', {
      params: { limit }
    });
    return response.data;
  },

  // Get top clients by revenue
  getTopClients: async (limit = 10, period = 'all') => {
    const response = await api.get('/dashboard/top-clients', {
      params: { limit, period }
    });
    return response.data;
  },

  // Get revenue trends (monthly data for the last 12 months)
  getRevenueTrends: async (months = 12) => {
    const response = await api.get('/dashboard/revenue-trends', {
      params: { months }
    });
    return response.data;
  },

  // Get invoice status distribution
  getInvoiceStatusDistribution: async () => {
    const response = await api.get('/dashboard/invoice-status');
    return response.data;
  },

  // Clear dashboard cache (admin function)
  clearCache: async () => {
    const response = await api.post('/dashboard/clear-cache');
    return response.data;
  },

  // Get cache statistics
  getCacheStats: async () => {
    const response = await api.get('/dashboard/cache-stats');
    return response.data;
  }
};

export default dashboardService;