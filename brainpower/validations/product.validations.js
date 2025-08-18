const Joi = require('joi');
const { validateRequest, validateSecurityConstraints } = require('../middleware/requestValidator');

// Enhanced validation schema for creating a product
const createProductSchema = function (req, res, next) {
    const schema = Joi.object({
        name: Joi.string()
            .trim()
            .min(2)
            .max(100)
            .required()
            .pattern(/^[a-zA-Z0-9\s\-_().]+$/)
            .messages({
                'string.empty': 'Product name is required',
                'string.min': 'Product name must be at least 2 characters long',
                'string.max': 'Product name cannot exceed 100 characters',
                'string.pattern.base': 'Product name contains invalid characters'
            }),
        description: Joi.string()
            .trim()
            .max(500)
            .optional()
            .allow('')
            .pattern(/^[a-zA-Z0-9\s\-_().,!?]*$/)
            .messages({
                'string.max': 'Description cannot exceed 500 characters',
                'string.pattern.base': 'Description contains invalid characters'
            }),
        basePrice: Joi.number()
            .positive()
            .precision(2)
            .min(0.01)
            .max(1000000)
            .required()
            .messages({
                'number.base': 'Base price must be a number',
                'number.positive': 'Base price must be greater than 0',
                'number.min': 'Base price must be at least 0.01',
                'number.max': 'Base price cannot exceed 1,000,000',
                'any.required': 'Base price is required'
            }),
        category: Joi.string()
            .trim()
            .min(2)
            .max(50)
            .required()
            .pattern(/^[a-zA-Z0-9\s\-_]+$/)
            .messages({
                'string.empty': 'Category is required',
                'string.min': 'Category must be at least 2 characters long',
                'string.max': 'Category cannot exceed 50 characters',
                'string.pattern.base': 'Category contains invalid characters'
            }),
        sku: Joi.string()
            .trim()
            .alphanum()
            .min(3)
            .max(20)
            .uppercase()
            .optional()
            .allow('')
            .messages({
                'string.alphanum': 'SKU must contain only letters and numbers',
                'string.min': 'SKU must be at least 3 characters long',
                'string.max': 'SKU cannot exceed 20 characters'
            }),
        isActive: Joi.boolean()
            .optional()
            .default(true),
        hsnCode: Joi.number()
            .integer()
            .min(1000)
            .max(99999999)
            .optional()
            .default(9021)
            .messages({
                'number.base': 'HSN code must be a number',
                'number.integer': 'HSN code must be an integer',
                'number.min': 'HSN code must be at least 4 digits',
                'number.max': 'HSN code cannot exceed 8 digits'
            })
    });
    
    // Apply security validation first
    validateSecurityConstraints(req, res, (err) => {
        if (err) return;
        validateRequest(req, res, next, schema, req.body);
    });
};

// Enhanced validation schema for updating a product
const updateProductSchema = function (req, res, next) {
    const schema = Joi.object({
        name: Joi.string()
            .trim()
            .min(2)
            .max(100)
            .optional()
            .pattern(/^[a-zA-Z0-9\s\-_().]+$/)
            .messages({
                'string.min': 'Product name must be at least 2 characters long',
                'string.max': 'Product name cannot exceed 100 characters',
                'string.pattern.base': 'Product name contains invalid characters'
            }),
        description: Joi.string()
            .trim()
            .max(500)
            .optional()
            .allow('')
            .pattern(/^[a-zA-Z0-9\s\-_().,!?]*$/)
            .messages({
                'string.max': 'Description cannot exceed 500 characters',
                'string.pattern.base': 'Description contains invalid characters'
            }),
        basePrice: Joi.number()
            .positive()
            .precision(2)
            .min(0.01)
            .max(1000000)
            .optional()
            .messages({
                'number.base': 'Base price must be a number',
                'number.positive': 'Base price must be greater than 0',
                'number.min': 'Base price must be at least 0.01',
                'number.max': 'Base price cannot exceed 1,000,000'
            }),
        category: Joi.string()
            .trim()
            .min(2)
            .max(50)
            .optional()
            .pattern(/^[a-zA-Z0-9\s\-_]+$/)
            .messages({
                'string.min': 'Category must be at least 2 characters long',
                'string.max': 'Category cannot exceed 50 characters',
                'string.pattern.base': 'Category contains invalid characters'
            }),
        sku: Joi.string()
            .trim()
            .alphanum()
            .min(3)
            .max(20)
            .uppercase()
            .optional()
            .allow('')
            .messages({
                'string.alphanum': 'SKU must contain only letters and numbers',
                'string.min': 'SKU must be at least 3 characters long',
                'string.max': 'SKU cannot exceed 20 characters'
            }),
        isActive: Joi.boolean()
            .optional(),
        hsnCode: Joi.number()
            .integer()
            .min(1000)
            .max(99999999)
            .optional()
            .messages({
                'number.base': 'HSN code must be a number',
                'number.integer': 'HSN code must be an integer',
                'number.min': 'HSN code must be at least 4 digits',
                'number.max': 'HSN code cannot exceed 8 digits'
            })
    });
    
    // Apply security validation first
    validateSecurityConstraints(req, res, (err) => {
        if (err) return;
        validateRequest(req, res, next, schema, req.body);
    });
};

// Enhanced validation schema for query parameters
const getProductsQuerySchema = function (req, res, next) {
    const schema = Joi.object({
        page: Joi.number()
            .integer()
            .min(1)
            .max(1000)
            .optional()
            .default(1)
            .messages({
                'number.base': 'Page must be a number',
                'number.integer': 'Page must be an integer',
                'number.min': 'Page must be at least 1',
                'number.max': 'Page cannot exceed 1000'
            }),
        limit: Joi.number()
            .integer()
            .min(1)
            .max(100)
            .optional()
            .default(10)
            .messages({
                'number.base': 'Limit must be a number',
                'number.integer': 'Limit must be an integer',
                'number.min': 'Limit must be at least 1',
                'number.max': 'Limit cannot exceed 100'
            }),
        search: Joi.string()
            .trim()
            .min(1)
            .max(100)
            .optional()
            .allow('')
            .pattern(/^[a-zA-Z0-9\s\-_().]*$/)
            .messages({
                'string.min': 'Search term must be at least 1 character',
                'string.max': 'Search term cannot exceed 100 characters',
                'string.pattern.base': 'Search term contains invalid characters'
            }),
        category: Joi.string()
            .trim()
            .max(50)
            .optional()
            .allow('')
            .pattern(/^[a-zA-Z0-9\s\-_]*$/)
            .messages({
                'string.max': 'Category filter cannot exceed 50 characters',
                'string.pattern.base': 'Category filter contains invalid characters'
            }),
        isActive: Joi.string()
            .valid('true', 'false', '')
            .optional()
            .allow(''),
        sortBy: Joi.string()
            .valid('name', 'basePrice', 'category', 'createdAt', 'updatedAt')
            .optional()
            .default('createdAt')
            .messages({
                'any.only': 'Sort field must be one of: name, basePrice, category, createdAt, updatedAt'
            }),
        sortOrder: Joi.string()
            .valid('asc', 'desc')
            .optional()
            .default('desc')
            .messages({
                'any.only': 'Sort order must be either asc or desc'
            }),
        minPrice: Joi.number()
            .min(0)
            .max(1000000)
            .optional()
            .messages({
                'number.base': 'Minimum price must be a number',
                'number.min': 'Minimum price cannot be negative',
                'number.max': 'Minimum price cannot exceed 1,000,000'
            }),
        maxPrice: Joi.number()
            .min(0)
            .max(1000000)
            .optional()
            .messages({
                'number.base': 'Maximum price must be a number',
                'number.min': 'Maximum price cannot be negative',
                'number.max': 'Maximum price cannot exceed 1,000,000'
            })
    });
    
    validateRequest(req, res, next, schema, req.query);
};

// Enhanced validation for MongoDB ObjectId parameters
const validateProductId = function (req, res, next) {
    const schema = Joi.object({
        id: Joi.string()
            .pattern(/^[0-9a-fA-F]{24}$/)
            .required()
            .messages({
                'string.pattern.base': 'Invalid product ID format',
                'any.required': 'Product ID is required'
            })
    });
    
    validateRequest(req, res, next, schema, req.params);
};

// Bulk operations validation
const validateBulkProductOperation = function (req, res, next) {
    const schema = Joi.object({
        ids: Joi.array()
            .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
            .min(1)
            .max(100)
            .required()
            .messages({
                'array.min': 'At least one product ID is required',
                'array.max': 'Cannot process more than 100 products at once',
                'any.required': 'Product IDs are required'
            }),
        action: Joi.string()
            .valid('activate', 'deactivate', 'delete')
            .required()
            .messages({
                'any.only': 'Action must be one of: activate, deactivate, delete',
                'any.required': 'Action is required'
            })
    });
    
    // Apply security validation first
    validateSecurityConstraints(req, res, (err) => {
        if (err) return;
        validateRequest(req, res, next, schema, req.body);
    });
};

module.exports = { 
    createProductSchema,
    updateProductSchema,
    getProductsQuerySchema,
    validateProductId,
    validateBulkProductOperation
};