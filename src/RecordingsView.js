// src/RecordingsView.js - Componente corregido para visualización y reproducción de grabaciones
import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, Grid, Card, CardContent, CardHeader, CardMedia, CardActions,
  Typography, Box, CircularProgress, Select, MenuItem, FormControl, 
  InputLabel, Button, Paper, Divider, Stack, Alert, Chip, IconButton,
  List, ListItem, ListItemText, ListItemIcon, Tooltip, TextField, 
  Pagination, LinearProgress
} from '@mui/material';
import {
  PlayArrow, Pause, Download, CalendarToday, AccessTime,
  Videocam, Delete, SkipPrevious, SkipNext, NavigateBefore, 
  NavigateNext, Refresh, ArrowBack
} from '@mui/icons-material';
import { useAuth } from './context/AuthContext'; // Importar contexto de autenticación

const baseApiUrl = 'http://localhost:8000';

// Componente para mostrar placeholder en lugar de imagen externa
const VideoPlaceholder = () => (
  <Box
    sx={{
      width: '100%',
      height: 140,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: '#222',
      color: 'white'
    }}
  >
    <Stack direction="column" alignItems="center" spacing={1}>
      <Videocam fontSize="large" />
      <Typography variant="caption">Vista previa no disponible</Typography>
    </Stack>
  </Box>
);

// Componente para reproducir una grabación específica
const RecordingPlayer = ({ recording, onBack }) => {
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
        subheader={`Cámara: ${recording.camera_id || 'Desconocida'} • Fecha: ${recording.date || 'Sin fecha'} • Hora: ${recording.time ? recording.time.replace(/-/g, ':') : 'Sin hora'}`}
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
      </CardContent>
    </Card>
  );
};

// Componente principal de visualización de grabaciones
const RecordingsView = () => {
  const { authFetch } = useAuth(); // Obtener la función authFetch del contexto
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recordings, setRecordings] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [dates, setDates] = useState([]);
  const [hours, setHours] = useState([]);
  
  // Filtros
  const [selectedCamera, setSelectedCamera] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedHour, setSelectedHour] = useState('');
  
  // Paginación
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  
  // Reproducción
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Cargar lista de cámaras
  useEffect(() => {
    const fetchCameras = async () => {
      try {
        const response = await authFetch(`${baseApiUrl}/cameras`);
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        setCameras(data);
      } catch (error) {
        console.error('Error al cargar cámaras:', error);
        setError('Error al cargar la lista de cámaras. Por favor, recargue la página.');
      }
    };

    fetchCameras();
  }, [authFetch]);
  
  // Cargar fechas disponibles cuando cambia la cámara seleccionada
  useEffect(() => {
    const fetchDates = async () => {
      try {
        const url = new URL(`${baseApiUrl}/api/recordings/dates`);
        if (selectedCamera) {
          url.searchParams.append('camera_id', selectedCamera);
        }
        
        const response = await authFetch(url);
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setDates(data.dates || []);
        
        // Limpiar fecha seleccionada si ya no está disponible
        if (selectedDate && !data.dates.includes(selectedDate)) {
          setSelectedDate('');
        }
      } catch (error) {
        console.error('Error al cargar fechas:', error);
        setError('Error al cargar fechas disponibles.');
        setDates([]);
      }
    };

    fetchDates();
  }, [selectedCamera, authFetch]);
  
  // Cargar horas disponibles cuando cambia la fecha seleccionada
  useEffect(() => {
    const fetchHours = async () => {
      if (!selectedDate) {
        setHours([]);
        return;
      }
      
      try {
        const url = new URL(`${baseApiUrl}/api/recordings/hours`);
        if (selectedCamera) {
          url.searchParams.append('camera_id', selectedCamera);
        }
        url.searchParams.append('date', selectedDate);
        
        const response = await authFetch(url);
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setHours(data.hours || []);
        
        // Limpiar hora seleccionada si ya no está disponible
        if (selectedHour && !data.hours.includes(selectedHour)) {
          setSelectedHour('');
        }
      } catch (error) {
        console.error('Error al cargar horas:', error);
        setError('Error al cargar horas disponibles.');
        setHours([]);
      }
    };

    fetchHours();
  }, [selectedCamera, selectedDate, authFetch]);
  
  // Cargar lista de grabaciones con los filtros seleccionados
  useEffect(() => {
    const fetchRecordings = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const url = new URL(`${baseApiUrl}/recordings`);
        if (selectedCamera) {
          url.searchParams.append('camera_id', selectedCamera);
        }
        if (selectedDate) {
          url.searchParams.append('date', selectedDate);
        }
        if (selectedHour) {
          url.searchParams.append('hour', selectedHour);
        }
        
        console.log("Consultando grabaciones:", url.toString());
        
        const response = await authFetch(url);
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("Grabaciones recibidas:", data);
        
        // Validar y normalizar los datos recibidos
        const validatedRecordings = (data.recordings || []).map(recording => {
          return {
            ...recording,
            // Asegurarse de que todas las propiedades necesarias existan
            camera_id: recording.camera_id || 'unknown',
            filename: recording.filename || 'Sin nombre',
            path: recording.path || '',
            date: recording.date || 'Sin fecha',
            hour: recording.hour || '00',
            time: recording.time || '00-00-00',
            size_bytes: recording.size_bytes || 0,
            size_mb: recording.size_mb || 0
          };
        });
        
        setRecordings(validatedRecordings);
        setPage(1); // Resetear a primera página con nuevos resultados
      } catch (error) {
        console.error('Error al cargar grabaciones:', error);
        setError('Error al cargar la lista de grabaciones. Por favor, intente nuevamente.');
        setRecordings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecordings();
  }, [selectedCamera, selectedDate, selectedHour, authFetch]);
  
  // Manejadores de eventos
  const handleCameraChange = (event) => {
    setSelectedCamera(event.target.value);
    setSelectedDate('');
    setSelectedHour('');
  };
  
  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
    setSelectedHour('');
  };
  
  const handleHourChange = (event) => {
    setSelectedHour(event.target.value);
  };
  
  const handlePageChange = (event, value) => {
    setPage(value);
  };
  
  const handlePlayRecording = (recording) => {
    console.log("Seleccionando grabación para reproducción:", recording);
    console.log("URL de reproducción:", `${baseApiUrl}/recordings/${recording.path}`);
    setSelectedRecording(recording);
    setIsPlaying(true);
  };
  
  const handleBackToList = () => {
    setSelectedRecording(null);
    setIsPlaying(false);
  };
  
  const handleRefresh = () => {
    // Recargar grabaciones con los filtros actuales
    const fetchRecordings = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const url = new URL(`${baseApiUrl}/recordings`);
        if (selectedCamera) {
          url.searchParams.append('camera_id', selectedCamera);
        }
        if (selectedDate) {
          url.searchParams.append('date', selectedDate);
        }
        if (selectedHour) {
          url.searchParams.append('hour', selectedHour);
        }
        
        const response = await authFetch(url);
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Validar y normalizar los datos recibidos
        const validatedRecordings = (data.recordings || []).map(recording => {
          return {
            ...recording,
            // Asegurarse de que todas las propiedades necesarias existan
            camera_id: recording.camera_id || 'unknown',
            filename: recording.filename || 'Sin nombre',
            path: recording.path || '',
            date: recording.date || 'Sin fecha',
            hour: recording.hour || '00',
            time: recording.time || '00-00-00',
            size_bytes: recording.size_bytes || 0,
            size_mb: recording.size_mb || 0
          };
        });
        
        setRecordings(validatedRecordings);
      } catch (error) {
        console.error('Error al cargar grabaciones:', error);
        setError('Error al cargar la lista de grabaciones. Por favor, intente nuevamente.');
        setRecordings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecordings();
  };
  
  // Paginación
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRecordings = recordings.slice(startIndex, endIndex);
  const pageCount = Math.ceil(recordings.length / itemsPerPage);
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Grabaciones
      </Typography>
      
      {/* Reproducción de grabación seleccionada */}
      {isPlaying && selectedRecording && (
        <RecordingPlayer
          recording={selectedRecording}
          onBack={handleBackToList}
        />
      )}
      
      {/* Filtros */}
      {!isPlaying && (
        <Paper sx={{ p: 2, mb: 3 }}>
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
              <FormControl fullWidth disabled={dates.length === 0}>
                <InputLabel>Fecha</InputLabel>
                <Select
                  value={selectedDate}
                  onChange={handleDateChange}
                  label="Fecha"
                >
                  <MenuItem value="">Todas las fechas</MenuItem>
                  {dates.map((date) => (
                    <MenuItem key={date} value={date}>
                      {date}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth disabled={hours.length === 0 || !selectedDate}>
                <InputLabel>Hora</InputLabel>
                <Select
                  value={selectedHour}
                  onChange={handleHourChange}
                  label="Hora"
                >
                  <MenuItem value="">Todas las horas</MenuItem>
                  {hours.map((hour) => (
                    <MenuItem key={hour} value={hour}>
                      {hour}:00
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleRefresh}
                fullWidth
              >
                Actualizar
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {/* Lista de grabaciones */}
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
          ) : recordings.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="textSecondary">
                No se encontraron grabaciones con los filtros seleccionados
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Pruebe a seleccionar otros filtros o verifique que existan grabaciones en el sistema
              </Typography>
            </Paper>
          ) : (
            <>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Mostrando {paginatedRecordings.length} de {recordings.length} grabaciones
              </Typography>
              
              <Grid container spacing={2}>
                {paginatedRecordings.map((recording) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={recording.path}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      {/* Placeholder para la vista previa del video */}
                      <VideoPlaceholder />
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" component="div" noWrap>
                          {recording.filename || 'Sin nombre'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <CalendarToday fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {recording.date || 'Sin fecha'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <AccessTime fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {recording.time ? recording.time.replace(/-/g, ':') : 'Sin hora'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <Videocam fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {cameras.find(c => c.id === recording.camera_id)?.name || recording.camera_id}
                          </Typography>
                        </Box>
                        <Box sx={{ mt: 1 }}>
                          <Chip 
                            size="small" 
                            label={`${recording.size_mb || 0} MB`} 
                            variant="outlined" 
                          />
                        </Box>
                      </CardContent>
                      <CardActions>
                        <Button 
                          startIcon={<PlayArrow />}
                          onClick={() => handlePlayRecording(recording)}
                          fullWidth
                          disabled={!recording.path}
                        >
                          Reproducir
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

export default RecordingsView;