import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Divider,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  Edit as EditIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import invoiceService from '../services/invoiceService';
import StatusBadge from './StatusBadge';

const InvoiceDetail = ({ invoiceId, onError, onEdit }) => {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (invoiceId) {
      loadInvoice();
    }
  }, [invoiceId]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const response = await invoiceService.getInvoice(invoiceId);
      
      if (response.success) {
        setInvoice(response.data);
      } else {
        onError(response.message || 'Failed to load invoice details');
      }
    } catch (err) {
      onError(err.message || 'Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setPdfLoading(true);
      await invoiceService.downloadInvoicePDF(
        invoice._id,
        `invoice-${invoice.invoiceNumber}.pdf`
      );
    } catch (err) {
      onError(err.message || 'Failed to download PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(invoice);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'dd/MM/yyyy');
  };

  // Format address
  const formatAddress = (address) => {
    if (!address) return 'No address provided';
    
    const parts = [
      address.street,
      address.city,
      address.state,
      address.zipCode,
      address.country
    ].filter(Boolean);
    
    return parts.join(', ');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!invoice) {
    return (
      <Alert severity="error">
        Invoice not found or failed to load.
      </Alert>
    );
  }

  return (
    <Box sx={{ maxWidth: '100%' }}>
      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={handleEdit}
        >
          Edit Invoice
        </Button>
        <Button
          variant="outlined"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
        >
          Print
        </Button>
        <Button
          variant="contained"
          startIcon={<PdfIcon />}
          onClick={handleDownloadPDF}
          loading={pdfLoading}
          disabled={pdfLoading}
        >
          {pdfLoading ? 'Generating...' : 'Download PDF'}
        </Button>
      </Box>

      {/* Invoice Header */}
      <Paper sx={{ p: 4, mb: 3 }} className="printable-invoice">
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h4" gutterBottom>
              INVOICE
            </Typography>
            <Typography variant="h6" color="primary" gutterBottom>
              #{invoice.invoiceNumber}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <StatusBadge status={invoice.status} size="medium" />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              <Typography variant="body2" color="text.secondary">
                Invoice Date
              </Typography>
              <Typography variant="body1" gutterBottom>
                {formatDate(invoice.invoiceDate)}
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                Due Date
              </Typography>
              <Typography variant="body1" gutterBottom>
                {formatDate(invoice.dueDate)}
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                Tax Type
              </Typography>
              <Typography variant="body1">
                {invoice.taxType === 'in-state' ? 'In-State (CGST + SGST)' : 'Out-State (IGST)'}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Client Information */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Bill To
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="body1" fontWeight="medium" gutterBottom>
              {invoice.clientId?.name || 'Unknown Client'}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {invoice.clientId?.email}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {invoice.clientId?.phone}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatAddress(invoice.clientId?.address)}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            {invoice.clientId?.gstNumber && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  GST Number
                </Typography>
                <Typography variant="body2">
                  {invoice.clientId.gstNumber}
                </Typography>
              </Box>
            )}
            
            {invoice.clientId?.panNumber && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  PAN Number
                </Typography>
                <Typography variant="body2">
                  {invoice.clientId.panNumber}
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Invoice Items */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Invoice Items
        </Typography>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>Size</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Unit Price</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoice.items?.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {item.productId?.name || 'Unknown Product'}
                      </Typography>
                      {item.productId?.description && (
                        <Typography variant="caption" color="text.secondary">
                          {item.productId.description}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={item.size?.charAt(0).toUpperCase() + item.size?.slice(1)} 
                      size="small" 
                      variant="outlined" 
                    />
                  </TableCell>
                  <TableCell align="right">
                    {item.quantity}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(item.customPrice)}
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="medium">
                      {formatCurrency(item.totalPrice || (item.quantity * item.customPrice))}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Tax Calculation and Totals */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            {invoice.notes && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Notes
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {invoice.notes}
                </Typography>
              </Box>
            )}
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>
                Invoice Summary
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Subtotal:</Typography>
                <Typography variant="body2">
                  {formatCurrency(invoice.subtotal)}
                </Typography>
              </Box>

              {invoice.taxType === 'in-state' ? (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">CGST (2.5%):</Typography>
                    <Typography variant="body2">
                      {formatCurrency(invoice.cgst)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">SGST (2.5%):</Typography>
                    <Typography variant="body2">
                      {formatCurrency(invoice.sgst)}
                    </Typography>
                  </Box>
                </>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">IGST (5%):</Typography>
                  <Typography variant="body2">
                    {formatCurrency(invoice.igst)}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Total Tax:</Typography>
                <Typography variant="body2">
                  {formatCurrency(invoice.totalTaxAmount)}
                </Typography>
              </Box>

              <Divider sx={{ my: 1 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6">Total Amount:</Typography>
                <Typography variant="h6" color="primary">
                  {formatCurrency(invoice.totalAmount)}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Invoice Metadata */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Invoice Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Created Date
            </Typography>
            <Typography variant="body2">
              {formatDate(invoice.createdAt)}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Last Updated
            </Typography>
            <Typography variant="body2">
              {formatDate(invoice.updatedAt)}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .printable-invoice {
            box-shadow: none !important;
            border: 1px solid #ddd !important;
          }
          
          .MuiButton-root {
            display: none !important;
          }
          
          .MuiPaper-root {
            box-shadow: none !important;
            border: 1px solid #ddd !important;
            margin-bottom: 16px !important;
          }
        }
      `}</style>
    </Box>
  );
};

export default InvoiceDetail;