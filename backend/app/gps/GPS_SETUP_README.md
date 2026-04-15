# GPS SinoTrack - Guía de Configuración e Integración

## Arquitectura del Sistema

```
┌─────────────────┐         TCP (puerto 5001)        ┌────────────────────┐
│  Dispositivo GPS │ ─────────────────────────────────▶│  Servidor TCP      │
│  SinoTrack       │         Protocolo GT06           │  (tcp_server.py)   │
│  (ST-901/906)    │◀─────────────────────────────────│                    │
└─────────────────┘         Respuestas ACK            └────────┬───────────┘
                                                               │
                                                               │ callback
                                                               ▼
                                                      ┌────────────────────┐
                                                      │  GPS Manager       │
                                                      │  (gps_manager.py)  │
                                                      └────────┬───────────┘
                                                               │
                                                               │ save
                                                               ▼
┌─────────────────┐         HTTP API (puerto 5000)    ┌────────────────────┐
│  Frontend React  │ ◀───────────────────────────────▶│  Flask API         │
│  + Leaflet Map   │         /api/gps/*               │  (api/gps.py)      │
└─────────────────┘                                   └────────┬───────────┘
                                                               │
                                                               │ query
                                                               ▼
                                                      ┌────────────────────┐
                                                      │  Firebase/Firestore│
                                                      │  gps_devices       │
                                                      │  gps_locations     │
                                                      └────────────────────┘
```

## Requisitos Previos

1. **VPS con IP pública** (o tu PC con puerto abierto en el router)
2. **Puerto TCP 5001 abierto** en el firewall
3. **Chip SIM activo** en el dispositivo SinoTrack con datos y SMS
4. **Número de teléfono del SIM** del GPS para enviar SMS

## Paso 1: Configurar el Dispositivo SinoTrack por SMS

### Comandos SMS Esenciales

Envía estos SMS **al número del SIM** que está dentro del GPS.
El formato varía según el modelo, pero los más comunes son:

#### 1. Establecer contraseña del dispositivo (si no la has cambiado)
```
La contraseña por defecto suele ser: 123456
```

#### 2. Configurar IP y puerto de tu servidor
**Este es el comando más importante.** Le dice al GPS a dónde enviar los datos.

```sms
804{contraseña} {IP_DE_TU_SERVIDOR} {PUERTO}
```

**Ejemplo:**
```sms
804123456 200.123.45.67 5001
```

**Para modelos más nuevos (ST-901L, ST-906):**
```sms
IP804{contraseña} {IP} {PUERTO}
```

Ejemplo:
```sms
IP804123456 200.123.45.67 5001
```

#### 3. Configurar intervalo de envío de ubicación (en segundos)
```sms
805{contraseña} {SEGUNDOS}
```

**Ejemplo (cada 30 segundos):**
```sms
805123456 30
```

**Para intervalo de 60 segundos:**
```sms
805123456 60
```

#### 4. Configurar APN del operador celular
```sms
APN{contraseña} {NOMBRE_APN}
```

**Ejemplos por operador (Colombia):**
```sms
APN123456 web.colombiamovil.com.co    (Tigo)
APN123456 internet.comcel.com.co       (Claro)
APN123456 web.vivo.com.co              (Movistar)
```

#### 5. Reiniciar el dispositivo
```sms
RESTART
```
o
```sms
CQ
```

#### 6. Verificar configuración actual
```sms
PARAM
```
El dispositivo responderá con un SMS con su configuración actual.

#### 7. Configurar zona horaria (GMT-5 para Colombia)
```sms
896{contraseña} -5
```

### Secuencia recomendada de SMS

Envía los comandos en este orden, esperando respuesta de cada uno:

1. `APN123456 internet.comcel.com.co` (configurar APN)
2. `804123456 TU_IP_PUBLICA 5001` (apuntar al servidor)
3. `805123456 30` (intervalo de 30 segundos)
4. `896123456 -5` (zona horaria)
5. `RESTART` (reiniciar para aplicar cambios)

## Paso 2: Preparar el Servidor

### En tu VPS o PC local:

#### Abrir puerto 5001 en el firewall

**Windows:**
```powershell
netsh advfirewall firewall add rule name="GPS TCP 5001" dir=in action=allow protocol=tcp localport=5001
```

**Linux:**
```bash
sudo ufw allow 5001/tcp
```

**Router (si es red local):** Redirigir puerto 5001 externo → puerto 5001 de tu PC local.

## Paso 3: Iniciar el Sistema

### Opción A: Desde la API (recomendado)
El servidor TCP se inicia/detiene desde el frontend o mediante la API:

```bash
# Iniciar servidor TCP GPS
curl -X POST http://localhost:5000/api/gps/server/start -H "Content-Type: application/json" -d '{"port": 5001}'

# Verificar estado
curl http://localhost:5000/api/gps/server/status

# Detener
curl -X POST http://localhost:5000/api/gps/server/stop
```

### Opción B: Auto-inicio con Flask
Para que el servidor TCP se inicie automáticamente con Flask, agrega esto en `run.py`:

```python
# Después de crear la app
from app.gps.gps_manager import get_gps_manager
gps = get_gps_manager(tcp_port=5001)
gps.start()
```

## Paso 4: Registrar Dispositivos

```bash
curl -X POST http://localhost:5000/api/gps/devices \
  -H "Content-Type: application/json" \
  -d '{
    "imei": "123456789012345",
    "name": "Camión 01",
    "placa": "ABC123",
    "conductor": "Juan Pérez"
  }'
```

## Paso 5: Consultar Ubicaciones

```bash
# Última ubicación de un dispositivo
curl http://localhost:5000/api/gps/location/123456789012345

# Última ubicación de TODOS los dispositivos
curl http://localhost:5000/api/gps/location/all

# Historial de las últimas 24 horas
curl "http://localhost:5000/api/gps/history/123456789012345?hours=24"
```

## API Endpoints Disponibles

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/gps/devices` | Lista todos los dispositivos |
| POST | `/api/gps/devices` | Registra un dispositivo |
| GET | `/api/gps/devices/<imei>` | Info de un dispositivo |
| PUT | `/api/gps/devices/<imei>` | Actualiza un dispositivo |
| GET | `/api/gps/location/<imei>` | Última ubicación |
| GET | `/api/gps/location/all` | Última ubicación de todos |
| GET | `/api/gps/history/<imei>?hours=24` | Historial de ruta |
| GET | `/api/gps/server/status` | Estado del servidor TCP |
| POST | `/api/gps/server/start` | Inicia servidor TCP |
| POST | `/api/gps/server/stop` | Detiene servidor TCP |
| POST | `/api/gps/cleanup` | Limpia datos antiguos |

## Formato de Datos del GPS (Protocolo GT06)

### Paquete de Login (0x01)
```
78 78   → Start bytes
0D      → Longitud (13 bytes)
01      → Protocolo: Login
03 51 60 80 00 95 30 51  → IMEI (8 bytes BCD)
00 01   → Serial number
D9 DC   → CRC16
0D 0A   → Stop bytes
```

### Paquete de Ubicación GPS (0x12)
```
78 78                   → Start bytes
1F                      → Longitud
12                      → Protocolo: GPS Data
0B 08 1D 11 2E 1E      → Fecha: 2011-08-29 17:46:30
CF                      → Satélites: 15 (nibble bajo), GPS length: 12 (nibble alto)
02 6B 3F 3E            → Latitud: 22.571230°
0C 46 A3 78            → Longitud: 114.058900°
00                      → Velocidad: 0 km/h
01 0C                   → Curso: 268° (Norte)
00 02                   → Serial
D8 72                   → CRC
0D 0A                   → Stop bytes
```

### Datos parseados (lo que guarda el sistema)
```json
{
  "imei": "351608009530",
  "latitude": 4.710989,
  "longitude": -74.072092,
  "speed": 45,
  "course": 180,
  "satellites": 8,
  "gps_valid": true,
  "device_timestamp": "2026-03-25T10:30:00+00:00",
  "server_timestamp": "2026-03-25T10:30:05.123456"
}
```

## Colecciones Firebase

### `gps_devices`
```json
{
  "imei": "123456789012345",
  "name": "Camión 01",
  "placa": "ABC123",
  "conductor": "Juan Pérez",
  "active": true,
  "last_seen": "2026-03-25T10:30:05",
  "created_at": "2026-03-20T08:00:00",
  "updated_at": "2026-03-25T10:30:05"
}
```

### `gps_locations`
```json
{
  "imei": "123456789012345",
  "latitude": 4.710989,
  "longitude": -74.072092,
  "speed": 45,
  "course": 180,
  "satellites": 8,
  "gps_valid": true,
  "device_timestamp": "2026-03-25T10:30:00+00:00",
  "server_timestamp": "2026-03-25T10:30:05"
}
```

## Troubleshooting

### El GPS no se conecta al servidor
1. Verificar que el puerto 5001 está abierto: `netstat -an | findstr 5001`
2. Verificar IP pública: buscar "what is my ip" en Google
3. Verificar que el APN es correcto para tu operador
4. Enviar `PARAM` por SMS para ver la configuración actual
5. Reiniciar el GPS: enviar `RESTART` por SMS

### El GPS se conecta pero no envía ubicación
1. El GPS necesita señal satelital (debe estar al aire libre)
2. Verificar satélites: enviar `WHERE` por SMS
3. Esperar 2-3 minutos después de encender para fix GPS

### Datos de ubicación incorrectos (lat/lng = 0)
1. `gps_valid: false` indica que no tiene fix GPS
2. Mover el dispositivo al exterior con cielo despejado
3. Esperar a que tenga al menos 4 satélites

## Estructura de Archivos

```
backend/app/
├── gps/
│   ├── __init__.py          # Módulo GPS
│   ├── gt06_parser.py       # Parser protocolo GT06
│   ├── tcp_server.py        # Servidor TCP para dispositivos
│   ├── gps_manager.py       # Orquestador (TCP + Firebase)
│   └── GPS_SETUP_README.md  # Esta documentación
├── api/
│   └── gps.py               # Endpoints API REST
├── database/
│   └── gps_repository.py    # Repositorio Firebase
frontend/src/
├── pages/
│   └── GPSTracking.jsx      # Página con mapa Leaflet
├── services/
│   └── gpsService.js        # Servicio API GPS
├── api/
│   └── endpoints.js         # Endpoints (sección GPS)
```
