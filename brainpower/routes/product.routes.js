const express = require('express');
const router = express.Router();

// Validations
const { 
    createProductSchema,
    updateProductSchema,
    getProductsQuerySchema,
    validateProductId
} = require('../validations/product.validations');

// Controllers
const { 
    getProductsController,
    getProductByIdController,
    createProductController,
    updateProductController,
    deleteProductController
} = require('../controllers/product.controller');

// Routes

// GET /api/products - Get all products with pagination and filtering
router.get('/', getProductsQuerySchema, getProductsController);

// GET /api/products/:id - Get single product by ID
router.get('/:id', validateProductId, getProductByIdController);

// POST /api/products - Create new product
router.post('/', createProductSchema, createProductController);

// PUT /api/products/:id - Update product
router.put('/:id', validateProductId, updateProductSchema, updateProductController);

// DELETE /api/products/:id - Delete product with reference checking
router.delete('/:id', validateProductId, deleteProductController);

module.exports = router;