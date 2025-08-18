const request = require('supertest');
const mongoose = require('mongoose');

// Import models
const Invoice = require('../models/invoice.model');
const Client = require('../models/client.model');
const Product = require('../models/product.model');

// Import app (we'll need to create a test app setup)
const express = require('express');
const invoiceRoutes = require('../routes/invoice.routes');

let app;

// Create test app
const createTestApp = () => {
    const testApp = express();
    testApp.use(express.json());
    testApp.use('/api/invoices', invoiceRoutes);
    return testApp;
};

describe('Invoice PDF Integration Tests', () => {
    beforeAll(async () => {
        // Create test app (database connection handled by global setup)
        app = createTestApp();
    });

    beforeEach(async () => {
        // Clear all collections (handled by global setup, but we can add specific cleanup if needed)
        await Invoice.deleteMany({});
        await Client.deleteMany({});
        await Product.deleteMany({});
    });

    describe('GET /api/invoices/:id/pdf', () => {
        test('should generate and return PDF for valid invoice', async () => {
            // Create test client
            const client = await Client.create({
                name: 'Test Client Ltd.',
                email: 'client@test.com',
                phone: '+91 98765 43210',
                gstNumber: '27ABCDE1234F1Z5',
                address: {
                    street: '123 Test Street',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    zipCode: '400001',
                    country: 'India'
                }
            });

            // Create test product
            const product = await Product.create({
                name: 'Test Product',
                description: 'A sample product for testing',
                basePrice: 300,
                category: 'Test Category',
                hsnCode: 9021
            });

            // Create test invoice
            const invoiceData = {
                clientId: client._id,
                invoiceDate: new Date('2024-01-15'),
                dueDate: new Date('2024-02-15'),
                taxType: 'in-state',
                items: [{
                    productId: product._id,
                    size: 'medium',
                    quantity: 2,
                    customPrice: 300
                }],
                notes: 'Test invoice for PDF generation'
            };
            
            const invoice = new Invoice(invoiceData);
            await invoice.save();

            // Test PDF generation endpoint
            const response = await request(app)
                .get(`/api/invoices/${invoice._id}/pdf`)
                .expect(200);

            // Verify response headers
            expect(response.headers['content-type']).toBe('application/pdf');
            expect(response.headers['content-disposition']).toContain('attachment');
            expect(response.headers['content-disposition']).toContain(`invoice-${invoice.invoiceNumber}.pdf`);

            // Verify PDF content
            expect(response.body).toBeInstanceOf(Buffer);
            expect(response.body.length).toBeGreaterThan(0);

            // Check PDF header
            const pdfHeader = response.body.toString('ascii', 0, 4);
            expect(pdfHeader).toBe('%PDF');
        }, 30000);

        test('should return 404 for non-existent invoice', async () => {
            const nonExistentId = new mongoose.Types.ObjectId();
            
            const response = await request(app)
                .get(`/api/invoices/${nonExistentId}/pdf`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invoice not found');
        });

        test('should return 400 for invalid invoice ID', async () => {
            const response = await request(app)
                .get('/api/invoices/invalid-id/pdf')
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });
});