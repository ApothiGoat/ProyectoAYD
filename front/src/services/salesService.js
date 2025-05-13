import api from './api';

const salesService = {
  // Obtener todas las ventas con filtros opcionales
  getSales: async (filters = {}) => {
    try {
      // Construir query params
      const params = new URLSearchParams();
      
      if (filters.branch_id) {
        params.append('branch_id', filters.branch_id);
      }
      
      if (filters.date_from) {
        params.append('date_from', filters.date_from);
      }
      
      if (filters.date_to) {
        params.append('date_to', filters.date_to);
      }
      
      const response = await api.get(`/sales?${params.toString()}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  // Obtener una venta por ID
  getSaleById: async (id) => {
    try {
      const response = await api.get(`/sales/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  // Crear nueva venta
  createSale: async (saleData) => {
    try {
      const response = await api.post('/sales', saleData);
      return response;
    } catch (error) {
      throw error;
    }
  }
};

export default salesService;
