/**
 * Test data factory for generating consistent test data
 */

class DataFactory {
  static product(overrides = {}) {
    return {
      name: 'Test Product',
      description: 'Test product description',
      basePrice: 100,
      category: 'Test Category',
      sku: 'TEST-SKU-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      hsnCode: 9021,
      isActive: true,
      ...overrides
    };
  }

  static client(overrides = {}) {
    const timestamp = Date.now();
    return {
      name: 'Test Client',
      email: `test${timestamp}@example.com`,
      phone: '1234567890',
      gstNumber: '29ABCDE1234F1Z5',
      panNumber: 'ABCDE1234F',
      aadharNumber: '123456789012',
      address: {
        street: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'India'
      },
      isActive: true,
      ...overrides
    };
  }

  static invoice(clientId, productId, overrides = {}) {
    return {
      clientId,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: 'draft',
      taxType: 'in-state',
      items: [{
        productId,
        size: 'medium',
        quantity: 1,
        customPrice: 100
      }],
      notes: 'Test invoice notes',
      ...overrides
    };
  }

  static invoiceItem(productId, overrides = {}) {
    return {
      productId,
      size: 'medium',
      quantity: 1,
      customPrice: 100,
      ...overrides
    };
  }

  static validSizes() {
    return ['pediatric', 'x-small', 'small', 'medium', 'large', 'x-large', 'xxl', 'xxxl', 'universal'];
  }

  static validStatuses() {
    return ['draft', 'sent', 'paid', 'overdue'];
  }

  static validTaxTypes() {
    return ['in-state', 'out-state'];
  }

  static invalidData() {
    return {
      product: {
        missingName: { description: 'Test', basePrice: 100, category: 'Test' },
        missingPrice: { name: 'Test', description: 'Test', category: 'Test' },
        missingCategory: { name: 'Test', description: 'Test', basePrice: 100 },
        negativePrice: { name: 'Test', description: 'Test', basePrice: -100, category: 'Test' },
        invalidHsnCode: { name: 'Test', description: 'Test', basePrice: 100, category: 'Test', hsnCode: 'invalid' }
      },
      client: {
        missingName: { email: 'test@example.com', phone: '1234567890' },
        missingEmail: { name: 'Test Client', phone: '1234567890' },
        missingPhone: { name: 'Test Client', email: 'test@example.com' },
        invalidEmail: { name: 'Test Client', email: 'invalid-email', phone: '1234567890' },
        invalidGst: { name: 'Test Client', email: 'test@example.com', phone: '1234567890', gstNumber: 'invalid-gst' }
      },
      invoice: {
        missingClient: { invoiceDate: new Date(), dueDate: new Date(), taxType: 'in-state', items: [] },
        missingDate: { clientId: 'someId', dueDate: new Date(), taxType: 'in-state', items: [] },
        missingTaxType: { clientId: 'someId', invoiceDate: new Date(), dueDate: new Date(), items: [] },
        emptyItems: { clientId: 'someId', invoiceDate: new Date(), dueDate: new Date(), taxType: 'in-state', items: [] },
        invalidTaxType: { clientId: 'someId', invoiceDate: new Date(), dueDate: new Date(), taxType: 'invalid', items: [] }
      }
    };
  }
}

module.exports = DataFactory;