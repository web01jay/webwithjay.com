// Models
const Client = require('../models/client.model');
const Invoice = require('../models/invoice.model');

// Common response handler
const errorHandler = require('../middleware/errorHandler');
const responseHandler = require('../middleware/responseHandler');

// Get all clients with pagination and filtering
const getClientsController = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            search = '', 
            state = '', 
            isActive = '',
            sortBy = 'name',
            sortOrder = 'asc'
        } = req.query;

        // Build filter object
        const filter = {};
        
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (state) {
            filter['address.state'] = { $regex: state, $options: 'i' };
        }
        
        if (isActive !== '') {
            filter.isActive = isActive === 'true';
        }

        // Build sort object
        const sortObj = {};
        sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Get clients with pagination
        const clients = await Client.find(filter)
            .sort(sortObj)
            .skip(skip)
            .limit(parseInt(limit))
            .select('-__v'); // Exclude version field

        // Get total count for pagination
        const totalClients = await Client.countDocuments(filter);
        const totalPages = Math.ceil(totalClients / parseInt(limit));

        const paginationData = {
            clients,
            totalCount: totalClients,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalClients,
                hasNextPage: parseInt(page) < totalPages,
                hasPrevPage: parseInt(page) > 1
            }
        };

        return responseHandler(res, true, 200, 'Clients retrieved successfully', paginationData);
    } catch (error) {
        console.log("Error while getting clients: ", error);
        return errorHandler(res)(error);
    }
};

// Get single client by ID
const getClientByIdController = async (req, res) => {
    try {
        const { id } = req.params;

        const client = await Client.findById(id).select('-__v');
        
        if (!client) {
            return responseHandler(res, false, 404, 'Client not found', {});
        }

        return responseHandler(res, true, 200, 'Client retrieved successfully', { client });
    } catch (error) {
        console.log("Error while getting client: ", error);
        return errorHandler(res)(error);
    }
};

// Create new client
const createClientController = async (req, res) => {
    try {
        const clientData = req.body;

        // Check if email already exists
        const existingClient = await Client.findOne({ email: clientData.email.toLowerCase() });
        if (existingClient) {
            return responseHandler(res, false, 409, 'Client with this email already exists', {});
        }

        const newClient = new Client(clientData);
        const savedClient = await newClient.save();

        return responseHandler(res, true, 201, 'Client created successfully', { client: savedClient });
    } catch (error) {
        console.log("Error while creating client: ", error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = {};
            Object.keys(error.errors).forEach(key => {
                validationErrors[key] = error.errors[key].message;
            });
            return responseHandler(res, false, 400, 'Validation failed', {}, validationErrors);
        }
        
        // Handle duplicate key error
        if (error.code === 11000) {
            return responseHandler(res, false, 409, 'Client with this email already exists', {});
        }
        
        return errorHandler(res)(error);
    }
};

// Update client
const updateClientController = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Check if client exists
        const existingClient = await Client.findById(id);
        if (!existingClient) {
            return responseHandler(res, false, 404, 'Client not found', {});
        }

        // Check if email already exists (if being updated and different from current)
        if (updateData.email && updateData.email.toLowerCase() !== existingClient.email) {
            const duplicateClient = await Client.findOne({ 
                email: updateData.email.toLowerCase(),
                _id: { $ne: id }
            });
            if (duplicateClient) {
                return responseHandler(res, false, 409, 'Client with this email already exists', {});
            }
        }

        const updatedClient = await Client.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true, runValidators: true }
        ).select('-__v');

        return responseHandler(res, true, 200, 'Client updated successfully', { client: updatedClient });
    } catch (error) {
        console.log("Error while updating client: ", error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = {};
            Object.keys(error.errors).forEach(key => {
                validationErrors[key] = error.errors[key].message;
            });
            return responseHandler(res, false, 400, 'Validation failed', {}, validationErrors);
        }
        
        // Handle duplicate key error
        if (error.code === 11000) {
            return responseHandler(res, false, 409, 'Client with this email already exists', {});
        }
        
        return errorHandler(res)(error);
    }
};

// Delete client with reference checking
const deleteClientController = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if client exists
        const client = await Client.findById(id);
        if (!client) {
            return responseHandler(res, false, 404, 'Client not found', {});
        }

        // Check if client is referenced in any invoices
        const invoiceCount = await Invoice.countDocuments({ clientId: id });
        if (invoiceCount > 0) {
            return responseHandler(
                res, 
                false, 
                422, 
                `Cannot delete client. They have ${invoiceCount} invoice(s) in the system`, 
                { referencedInvoices: invoiceCount }
            );
        }

        await Client.findByIdAndDelete(id);

        return responseHandler(res, true, 200, 'Client deleted successfully', {});
    } catch (error) {
        console.log("Error while deleting client: ", error);
        return errorHandler(res)(error);
    }
};

// Get client's invoice history
const getClientInvoicesController = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            page = 1, 
            limit = 10, 
            status = '',
            startDate,
            endDate,
            sortBy = 'invoiceDate',
            sortOrder = 'desc'
        } = req.query;

        // Check if client exists
        const client = await Client.findById(id);
        if (!client) {
            return responseHandler(res, false, 404, 'Client not found', {});
        }

        // Build filter object
        const filter = { clientId: id };
        
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

        // Build sort object
        const sortObj = {};
        sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Get invoices with pagination and populate product details
        const invoices = await Invoice.find(filter)
            .populate('clientId', 'name email')
            .populate('items.productId', 'name category')
            .sort(sortObj)
            .skip(skip)
            .limit(parseInt(limit))
            .select('-__v');

        // Get total count for pagination
        const totalInvoices = await Invoice.countDocuments(filter);
        const totalPages = Math.ceil(totalInvoices / parseInt(limit));

        // Calculate summary statistics for this client
        const summaryStats = await Invoice.aggregate([
            { $match: { clientId: client._id } },
            {
                $group: {
                    _id: null,
                    totalInvoices: { $sum: 1 },
                    totalAmount: { $sum: '$totalAmount' },
                    paidInvoices: {
                        $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
                    },
                    pendingAmount: {
                        $sum: { 
                            $cond: [
                                { $ne: ['$status', 'paid'] }, 
                                '$totalAmount', 
                                0
                            ] 
                        }
                    }
                }
            }
        ]);

        const stats = summaryStats.length > 0 ? summaryStats[0] : {
            totalInvoices: 0,
            totalAmount: 0,
            paidInvoices: 0,
            pendingAmount: 0
        };

        const responseData = {
            client: {
                _id: client._id,
                name: client.name,
                email: client.email
            },
            invoices,
            summary: {
                totalInvoices: stats.totalInvoices,
                totalAmount: stats.totalAmount,
                paidInvoices: stats.paidInvoices,
                pendingInvoices: stats.totalInvoices - stats.paidInvoices,
                pendingAmount: stats.pendingAmount
            },
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalInvoices,
                hasNextPage: parseInt(page) < totalPages,
                hasPrevPage: parseInt(page) > 1
            }
        };

        return responseHandler(res, true, 200, 'Client invoice history retrieved successfully', responseData);
    } catch (error) {
        console.log("Error while getting client invoices: ", error);
        return errorHandler(res)(error);
    }
};

module.exports = { 
    getClientsController,
    getClientByIdController,
    createClientController,
    updateClientController,
    deleteClientController,
    getClientInvoicesController
};