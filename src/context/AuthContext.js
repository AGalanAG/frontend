import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

// Crear el contexto de autenticación
const AuthContext = createContext(null);

// Definir constantes para los roles
const ROLE_VIEWER = 1;   // Visualizador - solo puede ver cámaras
const ROLE_OPERATOR = 2; // Operador - puede ver grabaciones y buscar vestimenta
const ROLE_ADMIN = 3;    // Administrador - acceso completo

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Al iniciar, verificar si hay una sesión activa
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (token) {
          // Verificar si el token es válido con el backend
          const response = await fetch('http://localhost:8000/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            // Token inválido, limpiar localStorage
            localStorage.removeItem('token');
          }
        }
      } catch (error) {
        console.error('Error al verificar autenticación:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Función de login
  const login = async (username, password) => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error de autenticación');
      }
      
      const data = await response.json();
      
      // Guardar token en localStorage
      localStorage.setItem('token', data.access_token);
      
      // Establecer los datos del usuario
      setUser(data.user);
      
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };
  
  // Función de logout
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };
  
  // Verificar si el usuario tiene cierto rol o superior
  const hasRole = (roleLevel) => {
    if (!user) return false;
    return user.role >= roleLevel;
  };
  
  // Verificar si el usuario tiene un rol específico
  const hasExactRole = (roleLevel) => {
    if (!user) return false;
    return user.role === roleLevel;
  };
  
  // AÑADIR ESTA FUNCIÓN: Función para realizar peticiones autenticadas
  const authFetch = useCallback(async (url, options = {}) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No hay token de autenticación disponible');
    }
    
    // Añadir el token a las cabeceras
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };
    
    // Realizar la petición con las cabeceras actualizadas
    return fetch(url, {
      ...options,
      headers
    });
  }, []);  // useCallback para evitar recreaciones innecesarias
  
  const authValues = {
    user,
    loading,
    login,
    logout,
    hasRole,
    hasExactRole,
    authFetch,  // Incluir la función en el contexto
    ROLE_VIEWER,
    ROLE_OPERATOR,
    ROLE_ADMIN
  };
  
  return (
    <AuthContext.Provider value={authValues}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto de autenticación
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
