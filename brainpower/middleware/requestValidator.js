const responseHandler = require("./responseHandler");
const { BadRequestError } = require("./errorHandler");

// Input sanitization functions
const sanitizeInput = (input) => {
    if (typeof input === 'string') {
        // Remove potential XSS characters and trim whitespace
        return input
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<[^>]*>/g, '')
            .trim();
    }
    return input;
};

const sanitizeObject = (obj) => {
    if (obj === null || obj === undefined) return obj;
    
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }
    
    if (typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
    }
    
    return sanitizeInput(obj);
};

// Reference integrity checking
const checkReferenceIntegrity = async (Model, field, value, errorMessage) => {
    if (!value) return null;
    
    try {
        const exists = await Model.findById(value);
        if (!exists) {
            throw new BadRequestError(errorMessage || `Referenced ${field} does not exist`);
        }
        return exists;
    } catch (error) {
        if (error.name === 'CastError') {
            throw new BadRequestError(`Invalid ${field} format`);
        }
        throw error;
    }
};

const validateRequest = (req, res, next, schema, data) => {
    // Sanitize input data before validation
    const sanitizedData = sanitizeObject(data);
    
    const { error } = schema.validate(sanitizedData, { abortEarly: false });
    if (error) {
        const details = {};
        error.details.forEach(err => {
            const field = err.path.join('.');
            details[field] = err.message;
        });
        
        return responseHandler(res, false, 400, 'Validation error', {}, {
            code: 'VALIDATION_ERROR',
            message: 'Please check your input and try again',
            details
        });
    }
    
    // Update request with sanitized data
    if (data === req.body) req.body = sanitizedData;
    if (data === req.query) req.query = sanitizedData;
    if (data === req.params) req.params = sanitizedData;
    
    next();
};

// Custom validation for tax calculations
const validateTaxCalculation = (req, res, next) => {
    try {
        const { taxType, items } = req.body;
        
        if (!taxType || !items || !Array.isArray(items)) {
            return next();
        }

        // Validate tax type is one of the allowed values
        const validTaxTypes = ['in-state', 'out-state'];
        if (!validTaxTypes.includes(taxType)) {
            return responseHandler(res, false, 400, 'Invalid tax type', {}, {
                errors: [`Tax type must be one of: ${validTaxTypes.join(', ')}`]
            });
        }

        // Validate that items array is not empty
        if (items.length === 0) {
            return responseHandler(res, false, 400, 'Invoice validation error', {}, {
                errors: ['Invoice must have at least one item for tax calculation']
            });
        }

        // Validate each item has required fields for tax calculation
        const itemErrors = [];
        items.forEach((item, index) => {
            if (!item.quantity || item.quantity <= 0) {
                itemErrors.push(`Item ${index + 1}: Quantity must be greater than 0`);
            }
            if (item.customPrice === undefined || item.customPrice < 0) {
                itemErrors.push(`Item ${index + 1}: Custom price must be 0 or greater`);
            }
        });

        if (itemErrors.length > 0) {
            return responseHandler(res, false, 400, 'Tax calculation validation error', {}, {
                errors: itemErrors
            });
        }

        // Calculate expected subtotal for validation
        const calculatedSubtotal = items.reduce((total, item) => {
            return total + (item.quantity * item.customPrice);
        }, 0);

        // Add calculated subtotal to request for use in controller
        req.calculatedSubtotal = calculatedSubtotal;
        
        next();
    } catch (error) {
        return responseHandler(res, false, 500, 'Tax validation error', {}, {
            errors: ['Error validating tax calculation']
        });
    }
};

// Comprehensive error response formatter
const formatValidationErrors = (errors) => {
    return errors.map(err => {
        // Handle Joi validation errors
        if (err.path && err.message) {
            return `${err.path.join('.')}: ${err.message}`;
        }
        // Handle custom validation errors
        return err.toString();
    });
};

// Enhanced validation middleware with better error handling
const validateRequestEnhanced = (req, res, next, schema, data, customValidations = []) => {
    const { error } = schema.validate(data, { abortEarly: false });
    
    if (error) {
        const formattedErrors = formatValidationErrors(error.details);
        return responseHandler(res, false, 400, 'Validation error', {}, {
            errors: formattedErrors
        });
    }

    // Run custom validations if provided
    if (customValidations.length > 0) {
        for (const validation of customValidations) {
            const validationResult = validation(data);
            if (validationResult.error) {
                return responseHandler(res, false, 400, 'Custom validation error', {}, {
                    errors: [validationResult.message]
                });
            }
        }
    }
    
    next();
};

// Security validation middleware
const validateSecurityConstraints = (req, res, next) => {
    try {
        // Check for SQL injection patterns (even though we use MongoDB)
        const sqlInjectionPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
            /(--|\/\*|\*\/|;|'|"|`)/g
        ];
        
        const checkForSqlInjection = (obj) => {
            if (typeof obj === 'string') {
                return sqlInjectionPatterns.some(pattern => pattern.test(obj));
            }
            if (typeof obj === 'object' && obj !== null) {
                return Object.values(obj).some(value => checkForSqlInjection(value));
            }
            return false;
        };
        
        if (checkForSqlInjection(req.body) || checkForSqlInjection(req.query)) {
            return responseHandler(res, false, 400, 'Invalid input detected', {}, {
                code: 'SECURITY_VIOLATION',
                message: 'Request contains potentially harmful content'
            });
        }
        
        // Check request size limits
        const maxBodySize = 10 * 1024 * 1024; // 10MB
        const bodySize = JSON.stringify(req.body).length;
        
        if (bodySize > maxBodySize) {
            return responseHandler(res, false, 413, 'Request too large', {}, {
                code: 'REQUEST_TOO_LARGE',
                message: 'Request body exceeds maximum allowed size'
            });
        }
        
        next();
    } catch (error) {
        return responseHandler(res, false, 500, 'Security validation error', {}, {
            code: 'SECURITY_ERROR',
            message: 'Error validating request security'
        });
    }
};

// Rate limiting validation (basic implementation)
const requestCounts = new Map();
const validateRateLimit = (maxRequests = 100, windowMs = 60000) => {
    return (req, res, next) => {
        const clientId = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        const windowStart = now - windowMs;
        
        // Clean old entries
        for (const [id, requests] of requestCounts.entries()) {
            const filteredRequests = requests.filter(time => time > windowStart);
            if (filteredRequests.length === 0) {
                requestCounts.delete(id);
            } else {
                requestCounts.set(id, filteredRequests);
            }
        }
        
        // Check current client
        const clientRequests = requestCounts.get(clientId) || [];
        const recentRequests = clientRequests.filter(time => time > windowStart);
        
        if (recentRequests.length >= maxRequests) {
            return responseHandler(res, false, 429, 'Too many requests', {}, {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests, please try again later'
            });
        }
        
        // Add current request
        recentRequests.push(now);
        requestCounts.set(clientId, recentRequests);
        
        next();
    };
};

module.exports = { 
    validateRequest,
    validateRequestEnhanced,
    validateTaxCalculation,
    formatValidationErrors,
    sanitizeInput,
    sanitizeObject,
    checkReferenceIntegrity,
    validateSecurityConstraints,
    validateRateLimit
};
