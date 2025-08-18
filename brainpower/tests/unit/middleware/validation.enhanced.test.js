const request = require('supertest');
const express = require('express');
const { 
    validateSecurityConstraints, 
    validateRateLimit,
    sanitizeInput,
    sanitizeObject,
    checkReferenceIntegrity
} = require('../../../middleware/requestValidator');
const { 
    ValidationError,
    BadRequestError,
    NotFoundError
} = require('../../../middleware/errorHandler');

describe('Enhanced Validation Middleware', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json());
    });

    describe('Security Validation', () => {
        beforeEach(() => {
            app.post('/test', validateSecurityConstraints, (req, res) => {
                res.json({ success: true });
            });
        });

        it('should block SQL injection attempts', async () => {
            const maliciousPayload = {
                name: "'; DROP TABLE users; --",
                description: "SELECT * FROM products"
            };

            const response = await request(app)
                .post('/test')
                .send(maliciousPayload);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('SECURITY_VIOLATION');
        });

        it('should block XSS attempts', async () => {
            const maliciousPayload = {
                name: "<script>alert('xss')</script>",
                description: "Normal description"
            };

            const response = await request(app)
                .post('/test')
                .send(maliciousPayload);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should allow safe content', async () => {
            const safePayload = {
                name: "Safe Product Name",
                description: "This is a safe description with normal text."
            };

            const response = await request(app)
                .post('/test')
                .send(safePayload);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should reject oversized requests', async () => {
            const largePayload = {
                data: 'x'.repeat(11 * 1024 * 1024) // 11MB
            };

            const response = await request(app)
                .post('/test')
                .send(largePayload);

            expect(response.status).toBe(413);
            // The response might not have the exact structure due to Express limits
            expect(response.body.success).toBe(false);
        });
    });

    describe('Rate Limiting', () => {
        beforeEach(() => {
            app.post('/test', validateRateLimit(5, 1000), (req, res) => {
                res.json({ success: true });
            });
        });

        it('should allow requests within limit', async () => {
            for (let i = 0; i < 5; i++) {
                const response = await request(app)
                    .post('/test')
                    .send({ test: 'data' });

                expect(response.status).toBe(200);
            }
        });

        it('should block requests exceeding limit', async () => {
            // Make 5 requests (at the limit)
            for (let i = 0; i < 5; i++) {
                await request(app)
                    .post('/test')
                    .send({ test: 'data' });
            }

            // 6th request should be blocked
            const response = await request(app)
                .post('/test')
                .send({ test: 'data' });

            expect(response.status).toBe(429);
            expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
        });
    });

    describe('Input Sanitization', () => {
        it('should sanitize string input', () => {
            const input = '<script>alert("xss")</script>Hello World';
            const sanitized = sanitizeInput(input);
            
            expect(sanitized).toBe('Hello World');
            expect(sanitized).not.toContain('<script>');
        });

        it('should sanitize object input', () => {
            const input = {
                name: '<script>alert("xss")</script>Product',
                description: 'Safe description',
                nested: {
                    field: '<b>Bold text</b>'
                }
            };

            const sanitized = sanitizeObject(input);
            
            expect(sanitized.name).toBe('Product');
            expect(sanitized.description).toBe('Safe description');
            expect(sanitized.nested.field).toBe('Bold text');
        });

        it('should handle arrays in objects', () => {
            const input = {
                items: [
                    '<script>alert("xss")</script>Item 1',
                    'Safe Item 2',
                    { name: '<b>Item 3</b>' }
                ]
            };

            const sanitized = sanitizeObject(input);
            
            expect(sanitized.items[0]).toBe('Item 1');
            expect(sanitized.items[1]).toBe('Safe Item 2');
            expect(sanitized.items[2].name).toBe('Item 3');
        });

        it('should preserve non-string values', () => {
            const input = {
                name: 'Product Name',
                price: 99.99,
                active: true,
                tags: null,
                metadata: undefined
            };

            const sanitized = sanitizeObject(input);
            
            expect(sanitized.name).toBe('Product Name');
            expect(sanitized.price).toBe(99.99);
            expect(sanitized.active).toBe(true);
            expect(sanitized.tags).toBe(null);
            expect(sanitized.metadata).toBe(undefined);
        });
    });

    describe('Reference Integrity Checking', () => {
        // Mock model for testing
        const MockModel = {
            findById: jest.fn()
        };

        beforeEach(() => {
            MockModel.findById.mockClear();
        });

        it('should pass when reference exists', async () => {
            MockModel.findById.mockResolvedValue({ _id: 'valid-id', name: 'Test' });

            const result = await checkReferenceIntegrity(
                MockModel, 
                'productId', 
                'valid-id', 
                'Product not found'
            );

            expect(result).toBeDefined();
            expect(result._id).toBe('valid-id');
            expect(MockModel.findById).toHaveBeenCalledWith('valid-id');
        });

        it('should throw error when reference does not exist', async () => {
            MockModel.findById.mockResolvedValue(null);

            await expect(
                checkReferenceIntegrity(
                    MockModel, 
                    'productId', 
                    'invalid-id', 
                    'Product not found'
                )
            ).rejects.toThrow(BadRequestError);
        });

        it('should handle invalid ObjectId format', async () => {
            MockModel.findById.mockRejectedValue({ name: 'CastError', path: 'productId' });

            await expect(
                checkReferenceIntegrity(
                    MockModel, 
                    'productId', 
                    'invalid-format', 
                    'Product not found'
                )
            ).rejects.toThrow(BadRequestError);
        });

        it('should return null for empty value', async () => {
            const result = await checkReferenceIntegrity(
                MockModel, 
                'productId', 
                null, 
                'Product not found'
            );

            expect(result).toBe(null);
            expect(MockModel.findById).not.toHaveBeenCalled();
        });
    });

    describe('Custom Error Classes', () => {
        it('should create ValidationError with correct properties', () => {
            const details = { name: 'Name is required' };
            const error = new ValidationError('Validation failed', details);

            expect(error.name).toBe('ValidationError');
            expect(error.message).toBe('Validation failed');
            expect(error.statusCode).toBe(400);
            expect(error.details).toBe(details);
        });

        it('should create NotFoundError with correct properties', () => {
            const error = new NotFoundError('Resource not found');

            expect(error.name).toBe('NotFoundError');
            expect(error.message).toBe('Resource not found');
            expect(error.statusCode).toBe(404);
        });

        it('should create BadRequestError with correct properties', () => {
            const details = { field: 'Invalid value' };
            const error = new BadRequestError('Bad request', details);

            expect(error.name).toBe('BadRequestError');
            expect(error.message).toBe('Bad request');
            expect(error.statusCode).toBe(400);
            expect(error.details).toBe(details);
        });
    });

    describe('Enhanced Error Handler', () => {
        beforeEach(() => {
            app.post('/test-error', (req, res, next) => {
                const { errorType } = req.body;
                
                switch (errorType) {
                    case 'validation':
                        const validationError = new Error('Validation failed');
                        validationError.name = 'ValidationError';
                        validationError.errors = {
                            name: { message: 'Name is required' },
                            email: { message: 'Invalid email format' }
                        };
                        throw validationError;
                    
                    case 'cast':
                        const castError = new Error('Cast failed');
                        castError.name = 'CastError';
                        castError.path = 'productId';
                        castError.kind = 'ObjectId';
                        castError.value = 'invalid-id';
                        throw castError;
                    
                    case 'duplicate':
                        const duplicateError = new Error('Duplicate key');
                        duplicateError.code = 11000;
                        duplicateError.keyValue = { email: 'test@example.com' };
                        throw duplicateError;
                    
                    default:
                        throw new Error('Generic error');
                }
            });

            // Add error handler
            app.use((error, req, res, next) => {
                const { expressErrorHandler } = require('../../../middleware/errorHandler');
                expressErrorHandler(error, req, res, next);
            });
        });

        it('should handle validation errors', async () => {
            const response = await request(app)
                .post('/test-error')
                .send({ errorType: 'validation' });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Validation failed');
            expect(response.body.error.details).toBeDefined();
            expect(response.body.error.details.name).toBe('Name is required');
        });

        it('should handle cast errors', async () => {
            const response = await request(app)
                .post('/test-error')
                .send({ errorType: 'cast' });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid data format');
            expect(response.body.error.details.productId).toContain('Invalid ObjectId');
        });

        it('should handle duplicate key errors', async () => {
            const response = await request(app)
                .post('/test-error')
                .send({ errorType: 'duplicate' });

            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Duplicate entry');
            expect(response.body.error.details.email).toContain('already exists');
        });
    });
});