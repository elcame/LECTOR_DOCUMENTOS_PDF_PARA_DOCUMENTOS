# Implementación: Ingresos Detallados por Conductor y Carro

## 🎯 **Objetivo**

Agregar fechas específicas y clasificación por carro (placa) para ver los ingresos detallados con información completa de cada viaje.

## ✅ **Implementación Completada**

### **1. Métodos en ManifiestosRepository**

#### **get_ingresos_by_conductor() - Mejorado**
```python
def get_ingresos_by_conductor(self, username: str, period: str = 'daily', days: int = 30) -> List[Dict]:
    """Obtiene ingresos agrupados por conductor con fechas específicas"""
```

**Características:**
- ✅ **Usa fecha_inicio** del manifiesto (no created_at)
- ✅ **Detalles completos** de cada viaje
- ✅ **Fecha específica** y día de la semana
- ✅ **Información completa**: placa, load_id, destino, archivo

**Respuesta:**
```json
[
  {
    "conductor": "JUAN PEREZ",
    "total_ingresos": 2500000,
    "viajes_count": 5,
    "promedio_por_viaje": 500000,
    "viajes": [
      {
        "fecha": "18.03.2026",
        "dia_semana": "Wednesday",
        "valor": 500000,
        "archivo": "doc1.pdf",
        "placa": "ABC123",
        "load_id": "12345",
        "destino": "Bogotá"
      }
    ]
  }
]
```

#### **get_ingresos_by_carro() - Nuevo**
```python
def get_ingresos_by_carro(self, username: str, period: str = 'daily', days: int = 30) -> List[Dict]:
    """Obtiene ingresos agrupados por carro (placa) con fechas específicas"""
```

**Características:**
- ✅ **Clasificación por placa** (carro)
- ✅ **Usa fecha_inicio** del manifiesto
- ✅ **Lista de conductores** que usaron el carro
- ✅ **Lista de destinos** visitados
- ✅ **Detalles completos** de cada viaje

**Respuesta:**
```json
[
  {
    "placa": "ABC123",
    "total_ingresos": 3000000,
    "viajes_count": 6,
    "promedio_por_viaje": 500000,
    "viajes": [...],
    "conductores": ["JUAN PEREZ", "MARIA GARCIA"],
    "conductores_count": 2,
    "destinos": ["Bogotá", "Medellín", "Cali"],
    "destinos_count": 3
  }
]
```

### **2. Nuevos Endpoints API**

#### **Archivo: ingresos_detalle.py**
```python
# Nuevo blueprint para ingresos detallados
@bp.route('/conductor', methods=['GET'])
def get_ingresos_by_conductor():
    """Obtiene ingresos detallados por conductor con fechas específicas"""

@bp.route('/carro', methods=['GET'])  
def get_ingresos_by_carro():
    """Obtiene ingresos detallados por carro (placa) con fechas específicas"""
```

#### **URLs Disponibles:**
- ✅ `GET /api/ingresos/conductor?period=daily&days=30`
- ✅ `GET /api/ingresos/carro?period=daily&days=30`

#### **Parámetros:**
- `period`: daily, weekly, monthly
- `days`: número de días a analizar (default: 30)

### **3. Corrección de Fechas**

#### **Problema Anterior:**
```python
# ❌ Usaba created_at (fecha de procesamiento)
fecha_str = (m.get('created_at) or m.get('fecha_inicio'))
```

#### **Solución Implementada:**
```python
# ✅ Prioriza fecha_inicio (fecha real del viaje)
fecha_str = (m.get('fecha_inicio') or 
           m.get('fecha retorno') or 
           m.get('fecha_procesamiento') or 
           m.get('created_at'))
```

**Prioridad Corregida:**
1. ✅ **fecha_inicio** - Fecha real del viaje (extraída del PDF)
2. ✅ **fecha retorno** - Fecha de retorno
3. ✅ **fecha_procesamiento** - Fecha de procesamiento
4. ✅ **created_at** - Fecha de creación (último recurso)

### **4. Logging Mejorado**

#### **Depuración de Fechas:**
```python
print(f"DEBUG: Analizando {len(manifiestos)} manifiestos para ingresos por carro")
print(f"DEBUG: Se encontraron {len(resultado)} carros con ingresos")
```

#### **Información de Procesamiento:**
```python
# Para cada viaje
viaje_detalle = {
    'fecha': fecha.strftime('%d.%m.%Y'),
    'dia_semana': self._traducir_dia_semana(fecha.strftime('%A')),
    'valor': valor,
    'archivo': m.get('archivo', 'No encontrado'),
    'placa': m.get('placa', 'No encontrado'),
    'load_id': m.get('load_id', 'No encontrado'),
    'destino': m.get('destino', 'No encontrado')
}
```

## 📊 **Ejemplos de Uso**

### **Ingresos por Conductor:**
```bash
GET /api/ingresos/conductor?period=daily&days=30
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "conductor": "JUAN PEREZ",
      "total_ingresos": 2500000,
      "viajes_count": 5,
      "promedio_por_viaje": 500000,
      "viajes": [
        {
          "fecha": "18.03.2026",
          "dia_semana": "Miércoles",
          "valor": 500000,
          "archivo": "manifiesto_001.pdf",
          "placa": "ABC123",
          "load_id": "12345",
          "destino": "Bogotá"
        }
      ]
    }
  ],
  "count": 1
}
```

### **Ingresos por Carro:**
```bash
GET /api/ingresos/carro?period=weekly&days=30
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "placa": "ABC123",
      "total_ingresos": 3000000,
      "viajes_count": 6,
      "promedio_por_viaje": 500000,
      "viajes": [...],
      "conductores": ["JUAN PEREZ", "MARIA GARCIA"],
      "conductores_count": 2,
      "destinos": ["Bogotá", "Medellín", "Cali"],
      "destinos_count": 3
    }
  ],
  "count": 1
}
```

## 🎯 **Beneficios**

### **Para Análisis por Conductor:**
- ✅ **Saber qué día** hizo cada viaje
- ✅ **Ver fechas específicas** de sus ingresos
- ✅ **Identificar patrones** temporales
- ✅ **Rendimiento por día** de la semana

### **Para Análisis por Carro:**
- ✅ **Rentabilidad por vehículo**
- ✅ **Conductores que usaron** cada carro
- ✅ **Destinos visitados** por cada placa
- ✅ **Optimización de flota**

### **Información Completa:**
- ✅ **Fecha exacta** del viaje (no procesamiento)
- ✅ **Día de la semana** en español
- ✅ **Detalles completos** de cada manifiesto
- ✅ **Ordenamiento** por ingresos (mayor a menor)

## 🔄 **Integración con Frontend**

### **Para usar en React:**
```javascript
// Ingresos por conductor
const response = await fetch('/api/ingresos/conductor?period=daily&days=30');
const data = await response.json();

// Ingresos por carro
const responseCarro = await fetch('/api/ingresos/carro?period=daily&days=30');
const dataCarro = await responseCarro.json();
```

### **Para mostrar en tablas:**
- **Conductor**: nombre, total, viajes, promedio
- **Carro**: placa, total, viajes, conductores, destinos
- **Detalles**: fecha, día, valor, archivo, load_id

---

## ✅ **Implementación Completa**

**Ahora tienes dos nuevos endpoints que proporcionan información detallada de ingresos por conductor y por carro, con fechas específicas y todos los detalles de cada viaje.**

**Las fechas usan la fecha real del manifiesto (fecha_inicio) en lugar de la fecha de procesamiento, mostrando los análisis correctos por día de la semana.** 🚀
