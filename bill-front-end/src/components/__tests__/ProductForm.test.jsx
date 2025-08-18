import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen, userEvent, waitFor, mockData } from '../../test/utils'
import ProductForm from '../ProductForm'
import * as productService from '../../services/productService'

// Mock the product service
vi.mock('../../services/productService', () => ({
  default: {
    createProduct: vi.fn(),
    updateProduct: vi.fn()
  }
}))

describe('ProductForm Component', () => {
  const mockOnSuccess = vi.fn()
  const mockOnError = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Form Rendering', () => {
    it('should render all form fields', () => {
      renderWithProviders(
        <ProductForm onSuccess={mockOnSuccess} onError={mockOnError} />
      )

      expect(screen.getByLabelText(/product name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/base price/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/sku/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/hsn code/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/active/i)).toBeInTheDocument()
    })

    it('should render with default values', () => {
      renderWithProviders(
        <ProductForm onSuccess={mockOnSuccess} onError={mockOnError} />
      )

      expect(screen.getByDisplayValue('9021')).toBeInTheDocument() // Default HSN code
      expect(screen.getByRole('checkbox', { name: /active/i })).toBeChecked() // Default active state
    })

    it('should populate form when editing existing product', () => {
      const product = mockData.product({
        name: 'Test Product',
        description: 'Test Description',
        basePrice: 150,
        category: 'Medical Equipment',
        sku: 'TEST-001',
        hsnCode: 8888
      })

      renderWithProviders(
        <ProductForm 
          product={product}
          onSuccess={mockOnSuccess} 
          onError={mockOnError} 
        />
      )

      expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument()
      expect(screen.getByDisplayValue('150')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Medical Equipment')).toBeInTheDocument()
      expect(screen.getByDisplayValue('TEST-001')).toBeInTheDocument()
      expect(screen.getByDisplayValue('8888')).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should show validation error for empty product name', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <ProductForm onSuccess={mockOnSuccess} onError={mockOnError} />
      )

      const nameField = screen.getByLabelText(/product name/i)
      
      // Focus and blur to trigger validation
      await user.click(nameField)
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/product name is required/i)).toBeInTheDocument()
      })
    })

    it('should show validation error for invalid base price', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <ProductForm onSuccess={mockOnSuccess} onError={mockOnError} />
      )

      const priceField = screen.getByLabelText(/base price/i)
      
      await user.type(priceField, '-100')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/base price cannot be negative/i)).toBeInTheDocument()
      })
    })

    it('should show validation error for non-numeric base price', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <ProductForm onSuccess={mockOnSuccess} onError={mockOnError} />
      )

      const priceField = screen.getByLabelText(/base price/i)
      
      await user.type(priceField, 'invalid')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/base price must be a valid number/i)).toBeInTheDocument()
      })
    })

    it('should show validation error for empty category', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <ProductForm onSuccess={mockOnSuccess} onError={mockOnError} />
      )

      const categoryField = screen.getByLabelText(/category/i)
      
      await user.click(categoryField)
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/category is required/i)).toBeInTheDocument()
      })
    })

    it('should validate HSN code format', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <ProductForm onSuccess={mockOnSuccess} onError={mockOnError} />
      )

      const hsnField = screen.getByLabelText(/hsn code/i)
      
      await user.clear(hsnField)
      await user.type(hsnField, '123') // Too short
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/hsn code must be a 4-digit number/i)).toBeInTheDocument()
      })
    })

    it('should validate SKU length', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <ProductForm onSuccess={mockOnSuccess} onError={mockOnError} />
      )

      const skuField = screen.getByLabelText(/sku/i)
      const longSku = 'A'.repeat(51) // Exceeds 50 character limit
      
      await user.type(skuField, longSku)
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/sku must be less than 50 characters/i)).toBeInTheDocument()
      })
    })

    it('should validate description length', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <ProductForm onSuccess={mockOnSuccess} onError={mockOnError} />
      )

      const descriptionField = screen.getByLabelText(/description/i)
      const longDescription = 'A'.repeat(501) // Exceeds 500 character limit
      
      await user.type(descriptionField, longDescription)
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/description must be less than 500 characters/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Interaction', () => {
    it('should update form fields when user types', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <ProductForm onSuccess={mockOnSuccess} onError={mockOnError} />
      )

      const nameField = screen.getByLabelText(/product name/i)
      const priceField = screen.getByLabelText(/base price/i)
      
      await user.type(nameField, 'New Product')
      await user.type(priceField, '299.99')

      expect(nameField).toHaveValue('New Product')
      expect(priceField).toHaveValue('299.99')
    })

    it('should toggle active status', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <ProductForm onSuccess={mockOnSuccess} onError={mockOnError} />
      )

      const activeSwitch = screen.getByRole('checkbox', { name: /active/i })
      
      expect(activeSwitch).toBeChecked()
      
      await user.click(activeSwitch)
      
      expect(activeSwitch).not.toBeChecked()
    })

    it('should select category from dropdown', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <ProductForm onSuccess={mockOnSuccess} onError={mockOnError} />
      )

      const categoryField = screen.getByLabelText(/category/i)
      
      await user.click(categoryField)
      
      const medicalOption = screen.getByText('Medical Equipment')
      await user.click(medicalOption)

      expect(screen.getByDisplayValue('Medical Equipment')).toBeInTheDocument()
    })
  })

  describe('Real-time Validation', () => {
    it('should show validation errors in real-time', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <ProductForm onSuccess={mockOnSuccess} onError={mockOnError} />
      )

      const nameField = screen.getByLabelText(/product name/i)
      
      // Type a single character (too short)
      await user.type(nameField, 'A')
      
      await waitFor(() => {
        expect(screen.getByText(/product name must be at least 2 characters/i)).toBeInTheDocument()
      })

      // Add another character to make it valid
      await user.type(nameField, 'B')
      
      await waitFor(() => {
        expect(screen.queryByText(/product name must be at least 2 characters/i)).not.toBeInTheDocument()
      })
    })

    it('should clear validation errors when field becomes valid', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <ProductForm onSuccess={mockOnSuccess} onError={mockOnError} />
      )

      const priceField = screen.getByLabelText(/base price/i)
      
      // Enter invalid price
      await user.type(priceField, '-100')
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByText(/base price cannot be negative/i)).toBeInTheDocument()
      })

      // Clear and enter valid price
      await user.clear(priceField)
      await user.type(priceField, '100')
      
      await waitFor(() => {
        expect(screen.queryByText(/base price cannot be negative/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Category Options', () => {
    it('should display all available categories', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <ProductForm onSuccess={mockOnSuccess} onError={mockOnError} />
      )

      const categoryField = screen.getByLabelText(/category/i)
      await user.click(categoryField)

      const expectedCategories = [
        'Medical Equipment',
        'Surgical Instruments',
        'Diagnostic Tools',
        'Rehabilitation Equipment',
        'Mobility Aids',
        'Therapeutic Devices',
        'Other'
      ]

      expectedCategories.forEach(category => {
        expect(screen.getByText(category)).toBeInTheDocument()
      })
    })
  })

  describe('Loading State', () => {
    it('should disable form when loading', () => {
      renderWithProviders(
        <ProductForm 
          onSuccess={mockOnSuccess} 
          onError={mockOnError}
          loading={true}
        />
      )

      expect(screen.getByLabelText(/product name/i)).toBeDisabled()
      expect(screen.getByLabelText(/base price/i)).toBeDisabled()
      expect(screen.getByLabelText(/category/i)).toBeDisabled()
    })
  })
})