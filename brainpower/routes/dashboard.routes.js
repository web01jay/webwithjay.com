const express = require('express');
const router = express.Router();

// Controllers
const { 
    getDashboardStats,
    getRecentInvoices,
    getTopClients,
    getRevenueTrends,
    getInvoiceStatusDistribution,
    clearDashboardCache,
    getCacheStats
} = require('../controllers/dashboard.controller');

// Middleware
const apiAccess = require('../middleware/apiAccess');

// Apply API access middleware to all dashboard routes
// router.use(apiAccess);

// Routes

// GET /api/dashboard/stats - Get dashboard summary statistics
router.get('/stats', getDashboardStats);

// GET /api/dashboard/recent-invoices - Get recent invoices for dashboard
router.get('/recent-invoices', getRecentInvoices);

// GET /api/dashboard/top-clients - Get top clients by revenue
router.get('/top-clients', getTopClients);

// GET /api/dashboard/revenue-trends - Get revenue trends for analytics
router.get('/revenue-trends', getRevenueTrends);

// GET /api/dashboard/invoice-status - Get invoice status distribution
router.get('/invoice-status', getInvoiceStatusDistribution);

// POST /api/dashboard/clear-cache - Clear dashboard cache (admin only)
router.post('/clear-cache', clearDashboardCache);

// GET /api/dashboard/cache-stats - Get cache statistics
router.get('/cache-stats', getCacheStats);

module.exports = router;