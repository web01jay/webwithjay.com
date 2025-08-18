// File: middleware/errorHandler.js
// This middleware handles errors in the application and sends a standardized error response.

const errorHandler = (res) => (error) => {
    console.error('Error Handler:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
    });

    // Default error response
    let statusCode = 500;
    let message = 'Internal Server Error';
    let details = null;

    // Handle different types of errors
    if (error.name === 'ValidationError') {
        // Mongoose validation error
        statusCode = 400;
        message = 'Validation failed';
        details = {};
        
        Object.keys(error.errors).forEach(key => {
            details[key] = error.errors[key].message;
        });
    } else if (error.name === 'CastError') {
        // Mongoose cast error (invalid ObjectId, etc.)
        statusCode = 400;
        message = 'Invalid data format';
        details = { [error.path]: `Invalid ${error.kind}: ${error.value}` };
    } else if (error.code === 11000) {
        // MongoDB duplicate key error
        statusCode = 409;
        message = 'Duplicate entry';
        const field = Object.keys(error.keyValue)[0];
        const value = error.keyValue[field];
        details = { [field]: `${field} '${value}' already exists` };
    } else if (error.name === 'JsonWebTokenError') {
        // JWT error
        statusCode = 401;
        message = 'Invalid token';
    } else if (error.name === 'TokenExpiredError') {
        // JWT expired
        statusCode = 401;
        message = 'Token expired';
    } else if (error.statusCode || error.status) {
        // Custom error with status code
        statusCode = error.statusCode || error.status;
        message = error.message || message;
        details = error.details || null;
    }

    // Send error response
    res.status(statusCode).json({
        success: false,
        message,
        data: {},
        error: {
            code: error.code || error.name || 'INTERNAL_ERROR',
            message: error.message || 'An unexpected error occurred',
            details,
            ...(process.env.NODE_ENV === 'development' && {
                stack: error.stack
            })
        }
    });
}

// Enhanced error handler middleware for Express
const expressErrorHandler = (error, req, res, next) => {
    console.error('Express Error Handler:', {
        url: req.url,
        method: req.method,
        message: error.message,
        stack: error.stack,
        body: req.body
    });

    // Use the existing error handler
    errorHandler(res)(error);
};

// Custom error classes
class ValidationError extends Error {
    constructor(message, details = null) {
        super(message);
        this.name = 'ValidationError';
        this.statusCode = 400;
        this.details = details;
    }
}

class NotFoundError extends Error {
    constructor(message = 'Resource not found') {
        super(message);
        this.name = 'NotFoundError';
        this.statusCode = 404;
    }
}

class ConflictError extends Error {
    constructor(message, details = null) {
        super(message);
        this.name = 'ConflictError';
        this.statusCode = 409;
        this.details = details;
    }
}

class UnauthorizedError extends Error {
    constructor(message = 'Unauthorized') {
        super(message);
        this.name = 'UnauthorizedError';
        this.statusCode = 401;
    }
}

class ForbiddenError extends Error {
    constructor(message = 'Forbidden') {
        super(message);
        this.name = 'ForbiddenError';
        this.statusCode = 403;
    }
}

class BadRequestError extends Error {
    constructor(message, details = null) {
        super(message);
        this.name = 'BadRequestError';
        this.statusCode = 400;
        this.details = details;
    }
}

module.exports = {
    errorHandler,
    expressErrorHandler,
    ValidationError,
    NotFoundError,
    ConflictError,
    UnauthorizedError,
    ForbiddenError,
    BadRequestError
};
