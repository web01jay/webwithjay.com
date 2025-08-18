const request = require('supertest');
const mongoose = require('mongoose');
const Product = require('../../models/product.model');
const DataFactory = require('../factories/dataFactory');
const testHelpers = require('../helpers/testHelpers');

// We need to create a test app since we can't import the main app directly
const express = require('express');
const productRoutes = require('../../routes/product.routes');

let app;

// Create test app
const createTestApp = () => {
  const testApp = express();
  testApp.use(express.json());
  testApp.use('/api/products', productRoutes);
  return testApp;
};

describe('Product API Integration Tests', () => {
  beforeAll(async () => {
    app = createTestApp();
  });

  describe('GET /api/products', () => {
    beforeEach(async () => {
      // Create test products
      await Product.create([
        DataFactory.product({ name: 'Product 1', category: 'Category A', isActive: true }),
        DataFactory.product({ name: 'Product 2', category: 'Category B', isActive: true }),
        DataFactory.product({ name: 'Inactive Product', category: 'Category A', isActive: false })
      ]);
    });

    test('should get all products with default pagination', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      testHelpers.validatePaginationResponse(response);
      expect(response.body.data.items).toHaveLength(3);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
      expect(response.body.data.pagination.total).toBe(3);
    });

    test('should filter products by search term', async () => {
      const response = await request(app)
        .get('/api/products?search=Product 1')
        .expect(200);

      testHelpers.validatePaginationResponse(response);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].name).toBe('Product 1');
    });

    test('should filter products by category', async () => {
      const response = await request(app)
        .get('/api/products?category=Category A')
        .expect(200);

      testHelpers.validatePaginationResponse(response);
      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.items.every(p => p.category === 'Category A')).toBe(true);
    });

    test('should filter products by active status', async () => {
      const response = await request(app)
        .get('/api/products?isActive=true')
        .expect(200);

      testHelpers.validatePaginationResponse(response);
      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.items.every(p => p.isActive === true)).toBe(true);
    });

    test('should handle pagination correctly', async () => {
      const response = await request(app)
        .get('/api/products?page=1&limit=2')
        .expect(200);

      testHelpers.validatePaginationResponse(response);
      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(2);
      expect(response.body.data.pagination.pages).toBe(2);
    });

    test('should return empty results for non-matching search', async () => {
      const response = await request(app)
        .get('/api/products?search=NonExistentProduct')
        .expect(200);

      testHelpers.validatePaginationResponse(response);
      expect(response.body.data.items).toHaveLength(0);
    });
  });

  describe('GET /api/products/:id', () => {
    let testProduct;

    beforeEach(async () => {
      testProduct = await Product.create(DataFactory.product());
    });

    test('should get product by valid ID', async () => {
      const response = await request(app)
        .get(`/api/products/${testProduct._id}`)
        .expect(200);

      testHelpers.validateApiResponse(response);
      expect(response.body.data._id).toBe(testProduct._id.toString());
      expect(response.body.data.name).toBe(testProduct.name);
    });

    test('should return 404 for non-existent product ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/products/${nonExistentId}`)
        .expect(404);

      testHelpers.validateErrorResponse(response, 404);
      expect(response.body.error.message).toBe('Product not found');
    });

    test('should return 400 for invalid product ID format', async () => {
      const response = await request(app)
        .get('/api/products/invalid-id')
        .expect(400);

      testHelpers.validateErrorResponse(response, 400);
    });
  });

  describe('POST /api/products', () => {
    test('should create product with valid data', async () => {
      const productData = DataFactory.product();
      
      const response = await request(app)
        .post('/api/products')
        .send(productData)
        .expect(201);

      testHelpers.validateApiResponse(response, 201);
      expect(response.body.data.name).toBe(productData.name);
      expect(response.body.data.basePrice).toBe(productData.basePrice);
      expect(response.body.data.category).toBe(productData.category);
      expect(response.body.data.sku).toBe(productData.sku.toUpperCase());
      expect(response.body.message).toBe('Product created successfully');

      // Verify product was saved to database
      const savedProduct = await Product.findById(response.body.data._id);
      expect(savedProduct).toBeTruthy();
    });

    test('should create product with minimal required fields', async () => {
      const productData = {
        name: 'Minimal Product',
        basePrice: 50,
        category: 'Test Category'
      };
      
      const response = await request(app)
        .post('/api/products')
        .send(productData)
        .expect(201);

      testHelpers.validateApiResponse(response, 201);
      expect(response.body.data.name).toBe(productData.name);
      expect(response.body.data.hsnCode).toBe(9021); // Default value
      expect(response.body.data.isActive).toBe(true); // Default value
    });

    test('should fail validation with missing required fields', async () => {
      const invalidData = {
        description: 'Product without required fields'
        // Missing name, basePrice, category
      };
      
      const response = await request(app)
        .post('/api/products')
        .send(invalidData)
        .expect(400);

      testHelpers.validateErrorResponse(response, 400);
      expect(response.body.error.message).toBe('Validation failed');
      expect(response.body.error.details).toBeInstanceOf(Array);
    });

    test('should fail validation with negative base price', async () => {
      const invalidData = DataFactory.product({ basePrice: -100 });
      
      const response = await request(app)
        .post('/api/products')
        .send(invalidData)
        .expect(400);

      testHelpers.validateErrorResponse(response, 400);
      expect(response.body.error.message).toBe('Validation failed');
    });

    test('should fail with duplicate SKU', async () => {
      const sku = 'DUPLICATE-SKU-TEST';
      
      // Create first product
      await Product.create(DataFactory.product({ sku }));
      
      // Try to create second product with same SKU
      const duplicateData = DataFactory.product({ sku });
      
      const response = await request(app)
        .post('/api/products')
        .send(duplicateData)
        .expect(409);

      testHelpers.validateErrorResponse(response, 409);
      expect(response.body.error.message).toBe('Product with this SKU already exists');
    });
  });

  describe('PUT /api/products/:id', () => {
    let testProduct;

    beforeEach(async () => {
      testProduct = await Product.create(DataFactory.product());
    });

    test('should update product with valid data', async () => {
      const updateData = {
        name: 'Updated Product Name',
        basePrice: 200,
        category: 'Updated Category'
      };
      
      const response = await request(app)
        .put(`/api/products/${testProduct._id}`)
        .send(updateData)
        .expect(200);

      testHelpers.validateApiResponse(response);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.basePrice).toBe(updateData.basePrice);
      expect(response.body.data.category).toBe(updateData.category);
      expect(response.body.message).toBe('Product updated successfully');

      // Verify product was updated in database
      const updatedProduct = await Product.findById(testProduct._id);
      expect(updatedProduct.name).toBe(updateData.name);
    });

    test('should return 404 for non-existent product', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const updateData = { name: 'Updated Name' };
      
      const response = await request(app)
        .put(`/api/products/${nonExistentId}`)
        .send(updateData)
        .expect(404);

      testHelpers.validateErrorResponse(response, 404);
      expect(response.body.error.message).toBe('Product not found');
    });

    test('should fail validation with invalid update data', async () => {
      const invalidData = { basePrice: -100 };
      
      const response = await request(app)
        .put(`/api/products/${testProduct._id}`)
        .send(invalidData)
        .expect(400);

      testHelpers.validateErrorResponse(response, 400);
    });
  });

  describe('DELETE /api/products/:id', () => {
    let testProduct;

    beforeEach(async () => {
      testProduct = await Product.create(DataFactory.product());
    });

    test('should delete product when not referenced in invoices', async () => {
      const response = await request(app)
        .delete(`/api/products/${testProduct._id}`)
        .expect(200);

      testHelpers.validateApiResponse(response);
      expect(response.body.message).toBe('Product deleted successfully');

      // Verify product was deleted from database
      const deletedProduct = await Product.findById(testProduct._id);
      expect(deletedProduct).toBeNull();
    });

    test('should return 404 for non-existent product', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .delete(`/api/products/${nonExistentId}`)
        .expect(404);

      testHelpers.validateErrorResponse(response, 404);
      expect(response.body.error.message).toBe('Product not found');
    });

    test('should return 400 for invalid product ID format', async () => {
      const response = await request(app)
        .delete('/api/products/invalid-id')
        .expect(400);

      testHelpers.validateErrorResponse(response, 400);
    });
  });
});