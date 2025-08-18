const mongoose = require('mongoose');
const Invoice = require('../../../models/invoice.model');
const Client = require('../../../models/client.model');
const Product = require('../../../models/product.model');
const DataFactory = require('../../factories/dataFactory');

describe('Invoice Model Unit Tests', () => {
  let testClient, testProduct;

  beforeEach(async () => {
    // Create test client and product for invoice tests
    testClient = await Client.create(DataFactory.client());
    testProduct = await Product.create(DataFactory.product());
  });

  describe('Invoice Creation', () => {
    test('should create a valid invoice with all fields', async () => {
      const invoiceData = DataFactory.invoice(testClient._id, testProduct._id);
      const invoice = new Invoice(invoiceData);
      
      const savedInvoice = await invoice.save();
      
      expect(savedInvoice._id).toBeDefined();
      expect(savedInvoice.invoiceNumber).toMatch(/^INV-\d{4}-\d{4}$/); // Auto-generated format
      expect(savedInvoice.clientId.toString()).toBe(testClient._id.toString());
      expect(savedInvoice.invoiceDate).toBeDefined();
      expect(savedInvoice.dueDate).toBeDefined();
      expect(savedInvoice.status).toBe('draft');
      expect(savedInvoice.taxType).toBe('in-state');
      expect(savedInvoice.items).toHaveLength(1);
      expect(savedInvoice.items[0].productId.toString()).toBe(testProduct._id.toString());
      expect(savedInvoice.items[0].size).toBe('medium');
      expect(savedInvoice.items[0].quantity).toBe(1);
      expect(savedInvoice.items[0].customPrice).toBe(100);
      expect(savedInvoice.items[0].totalPrice).toBe(100); // quantity * customPrice
      expect(savedInvoice.createdAt).toBeDefined();
      expect(savedInvoice.updatedAt).toBeDefined();
    });

    test('should auto-generate invoice number', async () => {
      const invoiceData = DataFactory.invoice(testClient._id, testProduct._id);
      delete invoiceData.invoiceNumber; // Remove to test auto-generation
      
      const invoice = new Invoice(invoiceData);
      const savedInvoice = await invoice.save();
      
      expect(savedInvoice.invoiceNumber).toMatch(/^INV-\d{4}-\d{4}$/);
    });

    test('should calculate totals automatically for in-state tax', async () => {
      const invoiceData = DataFactory.invoice(testClient._id, testProduct._id, {
        taxType: 'in-state',
        items: [
          { productId: testProduct._id, size: 'medium', quantity: 2, customPrice: 100 },
          { productId: testProduct._id, size: 'large', quantity: 1, customPrice: 150 }
        ]
      });
      
      const invoice = new Invoice(invoiceData);
      const savedInvoice = await invoice.save();
      
      expect(savedInvoice.subtotal).toBe(350); // (2*100) + (1*150)
      expect(savedInvoice.cgst).toBe(8.75); // 2.5% of 350
      expect(savedInvoice.sgst).toBe(8.75); // 2.5% of 350
      expect(savedInvoice.igst).toBe(0);
      expect(savedInvoice.totalTaxAmount).toBe(17.5); // cgst + sgst
      expect(savedInvoice.totalAmount).toBe(367.5); // subtotal + totalTaxAmount
    });

    test('should calculate totals automatically for out-state tax', async () => {
      const invoiceData = DataFactory.invoice(testClient._id, testProduct._id, {
        taxType: 'out-state',
        items: [
          { productId: testProduct._id, size: 'medium', quantity: 2, customPrice: 100 }
        ]
      });
      
      const invoice = new Invoice(invoiceData);
      const savedInvoice = await invoice.save();
      
      expect(savedInvoice.subtotal).toBe(200); // 2*100
      expect(savedInvoice.cgst).toBe(0);
      expect(savedInvoice.sgst).toBe(0);
      expect(savedInvoice.igst).toBe(10); // 5% of 200
      expect(savedInvoice.totalTaxAmount).toBe(10); // igst
      expect(savedInvoice.totalAmount).toBe(210); // subtotal + totalTaxAmount
    });

    test('should calculate item total prices correctly', async () => {
      const invoiceData = DataFactory.invoice(testClient._id, testProduct._id, {
        items: [
          { productId: testProduct._id, size: 'small', quantity: 3, customPrice: 75 },
          { productId: testProduct._id, size: 'large', quantity: 2, customPrice: 125 }
        ]
      });
      
      const invoice = new Invoice(invoiceData);
      const savedInvoice = await invoice.save();
      
      expect(savedInvoice.items[0].totalPrice).toBe(225); // 3 * 75
      expect(savedInvoice.items[1].totalPrice).toBe(250); // 2 * 125
    });
  });

  describe('Invoice Validation', () => {
    test('should fail validation when clientId is missing', async () => {
      const invoiceData = DataFactory.invalidData().invoice.missingClient;
      const invoice = new Invoice(invoiceData);
      
      await expect(invoice.save()).rejects.toThrow('Client is required');
    });

    test('should use default invoice date when not provided', async () => {
      const invoiceData = {
        clientId: testClient._id,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        taxType: 'in-state',
        items: [{ productId: testProduct._id, size: 'medium', quantity: 1, customPrice: 100 }]
        // invoiceDate will use default Date.now
      };
      const invoice = new Invoice(invoiceData);
      
      const savedInvoice = await invoice.save();
      
      expect(savedInvoice.invoiceDate).toBeDefined();
      expect(savedInvoice.invoiceDate).toBeInstanceOf(Date);
    });

    test('should fail validation when taxType is missing', async () => {
      const invoiceData = DataFactory.invalidData().invoice.missingTaxType;
      invoiceData.clientId = testClient._id;
      const invoice = new Invoice(invoiceData);
      
      await expect(invoice.save()).rejects.toThrow('Tax type is required');
    });

    test('should fail validation when items array is empty', async () => {
      const invoiceData = DataFactory.invalidData().invoice.emptyItems;
      invoiceData.clientId = testClient._id;
      const invoice = new Invoice(invoiceData);
      
      await expect(invoice.save()).rejects.toThrow('Invoice must have at least one item');
    });

    test('should fail validation with invalid tax type', async () => {
      const invoiceData = DataFactory.invoice(testClient._id, testProduct._id, {
        taxType: 'invalid-tax-type'
      });
      const invoice = new Invoice(invoiceData);
      
      await expect(invoice.save()).rejects.toThrow('Tax type must be either in-state or out-state');
    });

    test('should fail validation with invalid status', async () => {
      const invoiceData = DataFactory.invoice(testClient._id, testProduct._id, {
        status: 'invalid-status'
      });
      const invoice = new Invoice(invoiceData);
      
      await expect(invoice.save()).rejects.toThrow('Status must be one of: draft, sent, paid, overdue');
    });

    test('should fail validation when due date is before invoice date', async () => {
      const invoiceDate = new Date();
      const dueDate = new Date(invoiceDate.getTime() - 24 * 60 * 60 * 1000); // 1 day before
      
      const invoiceData = DataFactory.invoice(testClient._id, testProduct._id, {
        invoiceDate,
        dueDate
      });
      const invoice = new Invoice(invoiceData);
      
      await expect(invoice.save()).rejects.toThrow('Due date must be after invoice date');
    });

    test('should fail validation when notes exceed maximum length', async () => {
      const invoiceData = DataFactory.invoice(testClient._id, testProduct._id, {
        notes: 'A'.repeat(1001) // Exceeds 1000 character limit
      });
      const invoice = new Invoice(invoiceData);
      
      await expect(invoice.save()).rejects.toThrow('Notes cannot exceed 1000 characters');
    });
  });

  describe('Invoice Item Validation', () => {
    test('should fail validation when item productId is missing', async () => {
      const invoiceData = DataFactory.invoice(testClient._id, testProduct._id, {
        items: [{ size: 'medium', quantity: 1, customPrice: 100 }] // Missing productId
      });
      const invoice = new Invoice(invoiceData);
      
      await expect(invoice.save()).rejects.toThrow('Product is required');
    });

    test('should fail validation when item size is missing', async () => {
      const invoiceData = DataFactory.invoice(testClient._id, testProduct._id, {
        items: [{ productId: testProduct._id, quantity: 1, customPrice: 100 }] // Missing size
      });
      const invoice = new Invoice(invoiceData);
      
      await expect(invoice.save()).rejects.toThrow('Size is required');
    });

    test('should fail validation when item quantity is missing', async () => {
      const invoiceData = DataFactory.invoice(testClient._id, testProduct._id, {
        items: [{ productId: testProduct._id, size: 'medium', customPrice: 100 }] // Missing quantity
      });
      const invoice = new Invoice(invoiceData);
      
      await expect(invoice.save()).rejects.toThrow('Quantity is required');
    });

    test('should fail validation when item customPrice is missing', async () => {
      const invoiceData = DataFactory.invoice(testClient._id, testProduct._id, {
        items: [{ productId: testProduct._id, size: 'medium', quantity: 1 }] // Missing customPrice
      });
      const invoice = new Invoice(invoiceData);
      
      await expect(invoice.save()).rejects.toThrow('Custom price is required');
    });

    test('should fail validation with invalid size', async () => {
      const invoiceData = DataFactory.invoice(testClient._id, testProduct._id, {
        items: [{ productId: testProduct._id, size: 'invalid-size', quantity: 1, customPrice: 100 }]
      });
      const invoice = new Invoice(invoiceData);
      
      await expect(invoice.save()).rejects.toThrow('Size must be one of: pediatric, x-small, small, medium, large, x-large, xxl, xxxl, universal');
    });

    test('should fail validation with negative quantity', async () => {
      const invoiceData = DataFactory.invoice(testClient._id, testProduct._id, {
        items: [{ productId: testProduct._id, size: 'medium', quantity: -1, customPrice: 100 }]
      });
      const invoice = new Invoice(invoiceData);
      
      await expect(invoice.save()).rejects.toThrow('Quantity must be at least 1');
    });

    test('should fail validation with negative custom price', async () => {
      const invoiceData = DataFactory.invoice(testClient._id, testProduct._id, {
        items: [{ productId: testProduct._id, size: 'medium', quantity: 1, customPrice: -100 }]
      });
      const invoice = new Invoice(invoiceData);
      
      await expect(invoice.save()).rejects.toThrow('Custom price cannot be negative');
    });

    test('should accept all valid sizes', async () => {
      const validSizes = DataFactory.validSizes();
      
      for (const size of validSizes) {
        const invoiceData = DataFactory.invoice(testClient._id, testProduct._id, {
          items: [{ productId: testProduct._id, size, quantity: 1, customPrice: 100 }]
        });
        const invoice = new Invoice(invoiceData);
        
        const savedInvoice = await invoice.save();
        expect(savedInvoice.items[0].size).toBe(size);
        
        // Clean up for next iteration
        await Invoice.deleteOne({ _id: savedInvoice._id });
      }
    });
  });

  describe('Tax Calculation Logic', () => {
    test('should calculate in-state taxes correctly with multiple items', async () => {
      const invoiceData = DataFactory.invoice(testClient._id, testProduct._id, {
        taxType: 'in-state',
        items: [
          { productId: testProduct._id, size: 'small', quantity: 2, customPrice: 50 },
          { productId: testProduct._id, size: 'medium', quantity: 3, customPrice: 75 },
          { productId: testProduct._id, size: 'large', quantity: 1, customPrice: 200 }
        ]
      });
      
      const invoice = new Invoice(invoiceData);
      const savedInvoice = await invoice.save();
      
      const expectedSubtotal = (2 * 50) + (3 * 75) + (1 * 200); // 100 + 225 + 200 = 525
      const expectedCgst = expectedSubtotal * 0.025; // 13.125
      const expectedSgst = expectedSubtotal * 0.025; // 13.125
      const expectedTotal = expectedSubtotal + expectedCgst + expectedSgst; // 551.25
      
      expect(savedInvoice.subtotal).toBe(expectedSubtotal);
      expect(savedInvoice.cgst).toBe(expectedCgst);
      expect(savedInvoice.sgst).toBe(expectedSgst);
      expect(savedInvoice.igst).toBe(0);
      expect(savedInvoice.totalTaxAmount).toBe(expectedCgst + expectedSgst);
      expect(savedInvoice.totalAmount).toBe(expectedTotal);
    });

    test('should calculate out-state taxes correctly with multiple items', async () => {
      const invoiceData = DataFactory.invoice(testClient._id, testProduct._id, {
        taxType: 'out-state',
        items: [
          { productId: testProduct._id, size: 'medium', quantity: 4, customPrice: 125 },
          { productId: testProduct._id, size: 'large', quantity: 2, customPrice: 175 }
        ]
      });
      
      const invoice = new Invoice(invoiceData);
      const savedInvoice = await invoice.save();
      
      const expectedSubtotal = (4 * 125) + (2 * 175); // 500 + 350 = 850
      const expectedIgst = expectedSubtotal * 0.05; // 42.5
      const expectedTotal = expectedSubtotal + expectedIgst; // 892.5
      
      expect(savedInvoice.subtotal).toBe(expectedSubtotal);
      expect(savedInvoice.cgst).toBe(0);
      expect(savedInvoice.sgst).toBe(0);
      expect(savedInvoice.igst).toBe(expectedIgst);
      expect(savedInvoice.totalTaxAmount).toBe(expectedIgst);
      expect(savedInvoice.totalAmount).toBe(expectedTotal);
    });

    test('should recalculate taxes when tax type is changed', async () => {
      const invoiceData = DataFactory.invoice(testClient._id, testProduct._id, {
        taxType: 'in-state',
        items: [{ productId: testProduct._id, size: 'medium', quantity: 1, customPrice: 100 }]
      });
      
      const invoice = new Invoice(invoiceData);
      let savedInvoice = await invoice.save();
      
      // Verify in-state calculation
      expect(savedInvoice.cgst).toBe(2.5);
      expect(savedInvoice.sgst).toBe(2.5);
      expect(savedInvoice.igst).toBe(0);
      expect(savedInvoice.totalAmount).toBe(105);
      
      // Change to out-state
      savedInvoice.taxType = 'out-state';
      savedInvoice = await savedInvoice.save();
      
      // Verify out-state calculation
      expect(savedInvoice.cgst).toBe(0);
      expect(savedInvoice.sgst).toBe(0);
      expect(savedInvoice.igst).toBe(5);
      expect(savedInvoice.totalAmount).toBe(105); // Same total, different tax breakdown
    });
  });

  describe('Invoice Updates', () => {
    test('should update invoice fields correctly', async () => {
      const invoice = new Invoice(DataFactory.invoice(testClient._id, testProduct._id));
      const savedInvoice = await invoice.save();
      
      // Update fields
      savedInvoice.status = 'sent';
      savedInvoice.notes = 'Updated notes';
      savedInvoice.items[0].quantity = 3;
      
      const updatedInvoice = await savedInvoice.save();
      
      expect(updatedInvoice.status).toBe('sent');
      expect(updatedInvoice.notes).toBe('Updated notes');
      expect(updatedInvoice.items[0].quantity).toBe(3);
      expect(updatedInvoice.items[0].totalPrice).toBe(300); // Recalculated
      expect(updatedInvoice.subtotal).toBe(300); // Recalculated
      expect(updatedInvoice.updatedAt).not.toEqual(updatedInvoice.createdAt);
    });

    test('should maintain validation on updates', async () => {
      const invoice = new Invoice(DataFactory.invoice(testClient._id, testProduct._id));
      const savedInvoice = await invoice.save();
      
      // Try to update with invalid data
      savedInvoice.status = 'invalid-status';
      
      await expect(savedInvoice.save()).rejects.toThrow('Status must be one of: draft, sent, paid, overdue');
    });
  });

  describe('Invoice Queries', () => {
    beforeEach(async () => {
      // Create test invoices
      const client2 = await Client.create(DataFactory.client({ email: 'client2@example.com' }));
      
      // Create invoices one by one to avoid duplicate invoice numbers
      const invoice1 = new Invoice(DataFactory.invoice(testClient._id, testProduct._id, { 
        status: 'draft',
        invoiceDate: new Date('2024-01-15')
      }));
      await invoice1.save();

      const invoice2 = new Invoice(DataFactory.invoice(testClient._id, testProduct._id, { 
        status: 'sent',
        invoiceDate: new Date('2024-01-20')
      }));
      await invoice2.save();

      const invoice3 = new Invoice(DataFactory.invoice(client2._id, testProduct._id, { 
        status: 'paid',
        invoiceDate: new Date('2024-01-25')
      }));
      await invoice3.save();
    });

    test('should find invoices by client', async () => {
      const invoices = await Invoice.find({ clientId: testClient._id });
      
      expect(invoices).toHaveLength(2);
      expect(invoices.every(i => i.clientId.toString() === testClient._id.toString())).toBe(true);
    });

    test('should find invoices by status', async () => {
      const draftInvoices = await Invoice.find({ status: 'draft' });
      
      expect(draftInvoices).toHaveLength(1);
      expect(draftInvoices[0].status).toBe('draft');
    });

    test('should find invoices by date range', async () => {
      const startDate = new Date('2024-01-18');
      const endDate = new Date('2024-01-30');
      
      const invoices = await Invoice.find({
        invoiceDate: { $gte: startDate, $lte: endDate }
      });
      
      expect(invoices).toHaveLength(2);
      expect(invoices.every(i => i.invoiceDate >= startDate && i.invoiceDate <= endDate)).toBe(true);
    });
  });
});