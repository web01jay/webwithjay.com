const { validateTaxCalculation, formatValidationErrors } = require('../middleware/requestValidator');

describe('Validation Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            body: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
    });

    describe('validateTaxCalculation', () => {
        test('should pass validation for valid in-state tax calculation', () => {
            req.body = {
                taxType: 'in-state',
                items: [
                    { quantity: 2, customPrice: 100 },
                    { quantity: 1, customPrice: 50 }
                ]
            };

            validateTaxCalculation(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.calculatedSubtotal).toBe(250);
        });

        test('should pass validation for valid out-state tax calculation', () => {
            req.body = {
                taxType: 'out-state',
                items: [
                    { quantity: 1, customPrice: 200 }
                ]
            };

            validateTaxCalculation(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.calculatedSubtotal).toBe(200);
        });

        test('should fail validation for invalid tax type', () => {
            req.body = {
                taxType: 'invalid-type',
                items: [
                    { quantity: 1, customPrice: 100 }
                ]
            };

            validateTaxCalculation(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(next).not.toHaveBeenCalled();
        });

        test('should fail validation for empty items array', () => {
            req.body = {
                taxType: 'in-state',
                items: []
            };

            validateTaxCalculation(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(next).not.toHaveBeenCalled();
        });

        test('should fail validation for invalid item quantities', () => {
            req.body = {
                taxType: 'in-state',
                items: [
                    { quantity: 0, customPrice: 100 },
                    { quantity: -1, customPrice: 50 }
                ]
            };

            validateTaxCalculation(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(next).not.toHaveBeenCalled();
        });

        test('should fail validation for negative custom prices', () => {
            req.body = {
                taxType: 'in-state',
                items: [
                    { quantity: 1, customPrice: -100 }
                ]
            };

            validateTaxCalculation(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(next).not.toHaveBeenCalled();
        });

        test('should skip validation when taxType or items are missing', () => {
            req.body = {};

            validateTaxCalculation(req, res, next);

            expect(next).toHaveBeenCalled();
        });
    });

    describe('formatValidationErrors', () => {
        test('should format Joi validation errors correctly', () => {
            const joiErrors = [
                { path: ['name'], message: 'Name is required' },
                { path: ['email'], message: 'Email must be valid' }
            ];

            const formatted = formatValidationErrors(joiErrors);

            expect(formatted).toEqual([
                'name: Name is required',
                'email: Email must be valid'
            ]);
        });

        test('should format custom validation errors correctly', () => {
            const customErrors = [
                'Custom error message',
                new Error('Another error')
            ];

            const formatted = formatValidationErrors(customErrors);

            expect(formatted).toEqual([
                'Custom error message',
                'Error: Another error'
            ]);
        });
    });
});