const express = require('express');
const router = express.Router();

// Validations
const { 
    createClientSchema,
    updateClientSchema,
    getClientsQuerySchema,
    validateClientId,
    getClientInvoicesQuerySchema
} = require('../validations/client.validations');

// Controllers
const { 
    getClientsController,
    getClientByIdController,
    createClientController,
    updateClientController,
    deleteClientController,
    getClientInvoicesController
} = require('../controllers/client.controller');

// Routes

// GET /api/clients - Get all clients with pagination and filtering
router.get('/', getClientsQuerySchema, getClientsController);

// GET /api/clients/:id - Get single client by ID
router.get('/:id', validateClientId, getClientByIdController);

// GET /api/clients/:id/invoices - Get client's invoice history
router.get('/:id/invoices', getClientInvoicesQuerySchema, getClientInvoicesController);

// POST /api/clients - Create new client
router.post('/', createClientSchema, createClientController);

// PUT /api/clients/:id - Update client
router.put('/:id', validateClientId, updateClientSchema, updateClientController);

// DELETE /api/clients/:id - Delete client with reference checking
router.delete('/:id', validateClientId, deleteClientController);

module.exports = router;