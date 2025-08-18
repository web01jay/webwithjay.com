const { generateInvoicePDF, generateInvoiceHTML } = require('../utils/pdfGenerator');

// Mock invoice data for testing
const mockInvoice = {
    invoiceNumber: 'INV-2024-0001',
    invoiceDate: new Date('2024-01-15'),
    dueDate: new Date('2024-02-15'),
    status: 'sent',
    subtotal: 1000,
    cgst: 25,
    sgst: 25,
    igst: 0,
    totalTaxAmount: 50,
    totalAmount: 1050,
    taxType: 'in-state',
    notes: 'Thank you for your business!',
    clientId: {
        name: 'Test Client Ltd.',
        email: 'client@test.com',
        phone: '+91 98765 43210',
        gstNumber: '27ABCDE1234F1Z5',
        panNumber: 'ABCDE1234F',
        address: {
            street: '123 Test Street',
            city: 'Mumbai',
            state: 'Maharashtra',
            zipCode: '400001',
            country: 'India'
        }
    },
    items: [
        {
            productId: {
                name: 'Test Product 1',
                description: 'A sample product for testing',
                hsnCode: '9021'
            },
            size: 'medium',
            quantity: 2,
            customPrice: 300,
            totalPrice: 600
        },
        {
            productId: {
                name: 'Test Product 2',
                description: 'Another sample product',
                hsnCode: '9021'
            },
            size: 'large',
            quantity: 1,
            customPrice: 400,
            totalPrice: 400
        }
    ]
};

describe('PDF Generator', () => {
    describe('generateInvoiceHTML', () => {
        test('should generate HTML template with invoice data', () => {
            const html = generateInvoiceHTML(mockInvoice);
            
            expect(html).toContain('INV-2024-0001');
            expect(html).toContain('Test Client Ltd.');
            expect(html).toContain('Test Product 1');
            expect(html).toContain('Test Product 2');
            expect(html).toContain('₹1,050.00');
            expect(html).toContain('CGST (2.5%)');
            expect(html).toContain('SGST (2.5%)');
            expect(html).toContain('Thank you for your business!');
        });

        test('should handle out-state tax type', () => {
            const outStateInvoice = {
                ...mockInvoice,
                taxType: 'out-state',
                cgst: 0,
                sgst: 0,
                igst: 50
            };
            
            const html = generateInvoiceHTML(outStateInvoice);
            
            expect(html).toContain('IGST (5%)');
            expect(html).not.toContain('CGST');
            expect(html).not.toContain('SGST');
        });

        test('should handle invoice without notes', () => {
            const invoiceWithoutNotes = {
                ...mockInvoice,
                notes: null
            };
            
            const html = generateInvoiceHTML(invoiceWithoutNotes);
            
            expect(html).not.toContain('Notes:');
        });
    });

    describe('generateInvoicePDF', () => {
        test('should generate PDF buffer', async () => {
            const pdfBuffer = await generateInvoicePDF(mockInvoice);
            
            expect(pdfBuffer).toBeInstanceOf(Buffer);
            expect(pdfBuffer.length).toBeGreaterThan(0);
            
            // Check PDF header
            const pdfHeader = pdfBuffer.toString('ascii', 0, 4);
            expect(pdfHeader).toBe('%PDF');
        }, 30000); // Increase timeout for PDF generation

        test('should handle errors gracefully', async () => {
            // Test with completely invalid data that would cause template errors
            const invalidInvoice = { 
                invoiceNumber: 'TEST-001',
                items: null, // This will cause template errors
                clientId: null
            };
            
            await expect(generateInvoicePDF(invalidInvoice)).rejects.toThrow('Failed to generate PDF');
        });
    });
});