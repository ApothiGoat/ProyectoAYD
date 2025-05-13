import api from './api';

const inventoryService = {
  // Obtener inventario con filtros opcionales
  getInventory: async (filters = {}) => {
    try {
      // Construir query params
      const params = new URLSearchParams();
      
      if (filters.branch_id) {
        params.append('branch_id', filters.branch_id);
      }
      
      if (filters.product_id) {
        params.append('product_id', filters.product_id);
      }
      
      const response = await api.get(`/inventory?${params.toString()}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  // Agregar inventario
  addInventory: async (inventoryData) => {
    try {
      const response = await api.post('/inventory', inventoryData);
      return response;
    } catch (error) {
      throw error;
    }
  }
};

export default inventoryService;
