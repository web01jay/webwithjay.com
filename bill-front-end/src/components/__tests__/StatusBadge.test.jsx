import React from 'react'
import { describe, it, expect } from 'vitest'
import { renderWithProviders, screen } from '../../test/utils'
import StatusBadge from '../StatusBadge'

describe('StatusBadge Component', () => {
  describe('Status Color Mapping', () => {
    it('should render success color for active status', () => {
      renderWithProviders(<StatusBadge status="active" />)
      
      const badge = screen.getByText('Active')
      expect(badge).toBeInTheDocument()
      expect(badge.closest('.MuiChip-root')).toHaveClass('MuiChip-colorSuccess')
    })

    it('should render success color for paid status', () => {
      renderWithProviders(<StatusBadge status="paid" />)
      
      const badge = screen.getByText('Paid')
      expect(badge).toBeInTheDocument()
      expect(badge.closest('.MuiChip-root')).toHaveClass('MuiChip-colorSuccess')
    })

    it('should render warning color for draft status', () => {
      renderWithProviders(<StatusBadge status="draft" />)
      
      const badge = screen.getByText('Draft')
      expect(badge).toBeInTheDocument()
      expect(badge.closest('.MuiChip-root')).toHaveClass('MuiChip-colorWarning')
    })

    it('should render warning color for pending status', () => {
      renderWithProviders(<StatusBadge status="pending" />)
      
      const badge = screen.getByText('Pending')
      expect(badge).toBeInTheDocument()
      expect(badge.closest('.MuiChip-root')).toHaveClass('MuiChip-colorWarning')
    })

    it('should render error color for overdue status', () => {
      renderWithProviders(<StatusBadge status="overdue" />)
      
      const badge = screen.getByText('Overdue')
      expect(badge).toBeInTheDocument()
      expect(badge.closest('.MuiChip-root')).toHaveClass('MuiChip-colorError')
    })

    it('should render info color for sent status', () => {
      renderWithProviders(<StatusBadge status="sent" />)
      
      const badge = screen.getByText('Sent')
      expect(badge).toBeInTheDocument()
      expect(badge.closest('.MuiChip-root')).toHaveClass('MuiChip-colorInfo')
    })

    it('should render default color for unknown status', () => {
      renderWithProviders(<StatusBadge status="unknown" />)
      
      const badge = screen.getByText('Unknown')
      expect(badge).toBeInTheDocument()
      expect(badge.closest('.MuiChip-root')).toHaveClass('MuiChip-colorDefault')
    })
  })

  describe('Status Label Formatting', () => {
    it('should capitalize first letter of status', () => {
      renderWithProviders(<StatusBadge status="active" />)
      
      expect(screen.getByText('Active')).toBeInTheDocument()
    })

    it('should handle camelCase status names', () => {
      renderWithProviders(<StatusBadge status="inProgress" />)
      
      expect(screen.getByText('In Progress')).toBeInTheDocument()
    })

    it('should handle multiple camelCase words', () => {
      renderWithProviders(<StatusBadge status="waitingForApproval" />)
      
      expect(screen.getByText('Waiting For Approval')).toBeInTheDocument()
    })

    it('should handle empty status', () => {
      renderWithProviders(<StatusBadge status="" />)
      
      expect(screen.getByText('Unknown')).toBeInTheDocument()
    })

    it('should handle null status', () => {
      renderWithProviders(<StatusBadge status={null} />)
      
      expect(screen.getByText('Unknown')).toBeInTheDocument()
    })

    it('should handle undefined status', () => {
      renderWithProviders(<StatusBadge />)
      
      expect(screen.getByText('Unknown')).toBeInTheDocument()
    })
  })

  describe('Case Insensitivity', () => {
    it('should handle uppercase status', () => {
      renderWithProviders(<StatusBadge status="ACTIVE" />)
      
      const badge = screen.getByText('A C T I V E') // Component adds spaces between uppercase letters
      expect(badge).toBeInTheDocument()
      expect(badge.closest('.MuiChip-root')).toHaveClass('MuiChip-colorSuccess')
    })

    it('should handle mixed case status', () => {
      renderWithProviders(<StatusBadge status="AcTiVe" />)
      
      const badge = screen.getByText('Ac Ti Ve')
      expect(badge).toBeInTheDocument()
      expect(badge.closest('.MuiChip-root')).toHaveClass('MuiChip-colorSuccess')
    })
  })

  describe('Component Props', () => {
    it('should apply custom variant', () => {
      renderWithProviders(<StatusBadge status="active" variant="outlined" />)
      
      const badge = screen.getByText('Active')
      expect(badge.closest('.MuiChip-root')).toHaveClass('MuiChip-outlined')
    })

    it('should apply custom size', () => {
      renderWithProviders(<StatusBadge status="active" size="medium" />)
      
      const badge = screen.getByText('Active')
      expect(badge.closest('.MuiChip-root')).toHaveClass('MuiChip-sizeMedium')
    })

    it('should use default props when not specified', () => {
      renderWithProviders(<StatusBadge status="active" />)
      
      const badge = screen.getByText('Active')
      const chipElement = badge.closest('.MuiChip-root')
      
      expect(chipElement).toHaveClass('MuiChip-filled') // default variant
      expect(chipElement).toHaveClass('MuiChip-sizeSmall') // default size
    })
  })

  describe('All Status Types', () => {
    const statusTests = [
      { status: 'active', expectedColor: 'Success', expectedLabel: 'Active' },
      { status: 'paid', expectedColor: 'Success', expectedLabel: 'Paid' },
      { status: 'completed', expectedColor: 'Success', expectedLabel: 'Completed' },
      { status: 'success', expectedColor: 'Success', expectedLabel: 'Success' },
      { status: 'inactive', expectedColor: 'Warning', expectedLabel: 'Inactive' },
      { status: 'draft', expectedColor: 'Warning', expectedLabel: 'Draft' },
      { status: 'pending', expectedColor: 'Warning', expectedLabel: 'Pending' },
      { status: 'overdue', expectedColor: 'Error', expectedLabel: 'Overdue' },
      { status: 'failed', expectedColor: 'Error', expectedLabel: 'Failed' },
      { status: 'error', expectedColor: 'Error', expectedLabel: 'Error' },
      { status: 'cancelled', expectedColor: 'Error', expectedLabel: 'Cancelled' },
      { status: 'sent', expectedColor: 'Info', expectedLabel: 'Sent' },
      { status: 'processing', expectedColor: 'Info', expectedLabel: 'Processing' },
      { status: 'info', expectedColor: 'Info', expectedLabel: 'Info' }
    ]

    statusTests.forEach(({ status, expectedColor, expectedLabel }) => {
      it(`should render ${status} status correctly`, () => {
        renderWithProviders(<StatusBadge status={status} />)
        
        const badge = screen.getByText(expectedLabel)
        expect(badge).toBeInTheDocument()
        expect(badge.closest('.MuiChip-root')).toHaveClass(`MuiChip-color${expectedColor}`)
      })
    })
  })
})