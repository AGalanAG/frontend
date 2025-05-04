// src/DetectionConfigPanel.js - Panel de configuración del sistema de detección
import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, CardHeader, Typography, Switch,
  Slider, FormControlLabel, Button, Grid, Alert, CircularProgress,
  Stack, Divider, Chip, Paper, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
  Settings, Speed, HourglassEmpty, Tune, BugReport, 
  Save, Refresh, PowerSettingsNew, BarChart, Timeline, Videocam
} from '@mui/icons-material';
import { useAuth } from './context/AuthContext'; // Añadimos la importación

const baseApiUrl = 'http://localhost:8000';

// Componente para mostrar estadísticas en tarjetas
const StatCard = ({ title, value, icon, color = 'primary', suffix = '' }) => (
  <Card variant="outlined" sx={{ height: '100%' }}>
    <CardContent sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: `${color}.light`, 
          color: `${color}.dark`, 
          borderRadius: '50%', 
          p: 1, 
          mr: 1,
          width: 40,
          height: 40
        }}>
          {icon}
        </Box>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </Box>
      <Typography variant="h5" component="div" align="center" sx={{ fontWeight: 'bold' }}>
        {value}{suffix}
      </Typography>
    </CardContent>
  </Card>
);

// Componente principal del panel de configuración
const DetectionConfigPanel = () => {
  // Obtenemos authFetch del contexto de autenticación
  const { authFetch } = useAuth();
  
  // Estado de configuración
  const [config, setConfig] = useState({
    enabled: true,
    interval: 2.0,
    minConfidence: 0.4
  });
  
  // Estado de estadísticas
  const [stats, setStats] = useState(null);
  
  // Estado de cámaras
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [cameraConfig, setCameraConfig] = useState({ detectionEnabled: true });
  
  // Estado de UI
  const [loading, setLoading] = useState(true);
  const [configLoading, setConfigLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Cargar datos iniciales
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Cargar estadísticas
        const statsResponse = await authFetch(`${baseApiUrl}/api/clothing/stats`);
        if (!statsResponse.ok) {
          throw new Error(`Error ${statsResponse.status}: ${statsResponse.statusText}`);
        }
        const statsData = await statsResponse.json();
        setStats(statsData);
        
        // Extraer configuración actual
        if (statsData && statsData.service) {
          setConfig({
            enabled: statsData.service.enabled,
            interval: statsData.service.detection_interval,
            minConfidence: statsData.service.min_confidence
          });
        }
        
        // Cargar cámaras
        const camerasResponse = await authFetch(`${baseApiUrl}/cameras`);
        if (camerasResponse.ok) {
          const camerasData = await camerasResponse.json();
          setCameras(camerasData);
          
          // Seleccionar primera cámara por defecto
          if (camerasData.length > 0) {
            setSelectedCamera(camerasData[0].id);
            
            // Cargar configuración de esta cámara
            await fetchCameraConfig(camerasData[0].id);
          }
        }
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error);
        setError(`Error al cargar datos de configuración: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
    
    // Configurar actualización periódica de estadísticas
    const intervalId = setInterval(async () => {
      try {
        const response = await authFetch(`${baseApiUrl}/api/clothing/stats`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Error al actualizar estadísticas:", error);
      }
    }, 10000);  // Actualizar cada 10 segundos
    
    return () => clearInterval(intervalId);
  }, [authFetch]); // Añadimos authFetch como dependencia
  
  // Cargar configuración de cámara
  const fetchCameraConfig = async (cameraId) => {
    if (!cameraId) return;
    
    try {
      const response = await authFetch(`${baseApiUrl}/camera/${cameraId}/status`);
      if (response.ok) {
        const data = await response.json();
        
        // Extraer configuración de detección
        if (data && data.detection) {
          setCameraConfig({
            detectionEnabled: data.detection.enabled
          });
        }
      }
    } catch (error) {
      console.error(`Error al cargar configuración de cámara ${cameraId}:`, error);
    }
  };
  
  // Actualizar configuración de detección
  const handleSaveConfig = async () => {
    setConfigLoading(true);
    setSaveSuccess(false);
    
    try {
      const response = await authFetch(`${baseApiUrl}/api/clothing/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          enabled: config.enabled,
          interval: config.interval,
          min_confidence: config.minConfidence
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Configuración actualizada:", data);
      
      // Mostrar mensaje de éxito
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      // Actualizar estadísticas
      refreshStats();
    } catch (error) {
      console.error("Error al guardar configuración:", error);
      setError(`Error al guardar configuración: ${error.message}`);
    } finally {
      setConfigLoading(false);
    }
  };
  
  // Cambiar configuración de cámara
  const handleToggleCameraDetection = async (enabled) => {
    if (!selectedCamera) return;
    
    try {
      const response = await authFetch(`${baseApiUrl}/camera/${selectedCamera}/detection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          enabled: enabled
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`Detección ${enabled ? 'activada' : 'desactivada'} para cámara ${selectedCamera}:`, data);
      
      // Actualizar estado local
      setCameraConfig({
        ...cameraConfig,
        detectionEnabled: data.detection_enabled
      });
      
      // Actualizar estadísticas
      refreshStats();
    } catch (error) {
      console.error(`Error al cambiar detección de cámara ${selectedCamera}:`, error);
      setError(`Error al cambiar configuración de cámara: ${error.message}`);
    }
  };
  
  // Cambio de cámara seleccionada
  const handleCameraChange = async (event) => {
    const cameraId = event.target.value;
    setSelectedCamera(cameraId);
    
    // Cargar configuración de esta cámara
    await fetchCameraConfig(cameraId);
  };
  
  // Actualizar estadísticas
  const refreshStats = async () => {
    try {
      const response = await authFetch(`${baseApiUrl}/api/clothing/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error al actualizar estadísticas:", error);
    }
  };
  
  // Formatear estadísticas para mostrar
  const formatNumber = (num) => {
    if (num === undefined || num === null) return 'N/A';
    return num.toLocaleString();
  };
  
  // Obtener estadísticas de color
  const getTopColors = () => {
    if (!stats || !stats.database || !stats.database.colors) return [];
    
    return Object.entries(stats.database.colors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([color, count]) => ({ color, count }));
  };
  
  // Obtener estadísticas de tipo de vestimenta
  const getTopTypes = () => {
    if (!stats || !stats.database || !stats.database.types) return [];
    
    return Object.entries(stats.database.types)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ my: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Configuración del Sistema de Detección de Vestimenta
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {saveSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Configuración guardada correctamente
          </Alert>
        )}
        
        <Grid container spacing={3}>
          {/* Configuración global */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardHeader title="Configuración Global" avatar={<Settings />} />
              <CardContent>
                <FormControlLabel 
                  control={
                    <Switch
                      checked={config.enabled}
                      onChange={(e) => setConfig({...config, enabled: e.target.checked})}
                      color="primary"
                    />
                  }
                  label="Sistema de detección habilitado"
                />
                
                <Box sx={{ mt: 3 }}>
                  <Typography gutterBottom>
                    Intervalo de detección: {config.interval} segundos
                  </Typography>
                  <Slider
                    value={config.interval}
                    onChange={(e, newValue) => setConfig({...config, interval: newValue})}
                    min={0.5}
                    max={5}
                    step={0.5}
                    marks
                    valueLabelDisplay="auto"
                    disabled={!config.enabled}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Tiempo entre detecciones. Un valor menor aumenta la precisión pero consume más recursos.
                  </Typography>
                </Box>
                
                <Box sx={{ mt: 3 }}>
                  <Typography gutterBottom>
                    Confianza mínima: {config.minConfidence}
                  </Typography>
                  <Slider
                    value={config.minConfidence}
                    onChange={(e, newValue) => setConfig({...config, minConfidence: newValue})}
                    min={0.1}
                    max={0.9}
                    step={0.1}
                    marks
                    valueLabelDisplay="auto"
                    disabled={!config.enabled}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Nivel mínimo de confianza para guardar una detección. Un valor mayor reduce falsos positivos.
                  </Typography>
                </Box>
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Save />}
                    onClick={handleSaveConfig}
                    disabled={configLoading}
                  >
                    {configLoading ? 'Guardando...' : 'Guardar configuración'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Configuración por cámara */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardHeader title="Configuración por Cámara" avatar={<Videocam />} />
              <CardContent>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Seleccionar cámara</InputLabel>
                  <Select
                    value={selectedCamera}
                    onChange={handleCameraChange}
                    label="Seleccionar cámara"
                  >
                    {cameras.map((camera) => (
                      <MenuItem key={camera.id} value={camera.id}>
                        {camera.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                {selectedCamera ? (
                  <>
                    <FormControlLabel 
                      control={
                        <Switch
                          checked={cameraConfig.detectionEnabled}
                          onChange={(e) => handleToggleCameraDetection(e.target.checked)}
                          color="primary"
                        />
                      }
                      label={`Detección habilitada para ${cameras.find(c => c.id === selectedCamera)?.name || selectedCamera}`}
                    />
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Activa o desactiva la detección solo para esta cámara. La configuración global también debe estar habilitada.
                    </Typography>
                  </>
                ) : (
                  <Alert severity="info">
                    Selecciona una cámara para configurar su detección
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Tarjetas de estadísticas */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Estadísticas del Sistema de Detección
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="Total Detecciones"
              value={formatNumber(stats?.database?.total_detections)}
              icon={<BarChart />}
              color="primary"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="Frames Procesados"
              value={formatNumber(stats?.service?.processed_frames)}
              icon={<Timeline />}
              color="info"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="Tiempo Promedio"
              value={stats?.service?.detection_time_avg || 0}
              suffix=" s"
              icon={<Speed />}
              color="warning"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="Cámaras Procesadas"
              value={formatNumber(stats?.service?.cameras_processed)}
              icon={<Videocam />}
              color="success"
            />
          </Grid>
          
          {/* Estadísticas detalladas */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardHeader title="Colores más detectados" />
              <CardContent>
                {getTopColors().length > 0 ? (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {getTopColors().map(({ color, count }) => (
                      <Chip 
                        key={color}
                        label={`${color}: ${count}`}
                        color="primary"
                        variant="outlined"
                        sx={{ m: 0.5 }}
                      />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No hay datos de colores disponibles
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardHeader title="Tipos de vestimenta más detectados" />
              <CardContent>
                {getTopTypes().length > 0 ? (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {getTopTypes().map(({ type, count }) => (
                      <Chip 
                        key={type}
                        label={`${type}: ${count}`}
                        color="secondary"
                        variant="outlined"
                        sx={{ m: 0.5 }}
                      />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No hay datos de tipos disponibles
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Botones de acción */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<Refresh />}
                onClick={refreshStats}
                sx={{ mr: 2 }}
              >
                Actualizar estadísticas
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default DetectionConfigPanel;