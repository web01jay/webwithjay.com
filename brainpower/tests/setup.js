const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

// Setup before all tests
beforeAll(async () => {
  // Close any existing connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  
  // Create an in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect to the in-memory database
  await mongoose.connect(mongoUri);
});

// Cleanup after each test
afterEach(async () => {
  // Clear all collections after each test
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
});

// Cleanup after all tests
afterAll(async () => {
  try {
    // Close the database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
    
    // Stop the in-memory MongoDB instance
    if (mongoServer) {
      await mongoServer.stop();
    }
  } catch (error) {
    console.error('Error during test cleanup:', error);
  }
});

// Global test utilities
global.testUtils = {
  // Helper to create test data
  createTestData: {
    product: (overrides = {}) => ({
      name: 'Test Product',
      description: 'Test Description',
      basePrice: 100,
      category: 'Test Category',
      sku: 'TEST-SKU-' + Date.now(),
      hsnCode: 9021,
      ...overrides
    }),
    
    client: (overrides = {}) => ({
      name: 'Test Client',
      email: 'test@example.com',
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
      ...overrides
    }),
    
    invoice: (clientId, productId, overrides = {}) => ({
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
      notes: 'Test invoice',
      ...overrides
    })
  }
};