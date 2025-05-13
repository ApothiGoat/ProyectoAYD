import api from './api';

const branchesService = {
  // Obtener todas las sucursales
  getBranches: async () => {
    try {
      const response = await api.get('/branches');
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  // Crear nueva sucursal
  createBranch: async (branchData) => {
    try {
      const response = await api.post('/branches', branchData);
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  // Actualizar sucursal
  updateBranch: async (id, branchData) => {
    try {
      const response = await api.put(`/branches/${id}`, branchData);
      return response;
    } catch (error) {
      throw error;
    }
  }
};

export default branchesService;
