import api from './api';

const invoiceService = {
  // Get all invoices with pagination and filtering
  getInvoices: async (params = {}) => {
    const response = await api.get('/invoices', { params });
    return response.data;
  },

  // Get single invoice by ID with populated data
  getInvoice: async (id) => {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  },

  // Create new invoice
  createInvoice: async (invoiceData) => {
    const response = await api.post('/invoices', invoiceData);
    return response.data;
  },

  // Update existing invoice
  updateInvoice: async (id, invoiceData) => {
    const response = await api.put(`/invoices/${id}`, invoiceData);
    return response.data;
  },

  // Delete invoice
  deleteInvoice: async (id) => {
    const response = await api.delete(`/invoices/${id}`);
    return response.data;
  },

  // Generate PDF for invoice
  getInvoicePDF: async (id) => {
    const response = await api.get(`/invoices/${id}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Download PDF for invoice
  downloadInvoicePDF: async (id, filename) => {
    const pdfBlob = await invoiceService.getInvoicePDF(id);
    const url = window.URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `invoice-${id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Search invoices
  searchInvoices: async (query, params = {}) => {
    const response = await api.get('/invoices', {
      params: { search: query, ...params }
    });
    return response.data;
  }
};

export default invoiceService;