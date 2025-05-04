// src/UserManagementPanel.js
import React, { useState, useEffect } from 'react';
import {
  Container, Paper, Typography, Box, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, IconButton, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, FormControl, InputLabel,
  Select, MenuItem, Alert, Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useAuth } from './context/AuthContext';

// Definir la URL base de la API como constante
const baseApiUrl = 'http://localhost:8000';

const UserManagementPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [currentUser, setCurrentUser] = useState({
    id: null,
    username: '',
    password: '',
    role: 1
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Usando el hook useAuth para obtener authFetch y el usuario actual
  const { user: currentLoggedUser, authFetch } = useAuth();
  
  const roleLabels = {
    1: { label: 'Visualizador', color: 'info' },
    2: { label: 'Operador', color: 'warning' },
    3: { label: 'Administrador', color: 'error' }
  };
  
  // Cargar usuarios al montar el componente
  useEffect(() => {
    fetchUsers();
  }, [authFetch]); // Añadir authFetch como dependencia
  
  // Función para obtener la lista de usuarios
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Usar la ruta completa con el prefijo base
      const response = await authFetch(`${baseApiUrl}/api/auth/users`);
      
      if (!response.ok) {
        throw new Error('Error al obtener usuarios');
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error:', error);
      setError('No se pudieron cargar los usuarios: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Abrir diálogo para crear nuevo usuario
  const handleOpenCreateDialog = () => {
    setIsEditing(false);
    setDialogTitle('Crear Nuevo Usuario');
    setCurrentUser({
      id: null,
      username: '',
      password: '',
      role: 1
    });
    setFormError('');
    setOpenDialog(true);
  };
  
  // Abrir diálogo para editar usuario
  const handleOpenEditDialog = (user) => {
    setIsEditing(true);
    setDialogTitle('Editar Usuario');
    setCurrentUser({
      id: user.id,
      username: user.username,
      password: '',  // No mostrar contraseña actual
      role: user.role
    });
    setFormError('');
    setOpenDialog(true);
  };
  
  // Cerrar diálogo
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentUser(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Guardar usuario (crear o editar)
  const handleSaveUser = async () => {
    setFormError('');
    
    // Validación básica
    if (!currentUser.username.trim()) {
      setFormError('El nombre de usuario es obligatorio');
      return;
    }
    
    if (!isEditing && !currentUser.password.trim()) {
      setFormError('La contraseña es obligatoria para nuevos usuarios');
      return;
    }
    
    try {
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing 
        ? `${baseApiUrl}/api/auth/users/${currentUser.id}`
        : `${baseApiUrl}/api/auth/users`;
      
      // Eliminar id para nuevos usuarios
      const userData = { ...currentUser };
      if (!isEditing) {
        delete userData.id;
      }
      
      // Si estamos editando y no se proporciona contraseña, eliminarla para no actualizarla
      if (isEditing && !userData.password.trim()) {
        delete userData.password;
      }
      
      const response = await authFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al guardar usuario');
      }
      
      // Actualizar lista de usuarios
      fetchUsers();
      handleCloseDialog();
      
      // Mostrar mensaje de éxito
      setSuccessMessage(isEditing ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente');
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      console.error('Error:', error);
      setFormError('Error: ' + error.message);
    }
  };
  
  // Abrir confirmación de eliminación
  const handleOpenDeleteConfirm = (user) => {
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  };
  
  // Cerrar confirmación de eliminación
  const handleCloseDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setUserToDelete(null);
  };
  
  // Eliminar usuario
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      const response = await authFetch(`${baseApiUrl}/api/auth/users/${userToDelete.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Error al eliminar usuario');
      }
      
      // Actualizar lista de usuarios
      fetchUsers();
      handleCloseDeleteConfirm();
      
      // Mostrar mensaje de éxito
      setSuccessMessage('Usuario eliminado correctamente');
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      console.error('Error:', error);
      setError('No se pudo eliminar el usuario: ' + error.message);
      handleCloseDeleteConfirm();
    }
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">Administración de Usuarios</Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleOpenCreateDialog}
          >
            Nuevo Usuario
          </Button>
        </Box>
        
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Usuario</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">Cargando usuarios...</TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">No hay usuarios registrados</TableCell>
                </TableRow>
              ) : (
                users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      <Chip 
                        label={roleLabels[user.role]?.label || 'Desconocido'} 
                        color={roleLabels[user.role]?.color || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        color="primary" 
                        onClick={() => handleOpenEditDialog(user)}
                      >
                        <EditIcon />
                      </IconButton>
                      
                      {/* No permitir eliminar el usuario actual o el último admin */}
                      <IconButton 
                        color="error" 
                        onClick={() => handleOpenDeleteConfirm(user)}
                        disabled={user.id === currentLoggedUser?.id}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      {/* Diálogo para crear/editar usuario */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>
          )}
          
          <TextField
            margin="dense"
            name="username"
            label="Nombre de usuario"
            type="text"
            fullWidth
            value={currentUser.username}
            onChange={handleInputChange}
          />
          
          <TextField
            margin="dense"
            name="password"
            label={isEditing ? "Nueva contraseña (dejar en blanco para no cambiar)" : "Contraseña"}
            type="password"
            fullWidth
            value={currentUser.password}
            onChange={handleInputChange}
          />
          
          <FormControl fullWidth margin="dense">
            <InputLabel id="role-label">Rol</InputLabel>
            <Select
              labelId="role-label"
              name="role"
              value={currentUser.role}
              onChange={handleInputChange}
              label="Rol"
            >
              <MenuItem value={1}>Visualizador</MenuItem>
              <MenuItem value={2}>Operador</MenuItem>
              <MenuItem value={3}>Administrador</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSaveUser} variant="contained" color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={deleteConfirmOpen} onClose={handleCloseDeleteConfirm}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de que desea eliminar al usuario "{userToDelete?.username}"?
            Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfirm}>Cancelar</Button>
          <Button onClick={handleDeleteUser} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserManagementPanel;