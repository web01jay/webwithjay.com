// Models
const Invoice = require('../models/invoice.model');
const Client = require('../models/client.model');
const Product = require('../models/product.model');
const mongoose = require('mongoose');

// Common response handler
const errorHandler = require('../middleware/errorHandler');
const responseHandler = require('../middleware/responseHandler');

// PDF generation utility
const { generateInvoicePDF } = require('../utils/pdfGenerator');

// Get all invoices with pagination and filtering
const getInvoicesController = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            clientId = '',
            status = '',
            startDate,
            endDate,
            minAmount,
            maxAmount,
            sortBy = 'invoiceDate',
            sortOrder = 'desc'
        } = req.query;

        // Build filter object
        const filter = {};

        // Search functionality - search in invoice number and client name
        if (search) {
            // First, find clients matching the search term
            const matchingClients = await Client.find({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            }).select('_id');

            const clientIds = matchingClients.map(client => client._id);

            filter.$or = [
                { invoiceNumber: { $regex: search, $options: 'i' } },
                { clientId: { $in: clientIds } }
            ];
        }

        // Filter by specific client
        if (clientId) {
            filter.clientId = clientId;
        }

        // Filter by status
        if (status) {
            filter.status = status;
        }

        // Date range filtering
        if (startDate || endDate) {
            filter.invoiceDate = {};
            if (startDate) {
                filter.invoiceDate.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.invoiceDate.$lte = new Date(endDate);
            }
        }

        // Amount range filtering
        if (minAmount || maxAmount) {
            filter.totalAmount = {};
            if (minAmount) {
                filter.totalAmount.$gte = parseFloat(minAmount);
            }
            if (maxAmount) {
                filter.totalAmount.$lte = parseFloat(maxAmount);
            }
        }

        // Build sort object
        const sortObj = {};
        sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get invoices with pagination and populate client and product details
        const invoices = await Invoice.find(filter)
            .populate('clientId', 'name email phone address')
            .populate('items.productId', 'name category basePrice')
            .sort(sortObj)
            .skip(skip)
            .limit(parseInt(limit))
            .select('-__v');

        // Get total count for pagination
        const totalInvoices = await Invoice.countDocuments(filter);
        const totalPages = Math.ceil(totalInvoices / parseInt(limit));

        const paginationData = {
            invoices,
            totalCount: totalInvoices,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalInvoices,
                hasNextPage: parseInt(page) < totalPages,
                hasPrevPage: parseInt(page) > 1
            }
        };

        return responseHandler(res, true, 200, 'Invoices retrieved successfully', paginationData);
    } catch (error) {
        console.log("Error while getting invoices: ", error);
        return errorHandler(res)(error);
    }
};

// Get single invoice by ID with populated data
const getInvoiceByIdController = async (req, res) => {
    try {
        const { id } = req.params;

        const invoice = await Invoice.findById(id)
            .populate('clientId', 'name email phone gstNumber panNumber address')
            .populate('items.productId', 'name description category basePrice hsnCode')
            .select('-__v');

        if (!invoice) {
            return responseHandler(res, false, 404, 'Invoice not found', {});
        }

        return responseHandler(res, true, 200, 'Invoice retrieved successfully', { invoice });
    } catch (error) {
        console.log("Error while getting invoice: ", error);
        return errorHandler(res)(error);
    }
};

// Create new invoice with tax calculation
const createInvoiceController = async (req, res) => {
    try {
        const invoiceData = req.body;

        // Verify client exists
        const client = await Client.findById(invoiceData.clientId);
        if (!client) {
            return responseHandler(res, false, 404, 'Client not found', {});
        }

        // Verify all products exist
        const productIds = invoiceData.items.map(item => item.productId);
        const products = await Product.find({ _id: { $in: productIds } });

        if (products.length !== productIds.length) {
            return responseHandler(res, false, 404, 'One or more products not found', {});
        }

        // Determine tax type based on client location
        // For this implementation, we'll assume business is in a specific state
        // You can modify this logic based on your business requirements
        const businessState = 'Maharashtra'; // This should come from configuration
        const clientState = client.address?.state || '';

        // Auto-determine tax type if not provided
        if (!invoiceData.taxType) {
            invoiceData.taxType = clientState.toLowerCase() === businessState.toLowerCase() ? 'in-state' : 'out-state';
        }

        const newInvoice = new Invoice(invoiceData);
        const savedInvoice = await newInvoice.save();

        // Populate the saved invoice with client and product details
        const populatedInvoice = await Invoice.findById(savedInvoice._id)
            .populate('clientId', 'name email phone address')
            .populate('items.productId', 'name category basePrice');

        return responseHandler(res, true, 201, 'Invoice created successfully', { invoice: populatedInvoice });
    } catch (error) {
        console.log("Error while creating invoice: ", error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = {};
            Object.keys(error.errors).forEach(key => {
                validationErrors[key] = error.errors[key].message;
            });
            return responseHandler(res, false, 400, 'Validation failed', {}, validationErrors);
        }

        // Handle duplicate invoice number error
        if (error.code === 11000 && error.keyPattern?.invoiceNumber) {
            return responseHandler(res, false, 409, 'Invoice number already exists', {});
        }

        return errorHandler(res)(error);
    }
};

// Update invoice with recalculation
const updateInvoiceController = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Check if invoice exists
        const existingInvoice = await Invoice.findById(id);
        if (!existingInvoice) {
            return responseHandler(res, false, 404, 'Invoice not found', {});
        }

        // If client is being updated, verify the new client exists
        if (updateData.clientId && updateData.clientId !== existingInvoice.clientId.toString()) {
            const client = await Client.findById(updateData.clientId);
            if (!client) {
                return responseHandler(res, false, 404, 'Client not found', {});
            }

            // Auto-determine tax type based on new client location
            const businessState = 'Maharashtra'; // This should come from configuration
            const clientState = client.address?.state || '';

            if (!updateData.taxType) {
                updateData.taxType = clientState.toLowerCase() === businessState.toLowerCase() ? 'in-state' : 'out-state';
            }
        }

        // If items are being updated, verify all products exist
        if (updateData.items) {
            const productIds = updateData.items.map(item => item.productId);
            const products = await Product.find({ _id: { $in: productIds } });

            if (products.length !== productIds.length) {
                return responseHandler(res, false, 404, 'One or more products not found', {});
            }
        }

        const updatedInvoice = await Invoice.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        )
            .populate('clientId', 'name email phone address')
            .populate('items.productId', 'name category basePrice')
            .select('-__v');

        return responseHandler(res, true, 200, 'Invoice updated successfully', { invoice: updatedInvoice });
    } catch (error) {
        console.log("Error while updating invoice: ", error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = {};
            Object.keys(error.errors).forEach(key => {
                validationErrors[key] = error.errors[key].message;
            });
            return responseHandler(res, false, 400, 'Validation failed', {}, validationErrors);
        }

        // Handle duplicate invoice number error
        if (error.code === 11000 && error.keyPattern?.invoiceNumber) {
            return responseHandler(res, false, 409, 'Invoice number already exists', {});
        }

        return errorHandler(res)(error);
    }
};

// Delete invoice
const deleteInvoiceController = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if invoice exists
        const invoice = await Invoice.findById(id);
        if (!invoice) {
            return responseHandler(res, false, 404, 'Invoice not found', {});
        }

        // Additional business logic: prevent deletion of paid invoices
        if (invoice.status === 'paid') {
            return responseHandler(
                res,
                false,
                422,
                'Cannot delete paid invoices. Please contact administrator if deletion is necessary.',
                {}
            );
        }

        await Invoice.findByIdAndDelete(id);

        return responseHandler(res, true, 200, 'Invoice deleted successfully', {});
    } catch (error) {
        console.log("Error while deleting invoice: ", error);
        return errorHandler(res)(error);
    }
};

// Update invoice status
const updateInvoiceStatusController = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Check if invoice exists
        const invoice = await Invoice.findById(id);
        if (!invoice) {
            return responseHandler(res, false, 404, 'Invoice not found', {});
        }

        // Business logic for status transitions
        const validTransitions = {
            'draft': ['sent', 'paid'],
            'sent': ['paid', 'overdue'],
            'overdue': ['paid'],
            'paid': [] // Paid invoices cannot be changed
        };

        if (!validTransitions[invoice.status].includes(status)) {
            return responseHandler(
                res,
                false,
                422,
                `Cannot change status from ${invoice.status} to ${status}`,
                {}
            );
        }

        const updatedInvoice = await Invoice.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        )
            .populate('clientId', 'name email')
            .select('-__v');

        return responseHandler(res, true, 200, 'Invoice status updated successfully', { invoice: updatedInvoice });
    } catch (error) {
        console.log("Error while updating invoice status: ", error);
        return errorHandler(res)(error);
    }
};

// Get invoice statistics and summary
const getInvoiceStatsController = async (req, res) => {
    try {
        const { startDate, endDate, clientId } = req.query;

        // Build filter for date range and client
        const matchFilter = {};

        if (startDate || endDate) {
            matchFilter.invoiceDate = {};
            if (startDate) {
                matchFilter.invoiceDate.$gte = new Date(startDate);
            }
            if (endDate) {
                matchFilter.invoiceDate.$lte = new Date(endDate);
            }
        }

        if (clientId) {
            matchFilter.clientId = mongoose.Types.ObjectId(clientId);
        }

        // Aggregate statistics
        const stats = await Invoice.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: null,
                    totalInvoices: { $sum: 1 },
                    totalAmount: { $sum: '$totalAmount' },
                    totalTaxAmount: { $sum: '$totalTaxAmount' },
                    draftInvoices: {
                        $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
                    },
                    sentInvoices: {
                        $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] }
                    },
                    paidInvoices: {
                        $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
                    },
                    overdueInvoices: {
                        $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] }
                    },
                    paidAmount: {
                        $sum: {
                            $cond: [
                                { $eq: ['$status', 'paid'] },
                                '$totalAmount',
                                0
                            ]
                        }
                    },
                    pendingAmount: {
                        $sum: {
                            $cond: [
                                { $ne: ['$status', 'paid'] },
                                '$totalAmount',
                                0
                            ]
                        }
                    },
                    averageInvoiceAmount: { $avg: '$totalAmount' }
                }
            }
        ]);

        const summary = stats.length > 0 ? stats[0] : {
            totalInvoices: 0,
            totalAmount: 0,
            totalTaxAmount: 0,
            draftInvoices: 0,
            sentInvoices: 0,
            paidInvoices: 0,
            overdueInvoices: 0,
            paidAmount: 0,
            pendingAmount: 0,
            averageInvoiceAmount: 0
        };

        // Remove the _id field from aggregation result
        delete summary._id;

        return responseHandler(res, true, 200, 'Invoice statistics retrieved successfully', { stats: summary });
    } catch (error) {
        console.log("Error while getting invoice statistics: ", error);
        return errorHandler(res)(error);
    }
};

// Bulk update invoices
const bulkUpdateInvoicesController = async (req, res) => {
    try {
        const { invoiceIds, updates } = req.body;

        // Verify all invoices exist
        const invoices = await Invoice.find({ _id: { $in: invoiceIds } });
        if (invoices.length !== invoiceIds.length) {
            return responseHandler(res, false, 404, 'One or more invoices not found', {});
        }

        // Perform bulk update
        const result = await Invoice.updateMany(
            { _id: { $in: invoiceIds } },
            updates,
            { runValidators: true }
        );

        return responseHandler(res, true, 200, `${result.modifiedCount} invoices updated successfully`, {
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.log("Error while bulk updating invoices: ", error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = {};
            Object.keys(error.errors).forEach(key => {
                validationErrors[key] = error.errors[key].message;
            });
            return responseHandler(res, false, 400, 'Validation failed', {}, validationErrors);
        }

        return errorHandler(res)(error);
    }
};

// Generate and download invoice PDF
const generateInvoicePDFController = async (req, res) => {
    try {
        const { id } = req.params;

        // Get invoice with populated data
        const invoice = await Invoice.findById(id)
            .populate('clientId', 'name email phone gstNumber panNumber address')
            .populate('items.productId', 'name description category basePrice hsnCode')
            .select('-__v');

        if (!invoice) {
            return responseHandler(res, false, 404, 'Invoice not found', {});
        }

        // Generate PDF
        const pdfBuffer = await generateInvoicePDF(invoice);

        // Set response headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        // Send PDF buffer
        res.send(pdfBuffer);

    } catch (error) {
        console.log("Error while generating invoice PDF: ", error);
        return errorHandler(res)(error);
    }
};

module.exports = {
    getInvoicesController,
    getInvoiceByIdController,
    createInvoiceController,
    updateInvoiceController,
    deleteInvoiceController,
    updateInvoiceStatusController,
    getInvoiceStatsController,
    bulkUpdateInvoicesController,
    generateInvoicePDFController
};