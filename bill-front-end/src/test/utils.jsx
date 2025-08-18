import React from 'react'
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'

// Create a default theme for testing
const theme = createTheme()

// Custom render function that includes providers
export function renderWithProviders(ui, options = {}) {
  const { initialEntries = ['/'], ...renderOptions } = options

  function Wrapper({ children }) {
    return (
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          {children}
        </ThemeProvider>
      </BrowserRouter>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Mock data factories for testing
export const mockData = {
  product: (overrides = {}) => ({
    _id: '507f1f77bcf86cd799439011',
    name: 'Test Product',
    description: 'Test product description',
    basePrice: 100,
    category: 'Test Category',
    sku: 'TEST-SKU-001',
    hsnCode: 9021,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides
  }),

  client: (overrides = {}) => ({
    _id: '507f1f77bcf86cd799439012',
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
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides
  }),

  invoice: (overrides = {}) => ({
    _id: '507f1f77bcf86cd799439013',
    invoiceNumber: 'INV-2024-0001',
    clientId: '507f1f77bcf86cd799439012',
    invoiceDate: '2024-01-01T00:00:00.000Z',
    dueDate: '2024-01-31T00:00:00.000Z',
    status: 'draft',
    taxType: 'in-state',
    items: [{
      productId: '507f1f77bcf86cd799439011',
      size: 'medium',
      quantity: 1,
      customPrice: 100,
      totalPrice: 100
    }],
    subtotal: 100,
    cgst: 2.5,
    sgst: 2.5,
    igst: 0,
    totalTaxAmount: 5,
    totalAmount: 105,
    notes: 'Test invoice notes',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides
  }),

  dashboardStats: (overrides = {}) => ({
    totalProducts: 25,
    totalClients: 15,
    totalInvoices: 50,
    totalRevenue: 125000,
    recentInvoices: [
      {
        _id: '507f1f77bcf86cd799439013',
        invoiceNumber: 'INV-2024-0001',
        clientName: 'Test Client',
        totalAmount: 105,
        status: 'draft',
        createdAt: '2024-01-01T00:00:00.000Z'
      }
    ],
    topClients: [
      {
        _id: '507f1f77bcf86cd799439012',
        name: 'Test Client',
        totalRevenue: 1050,
        invoiceCount: 10
      }
    ],
    ...overrides
  })
}

// Mock API responses
export const mockApiResponse = {
  success: (data, message = 'Success') => ({
    success: true,
    message,
    data,
    error: {}
  }),

  error: (message = 'Error', error = {}) => ({
    success: false,
    message,
    data: {},
    error
  }),

  pagination: (items, page = 1, limit = 10, total = null) => ({
    success: true,
    message: 'Data retrieved successfully',
    data: {
      items,
      pagination: {
        page,
        limit,
        total: total || items.length,
        pages: Math.ceil((total || items.length) / limit)
      }
    },
    error: {}
  })
}

// Re-export everything from testing-library
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'