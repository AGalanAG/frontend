// src/LiveView.js
import React, { useState, useEffect } from 'react';
import { 
  Container, Grid, Paper, Typography, Box, Alert, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, Chip
} from '@mui/material';
import { useAuth } from './context/AuthContext';
import CameraView from './components/CameraView';

const LiveView = () => {
  const { authFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [cameras, setCameras] = useState([]);
  const [selectedCameras, setSelectedCameras] = useState([]);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [error, setError] = useState(null);

  // Cargar lista de cámaras al iniciar
  useEffect(() => {
    const fetchCameras = async () => {
      try {
        setLoading(true);
        const response = await authFetch('http://localhost:8000/cameras');
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setCameras(data);
        setAvailableCameras(data);
        
        // Seleccionar la primera cámara por defecto
        if (data.length > 0) {
          setSelectedCameras([data[0]]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching cameras:', error);
        setError(`Error al cargar las cámaras: ${error.message}`);
        setLoading(false);
      }
    };

    fetchCameras();
  }, [authFetch]);

  // Actualizar cámaras disponibles cuando cambian las seleccionadas
  useEffect(() => {
    const availableCams = cameras.filter(
      cam => !selectedCameras.some(selected => selected.id === cam.id)
    );
    setAvailableCameras(availableCams);
  }, [selectedCameras, cameras]);

  // Agregar una cámara
  const handleAddCamera = (cameraId) => {
    const cameraToAdd = cameras.find(cam => cam.id === cameraId);
    
    if (selectedCameras.length >= 4) {
      alert('Ya se ha alcanzado el límite máximo de 4 cámaras simultáneas.');
      return;
    }
    
    if (cameraToAdd) {
      setSelectedCameras(prev => [...prev, cameraToAdd]);
    }
  };

  // Quitar una cámara
  const handleRemoveCamera = (cameraId) => {
    setSelectedCameras(prev => prev.filter(cam => cam.id !== cameraId));
  };

  // Calcular la cuadrícula según número de cámaras
  const getGridSize = (count) => {
    switch (count) {
      case 1: return 12; // Una cámara ocupa toda la fila
      case 2: return 6;  // Dos cámaras, cada una 6/12
      case 3:            // Tres cámaras: primera 12/12, las otras dos 6/12 cada una
      case 4: return 6;  // Cuatro cámaras: 6/12 cada una (2x2)
      default: return 12;
    }
  };

  // Ajustar diseño para 3 cámaras (primera fila completa, segunda fila dividida)
  const getGridLayout = () => {
    const count = selectedCameras.length;
    
    if (count === 3) {
      return [12, 6, 6]; // Tamaños específicos para 3 cámaras
    } else {
      const size = getGridSize(count);
      return Array(count).fill(size);
    }
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="body1" gutterBottom>
              Cámaras seleccionadas: {selectedCameras.length}/4
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {selectedCameras.map(cam => (
                <Chip
                  key={cam.id}
                  label={cam.name}
                  onDelete={() => handleRemoveCamera(cam.id)}
                />
              ))}
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth disabled={availableCameras.length === 0 || selectedCameras.length >= 4}>
              <InputLabel>Agregar cámara</InputLabel>
              <Select
                value=""
                onChange={(e) => handleAddCamera(e.target.value)}
                label="Agregar cámara"
              >
                {availableCameras.map((camera) => (
                  <MenuItem key={camera.id} value={camera.id}>
                    {camera.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      ) : (
        <Grid container spacing={2}>
          {selectedCameras.length === 0 ? (
            <Grid item xs={12}>
              <Box 
                sx={{ 
                  height: 200, 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  border: '2px dashed #ccc',
                  borderRadius: 2
                }}
              >
                <Typography variant="body1" color="textSecondary">
                  No hay cámaras seleccionadas. Añada una cámara para visualizarla.
                </Typography>
              </Box>
            </Grid>
          ) : (
            selectedCameras.map((camera, index) => {
              const gridSizes = getGridLayout();
              return (
                <Grid 
                  item 
                  xs={12} 
                  md={gridSizes[index]} 
                  key={camera.id}
                >
                  <CameraView 
                    camera={camera} 
                    onClose={() => handleRemoveCamera(camera.id)}
                    fullView={selectedCameras.length === 1} 
                  />
                </Grid>
              );
            })
          )}
        </Grid>
      )}
    </Container>
  );
};

export default LiveView;
