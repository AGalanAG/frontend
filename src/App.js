// src/App.js con autenticación implementada
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { 
  Container, Grid, Card, CardContent, CardHeader, 
  Typography, AppBar, Toolbar, Box, 
  CircularProgress, Select, MenuItem, FormControl, 
  InputLabel, Button, Checkbox, ListItemText, OutlinedInput,
  IconButton, Paper, Divider, Stack, Alert, Chip, Tabs, Tab, Menu, Avatar
} from '@mui/material';
import CameraIcon from '@mui/icons-material/Videocam';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

// Importar componentes
import LiveView from './LiveView';
import RecordingsView from './RecordingsView';
import ClothingSearchView from './ClothingSearchView';
import DetectionConfigPanel from './DetectionConfigPanel';
import LoginForm from './LoginForm';
import UserManagementPanel from './UserManagementPanel';
import ProtectedRoute from './components/ProtectedRoute';
import UnauthorizedPage from './components/UnauthorizedPage';

// Contexto de autenticación
import { AuthProvider, useAuth } from './context/AuthContext';

function AppContent() {
  const { user, logout, hasRole, ROLE_VIEWER, ROLE_OPERATOR, ROLE_ADMIN } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  
  // Restablecer a la primera pestaña al iniciar sesión
  useEffect(() => {
    if (user) {
      setActiveTab(0);
    }
  }, [user]);
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };
  
  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };
  
  const handleLogout = () => {
    handleUserMenuClose();
    logout();
  };
  
  // Si no ha iniciado sesión, mostrar formulario de login
  if (!user) {
    return <LoginForm />;
  }
  
  const userRoleInfo = {
    1: { label: 'Visualizador', color: 'info' },
    2: { label: 'Operador', color: 'warning' },
    3: { label: 'Administrador', color: 'error' }
  };
  
  // Obtener información de rol para el usuario actual
  const roleInfo = userRoleInfo[user.role] || userRoleInfo[1];
  
  // Renderizar contenido según la pestaña activa
  const renderContent = () => {
    switch (activeTab) {
      case 0: // Live View - Todos los usuarios
        return <LiveView />;
      case 1: // Recordings - Operadores y Administradores
        return hasRole(ROLE_OPERATOR) ? (
          <RecordingsView />
        ) : (
          <UnauthorizedPage />
        );
      case 2: // Clothing Search - Operadores y Administradores
        return hasRole(ROLE_OPERATOR) ? (
          <ClothingSearchView />
        ) : (
          <UnauthorizedPage />
        );
      case 3: // Configuration - Solo Administrador
        return hasRole(ROLE_ADMIN) ? (
          <DetectionConfigPanel />
        ) : (
          <UnauthorizedPage />
        );
      case 4: // User Management - Solo Administrador
        return hasRole(ROLE_ADMIN) ? (
          <UserManagementPanel />
        ) : (
          <UnauthorizedPage />
        );
      default:
        return <div>Contenido no disponible</div>;
    }
  };

  return (
    <div className="App">
      <AppBar position="static" color="primary">
        <Toolbar>
          <CameraIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Sistema de Visualización, Grabación y Detección de Vestimenta
          </Typography>
          
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            textColor="inherit"
            indicatorColor="secondary"
            sx={{ 
              flexGrow: 1, 
              '& .MuiTab-root': { minWidth: 100 } 
            }}
          >
            <Tab icon={<CameraIcon />} label="En vivo" />
            
            {/* Usar concatenación de arrays en lugar de fragmentos */}
            {[
              ...(hasRole(ROLE_OPERATOR) ? [
                <Tab key="recordings" icon={<VideoLibraryIcon />} label="Grabaciones" />,
                <Tab key="search" icon={<SearchIcon />} label="Buscar vestimenta" />
              ] : []),
              
              ...(hasRole(ROLE_ADMIN) ? [
                <Tab key="config" icon={<SettingsIcon />} label="Configuración" />,
                <Tab key="users" icon={<AdminPanelSettingsIcon />} label="Usuarios" />
              ] : [])
            ]}
          </Tabs>
          
          {/* Menú de usuario */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Chip
              avatar={<Avatar><PersonIcon /></Avatar>}
              label={`${user.username} (${roleInfo.label})`}
              color={roleInfo.color}
              onClick={handleUserMenuOpen}
              sx={{ ml: 2 }}
            />
            
            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={handleUserMenuClose}
            >
              <MenuItem disabled>
                <Typography variant="body2">
                  Conectado como: <strong>{user.username}</strong>
                </Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                Cerrar sesión
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {renderContent()}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<AppContent />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;