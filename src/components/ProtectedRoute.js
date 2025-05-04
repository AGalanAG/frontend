import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Componente que redirige a los usuarios no autorizados
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, hasRole, loading } = useAuth();
  
  // Mientras verifica la autenticación, no hacer nada
  if (loading) {
    return <div>Cargando...</div>;
  }
  
  // Si no hay usuario autenticado, redirigir al login
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  // Si se requiere un rol específico y el usuario no lo tiene, redirigir a no autorizado
  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/unauthorized" />;
  }
  
  // Si pasa todas las validaciones, mostrar el contenido protegido
  return children;
};

export default ProtectedRoute;