const request = require('supertest');
const app = require('../../index');

/**
 * Test helper utilities for API testing
 */
class TestHelpers {
  constructor() {
    this.app = app;
  }

  /**
   * Create a test request with common headers
   */
  createRequest() {
    return request(this.app);
  }

  /**
   * Create authenticated request (if authentication is needed)
   */
  createAuthenticatedRequest(token = null) {
    const req = request(this.app);
    if (token) {
      req.set('Authorization', `Bearer ${token}`);
    }
    return req;
  }

  /**
   * Helper to create test product
   */
  async createTestProduct(data = {}) {
    const productData = {
      name: 'Test Product',
      description: 'Test Description',
      basePrice: 100,
      category: 'Test Category',
      sku: 'TEST-SKU-' + Date.now(),
      hsnCode: 9021,
      ...data
    };

    const response = await this.createRequest()
      .post('/api/products')
      .send(productData);

    return response.body.data;
  }

  /**
   * Helper to create test client
   */
  async createTestClient(data = {}) {
    const clientData = {
      name: 'Test Client',
      email: 'test' + Date.now() + '@example.com',
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
      ...data
    };

    const response = await this.createRequest()
      .post('/api/clients')
      .send(clientData);

    return response.body.data;
  }

  /**
   * Helper to create test invoice
   */
  async createTestInvoice(clientId, productId, data = {}) {
    const invoiceData = {
      clientId,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'draft',
      taxType: 'in-state',
      items: [{
        productId,
        size: 'medium',
        quantity: 1,
        customPrice: 100
      }],
      notes: 'Test invoice',
      ...data
    };

    const response = await this.createRequest()
      .post('/api/invoices')
      .send(invoiceData);

    return response.body.data;
  }

  /**
   * Helper to validate API response structure
   */
  validateApiResponse(response, expectedStatus = 200) {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toHaveProperty('success');
    
    if (expectedStatus >= 200 && expectedStatus < 300) {
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('data');
    } else {
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('error');
    }
  }

  /**
   * Helper to validate error response structure
   */
  validateErrorResponse(response, expectedStatus, expectedErrorCode = null) {
    expect(response.status).toBe(expectedStatus);
    expect(response.body.success).toBe(false);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('message');
    
    if (expectedErrorCode) {
      expect(response.body.error).toHaveProperty('code', expectedErrorCode);
    }
  }

  /**
   * Helper to validate pagination response
   */
  validatePaginationResponse(response) {
    this.validateApiResponse(response);
    expect(response.body.data).toHaveProperty('items');
    expect(response.body.data).toHaveProperty('pagination');
    expect(response.body.data.pagination).toHaveProperty('page');
    expect(response.body.data.pagination).toHaveProperty('limit');
    expect(response.body.data.pagination).toHaveProperty('total');
    expect(response.body.data.pagination).toHaveProperty('pages');
  }
}

module.exports = new TestHelpers();