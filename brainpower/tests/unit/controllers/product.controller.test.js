const productController = require('../../../controllers/product.controller');
const Product = require('../../../models/product.model');
const Invoice = require('../../../models/invoice.model');
const DataFactory = require('../../factories/dataFactory');

// Mock the models
jest.mock('../../../models/product.model');
jest.mock('../../../models/invoice.model');

describe('Product Controller Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      query: {},
      params: {},
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('getProductsController', () => {
    test('should get products with default pagination', async () => {
      const mockProducts = [
        DataFactory.product({ name: 'Product 1' }),
        DataFactory.product({ name: 'Product 2' })
      ];

      Product.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockProducts)
      });
      Product.countDocuments.mockResolvedValue(2);

      await productController.getProductsController(req, res);

      expect(Product.find).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          items: mockProducts,
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            pages: 1
          }
        }
      });
    });

    test('should filter products by search term', async () => {
      req.query = { search: 'test' };
      const mockProducts = [DataFactory.product({ name: 'Test Product' })];

      Product.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockProducts)
      });
      Product.countDocuments.mockResolvedValue(1);

      await productController.getProductsController(req, res);

      expect(Product.find).toHaveBeenCalledWith({
        $or: [
          { name: { $regex: 'test', $options: 'i' } },
          { description: { $regex: 'test', $options: 'i' } }
        ]
      });
    });

    test('should filter products by category', async () => {
      req.query = { category: 'electronics' };
      const mockProducts = [DataFactory.product({ category: 'Electronics' })];

      Product.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockProducts)
      });
      Product.countDocuments.mockResolvedValue(1);

      await productController.getProductsController(req, res);

      expect(Product.find).toHaveBeenCalledWith({
        category: { $regex: 'electronics', $options: 'i' }
      });
    });

    test('should filter products by active status', async () => {
      req.query = { isActive: 'true' };
      const mockProducts = [DataFactory.product({ isActive: true })];

      Product.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockProducts)
      });
      Product.countDocuments.mockResolvedValue(1);

      await productController.getProductsController(req, res);

      expect(Product.find).toHaveBeenCalledWith({
        isActive: true
      });
    });

    test('should handle pagination correctly', async () => {
      req.query = { page: '2', limit: '5' };
      const mockProducts = [DataFactory.product()];

      Product.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockProducts)
      });
      Product.countDocuments.mockResolvedValue(10);

      await productController.getProductsController(req, res);

      expect(Product.find().skip).toHaveBeenCalledWith(5); // (2-1) * 5
      expect(Product.find().limit).toHaveBeenCalledWith(5);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          items: mockProducts,
          pagination: {
            page: 2,
            limit: 5,
            total: 10,
            pages: 2
          }
        }
      });
    });

    test('should handle errors gracefully', async () => {
      const error = new Error('Database error');
      Product.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockRejectedValue(error)
      });

      await productController.getProductsController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Failed to fetch products',
          details: error.message
        }
      });
    });
  });

  describe('getProductByIdController', () => {
    test('should get product by valid ID', async () => {
      const mockProduct = DataFactory.product();
      req.params.id = 'validObjectId';

      Product.findById.mockResolvedValue(mockProduct);

      await productController.getProductByIdController(req, res);

      expect(Product.findById).toHaveBeenCalledWith('validObjectId');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockProduct
      });
    });

    test('should return 404 for non-existent product', async () => {
      req.params.id = 'nonExistentId';

      Product.findById.mockResolvedValue(null);

      await productController.getProductByIdController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Product not found'
        }
      });
    });

    test('should handle invalid ObjectId', async () => {
      req.params.id = 'invalidId';
      const error = new Error('Cast to ObjectId failed');

      Product.findById.mockRejectedValue(error);

      await productController.getProductByIdController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid product ID format'
        }
      });
    });
  });

  describe('createProductController', () => {
    test('should create product with valid data', async () => {
      const productData = DataFactory.product();
      const mockSavedProduct = { ...productData, _id: 'newProductId' };
      req.body = productData;

      Product.prototype.save = jest.fn().mockResolvedValue(mockSavedProduct);

      await productController.createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockSavedProduct,
        message: 'Product created successfully'
      });
    });

    test('should handle validation errors', async () => {
      const invalidData = { name: '', basePrice: -100 };
      req.body = invalidData;

      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      validationError.errors = {
        name: { message: 'Product name is required' },
        basePrice: { message: 'Base price cannot be negative' }
      };

      Product.prototype.save = jest.fn().mockRejectedValue(validationError);

      await productController.createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Validation failed',
          details: expect.any(Array)
        }
      });
    });

    test('should handle duplicate SKU error', async () => {
      const productData = DataFactory.product({ sku: 'DUPLICATE-SKU' });
      req.body = productData;

      const duplicateError = new Error('Duplicate key error');
      duplicateError.code = 11000;
      duplicateError.keyPattern = { sku: 1 };

      Product.prototype.save = jest.fn().mockRejectedValue(duplicateError);

      await productController.createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Product with this SKU already exists'
        }
      });
    });
  });

  describe('updateProductController', () => {
    test('should update product with valid data', async () => {
      const productId = 'validProductId';
      const updateData = { name: 'Updated Product', basePrice: 200 };
      const mockUpdatedProduct = { ...updateData, _id: productId };
      
      req.params.id = productId;
      req.body = updateData;

      Product.findByIdAndUpdate.mockResolvedValue(mockUpdatedProduct);

      await productController.updateProductController(req, res);

      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(
        productId,
        updateData,
        { new: true, runValidators: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedProduct,
        message: 'Product updated successfully'
      });
    });

    test('should return 404 for non-existent product', async () => {
      req.params.id = 'nonExistentId';
      req.body = { name: 'Updated Product' };

      Product.findByIdAndUpdate.mockResolvedValue(null);

      await productController.updateProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Product not found'
        }
      });
    });

    test('should handle validation errors on update', async () => {
      req.params.id = 'validProductId';
      req.body = { basePrice: -100 };

      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';

      Product.findByIdAndUpdate.mockRejectedValue(validationError);

      await productController.updateProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('deleteProductController', () => {
    test('should delete product when not referenced in invoices', async () => {
      const productId = 'validProductId';
      const mockProduct = DataFactory.product();
      req.params.id = productId;

      Product.findById.mockResolvedValue(mockProduct);
      Invoice.findOne.mockResolvedValue(null); // No invoices reference this product
      Product.findByIdAndDelete.mockResolvedValue(mockProduct);

      await productController.deleteProductController(req, res);

      expect(Invoice.findOne).toHaveBeenCalledWith({
        'items.productId': productId
      });
      expect(Product.findByIdAndDelete).toHaveBeenCalledWith(productId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Product deleted successfully'
      });
    });

    test('should prevent deletion when product is referenced in invoices', async () => {
      const productId = 'validProductId';
      const mockProduct = DataFactory.product();
      const mockInvoice = { _id: 'invoiceId', invoiceNumber: 'INV-001' };
      req.params.id = productId;

      Product.findById.mockResolvedValue(mockProduct);
      Invoice.findOne.mockResolvedValue(mockInvoice); // Product is referenced

      await productController.deleteProductController(req, res);

      expect(Product.findByIdAndDelete).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Cannot delete product as it is referenced in existing invoices'
        }
      });
    });

    test('should return 404 for non-existent product', async () => {
      req.params.id = 'nonExistentId';

      Product.findById.mockResolvedValue(null);

      await productController.deleteProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Product not found'
        }
      });
    });

    test('should handle database errors', async () => {
      req.params.id = 'validProductId';
      const error = new Error('Database error');

      Product.findById.mockRejectedValue(error);

      await productController.deleteProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Failed to delete product',
          details: error.message
        }
      });
    });
  });
});