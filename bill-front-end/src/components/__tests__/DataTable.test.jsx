import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen, userEvent, mockData } from '../../test/utils'
import DataTable from '../DataTable'

describe('DataTable Component', () => {
  const mockColumns = [
    { id: 'name', label: 'Name', sortable: true },
    { id: 'email', label: 'Email', sortable: true },
    { id: 'status', label: 'Status', sortable: false },
    { id: 'actions', label: 'Actions', sortable: false }
  ]

  const mockData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Inactive' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'Active' }
  ]

  const mockProps = {
    columns: mockColumns,
    data: mockData,
    title: 'Test Table',
    page: 0,
    rowsPerPage: 10,
    totalCount: 3
  }

  const mockOnSort = vi.fn()
  const mockOnPageChange = vi.fn()
  const mockOnRowsPerPageChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Table Rendering', () => {
    it('should render table with title', () => {
      renderWithProviders(<DataTable {...mockProps} />)
      
      expect(screen.getByText('Test Table')).toBeInTheDocument()
    })

    it('should render table headers', () => {
      renderWithProviders(<DataTable {...mockProps} />)
      
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
      expect(screen.getByText('Actions')).toBeInTheDocument()
    })

    it('should render table data', () => {
      renderWithProviders(<DataTable {...mockProps} />)
      
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.getByText('jane@example.com')).toBeInTheDocument()
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
      expect(screen.getByText('bob@example.com')).toBeInTheDocument()
    })

    it('should render correct number of rows', () => {
      renderWithProviders(<DataTable {...mockProps} />)
      
      const rows = screen.getAllByRole('row')
      // Header row + data rows
      expect(rows).toHaveLength(4) // 1 header + 3 data rows
    })

    it('should render empty state when no data', () => {
      renderWithProviders(
        <DataTable 
          {...mockProps} 
          data={[]} 
          totalCount={0}
        />
      )
      
      expect(screen.getByText(/no data available/i)).toBeInTheDocument()
    })
  })

  describe('Sorting Functionality', () => {
    it('should render sort labels for sortable columns', () => {
      renderWithProviders(<DataTable {...mockProps} onSort={mockOnSort} />)
      
      const nameHeader = screen.getByText('Name')
      const emailHeader = screen.getByText('Email')
      
      expect(nameHeader.closest('th')).toHaveClass('MuiTableCell-head')
      expect(emailHeader.closest('th')).toHaveClass('MuiTableCell-head')
    })

    it('should not render sort labels for non-sortable columns', () => {
      renderWithProviders(<DataTable {...mockProps} onSort={mockOnSort} />)
      
      const statusHeader = screen.getByText('Status')
      const actionsHeader = screen.getByText('Actions')
      
      // These should not have sort functionality
      expect(statusHeader.closest('span')).not.toHaveClass('MuiTableSortLabel-root')
      expect(actionsHeader.closest('span')).not.toHaveClass('MuiTableSortLabel-root')
    })

    it('should call onSort when sortable column is clicked', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(<DataTable {...mockProps} onSort={mockOnSort} />)
      
      const nameHeader = screen.getByRole('button', { name: /name/i })
      await user.click(nameHeader)
      
      expect(mockOnSort).toHaveBeenCalledWith('name', 'desc')
    })

    it('should toggle sort order when same column is clicked twice', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <DataTable 
          {...mockProps} 
          onSort={mockOnSort}
          sortBy="name"
          sortOrder="asc"
        />
      )
      
      const nameHeader = screen.getByRole('button', { name: /name/i })
      
      // First click should change to desc
      await user.click(nameHeader)
      expect(mockOnSort).toHaveBeenCalledWith('name', 'desc')
      
      // Second click should change back to asc
      await user.click(nameHeader)
      expect(mockOnSort).toHaveBeenCalledWith('name', 'asc')
    })
  })

  describe('Pagination Functionality', () => {
    it('should render pagination component', () => {
      renderWithProviders(<DataTable {...mockProps} />)
      
      expect(screen.getByText(/rows per page/i)).toBeInTheDocument()
    })

    it('should display correct pagination info', () => {
      renderWithProviders(<DataTable {...mockProps} />)
      
      expect(screen.getByText('1–3 of 3')).toBeInTheDocument()
    })

    it('should call onPageChange when page is changed', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <DataTable 
          {...mockProps} 
          totalCount={25}
          onPageChange={mockOnPageChange}
        />
      )
      
      const nextButton = screen.getByRole('button', { name: /next page/i })
      await user.click(nextButton)
      
      expect(mockOnPageChange).toHaveBeenCalledWith(1)
    })

    it('should call onRowsPerPageChange when rows per page is changed', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <DataTable 
          {...mockProps} 
          onRowsPerPageChange={mockOnRowsPerPageChange}
        />
      )
      
      const rowsPerPageSelect = screen.getByRole('combobox')
      await user.click(rowsPerPageSelect)
      
      const option25 = screen.getByRole('option', { name: '25' })
      await user.click(option25)
      
      expect(mockOnRowsPerPageChange).toHaveBeenCalledWith(25)
    })

    it('should disable pagination buttons appropriately', () => {
      renderWithProviders(
        <DataTable 
          {...mockProps} 
          page={0}
          totalCount={5}
          rowsPerPage={10}
        />
      )
      
      const prevButton = screen.getByRole('button', { name: /previous page/i })
      const nextButton = screen.getByRole('button', { name: /next page/i })
      
      expect(prevButton).toBeDisabled()
      expect(nextButton).toBeDisabled()
    })
  })

  describe('Loading State', () => {
    it('should show loading state', () => {
      renderWithProviders(
        <DataTable 
          {...mockProps} 
          loading={true}
        />
      )
      
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('should disable interactions when loading', () => {
      renderWithProviders(
        <DataTable 
          {...mockProps} 
          loading={true}
          onSort={mockOnSort}
        />
      )
      
      const sortButtons = screen.queryAllByRole('button')
      sortButtons.forEach(button => {
        if (button.getAttribute('aria-label')?.includes('sort')) {
          expect(button).toBeDisabled()
        }
      })
    })
  })

  describe('Custom Cell Rendering', () => {
    it('should render custom cell content when render function is provided', () => {
      const customColumns = [
        { 
          id: 'name', 
          label: 'Name', 
          render: (row) => <strong>{row.name}</strong>
        },
        { 
          id: 'status', 
          label: 'Status',
          render: (row) => <span className="status-badge">{row.status}</span>
        }
      ]

      renderWithProviders(
        <DataTable 
          {...mockProps} 
          columns={customColumns}
        />
      )
      
      expect(screen.getByText('John Doe').tagName).toBe('STRONG')
      expect(screen.getByText('Active')).toHaveClass('status-badge')
    })
  })

  describe('Responsive Behavior', () => {
    it('should handle small screen sizes', () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      })

      renderWithProviders(<DataTable {...mockProps} />)
      
      const tableContainer = screen.getByRole('table').closest('.MuiTableContainer-root')
      expect(tableContainer).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithProviders(<DataTable {...mockProps} />)
      
      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()
      
      const columnHeaders = screen.getAllByRole('columnheader')
      expect(columnHeaders).toHaveLength(4)
    })

    it('should have proper sort button labels', () => {
      renderWithProviders(<DataTable {...mockProps} onSort={mockOnSort} />)
      
      const nameSortButton = screen.getByRole('button', { name: /name/i })
      expect(nameSortButton).toHaveAttribute('aria-label')
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined data gracefully', () => {
      renderWithProviders(
        <DataTable 
          {...mockProps} 
          data={undefined}
        />
      )
      
      expect(screen.getByText(/no data available/i)).toBeInTheDocument()
    })

    it('should handle empty columns array', () => {
      renderWithProviders(
        <DataTable 
          {...mockProps} 
          columns={[]}
        />
      )
      
      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()
    })

    it('should handle zero total count', () => {
      renderWithProviders(
        <DataTable 
          {...mockProps} 
          data={[]}
          totalCount={0}
        />
      )
      
      expect(screen.getByText('0–0 of 0')).toBeInTheDocument()
    })
  })
})