import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, Typography, Box, 
  Button, Alert, IconButton, Stack
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const CameraView = ({ camera, onClose, fullView }) => {
  const [connectionStatus, setConnectionStatus] = useState('desconectado');
  const [currentFrame, setCurrentFrame] = useState(null);
  const [wsConnection, setWsConnection] = useState(null);
  const [error, setError] = useState(null);

  // Conectar a la cámara seleccionada vía WebSocket
  useEffect(() => {
    if (!camera) return;

    // Cerrar conexión anterior si existe
    if (wsConnection) {
      wsConnection.close();
      setConnectionStatus('desconectado');
      setCurrentFrame(null);
    }

    setError(null);
    setConnectionStatus('conectando');

    // Configuración del WebSocket
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;
    const wsUrl = `${wsProtocol}//${wsHost}/ws/stream/${camera.id}`;
    
    // Crear nueva conexión WebSocket
    const ws = new WebSocket(wsUrl);
    setWsConnection(ws);

    // Manejadores de eventos WebSocket
    ws.onopen = () => {
      console.log(`Conectado a la cámara ${camera.id}`);
      setConnectionStatus('conectado');
      
      try {
        ws.send('ready');
      } catch (e) {
        console.warn('No se pudo enviar mensaje de ready', e);
      }
    };

    // Procesamiento de mensajes (frames)
    let frameCount = 0;
    const frameProcessingStart = performance.now();
    
    ws.onmessage = (event) => {
      try {
        // Manejar los datos recibidos (frames)
        const frameData = eval(`(${event.data})`); // Parse del objeto de datos
        
        // Comprobar si hay error
        if (frameData && frameData.error) {
          setError(frameData.error);
          setConnectionStatus('error');
          return;
        }
        
        // Adaptación a los nuevos nombres de campo abreviados
        if (frameData && (frameData.image || frameData.i)) {
          // Usar el campo 'i' (abreviado) si está disponible, de lo contrario usar 'image'
          const imageData = frameData.i || frameData.image;
          setCurrentFrame(`data:image/jpeg;base64,${imageData}`);
          
          // Medir y registrar la latencia cada 50 frames
          frameCount++;
          if (frameCount % 50 === 0) {
            const now = performance.now();
            const fps = frameCount / ((now - frameProcessingStart) / 1000);
            console.log(`Cámara ${camera.id} - Rendimiento: ~${fps.toFixed(1)} FPS`);
          }
          
          // Notificar que estamos listos para otro frame
          try {
            ws.send('ready');
          } catch (e) {
            // Ignorar errores si la conexión se cerró
          }
        }
      } catch (error) {
        console.error('Error al procesar frame:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('Error de WebSocket:', error);
      setConnectionStatus('error');
      setError('Error de conexión WebSocket');
    };

    ws.onclose = (event) => {
      console.log(`Conexión cerrada (código: ${event.code}) para cámara ${camera.id}`);
      setConnectionStatus('desconectado');
    };

    // Limpiar al desmontar
    return () => {
      if (ws && ws.readyState !== WebSocket.CLOSED) {
        ws.close();
      }
    };
  }, [camera]);

  // Manejar reconexión
  const handleReconnect = () => {
    if (wsConnection) {
      wsConnection.close();
      setConnectionStatus('reconectando');
      setError(null);
      // La reconexión ocurrirá automáticamente en el useEffect
    }
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title={camera?.name || 'Sin selección'}
        subheader={`Cámara ID: ${camera?.id || 'N/A'}`}
        action={
          <Stack direction="row" spacing={1}>
            {!fullView && (
              <IconButton onClick={onClose} size="small">
                <CloseIcon />
              </IconButton>
            )}
          </Stack>
        }
      />
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 1 }}>
        <Box
          sx={{
            width: '100%',
            flexGrow: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            bgcolor: 'black',
            position: 'relative',
            minHeight: fullView ? 480 : 240,
          }}
        >
          {error && (
            <Alert severity="error" sx={{ position: 'absolute', top: 10, left: 10, right: 10, zIndex: 10 }}>
              {error}
            </Alert>
          )}
          
          {currentFrame ? (
            <img
              src={currentFrame}
              alt="Camera Feed"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
            />
          ) : (
            <Typography color="white">
              {connectionStatus === 'conectado'
                ? 'Esperando video...'
                : connectionStatus === 'conectando'
                ? 'Conectando...'
                : connectionStatus === 'reconectando'
                ? 'Reconectando...'
                : 'Sin conexión a la cámara'}
            </Typography>
          )}
          
          {/* Overlay para información adicional */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              bgcolor: 'rgba(0,0,0,0.5)',
              color: 'white',
              p: 1,
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <Typography variant="body2">
              {connectionStatus === 'conectado' ? 'En vivo' : connectionStatus}
            </Typography>
            <Typography variant="body2">
              {new Date().toLocaleTimeString()}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleReconnect}
            disabled={connectionStatus === 'reconectando' || connectionStatus === 'conectando'}
          >
            Reconectar
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CameraView;
