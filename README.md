# Prototipo 1 TT 
Este sistema permite gestionar múltiples cámaras RTSP, visualizar transmisiones en tiempo real, grabar videos automáticamente y detectar prendas de vestimenta usando inteligencia artificial (YOLOv8). Incluye un backend en FastAPI y un frontend en React con Material UI.

## Características principales

- **Visualización en tiempo real** de múltiples cámaras RTSP
- **Grabación automática** organizada por cámara/fecha/hora
- **Detección de vestimenta** usando modelo YOLOv8
- **Búsqueda avanzada** de grabaciones por fecha/hora/cámara
- **Búsqueda de vestimenta** por tipo/color
- **Sistema de autenticación** con roles (administrador, operador, visualizador)
- **Administración de usuarios**
- **Panel de configuración** del sistema de detección

## Requisitos previos

- Python 3.8+ 
- Node.js 14+ y npm 
- FFmpeg (para optimización de videos)
- Acceso a cámaras RTSP
- CUDA (opcional, para aceleración GPU de detección)

## Estructura del proyecto

El proyecto está dividido en dos partes:

- **Backend**: API REST en FastAPI que gestiona cámaras, grabaciones y detección
- **Frontend**: Aplicación React que proporciona la interfaz de usuario

## Instalación y configuración

### 2. Configuración del Frontend

#### 2.1 Instalar dependencias de Node.js

```bash
cd frontend
npm install
```

#### 2.2 Configurar URL del backend

Editar la constante en todos los archivos JS que contienen la URL del backend:

```javascript
// En cada componente que tenga esta constante
const baseApiUrl = 'http://localhost:8000';
```

## Ejecución del sistema

### 1. Iniciar el backend

```bash
# Desde la carpeta raíz del proyecto
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Iniciar el frontend

```bash
cd frontend
npm start
```

La aplicación estará disponible en http://localhost:3000

## Credenciales iniciales

El sistema crea automáticamente un usuario administrador:
- **Usuario**: admin
- **Contraseña**: admin

Se recomienda cambiar esta contraseña inmediatamente después del primer inicio de sesión.

## Roles de usuario

- **Visualizador (1)**: Solo puede ver transmisiones en vivo
- **Operador (2)**: Puede ver transmisiones y acceder a grabaciones y búsqueda
- **Administrador (3)**: Acceso completo, incluida gestión de usuarios y configuración

## Directorios importantes

- **recordings**: Almacena las grabaciones organizadas por cámara/fecha/hora
- **data**: Contiene las bases de datos SQLite

