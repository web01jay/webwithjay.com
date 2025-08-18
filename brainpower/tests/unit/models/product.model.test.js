const mongoose = require('mongoose');
const Product = require('../../../models/product.model');
const DataFactory = require('../../factories/dataFactory');

describe('Product Model Unit Tests', () => {
  describe('Product Creation', () => {
    test('should create a valid product with all required fields', async () => {
      const productData = DataFactory.product();
      const product = new Product(productData);
      
      const savedProduct = await product.save();
      
      expect(savedProduct._id).toBeDefined();
      expect(savedProduct.name).toBe(productData.name);
      expect(savedProduct.description).toBe(productData.description);
      expect(savedProduct.basePrice).toBe(productData.basePrice);
      expect(savedProduct.category).toBe(productData.category);
      expect(savedProduct.sku).toBe(productData.sku.toUpperCase()); // Should be uppercase
      expect(savedProduct.hsnCode).toBe(productData.hsnCode);
      expect(savedProduct.isActive).toBe(true);
      expect(savedProduct.createdAt).toBeDefined();
      expect(savedProduct.updatedAt).toBeDefined();
    });

    test('should create product with minimal required fields', async () => {
      const productData = {
        name: 'Minimal Product',
        basePrice: 50,
        category: 'Test Category'
      };
      
      const product = new Product(productData);
      const savedProduct = await product.save();
      
      expect(savedProduct._id).toBeDefined();
      expect(savedProduct.name).toBe(productData.name);
      expect(savedProduct.basePrice).toBe(productData.basePrice);
      expect(savedProduct.category).toBe(productData.category);
      expect(savedProduct.hsnCode).toBe(9021); // Default value
      expect(savedProduct.isActive).toBe(true); // Default value
    });

    test('should convert SKU to uppercase on save', async () => {
      const productData = DataFactory.product({ sku: 'test-sku-lowercase' });
      const product = new Product(productData);
      
      const savedProduct = await product.save();
      
      expect(savedProduct.sku).toBe('TEST-SKU-LOWERCASE');
    });
  });

  describe('Product Validation', () => {
    test('should fail validation when name is missing', async () => {
      const productData = DataFactory.invalidData().product.missingName;
      const product = new Product(productData);
      
      await expect(product.save()).rejects.toThrow('Product name is required');
    });

    test('should fail validation when basePrice is missing', async () => {
      const productData = DataFactory.invalidData().product.missingPrice;
      const product = new Product(productData);
      
      await expect(product.save()).rejects.toThrow('Base price is required');
    });

    test('should fail validation when category is missing', async () => {
      const productData = DataFactory.invalidData().product.missingCategory;
      const product = new Product(productData);
      
      await expect(product.save()).rejects.toThrow('Category is required');
    });

    test('should fail validation when basePrice is negative', async () => {
      const productData = DataFactory.invalidData().product.negativePrice;
      const product = new Product(productData);
      
      await expect(product.save()).rejects.toThrow('Base price cannot be negative');
    });

    test('should fail validation when name exceeds maximum length', async () => {
      const productData = DataFactory.product({ 
        name: 'A'.repeat(201) // Exceeds 200 character limit
      });
      const product = new Product(productData);
      
      await expect(product.save()).rejects.toThrow('Product name cannot exceed 200 characters');
    });

    test('should fail validation when description exceeds maximum length', async () => {
      const productData = DataFactory.product({ 
        description: 'A'.repeat(1001) // Exceeds 1000 character limit
      });
      const product = new Product(productData);
      
      await expect(product.save()).rejects.toThrow('Description cannot exceed 1000 characters');
    });

    test('should fail validation when category exceeds maximum length', async () => {
      const productData = DataFactory.product({ 
        category: 'A'.repeat(101) // Exceeds 100 character limit
      });
      const product = new Product(productData);
      
      await expect(product.save()).rejects.toThrow('Category cannot exceed 100 characters');
    });

    test('should fail validation when SKU exceeds maximum length', async () => {
      const productData = DataFactory.product({ 
        sku: 'A'.repeat(51) // Exceeds 50 character limit
      });
      const product = new Product(productData);
      
      await expect(product.save()).rejects.toThrow('SKU cannot exceed 50 characters');
    });

    test('should fail validation when hsnCode is not a positive number', async () => {
      const productData = DataFactory.product({ hsnCode: -1 });
      const product = new Product(productData);
      
      await expect(product.save()).rejects.toThrow('HSN code must be a positive number');
    });
  });

  describe('Product Uniqueness', () => {
    test('should enforce unique SKU constraint', async () => {
      const sku = 'UNIQUE-SKU-TEST';
      
      // Create first product with SKU
      const product1 = new Product(DataFactory.product({ sku }));
      await product1.save();
      
      // Try to create second product with same SKU
      const product2 = new Product(DataFactory.product({ sku }));
      
      await expect(product2.save()).rejects.toThrow();
    });

    test('should allow multiple products without SKU (sparse index)', async () => {
      // Create first product without SKU
      const product1 = new Product(DataFactory.product({ sku: undefined }));
      await product1.save();
      
      // Create second product without SKU - should not fail
      const product2 = new Product(DataFactory.product({ sku: undefined }));
      const savedProduct2 = await product2.save();
      
      expect(savedProduct2._id).toBeDefined();
    });
  });

  describe('Product Updates', () => {
    test('should update product fields correctly', async () => {
      const product = new Product(DataFactory.product());
      const savedProduct = await product.save();
      
      // Update fields
      savedProduct.name = 'Updated Product Name';
      savedProduct.basePrice = 200;
      savedProduct.isActive = false;
      
      const updatedProduct = await savedProduct.save();
      
      expect(updatedProduct.name).toBe('Updated Product Name');
      expect(updatedProduct.basePrice).toBe(200);
      expect(updatedProduct.isActive).toBe(false);
      expect(updatedProduct.updatedAt).not.toEqual(updatedProduct.createdAt);
    });

    test('should maintain validation on updates', async () => {
      const product = new Product(DataFactory.product());
      const savedProduct = await product.save();
      
      // Try to update with invalid data
      savedProduct.basePrice = -100;
      
      await expect(savedProduct.save()).rejects.toThrow('Base price cannot be negative');
    });
  });

  describe('Product Queries', () => {
    beforeEach(async () => {
      // Create test products
      await Product.create([
        DataFactory.product({ name: 'Active Product 1', category: 'Category A', isActive: true }),
        DataFactory.product({ name: 'Active Product 2', category: 'Category B', isActive: true }),
        DataFactory.product({ name: 'Inactive Product', category: 'Category A', isActive: false })
      ]);
    });

    test('should find products by category', async () => {
      const products = await Product.find({ category: 'Category A' });
      
      expect(products).toHaveLength(2);
      expect(products.every(p => p.category === 'Category A')).toBe(true);
    });

    test('should find only active products', async () => {
      const activeProducts = await Product.find({ isActive: true });
      
      expect(activeProducts).toHaveLength(2);
      expect(activeProducts.every(p => p.isActive === true)).toBe(true);
    });

    test('should support text search on name and description', async () => {
      // Create a product with searchable content
      await Product.create(DataFactory.product({ 
        name: 'Searchable Product',
        description: 'This product has searchable content'
      }));
      
      const searchResults = await Product.find({ $text: { $search: 'searchable' } });
      
      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchResults.some(p => p.name.includes('Searchable'))).toBe(true);
    });
  });
});