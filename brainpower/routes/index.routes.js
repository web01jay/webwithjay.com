const express = require('express');
const { apiAccess } = require('../middleware/apiAccess');
const router = express.Router();

// Routes
const authRoutes = require('./auth.routes');
const productRoutes = require('./product.routes');
const clientRoutes = require('./client.routes');
const invoiceRoutes = require('./invoice.routes');
const dashboardRoutes = require('./dashboard.routes');
// const userRoutes = require('./');

router.use('/auth', apiAccess, authRoutes);
router.use('/products', apiAccess, productRoutes);
router.use('/clients', apiAccess, clientRoutes);
router.use('/invoices', apiAccess, invoiceRoutes);
router.use('/dashboard', apiAccess, dashboardRoutes);

module.exports = router;
