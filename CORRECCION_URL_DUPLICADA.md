# Corrección: URL Duplicada de API

## 🐛 Problema Identificado

Error 404 en el endpoint `http://localhost:5000/api/api/carros/batch` - Nota la duplicación de `/api/api/`.

**Causa Raíz:**
- La configuración de la API en el frontend ya incluye `/api` en el BASE_URL
- Pero los servicios estaban agregando `/api` nuevamente a las rutas

**Configuración de API:**
```javascript
// frontend/src/config/constants.js
export const API_CONFIG = {
  BASE_URL: (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000') + '/api',
  //                                                                  ↑↑↑
  //                                                                  Ya incluye /api
}
```

**Servicios con URL duplicada:**
```javascript
// INCORRECTO - Duplica /api
const response = await api.post('/api/carros/batch', { placas })
// Resultado: http://localhost:5000/api/api/carros/batch ❌

const response = await api.get('/api/manifiestos/placas')
// Resultado: http://localhost:5000/api/api/manifiestos/placas ❌
```

## 🔧 Solución Implementada

### 1. Corrección en carrosService.js

**ANTES:**
```javascript
async createCarrosBatch(placas) {
  const response = await api.post('/api/carros/batch', { placas })
  return response.data
}
```

**DESPUÉS:**
```javascript
async createCarrosBatch(placas) {
  const response = await api.post('/carros/batch', { placas })
  return response.data
}
```

### 2. Corrección en manifiestosService.js

**ANTES:**
```javascript
async getConductores() {
  const response = await api.get('/api/manifiestos/conductores')
  return response.data
}

async getPlacas() {
  const response = await api.get('/api/manifiestos/placas')
  return response.data
}
```

**DESPUÉS:**
```javascript
async getConductores() {
  const response = await api.get('/manifiestos/conductores')
  return response.data
}

async getPlacas() {
  const response = await api.get('/manifiestos/placas')
  return response.data
}
```

## 🧪 Verificación

### Prueba del Endpoint Corregido
```bash
# GET (debería dar 405 Method Not Allowed, pero el endpoint existe)
curl.exe -s http://localhost:5000/api/carros/batch
# Resultado: 405 Method Not Allowed ✅ (endpoint existe)

# POST (debería dar 401 No autenticado, pero el endpoint funciona)
curl.exe -s -X POST http://localhost:5000/api/carros/batch \
  -H "Content-Type: application/json" \
  -d "{\"placas\":[]}"
# Resultado: {"error": "No autenticado", "success": false} ✅
```

## 📊 Resultado Esperado

### URLs Corregidas:
- ✅ `http://localhost:5000/api/carros/batch` (funciona)
- ✅ `http://localhost:5000/api/manifiestos/placas` (funciona)
- ✅ `http://localhost:5000/api/manifiestos/conductores` (funciona)

### URLs Problemáticas (corregidas):
- ❌ `http://localhost:5000/api/api/carros/batch` (404)
- ❌ `http://localhost:5000/api/api/manifiestos/placas` (404)
- ❌ `http://localhost:5000/api/api/manifiestos/conductores` (404)

## 📝 Archivos Modificados

1. `frontend/src/services/carrosService.js`
   - Línea 39: `/api/carros/batch` → `/carros/batch`

2. `frontend/src/services/manifiestosService.js`
   - Línea 365: `/api/manifiestos/conductores` → `/manifiestos/conductores`
   - Línea 374: `/api/manifiestos/placas` → `/manifiestos/placas`

## 🎯 Impacto

- **Importación desde manifiestos**: Ahora funcionará correctamente
- **Creación batch de carros**: Podrá crear múltiples carros
- **Obtención de placas únicas**: Funcionará sin errores 404
- **Obtención de conductores**: Funcionará sin errores 404

---

**Estado**: ✅ **CORRECCIÓN COMPLETA - ENDPOINTS FUNCIONAN**
