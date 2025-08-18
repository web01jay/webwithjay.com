const express = require('express');
const router = express.Router();

// Validations
const { 
    createInvoiceSchema,
    updateInvoiceSchema,
    getInvoicesQuerySchema,
    validateInvoiceId,
    updateInvoiceStatusSchema,
    bulkUpdateInvoicesSchema
} = require('../validations/invoice.validations');

// Controllers
const { 
    getInvoicesController,
    getInvoiceByIdController,
    createInvoiceController,
    updateInvoiceController,
    deleteInvoiceController,
    updateInvoiceStatusController,
    getInvoiceStatsController,
    bulkUpdateInvoicesController,
    generateInvoicePDFController
} = require('../controllers/invoice.controller');

// Routes

// GET /api/invoices - Get all invoices with pagination and filtering
router.get('/', getInvoicesQuerySchema, getInvoicesController);

// GET /api/invoices/stats - Get invoice statistics and summary
router.get('/stats', getInvoiceStatsController);

// GET /api/invoices/:id/pdf - Generate and download invoice PDF
router.get('/:id/pdf', validateInvoiceId, generateInvoicePDFController);

// GET /api/invoices/:id - Get single invoice by ID with populated client and product data
router.get('/:id', validateInvoiceId, getInvoiceByIdController);

// POST /api/invoices - Create new invoice with tax calculation
router.post('/', createInvoiceSchema, createInvoiceController);

// PUT /api/invoices/:id - Update invoice
router.put('/:id', validateInvoiceId, updateInvoiceSchema, updateInvoiceController);

// PATCH /api/invoices/:id/status - Update invoice status
router.patch('/:id/status', validateInvoiceId, updateInvoiceStatusSchema, updateInvoiceStatusController);

// DELETE /api/invoices/:id - Delete invoice
router.delete('/:id', validateInvoiceId, deleteInvoiceController);

// POST /api/invoices/bulk-update - Bulk update invoices
router.post('/bulk-update', bulkUpdateInvoicesSchema, bulkUpdateInvoicesController);

module.exports = router;