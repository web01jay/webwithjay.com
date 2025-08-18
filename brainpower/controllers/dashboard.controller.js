// Models
const Invoice = require('../models/invoice.model');
const Client = require('../models/client.model');
const Product = require('../models/product.model');
const mongoose = require('mongoose');

// Common response handler
const responseHandler = require('../middleware/responseHandler');

// Enhanced cache for frequently accessed data with TTL and size limits
class DashboardCache {
    constructor(maxSize = 100, defaultTTL = 5 * 60 * 1000) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.defaultTTL = defaultTTL;
        this.hitCount = 0;
        this.missCount = 0;
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) {
            this.missCount++;
            return null;
        }

        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            this.missCount++;
            return null;
        }

        this.hitCount++;
        return item.data;
    }

    set(key, data, ttl = this.defaultTTL) {
        // Remove oldest entries if cache is full
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            data,
            expiry: Date.now() + ttl,
            timestamp: Date.now()
        });
    }

    clear() {
        this.cache.clear();
        this.hitCount = 0;
        this.missCount = 0;
    }

    getStats() {
        const total = this.hitCount + this.missCount;
        return {
            size: this.cache.size,
            hitRate: total > 0 ? (this.hitCount / total * 100).toFixed(2) + '%' : '0%',
            hits: this.hitCount,
            misses: this.missCount
        };
    }
}

const dashboardCache = new DashboardCache();

// Helper function to get cached data or execute query with different TTL options
const getCachedData = async (key, queryFunction, ttl) => {
    const cached = dashboardCache.get(key);
    if (cached) {
        return cached;
    }
    
    const data = await queryFunction();
    dashboardCache.set(key, data, ttl);
    return data;
};

// Get dashboard summary statistics
const getDashboardStats = async (req, res) => {
    try {
        const stats = await getCachedData('dashboard-stats', async () => {
            // Get current date for filtering
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfYear = new Date(now.getFullYear(), 0, 1);

            // Parallel execution of all statistics queries
            const [
                totalClients,
                totalProducts,
                totalInvoices,
                monthlyInvoices,
                yearlyInvoices,
                totalRevenue,
                monthlyRevenue,
                yearlyRevenue,
                pendingInvoices,
                overdueInvoices,
                paidInvoices,
                averageInvoiceValue
            ] = await Promise.all([
                // Basic counts
                Client.countDocuments({ isActive: true }),
                Product.countDocuments({ isActive: true }),
                Invoice.countDocuments(),
                
                // Monthly and yearly invoice counts
                Invoice.countDocuments({ 
                    invoiceDate: { $gte: startOfMonth } 
                }),
                Invoice.countDocuments({ 
                    invoiceDate: { $gte: startOfYear } 
                }),
                
                // Revenue calculations
                Invoice.aggregate([
                    { $match: { status: 'paid' } },
                    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
                ]).then(result => result[0]?.total || 0),
                
                Invoice.aggregate([
                    { 
                        $match: { 
                            status: 'paid',
                            invoiceDate: { $gte: startOfMonth }
                        } 
                    },
                    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
                ]).then(result => result[0]?.total || 0),
                
                Invoice.aggregate([
                    { 
                        $match: { 
                            status: 'paid',
                            invoiceDate: { $gte: startOfYear }
                        } 
                    },
                    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
                ]).then(result => result[0]?.total || 0),
                
                // Invoice status counts
                Invoice.countDocuments({ status: { $in: ['draft', 'sent'] } }),
                Invoice.countDocuments({ 
                    status: { $in: ['sent', 'draft'] },
                    dueDate: { $lt: now }
                }),
                Invoice.countDocuments({ status: 'paid' }),
                
                // Average invoice value
                Invoice.aggregate([
                    { $group: { _id: null, average: { $avg: '$totalAmount' } } }
                ]).then(result => result[0]?.average || 0)
            ]);

            return {
                overview: {
                    totalClients,
                    totalProducts,
                    totalInvoices,
                    totalRevenue: Math.round(totalRevenue * 100) / 100
                },
                invoices: {
                    total: totalInvoices,
                    monthly: monthlyInvoices,
                    yearly: yearlyInvoices,
                    pending: pendingInvoices,
                    overdue: overdueInvoices,
                    paid: paidInvoices,
                    averageValue: Math.round(averageInvoiceValue * 100) / 100
                },
                revenue: {
                    total: Math.round(totalRevenue * 100) / 100,
                    monthly: Math.round(monthlyRevenue * 100) / 100,
                    yearly: Math.round(yearlyRevenue * 100) / 100
                }
            };
        });

        return responseHandler(res, true, 200, 'Dashboard statistics retrieved successfully', stats);
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return responseHandler(res, false, 500, 'Failed to fetch dashboard statistics');
    }
};

// Get recent invoices for dashboard
const getRecentInvoices = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        
        const recentInvoices = await getCachedData(`recent-invoices-${limit}`, async () => {
            return await Invoice.find()
                .populate('clientId', 'name email')
                .sort({ createdAt: -1 })
                .limit(parseInt(limit))
                .select('invoiceNumber clientId invoiceDate dueDate status totalAmount createdAt')
                .lean();
        });

        return responseHandler(res, true, 200, 'Recent invoices retrieved successfully', recentInvoices);
    } catch (error) {
        console.error('Error fetching recent invoices:', error);
        return responseHandler(res, false, 500, 'Failed to fetch recent invoices');
    }
};

// Get revenue trends for analytics
const getRevenueTrends = async (req, res) => {
    try {
        const { months = 12 } = req.query;
        
        const revenueTrends = await getCachedData(`revenue-trends-${months}`, async () => {
            const monthsBack = parseInt(months);
            const endDate = new Date();
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - monthsBack);

            const pipeline = [
                {
                    $match: {
                        status: 'paid',
                        invoiceDate: { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $group: {
                        _id: {
                            year: { $year: '$invoiceDate' },
                            month: { $month: '$invoiceDate' }
                        },
                        revenue: { $sum: '$totalAmount' },
                        invoiceCount: { $sum: 1 }
                    }
                },
                {
                    $sort: { '_id.year': 1, '_id.month': 1 }
                },
                {
                    $project: {
                        _id: 0,
                        month: {
                            $concat: [
                                { $toString: '$_id.year' },
                                '-',
                                { $cond: [
                                    { $lt: ['$_id.month', 10] },
                                    { $concat: ['0', { $toString: '$_id.month' }] },
                                    { $toString: '$_id.month' }
                                ]}
                            ]
                        },
                        revenue: { $round: ['$revenue', 2] },
                        invoiceCount: 1
                    }
                }
            ];

            return await Invoice.aggregate(pipeline);
        }, 10 * 60 * 1000); // Cache for 10 minutes

        return responseHandler(res, true, 200, 'Revenue trends retrieved successfully', revenueTrends);
    } catch (error) {
        console.error('Error fetching revenue trends:', error);
        return responseHandler(res, false, 500, 'Failed to fetch revenue trends');
    }
};

// Get invoice status distribution
const getInvoiceStatusDistribution = async (req, res) => {
    try {
        const statusDistribution = await getCachedData('invoice-status-distribution', async () => {
            const pipeline = [
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                        totalAmount: { $sum: '$totalAmount' }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        status: '$_id',
                        count: 1,
                        totalAmount: { $round: ['$totalAmount', 2] }
                    }
                }
            ];

            return await Invoice.aggregate(pipeline);
        }, 5 * 60 * 1000); // Cache for 5 minutes

        return responseHandler(res, true, 200, 'Invoice status distribution retrieved successfully', statusDistribution);
    } catch (error) {
        console.error('Error fetching invoice status distribution:', error);
        return responseHandler(res, false, 500, 'Failed to fetch invoice status distribution');
    }
};

// Get top clients by revenue for analytics
const getTopClients = async (req, res) => {
    try {
        const { limit = 10, period = 'all' } = req.query;
        
        const topClients = await getCachedData(`top-clients-${limit}-${period}`, async () => {
            // Build date filter based on period
            let dateFilter = {};
            const now = new Date();
            
            switch (period) {
                case 'month':
                    dateFilter = { 
                        invoiceDate: { 
                            $gte: new Date(now.getFullYear(), now.getMonth(), 1) 
                        } 
                    };
                    break;
                case 'year':
                    dateFilter = { 
                        invoiceDate: { 
                            $gte: new Date(now.getFullYear(), 0, 1) 
                        } 
                    };
                    break;
                case 'quarter':
                    const quarter = Math.floor(now.getMonth() / 3);
                    dateFilter = { 
                        invoiceDate: { 
                            $gte: new Date(now.getFullYear(), quarter * 3, 1) 
                        } 
                    };
                    break;
                default:
                    // 'all' - no date filter
                    break;
            }

            const pipeline = [
                {
                    $match: {
                        status: 'paid',
                        ...dateFilter
                    }
                },
                {
                    $group: {
                        _id: '$clientId',
                        totalRevenue: { $sum: '$totalAmount' },
                        invoiceCount: { $sum: 1 },
                        averageInvoiceValue: { $avg: '$totalAmount' },
                        lastInvoiceDate: { $max: '$invoiceDate' }
                    }
                },
                {
                    $lookup: {
                        from: 'clients',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'client'
                    }
                },
                {
                    $unwind: '$client'
                },
                {
                    $project: {
                        _id: 1,
                        clientName: '$client.name',
                        clientEmail: '$client.email',
                        totalRevenue: { $round: ['$totalRevenue', 2] },
                        invoiceCount: 1,
                        averageInvoiceValue: { $round: ['$averageInvoiceValue', 2] },
                        lastInvoiceDate: 1
                    }
                },
                {
                    $sort: { totalRevenue: -1 }
                },
                {
                    $limit: parseInt(limit)
                }
            ];

            return await Invoice.aggregate(pipeline);
        });

        return responseHandler(res, true, 200, 'Top clients retrieved successfully', topClients);
    } catch (error) {
        console.error('Error fetching top clients:', error);
        return responseHandler(res, false, 500, 'Failed to fetch top clients');
    }
};

// Clear cache endpoint for admin use
const clearDashboardCache = async (req, res) => {
    try {
        const stats = dashboardCache.getStats();
        dashboardCache.clear();
        
        return responseHandler(res, true, 200, 'Cache cleared successfully', { 
            message: 'Dashboard cache cleared successfully',
            previousStats: stats
        });
    } catch (error) {
        console.error('Error clearing dashboard cache:', error);
        return responseHandler(res, false, 500, 'Failed to clear cache');
    }
};

// Get cache statistics
const getCacheStats = async (req, res) => {
    try {
        const stats = dashboardCache.getStats();
        return responseHandler(res, true, 200, 'Cache statistics retrieved successfully', stats);
    } catch (error) {
        console.error('Error fetching cache stats:', error);
        return responseHandler(res, false, 500, 'Failed to fetch cache statistics');
    }
};

module.exports = {
    getDashboardStats,
    getRecentInvoices,
    getTopClients,
    getRevenueTrends,
    getInvoiceStatusDistribution,
    clearDashboardCache,
    getCacheStats
};