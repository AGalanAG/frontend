// src/components/UnauthorizedPage.js
import React from 'react';
import { Container, Paper, Typography, Button, Box } from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  
  return (
    <Container maxWidth="md" sx={{ mt: 5 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Box sx={{ mb: 3 }}>
          <LockIcon color="error" sx={{ fontSize: 60 }} />
        </Box>
        <Typography variant="h4" gutterBottom>
          Acceso No Autorizado
        </Typography>
        <Typography variant="body1" paragraph sx={{ mb: 3 }}>
          No tiene permisos suficientes para acceder a esta sección.
          Contacte al administrador si cree que debería tener acceso.
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => navigate('/')}
        >
          Volver a Inicio
        </Button>
      </Paper>
    </Container>
  );
};

export default UnauthorizedPage;