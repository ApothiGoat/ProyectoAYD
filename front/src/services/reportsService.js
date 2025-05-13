import api from './api';

const reportsService = {
  // Métricas de ventas
  getSalesMetrics: async (period = 'monthly', branch_id = null) => {
    try {
      const params = new URLSearchParams();
      
      params.append('period', period);
      
      if (branch_id) {
        params.append('branch_id', branch_id);
      }
      
      const response = await api.get(`/metrics/sales?${params.toString()}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  // Métricas de rendimiento de sucursales
  getBranchPerformance: async () => {
    try {
      const response = await api.get('/metrics/performance');
      return response;
    } catch (error) {
      throw error;
    }
  }
};

export default reportsService;
