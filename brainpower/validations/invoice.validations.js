const Joi = require('joi');
const { validateRequest, validateTaxCalculation } = require('../middleware/requestValidator');

// Valid size options for invoice items
const validSizes = ['pediatric', 'x-small', 'small', 'medium', 'large', 'x-large', 'xxl', 'xxxl', 'universal'];

// Valid status options for invoices
const validStatuses = ['draft', 'sent', 'paid', 'overdue'];

// Valid tax types
const validTaxTypes = ['in-state', 'out-state'];

// Invoice item validation schema
const invoiceItemSchema = Joi.object({
    productId: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            'string.pattern.base': 'Invalid product ID format',
            'any.required': 'Product ID is required'
        }),
    size: Joi.string()
        .valid(...validSizes)
        .required()
        .messages({
            'any.only': `Size must be one of: ${validSizes.join(', ')}`,
            'any.required': 'Size is required'
        }),
    quantity: Joi.number()
        .integer()
        .min(1)
        .required()
        .messages({
            'number.base': 'Quantity must be a number',
            'number.integer': 'Quantity must be a whole number',
            'number.min': 'Quantity must be at least 1',
            'any.required': 'Quantity is required'
        }),
    customPrice: Joi.number()
        .min(0)
        .required()
        .messages({
            'number.base': 'Custom price must be a number',
            'number.min': 'Custom price cannot be negative',
            'any.required': 'Custom price is required'
        })
});

// Validation schema for creating an invoice
const createInvoiceSchema = function (req, res, next) {
    const schema = Joi.object({
        clientId: Joi.string()
            .pattern(/^[0-9a-fA-F]{24}$/)
            .required()
            .messages({
                'string.pattern.base': 'Invalid client ID format',
                'any.required': 'Client ID is required'
            }),
        invoiceDate: Joi.date()
            .iso()
            .optional()
            .default(() => new Date())
            .messages({
                'date.base': 'Invoice date must be a valid date'
            }),
        dueDate: Joi.date()
            .iso()
            .min(Joi.ref('invoiceDate'))
            .required()
            .messages({
                'date.base': 'Due date must be a valid date',
                'date.min': 'Due date must be after invoice date',
                'any.required': 'Due date is required'
            }),
        status: Joi.string()
            .valid(...validStatuses)
            .optional()
            .default('draft')
            .messages({
                'any.only': `Status must be one of: ${validStatuses.join(', ')}`
            }),
        items: Joi.array()
            .items(invoiceItemSchema)
            .min(1)
            .required()
            .messages({
                'array.min': 'Invoice must have at least one item',
                'any.required': 'Invoice items are required'
            }),
        taxType: Joi.string()
            .valid(...validTaxTypes)
            .required()
            .messages({
                'any.only': `Tax type must be one of: ${validTaxTypes.join(', ')}`,
                'any.required': 'Tax type is required'
            }),
        notes: Joi.string()
            .trim()
            .max(1000)
            .optional()
            .allow('')
            .messages({
                'string.max': 'Notes cannot exceed 1000 characters'
            })
    });
    
    // First validate the schema, then validate tax calculations
    validateRequest(req, res, (err) => {
        if (err) return next(err);
        validateTaxCalculation(req, res, next);
    }, schema, req.body);
};

// Validation schema for updating an invoice
const updateInvoiceSchema = function (req, res, next) {
    const schema = Joi.object({
        clientId: Joi.string()
            .pattern(/^[0-9a-fA-F]{24}$/)
            .optional()
            .messages({
                'string.pattern.base': 'Invalid client ID format'
            }),
        invoiceDate: Joi.date()
            .iso()
            .optional()
            .messages({
                'date.base': 'Invoice date must be a valid date'
            }),
        dueDate: Joi.date()
            .iso()
            .min(Joi.ref('invoiceDate'))
            .optional()
            .messages({
                'date.base': 'Due date must be a valid date',
                'date.min': 'Due date must be after invoice date'
            }),
        status: Joi.string()
            .valid(...validStatuses)
            .optional()
            .messages({
                'any.only': `Status must be one of: ${validStatuses.join(', ')}`
            }),
        items: Joi.array()
            .items(invoiceItemSchema)
            .min(1)
            .optional()
            .messages({
                'array.min': 'Invoice must have at least one item'
            }),
        taxType: Joi.string()
            .valid(...validTaxTypes)
            .optional()
            .messages({
                'any.only': `Tax type must be one of: ${validTaxTypes.join(', ')}`
            }),
        notes: Joi.string()
            .trim()
            .max(1000)
            .optional()
            .allow('')
            .messages({
                'string.max': 'Notes cannot exceed 1000 characters'
            })
    });
    
    // First validate the schema, then validate tax calculations if items or taxType are being updated
    validateRequest(req, res, (err) => {
        if (err) return next(err);
        
        // Only validate tax calculation if items or taxType are being updated
        if (req.body.items || req.body.taxType) {
            validateTaxCalculation(req, res, next);
        } else {
            next();
        }
    }, schema, req.body);
};

// Validation schema for query parameters when getting invoices
const getInvoicesQuerySchema = function (req, res, next) {
    const schema = Joi.object({
        page: Joi.number()
            .integer()
            .min(1)
            .optional()
            .default(1),
        limit: Joi.number()
            .integer()
            .min(1)
            .max(100)
            .optional()
            .default(10),
        search: Joi.string()
            .trim()
            .optional()
            .allow('')
            .messages({
                'string.base': 'Search term must be a string'
            }),
        clientId: Joi.string()
            .pattern(/^[0-9a-fA-F]{24}$/)
            .optional()
            .messages({
                'string.pattern.base': 'Invalid client ID format'
            }),
        status: Joi.string()
            .valid(...validStatuses, '')
            .optional()
            .allow('')
            .messages({
                'any.only': `Status must be one of: ${validStatuses.join(', ')}`
            }),
        startDate: Joi.date()
            .iso()
            .optional()
            .messages({
                'date.base': 'Start date must be a valid date'
            }),
        endDate: Joi.date()
            .iso()
            .min(Joi.ref('startDate'))
            .optional()
            .messages({
                'date.base': 'End date must be a valid date',
                'date.min': 'End date must be after start date'
            }),
        minAmount: Joi.number()
            .min(0)
            .optional()
            .messages({
                'number.base': 'Minimum amount must be a number',
                'number.min': 'Minimum amount cannot be negative'
            }),
        maxAmount: Joi.number()
            .min(Joi.ref('minAmount'))
            .optional()
            .messages({
                'number.base': 'Maximum amount must be a number',
                'number.min': 'Maximum amount must be greater than minimum amount'
            }),
        sortBy: Joi.string()
            .valid('invoiceNumber', 'invoiceDate', 'dueDate', 'totalAmount', 'status', 'createdAt', 'updatedAt')
            .optional()
            .default('invoiceDate')
            .messages({
                'any.only': 'Sort field must be one of: invoiceNumber, invoiceDate, dueDate, totalAmount, status, createdAt, updatedAt'
            }),
        sortOrder: Joi.string()
            .valid('asc', 'desc')
            .optional()
            .default('desc')
            .messages({
                'any.only': 'Sort order must be either asc or desc'
            })
    });
    
    validateRequest(req, res, next, schema, req.query);
};

// Validation for MongoDB ObjectId parameters
const validateInvoiceId = function (req, res, next) {
    const schema = Joi.object({
        id: Joi.string()
            .pattern(/^[0-9a-fA-F]{24}$/)
            .required()
            .messages({
                'string.pattern.base': 'Invalid invoice ID format',
                'any.required': 'Invoice ID is required'
            })
    });
    
    validateRequest(req, res, next, schema, req.params);
};

// Validation for invoice status update
const updateInvoiceStatusSchema = function (req, res, next) {
    const schema = Joi.object({
        status: Joi.string()
            .valid(...validStatuses)
            .required()
            .messages({
                'any.only': `Status must be one of: ${validStatuses.join(', ')}`,
                'any.required': 'Status is required'
            })
    });
    
    validateRequest(req, res, next, schema, req.body);
};

// Validation for bulk operations
const bulkUpdateInvoicesSchema = function (req, res, next) {
    const schema = Joi.object({
        invoiceIds: Joi.array()
            .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
            .min(1)
            .required()
            .messages({
                'array.min': 'At least one invoice ID is required',
                'any.required': 'Invoice IDs are required'
            }),
        updates: Joi.object({
            status: Joi.string()
                .valid(...validStatuses)
                .optional()
                .messages({
                    'any.only': `Status must be one of: ${validStatuses.join(', ')}`
                }),
            dueDate: Joi.date()
                .iso()
                .optional()
                .messages({
                    'date.base': 'Due date must be a valid date'
                }),
            notes: Joi.string()
                .trim()
                .max(1000)
                .optional()
                .allow('')
                .messages({
                    'string.max': 'Notes cannot exceed 1000 characters'
                })
        })
        .min(1)
        .required()
        .messages({
            'object.min': 'At least one update field is required',
            'any.required': 'Updates are required'
        })
    });
    
    validateRequest(req, res, next, schema, req.body);
};

module.exports = { 
    createInvoiceSchema,
    updateInvoiceSchema,
    getInvoicesQuerySchema,
    validateInvoiceId,
    updateInvoiceStatusSchema,
    bulkUpdateInvoicesSchema
};