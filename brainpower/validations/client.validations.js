const Joi = require('joi');
const { validateRequest, validateSecurityConstraints } = require('../middleware/requestValidator');

// Custom validation for GST number format
const gstNumberPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

// Custom validation for PAN number format
const panNumberPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

// Custom validation for Aadhar number format
const aadharNumberPattern = /^[0-9]{12}$/;

// Enhanced address validation schema
const addressSchema = Joi.object({
    street: Joi.string()
        .trim()
        .min(5)
        .max(200)
        .optional()
        .allow('')
        .pattern(/^[a-zA-Z0-9\s\-_().,#/]+$/)
        .messages({
            'string.min': 'Street address must be at least 5 characters long',
            'string.max': 'Street address cannot exceed 200 characters',
            'string.pattern.base': 'Street address contains invalid characters'
        }),
    city: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .optional()
        .allow('')
        .pattern(/^[a-zA-Z\s\-_]+$/)
        .messages({
            'string.min': 'City must be at least 2 characters long',
            'string.max': 'City cannot exceed 100 characters',
            'string.pattern.base': 'City name contains invalid characters'
        }),
    state: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .optional()
        .allow('')
        .pattern(/^[a-zA-Z\s\-_]+$/)
        .messages({
            'string.min': 'State must be at least 2 characters long',
            'string.max': 'State cannot exceed 100 characters',
            'string.pattern.base': 'State name contains invalid characters'
        }),
    zipCode: Joi.string()
        .trim()
        .min(3)
        .max(20)
        .optional()
        .allow('')
        .pattern(/^[a-zA-Z0-9\s\-]+$/)
        .messages({
            'string.min': 'Zip code must be at least 3 characters long',
            'string.max': 'Zip code cannot exceed 20 characters',
            'string.pattern.base': 'Zip code contains invalid characters'
        }),
    country: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .optional()
        .default('India')
        .pattern(/^[a-zA-Z\s\-_]+$/)
        .messages({
            'string.min': 'Country must be at least 2 characters long',
            'string.max': 'Country cannot exceed 100 characters',
            'string.pattern.base': 'Country name contains invalid characters'
        })
});

// Enhanced validation schema for creating a client
const createClientSchema = function (req, res, next) {
    const schema = Joi.object({
        name: Joi.string()
            .trim()
            .min(2)
            .max(100)
            .required()
            .pattern(/^[a-zA-Z\s\-_().]+$/)
            .messages({
                'string.empty': 'Client name is required',
                'string.min': 'Client name must be at least 2 characters long',
                'string.max': 'Client name cannot exceed 100 characters',
                'string.pattern.base': 'Client name contains invalid characters'
            }),
        email: Joi.string()
            .trim()
            .email({ tlds: { allow: false } })
            .lowercase()
            .max(254)
            .required()
            .messages({
                'string.email': 'Please enter a valid email address',
                'string.max': 'Email address cannot exceed 254 characters',
                'any.required': 'Email is required'
            }),
        phone: Joi.string()
            .trim()
            .min(10)
            .max(15)
            .required()
            .pattern(/^[\+]?[1-9][\d]{9,14}$/)
            .messages({
                'string.empty': 'Phone number is required',
                'string.min': 'Phone number must be at least 10 digits',
                'string.max': 'Phone number cannot exceed 15 digits',
                'string.pattern.base': 'Please enter a valid phone number'
            }),
        gstNumber: Joi.string()
            .trim()
            .uppercase()
            .pattern(gstNumberPattern)
            .length(15)
            .optional()
            .allow('')
            .messages({
                'string.pattern.base': 'Please enter a valid GST number (format: 22AAAAA0000A1Z5)',
                'string.length': 'GST number must be exactly 15 characters'
            }),
        panNumber: Joi.string()
            .trim()
            .uppercase()
            .pattern(panNumberPattern)
            .length(10)
            .optional()
            .allow('')
            .messages({
                'string.pattern.base': 'Please enter a valid PAN number (format: AAAAA0000A)',
                'string.length': 'PAN number must be exactly 10 characters'
            }),
        aadharNumber: Joi.string()
            .trim()
            .pattern(aadharNumberPattern)
            .length(12)
            .optional()
            .allow('')
            .messages({
                'string.pattern.base': 'Please enter a valid 12-digit Aadhar number',
                'string.length': 'Aadhar number must be exactly 12 digits'
            }),
        address: addressSchema.optional(),
        isActive: Joi.boolean()
            .optional()
            .default(true)
    });
    
    // Apply security validation first
    validateSecurityConstraints(req, res, (err) => {
        if (err) return;
        validateRequest(req, res, next, schema, req.body);
    });
};

// Validation schema for updating a client
const updateClientSchema = function (req, res, next) {
    const schema = Joi.object({
        name: Joi.string()
            .trim()
            .min(1)
            .max(200)
            .optional()
            .messages({
                'string.empty': 'Client name cannot be empty',
                'string.max': 'Client name cannot exceed 200 characters'
            }),
        email: Joi.string()
            .trim()
            .email()
            .lowercase()
            .optional()
            .messages({
                'string.email': 'Please enter a valid email address'
            }),
        phone: Joi.string()
            .trim()
            .min(1)
            .max(20)
            .optional()
            .messages({
                'string.empty': 'Phone number cannot be empty',
                'string.max': 'Phone number cannot exceed 20 characters'
            }),
        gstNumber: Joi.string()
            .trim()
            .uppercase()
            .pattern(gstNumberPattern)
            .max(15)
            .optional()
            .allow('')
            .messages({
                'string.pattern.base': 'Please enter a valid GST number (format: 22AAAAA0000A1Z5)',
                'string.max': 'GST number cannot exceed 15 characters'
            }),
        panNumber: Joi.string()
            .trim()
            .uppercase()
            .pattern(panNumberPattern)
            .length(10)
            .optional()
            .allow('')
            .messages({
                'string.pattern.base': 'Please enter a valid PAN number (format: AAAAA0000A)',
                'string.length': 'PAN number must be exactly 10 characters'
            }),
        aadharNumber: Joi.string()
            .trim()
            .pattern(aadharNumberPattern)
            .length(12)
            .optional()
            .allow('')
            .messages({
                'string.pattern.base': 'Please enter a valid 12-digit Aadhar number',
                'string.length': 'Aadhar number must be exactly 12 digits'
            }),
        address: addressSchema.optional(),
        isActive: Joi.boolean()
            .optional()
    });
    
    validateRequest(req, res, next, schema, req.body);
};

// Validation schema for query parameters
const getClientsQuerySchema = function (req, res, next) {
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
            .allow(''),
        state: Joi.string()
            .trim()
            .optional()
            .allow(''),
        isActive: Joi.string()
            .valid('true', 'false', '')
            .optional()
            .allow(''),
        sortBy: Joi.string()
            .valid('name', 'email', 'phone', 'createdAt', 'updatedAt')
            .optional()
            .default('name'),
        sortOrder: Joi.string()
            .valid('asc', 'desc')
            .optional()
            .default('asc')
    });
    
    validateRequest(req, res, next, schema, req.query);
};

// Validation for MongoDB ObjectId parameters
const validateClientId = function (req, res, next) {
    const schema = Joi.object({
        id: Joi.string()
            .pattern(/^[0-9a-fA-F]{24}$/)
            .required()
            .messages({
                'string.pattern.base': 'Invalid client ID format'
            })
    });
    
    validateRequest(req, res, next, schema, req.params);
};

// Validation for client invoice history query parameters
const getClientInvoicesQuerySchema = function (req, res, next) {
    const schema = Joi.object({
        id: Joi.string()
            .pattern(/^[0-9a-fA-F]{24}$/)
            .required()
            .messages({
                'string.pattern.base': 'Invalid client ID format'
            })
    });
    
    const querySchema = Joi.object({
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
        status: Joi.string()
            .valid('draft', 'sent', 'paid', 'overdue', '')
            .optional()
            .allow(''),
        startDate: Joi.date()
            .iso()
            .optional(),
        endDate: Joi.date()
            .iso()
            .min(Joi.ref('startDate'))
            .optional()
            .messages({
                'date.min': 'End date must be after start date'
            }),
        sortBy: Joi.string()
            .valid('invoiceDate', 'dueDate', 'totalAmount', 'createdAt')
            .optional()
            .default('invoiceDate'),
        sortOrder: Joi.string()
            .valid('asc', 'desc')
            .optional()
            .default('desc')
    });
    
    // Validate both params and query
    validateRequest(req, res, (err) => {
        if (err) return next(err);
        validateRequest(req, res, next, querySchema, req.query);
    }, schema, req.params);
};

module.exports = { 
    createClientSchema,
    updateClientSchema,
    getClientsQuerySchema,
    validateClientId,
    getClientInvoicesQuerySchema
};