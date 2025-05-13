import React, { createContext, useState, useContext, useCallback } from 'react';

// Crear el contexto
const AuthContext = createContext();

// Proveedor del contexto que envuelve la aplicación
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({
    username: 'admin',
    role: 'admin',
    branch_id: null
  });
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Función para iniciar sesión (simplificada)
  const login = async (credentials) => {
    setUser({
      username: credentials.username || 'admin',
      role: 'admin',
      branch_id: null
    });
    setIsAuthenticated(true);
    return true;
  };
  
  // Función para cerrar sesión
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };
  
  // Función para verificar autenticación
  const checkAuth = useCallback(() => {
    // Simulamos autenticación para desarrollo
    return true;
  }, []);
  
  // Valor del contexto que se proporcionará
  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    checkAuth
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  // Si el contexto es undefined, significa que el hook se está usando
  // fuera de un AuthProvider
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  
  return context;
};
