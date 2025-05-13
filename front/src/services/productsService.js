import api from './api';

const productsService = {
  // Obtener productos con filtros opcionales
  getProducts: async (filters = {}) => {
    try {
      // Construir query params
      const params = new URLSearchParams();
      
      if (filters.category) {
        params.append('category', filters.category);
      }
      
      if (filters.name) {
        params.append('name', filters.name);
      }
      
      const response = await api.get(`/products?${params.toString()}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  // Crear nuevo producto
  createProduct: async (productData) => {
    try {
      const response = await api.post('/products', productData);
      return response;
    } catch (error) {
      throw error;
    }
  }
};

export default productsService;
