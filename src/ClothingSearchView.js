// src/ClothingSearchView.js - Componente para búsqueda de vestimenta
import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, Grid, Card, CardContent, CardHeader, CardMedia, CardActions,
  Typography, Box, CircularProgress, Select, MenuItem, FormControl, 
  InputLabel, Button, Paper, Divider, Stack, Alert, Chip, IconButton,
  List, ListItem, ListItemText, ListItemIcon, Tooltip, TextField, 
  Pagination, LinearProgress, Autocomplete, Checkbox, Radio, RadioGroup,
  FormControlLabel, FormLabel, FormGroup, Slider
} from '@mui/material';
import {
  Search, Camera, CalendarToday, AccessTime, Videocam, PlayArrow,
  FilterAlt, FilterAltOff, Refresh, ColorLens, Category, Timeline, ArrowBack, Pause,Download
} from '@mui/icons-material';
import { useAuth } from './context/AuthContext'; // Importar contexto de autenticación

const baseApiUrl = 'http://localhost:8000';

// Componente para mostrar marcadores en la línea de tiempo de un video
const VideoTimelineMarkers = ({ videoPath, onSeekTo, duration = 300 }) => {
  const { authFetch } = useAuth(); // Obtener la función authFetch del contexto
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeline, setTimeline] = useState([]);
  
  useEffect(() => {
    if (!videoPath) return;
    
    const fetchTimeline = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Obtener marcadores de detección para este video
        const encodedPath = encodeURIComponent(videoPath);
        console.log(`Consultando timeline para: ${encodedPath}`);
        const response = await authFetch(`${baseApiUrl}/api/clothing/video/${encodedPath}/timeline`);
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("Datos de timeline recibidos:", data);
        
        if (data.timeline && data.timeline.length > 0) {
          setTimeline(data.timeline);
        } else {
          console.log("No se encontraron marcadores para este video");
          setTimeline([]);
        }
      } catch (error) {
        console.error("Error al cargar marcadores temporales:", error);
        setError("No se pudieron cargar los marcadores de detección de vestimenta.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchTimeline();
  }, [videoPath, authFetch]);
  
  // Formatear tiempo para mostrar
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "00:00";
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Obtener color de fondo basado en tipo de prenda
  const getMarkerColor = (type) => {
    const colorMap = {
      'upper_clothing': '#2196F3', // Azul
      'lower_clothing': '#4CAF50', // Verde
      'backpack': '#FFC107',       // Amarillo
      'tie': '#9C27B0',            // Morado
      'suitcase': '#F44336'        // Rojo
    };
    return colorMap[type] || '#757575'; // Gris por defecto
  };
  
  // Obtener texto descriptivo para el tooltip
  const getMarkerTooltip = (marker) => {
    return marker.summary.map(item => 
      `${item.color} ${item.type} (${item.count})`
    ).join(', ');
  };

  if (loading) {
    return <LinearProgress />;
  }
  
  if (error) {
    return <Alert severity="warning">{error}</Alert>;
  }
  
  if (timeline.length === 0) {
    return (
      <Box sx={{ py: 1 }}>
        <Typography variant="body2" color="text.secondary">
          No hay marcadores de detección disponibles para este video.
        </Typography>
      </Box>
    );
  }
  
  // Obtener la duración total del video para calcular las posiciones
  const videoDuration = duration || Math.max(...timeline.map(m => m.time)) + 30;
  
  return (
    <Box sx={{ mt: 3, mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Línea del Tiempo de Detecciones ({timeline.length} marcadores)
      </Typography>
      
      {/* Línea del tiempo horizontal */}
      <Box 
        sx={{ 
          position: 'relative',
          width: '100%',
          height: 80,
          bgcolor: 'rgb(240, 240, 240)',
          borderRadius: 1,
          mt: 1,
          mb: 2
        }}
      >
        {/* Línea central */}
        <Box 
          sx={{ 
            position: 'absolute', 
            top: '50%', 
            left: 0, 
            right: 0, 
            height: 2, 
            bgcolor: '#9e9e9e' 
          }}
        />
        
        {/* Marcas de tiempo cada minuto */}
        {Array.from({ length: Math.ceil(videoDuration / 60) + 1 }).map((_, index) => (
          <Box 
            key={`timemark-${index}`} 
            sx={{
              position: 'absolute',
              bottom: 0,
              left: `${(index * 60 * 100) / videoDuration}%`,
              height: 12,
              width: 1,
              bgcolor: '#9e9e9e',
              textAlign: 'center'
            }}
          >
            <Typography variant="caption" sx={{ position: 'absolute', bottom: -18, left: -10 }}>
              {formatTime(index * 60)}
            </Typography>
          </Box>
        ))}
        
        {/* Marcadores de detecciones */}
        {timeline.map((marker, index) => {
          // Calcular posición relativa en la línea del tiempo
          const position = (marker.time * 100) / videoDuration;
          
          // Obtener el tipo de prenda más relevante (el primero en la lista)
          const primaryType = marker.summary.length > 0 ? marker.summary[0].type : 'unknown';
          const markerColor = getMarkerColor(primaryType);
          const tooltipText = getMarkerTooltip(marker);
          
          return (
            <Tooltip 
              key={`marker-${index}`} 
              title={<>
                <Typography variant="caption">{formatTime(marker.time)}</Typography>
                <br />
                <Typography variant="caption">{tooltipText}</Typography>
              </>}
              placement="top"
              arrow
            >
              <Box
                onClick={() => onSeekTo(marker.time)}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: `${position}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  bgcolor: markerColor,
                  border: '2px solid white',
                  cursor: 'pointer',
                  '&:hover': {
                    width: 20,
                    height: 20,
                    boxShadow: '0 0 5px rgba(0,0,0,0.3)'
                  },
                  transition: 'all 0.2s ease'
                }}
              />
            </Tooltip>
          );
        })}
      </Box>
      
      {/* Leyenda de colores */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#2196F3', mr: 1 }} />
          <Typography variant="caption">Parte superior</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#4CAF50', mr: 1 }} />
          <Typography variant="caption">Parte inferior</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#FFC107', mr: 1 }} />
          <Typography variant="caption">Mochilas</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#757575', mr: 1 }} />
          <Typography variant="caption">Otros</Typography>
        </Box>
      </Box>
      
      {/* Instrucciones de uso */}
      <Typography variant="body2" color="text.secondary">
        Haz clic en cualquier marcador para saltar a ese momento en el video.
      </Typography>
    </Box>
  );
};

// Componente para reproducir grabaciones con marcadores de detección
const ClothingDetectionPlayer = ({ recording, onBack }) => {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Reiniciar estado cuando cambia la grabación
    setPlaying(false);
    setCurrentTime(0);
    setLoading(true);
    setError(null);
    
    console.log("Intentando reproducir:", `${baseApiUrl}/recordings/${recording?.path}`);
  }, [recording]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pause();
      } else {
        // Intentamos reproducir y manejamos posibles errores
        const playPromise = videoRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // Reproducción iniciada con éxito
              console.log("Reproducción iniciada correctamente");
            })
            .catch(err => {
              console.error("Error al iniciar reproducción:", err);
              setError(`Error al iniciar reproducción: ${err.message}`);
            });
        }
      }
      setPlaying(!playing);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleDurationChange = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setLoading(false);
    }
  };

  const handleSliderChange = (event) => {
    const newTime = parseFloat(event.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };
  
  const handleSeekTo = (timeInSeconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timeInSeconds;
      setCurrentTime(timeInSeconds);
      // Iniciar reproducción automáticamente
      if (!playing) {
        videoRef.current.play();
        setPlaying(true);
      }
    }
  };

  const handleError = (event) => {
    console.error('Error en reproducción de video:', event);
    setError('Error al reproducir el video. Puede ser que el formato no sea compatible o que el archivo no exista.');
    setLoading(false);
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds === Infinity) return '00:00';
    
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Intentar reproducción directa mediante enlace de descarga si el streaming falla
  const handleTryDirectDownload = () => {
    const downloadUrl = `${baseApiUrl}/recordings/${recording?.path}`;
    console.log("Descargando desde:", downloadUrl);
    window.open(downloadUrl, '_blank');
  };

  // Asegurarse de que el recording existe y tiene los datos necesarios
  if (!recording || !recording.path) {
    return (
      <Alert severity="error">
        Error: No se puede reproducir el video porque faltan datos necesarios.
      </Alert>
    );
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardHeader
        title={`Reproduciendo: ${recording.filename || 'Sin nombre'}`}
        subheader={`Cámara: ${recording.camera_id || 'Desconocida'} • Fecha: ${recording.date || 'Sin fecha'} • Hora: ${recording.hour}:00`}
        action={
          <Button 
            startIcon={<ArrowBack />} 
            onClick={onBack}
            sx={{ mt: 1 }}
          >
            Volver a la lista
          </Button>
        }
      />
      <CardContent sx={{ p: 1 }}>
        {loading && <LinearProgress />}
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            action={
              <Button color="inherit" size="small" onClick={handleTryDirectDownload}>
                Descargar Video
              </Button>
            }
          >
            {error}
          </Alert>
        )}
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Box sx={{ width: '100%', bgcolor: 'black', position: 'relative' }}>
              <video
                ref={videoRef}
                src={`${baseApiUrl}/recordings/${recording.path}`}
                type="video/mp4"
                controls={true}  // Controles nativos para mejor compatibilidad
                style={{ width: '100%', maxHeight: '70vh' }}
                onTimeUpdate={handleTimeUpdate}
                onDurationChange={handleDurationChange}
                onError={handleError}
                onLoadedData={() => setLoading(false)}
                preload="auto"
              />
            </Box>
            
            <Box sx={{ mt: 2, px: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item>
                  <IconButton 
                    onClick={handlePlayPause} 
                    disabled={loading || error}
                  >
                    {playing ? <Pause /> : <PlayArrow />}
                  </IconButton>
                </Grid>
                <Grid item xs>
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    step={0.1}
                    value={currentTime || 0}
                    onChange={handleSliderChange}
                    style={{ width: '100%' }}
                    disabled={loading || error}
                  />
                </Grid>
                <Grid item>
                  <Typography variant="body2">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </Typography>
                </Grid>
                <Grid item>
                  <Tooltip title="Descargar">
                    <IconButton 
                      href={`${baseApiUrl}/recordings/${recording.path}`}
                      download
                      disabled={loading || error}
                    >
                      <Download />
                    </IconButton>
                  </Tooltip>
                </Grid>
              </Grid>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              Detecciones de vestimenta
            </Typography>
            <VideoTimelineMarkers 
              videoPath={recording.path} 
              onSeekTo={handleSeekTo}
              duration={duration}  // Pasar duración del video actual
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

// Componente principal de búsqueda de vestimenta
const ClothingSearchView = () => {
  const { authFetch } = useAuth(); // Obtener la función authFetch del contexto
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [availableOptions, setAvailableOptions] = useState({
    clothingTypes: [],
    colors: []
  });
  
  // Filtros de búsqueda
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.5);
  
  // Paginación
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  
  // Reproducción
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Cargar datos iniciales: cámaras y opciones de vestimenta
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Cargar cámaras
        const camerasResponse = await authFetch(`${baseApiUrl}/cameras`);
        if (camerasResponse.ok) {
          const camerasData = await camerasResponse.json();
          setCameras(camerasData);
        }
        
        // Cargar opciones de vestimenta
        const optionsResponse = await authFetch(`${baseApiUrl}/api/clothing/available`);
        if (optionsResponse.ok) {
          const optionsData = await optionsResponse.json();
          
          // Formatear tipos de vestimenta para UI
          const formattedTypes = Object.entries(optionsData.clothing_types || {}).map(([id, name]) => ({
            id,
            name
          }));
          
          setAvailableOptions({
            clothingTypes: formattedTypes,
            colors: optionsData.colors || []
          });
        }
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error);
        setError("Error al cargar datos. Por favor, recargue la página.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [authFetch]);
  
  // Función para realizar búsqueda
  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Construir URL con parámetros de búsqueda
      const url = new URL(`${baseApiUrl}/api/clothing/search`);
      
      if (selectedCamera) {
        url.searchParams.append('camera_id', selectedCamera);
      }
      
      if (selectedType) {
        url.searchParams.append('clothing_type', selectedType);
      }
      
      if (selectedColor) {
        url.searchParams.append('color', selectedColor);
      }
      
      url.searchParams.append('confidence', confidenceThreshold.toString());
      
      // Realizar búsqueda
      const response = await authFetch(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Agrupar resultados por video
      const groupedResults = groupResultsByVideo(data.results || []);
      setSearchResults(groupedResults);
      setPage(1); // Volver a primera página
      
    } catch (error) {
      console.error("Error en búsqueda:", error);
      setError(`Error al buscar: ${error.message}`);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Agrupar resultados por video para mostrar una sola entrada por video
  const groupResultsByVideo = (results) => {
    const groupedByVideo = {};
    
    for (const detection of results) {
      if (!groupedByVideo[detection.video_path]) {
        // Extraer información relevante del path
        // Ejemplo: cam1/2023-12-10/14/Entrada_Principal_2023-12-10_14-30-00.mp4
        const pathParts = detection.video_path.split('/');
        const cameraId = pathParts[0];
        const date = pathParts[1];
        const hour = pathParts[2];
        const filename = pathParts[3];
        
        groupedByVideo[detection.video_path] = {
          camera_id: cameraId,
          path: detection.video_path,
          date: date,
          hour: hour,
          filename: filename,
          detections_count: 0,
          detections: [],
          confidence: 0
        };
      }
      
      // Añadir detección y actualizar contador
      groupedByVideo[detection.video_path].detections.push(detection);
      groupedByVideo[detection.video_path].detections_count += 1;
      
      // Actualizar confianza máxima
      if (detection.confidence > groupedByVideo[detection.video_path].confidence) {
        groupedByVideo[detection.video_path].confidence = detection.confidence;
      }
    }
    
    // Convertir a array y ordenar por cantidad de detecciones
    return Object.values(groupedByVideo).sort((a, b) => b.detections_count - a.detections_count);
  };
  
  // Manejadores de eventos
  const handleCameraChange = (event) => {
    setSelectedCamera(event.target.value);
  };
  
  const handleTypeChange = (event) => {
    setSelectedType(event.target.value);
  };
  
  const handleColorChange = (event) => {
    setSelectedColor(event.target.value);
  };
  
  const handleConfidenceChange = (event) => {
    setConfidenceThreshold(parseFloat(event.target.value));
  };
  
  const handleClearFilters = () => {
    setSelectedCamera('');
    setSelectedType('');
    setSelectedColor('');
    setConfidenceThreshold(0.5);
  };
  
  const handlePageChange = (event, value) => {
    setPage(value);
  };
  
  const handlePlayRecording = (recording) => {
    console.log("Seleccionando grabación para reproducción:", recording);
    setSelectedRecording(recording);
    setIsPlaying(true);
  };
  
  const handleBackToList = () => {
    setSelectedRecording(null);
    setIsPlaying(false);
  };
  
  // Paginación
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedResults = searchResults.slice(startIndex, endIndex);
  const pageCount = Math.ceil(searchResults.length / itemsPerPage);
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Búsqueda de Vestimenta
      </Typography>
      
      {/* Reproducción de grabación seleccionada */}
      {isPlaying && selectedRecording && (
        <ClothingDetectionPlayer
          recording={selectedRecording}
          onBack={handleBackToList}
        />
      )}
      
      {/* Filtros de búsqueda */}
      {!isPlaying && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Criterios de búsqueda
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Cámara</InputLabel>
                <Select
                  value={selectedCamera}
                  onChange={handleCameraChange}
                  label="Cámara"
                >
                  <MenuItem value="">Todas las cámaras</MenuItem>
                  {cameras.map((camera) => (
                    <MenuItem key={camera.id} value={camera.id}>
                      {camera.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Tipo de vestimenta</InputLabel>
                <Select
                  value={selectedType}
                  onChange={handleTypeChange}
                  label="Tipo de vestimenta"
                >
                  <MenuItem value="">Todos los tipos</MenuItem>
                  {availableOptions.clothingTypes.map((type) => (
                    <MenuItem key={type.id} value={type.name}>
                      {type.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Color</InputLabel>
                <Select
                  value={selectedColor}
                  onChange={handleColorChange}
                  label="Color"
                >
                  <MenuItem value="">Todos los colores</MenuItem>
                  {availableOptions.colors.map((color) => (
                    <MenuItem key={color} value={color}>
                      {color}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Box sx={{ width: '100%' }}>
                <Typography variant="body2" gutterBottom>
                  Confianza mínima: {confidenceThreshold}
                </Typography>
                <Slider
                  value={confidenceThreshold}
                  onChange={handleConfidenceChange}
                  min={0.1}
                  max={0.9}
                  step={0.1}
                  valueLabelDisplay="auto"
                  marks
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<Search />}
                  onClick={handleSearch}
                  fullWidth
                >
                  Buscar
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FilterAltOff />}
                  onClick={handleClearFilters}
                >
                  Limpiar
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {/* Lista de resultados */}
      {!isPlaying && (
        <>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : searchResults.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="textSecondary">
                No se encontraron detecciones con los criterios seleccionados
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Pruebe a cambiar los filtros o realizar una nueva búsqueda
              </Typography>
            </Paper>
          ) : (
            <>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Se encontraron {searchResults.length} grabaciones con detecciones de vestimenta
              </Typography>
              
              <Grid container spacing={2}>
                {paginatedResults.map((result) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={result.path}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ 
                        bgcolor: '#222', 
                        color: 'white',
                        height: 140, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}>
                        <Videocam sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="body2">
                          {result.detections_count} detecciones
                        </Typography>
                      </Box>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" component="div" noWrap>
                          {result.filename || 'Sin nombre'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <CalendarToday fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {result.date || 'Sin fecha'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <AccessTime fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {result.hour}:00
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <Camera fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {cameras.find(c => c.id === result.camera_id)?.name || result.camera_id}
                          </Typography>
                        </Box>
                        <Box sx={{ mt: 1 }}>
                          <Chip 
                            size="small" 
                            icon={<Category fontSize="small" />}
                            label={`${result.detections_count} detecciones`} 
                            color="primary"
                            variant="outlined" 
                          />
                        </Box>
                      </CardContent>
                      <CardActions>
                        <Button 
                          startIcon={<PlayArrow />}
                          onClick={() => handlePlayRecording(result)}
                          fullWidth
                          disabled={!result.path}
                          variant="contained"
                        >
                          Ver detecciones
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              
              {/* Paginación */}
              {pageCount > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination 
                    count={pageCount} 
                    page={page} 
                    onChange={handlePageChange} 
                    color="primary" 
                  />
                </Box>
              )}
            </>
          )}
        </>
      )}
    </Container>
  );
};

export default ClothingSearchView;