// Models
const Product = require('../models/product.model');
const Invoice = require('../models/invoice.model');

// Common response handler
const errorHandler = require('../middleware/errorHandler');
const responseHandler = require('../middleware/responseHandler');

// Get all products with pagination and filtering
const getProductsController = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            search = '', 
            category = '', 
            isActive = '' 
        } = req.query;

        // Build filter object
        const filter = {};
        
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (category) {
            filter.category = { $regex: category, $options: 'i' };
        }
        
        if (isActive !== '') {
            filter.isActive = isActive === 'true';
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Get products with pagination
        const products = await Product.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count for pagination
        const totalProducts = await Product.countDocuments(filter);
        const totalPages = Math.ceil(totalProducts / parseInt(limit));

        const paginationData = {
            products,
            totalCount: totalProducts,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalProducts,
                hasNextPage: parseInt(page) < totalPages,
                hasPrevPage: parseInt(page) > 1
            }
        };

        return responseHandler(res, true, 200, 'Products retrieved successfully', paginationData);
    } catch (error) {
        console.log("Error while getting products: ", error);
        return errorHandler(res)(error);
    }
};

// Get single product by ID
const getProductByIdController = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findById(id);
        
        if (!product) {
            return responseHandler(res, false, 404, 'Product not found', {});
        }

        return responseHandler(res, true, 200, 'Product retrieved successfully', { product });
    } catch (error) {
        console.log("Error while getting product: ", error);
        return errorHandler(res)(error);
    }
};

// Create new product
const createProductController = async (req, res) => {
    try {
        const productData = req.body;

        // Check if SKU already exists (if provided)
        if (productData.sku) {
            const existingProduct = await Product.findOne({ sku: productData.sku.toUpperCase() });
            if (existingProduct) {
                return responseHandler(res, false, 409, 'Product with this SKU already exists', {});
            }
        }

        const newProduct = new Product(productData);
        const savedProduct = await newProduct.save();

        return responseHandler(res, true, 201, 'Product created successfully', { product: savedProduct });
    } catch (error) {
        console.log("Error while creating product: ", error);
        
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
            return responseHandler(res, false, 409, 'Product with this SKU already exists', {});
        }
        
        return errorHandler(res)(error);
    }
};

// Update product
const updateProductController = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Check if product exists
        const existingProduct = await Product.findById(id);
        if (!existingProduct) {
            return responseHandler(res, false, 404, 'Product not found', {});
        }

        // Check if SKU already exists (if being updated and different from current)
        if (updateData.sku && updateData.sku.toUpperCase() !== existingProduct.sku) {
            const duplicateProduct = await Product.findOne({ 
                sku: updateData.sku.toUpperCase(),
                _id: { $ne: id }
            });
            if (duplicateProduct) {
                return responseHandler(res, false, 409, 'Product with this SKU already exists', {});
            }
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true, runValidators: true }
        );

        return responseHandler(res, true, 200, 'Product updated successfully', { product: updatedProduct });
    } catch (error) {
        console.log("Error while updating product: ", error);
        
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
            return responseHandler(res, false, 409, 'Product with this SKU already exists', {});
        }
        
        return errorHandler(res)(error);
    }
};

// Delete product with reference checking
const deleteProductController = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if product exists
        const product = await Product.findById(id);
        if (!product) {
            return responseHandler(res, false, 404, 'Product not found', {});
        }

        // Check if product is referenced in any invoices
        const invoiceCount = await Invoice.countDocuments({ 'items.productId': id });
        if (invoiceCount > 0) {
            return responseHandler(
                res, 
                false, 
                422, 
                `Cannot delete product. It is referenced in ${invoiceCount} invoice(s)`, 
                { referencedInvoices: invoiceCount }
            );
        }

        await Product.findByIdAndDelete(id);

        return responseHandler(res, true, 200, 'Product deleted successfully', {});
    } catch (error) {
        console.log("Error while deleting product: ", error);
        return errorHandler(res)(error);
    }
};

module.exports = { 
    getProductsController,
    getProductByIdController,
    createProductController,
    updateProductController,
    deleteProductController
};