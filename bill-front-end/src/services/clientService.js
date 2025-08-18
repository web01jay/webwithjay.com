import api from './api';

const clientService = {
  // Get all clients with pagination and filtering
  getClients: async (params = {}) => {
    const response = await api.get('/clients', { params });
    return response.data;
  },

  // Get single client by ID
  getClient: async (id) => {
    const response = await api.get(`/clients/${id}`);
    return response.data;
  },

  // Get client's invoice history
  getClientInvoices: async (id, params = {}) => {
    const response = await api.get(`/clients/${id}/invoices`, { params });
    return response.data;
  },

  // Create new client
  createClient: async (clientData) => {
    const response = await api.post('/clients', clientData);
    return response.data;
  },

  // Update existing client
  updateClient: async (id, clientData) => {
    const response = await api.put(`/clients/${id}`, clientData);
    return response.data;
  },

  // Delete client
  deleteClient: async (id) => {
    const response = await api.delete(`/clients/${id}`);
    return response.data;
  },

  // Search clients
  searchClients: async (query, params = {}) => {
    const response = await api.get('/clients', {
      params: { search: query, ...params }
    });
    return response.data;
  }
};

export default clientService;