const mongoose = require('mongoose');
const Product = require('../models/product.model');

describe('Test Setup Verification', () => {
  test('should connect to test database', () => {
    expect(mongoose.connection.readyState).toBe(1); // 1 = connected
  });

  test('should be able to create and retrieve test data', async () => {
    // Create a test product
    const productData = {
      name: 'Test Product',
      description: 'Test Description',
      basePrice: 100,
      category: 'Test Category',
      sku: 'TEST-SKU-' + Date.now(),
      hsnCode: 9021
    };

    const product = await Product.create(productData);
    expect(product._id).toBeDefined();
    expect(product.name).toBe(productData.name);

    // Retrieve the product
    const foundProduct = await Product.findById(product._id);
    expect(foundProduct).toBeTruthy();
    expect(foundProduct.name).toBe(productData.name);
  });

  test('should clean up data between tests', async () => {
    // This test should start with a clean database
    const productCount = await Product.countDocuments();
    expect(productCount).toBe(0);
  });
});