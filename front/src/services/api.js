// src/services/api.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

// Crear instancia de axios con URL base
const api = axios.create({
  baseURL: API_URL
});

// Interceptor para agregar token a las solicitudes
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Si el error es 401 (no autorizado), podría ser que el token expiró
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;
