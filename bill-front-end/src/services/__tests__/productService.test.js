import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import productService from '../productService'
import api from '../api'

// Mock the API module
vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

describe('Product Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getProducts', () => {
    it('should fetch products with default parameters', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            products: [
              { id: 1, name: 'Product 1', basePrice: 100 },
              { id: 2, name: 'Product 2', basePrice: 200 }
            ],
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalProducts: 2
            }
          }
        }
      }

      api.get.mockResolvedValue(mockResponse)

      const result = await productService.getProducts()

      expect(api.get).toHaveBeenCalledWith('/products', {
        params: {
          page: 1,
          limit: 10,
          search: '',
          category: '',
          isActive: ''
        }
      })
      expect(result).toEqual(mockResponse.data)
    })

    it('should fetch products with custom parameters', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            products: [{ id: 1, name: 'Filtered Product', basePrice: 150 }],
            pagination: { currentPage: 2, totalPages: 3, totalProducts: 25 }
          }
        }
      }

      api.get.mockResolvedValue(mockResponse)

      const params = {
        page: 2,
        limit: 20,
        search: 'test',
        category: 'Medical',
        isActive: true
      }

      const result = await productService.getProducts(params)

      expect(api.get).toHaveBeenCalledWith('/products', {
        params: {
          page: 2,
          limit: 20,
          search: 'test',
          category: 'Medical',
          isActive: true
        }
      })
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle API errors', async () => {
      const mockError = new Error('Network error')
      api.get.mockRejectedValue(mockError)

      await expect(productService.getProducts()).rejects.toThrow('Network error')
    })
  })

  describe('getProductById', () => {
    it('should fetch product by ID', async () => {
      const mockProduct = {
        id: 1,
        name: 'Test Product',
        basePrice: 100,
        category: 'Medical Equipment'
      }

      const mockResponse = {
        data: {
          success: true,
          data: { product: mockProduct }
        }
      }

      api.get.mockResolvedValue(mockResponse)

      const result = await productService.getProductById('1')

      expect(api.get).toHaveBeenCalledWith('/products/1')
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle product not found', async () => {
      const mockError = {
        response: {
          status: 404,
          data: {
            success: false,
            message: 'Product not found'
          }
        }
      }

      api.get.mockRejectedValue(mockError)

      await expect(productService.getProductById('999')).rejects.toEqual(mockError)
    })
  })

  describe('createProduct', () => {
    it('should create a new product', async () => {
      const productData = {
        name: 'New Product',
        description: 'Product description',
        basePrice: 299.99,
        category: 'Medical Equipment',
        sku: 'NEW-001',
        hsnCode: 9021
      }

      const mockResponse = {
        data: {
          success: true,
          data: {
            product: { id: 1, ...productData }
          },
          message: 'Product created successfully'
        }
      }

      api.post.mockResolvedValue(mockResponse)

      const result = await productService.createProduct(productData)

      expect(api.post).toHaveBeenCalledWith('/products', productData)
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle validation errors', async () => {
      const invalidData = {
        name: '',
        basePrice: -100
      }

      const mockError = {
        response: {
          status: 400,
          data: {
            success: false,
            message: 'Validation failed',
            error: {
              name: 'Product name is required',
              basePrice: 'Base price cannot be negative'
            }
          }
        }
      }

      api.post.mockRejectedValue(mockError)

      await expect(productService.createProduct(invalidData)).rejects.toEqual(mockError)
    })

    it('should handle duplicate SKU error', async () => {
      const productData = {
        name: 'Duplicate Product',
        basePrice: 100,
        category: 'Test',
        sku: 'DUPLICATE-SKU'
      }

      const mockError = {
        response: {
          status: 409,
          data: {
            success: false,
            message: 'Product with this SKU already exists'
          }
        }
      }

      api.post.mockRejectedValue(mockError)

      await expect(productService.createProduct(productData)).rejects.toEqual(mockError)
    })
  })

  describe('updateProduct', () => {
    it('should update an existing product', async () => {
      const productId = '1'
      const updateData = {
        name: 'Updated Product',
        basePrice: 199.99
      }

      const mockResponse = {
        data: {
          success: true,
          data: {
            product: { id: productId, ...updateData }
          },
          message: 'Product updated successfully'
        }
      }

      api.put.mockResolvedValue(mockResponse)

      const result = await productService.updateProduct(productId, updateData)

      expect(api.put).toHaveBeenCalledWith(`/products/${productId}`, updateData)
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle product not found during update', async () => {
      const mockError = {
        response: {
          status: 404,
          data: {
            success: false,
            message: 'Product not found'
          }
        }
      }

      api.put.mockRejectedValue(mockError)

      await expect(productService.updateProduct('999', {})).rejects.toEqual(mockError)
    })
  })

  describe('deleteProduct', () => {
    it('should delete a product', async () => {
      const productId = '1'
      const mockResponse = {
        data: {
          success: true,
          message: 'Product deleted successfully'
        }
      }

      api.delete.mockResolvedValue(mockResponse)

      const result = await productService.deleteProduct(productId)

      expect(api.delete).toHaveBeenCalledWith(`/products/${productId}`)
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle product not found during deletion', async () => {
      const mockError = {
        response: {
          status: 404,
          data: {
            success: false,
            message: 'Product not found'
          }
        }
      }

      api.delete.mockRejectedValue(mockError)

      await expect(productService.deleteProduct('999')).rejects.toEqual(mockError)
    })

    it('should handle product referenced in invoices', async () => {
      const mockError = {
        response: {
          status: 422,
          data: {
            success: false,
            message: 'Cannot delete product. It is referenced in 5 invoice(s)',
            data: { referencedInvoices: 5 }
          }
        }
      }

      api.delete.mockRejectedValue(mockError)

      await expect(productService.deleteProduct('1')).rejects.toEqual(mockError)
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network Error')
      networkError.code = 'NETWORK_ERROR'

      api.get.mockRejectedValue(networkError)

      await expect(productService.getProducts()).rejects.toThrow('Network Error')
    })

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout')
      timeoutError.code = 'ECONNABORTED'

      api.get.mockRejectedValue(timeoutError)

      await expect(productService.getProducts()).rejects.toThrow('Request timeout')
    })

    it('should handle server errors', async () => {
      const serverError = {
        response: {
          status: 500,
          data: {
            success: false,
            message: 'Internal Server Error'
          }
        }
      }

      api.get.mockRejectedValue(serverError)

      await expect(productService.getProducts()).rejects.toEqual(serverError)
    })
  })

  describe('Request Parameters', () => {
    it('should handle empty search parameter', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { products: [], pagination: {} }
        }
      }

      api.get.mockResolvedValue(mockResponse)

      await productService.getProducts({ search: '' })

      expect(api.get).toHaveBeenCalledWith('/products', {
        params: expect.objectContaining({
          search: ''
        })
      })
    })

    it('should handle boolean isActive parameter', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { products: [], pagination: {} }
        }
      }

      api.get.mockResolvedValue(mockResponse)

      await productService.getProducts({ isActive: false })

      expect(api.get).toHaveBeenCalledWith('/products', {
        params: expect.objectContaining({
          isActive: false
        })
      })
    })

    it('should handle numeric page and limit parameters', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { products: [], pagination: {} }
        }
      }

      api.get.mockResolvedValue(mockResponse)

      await productService.getProducts({ page: 3, limit: 25 })

      expect(api.get).toHaveBeenCalledWith('/products', {
        params: expect.objectContaining({
          page: 3,
          limit: 25
        })
      })
    })
  })
})