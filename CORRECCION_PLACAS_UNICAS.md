# Corrección: Placas Únicas de Manifiestos

## 🐛 Problema Identificado

Las placas se mostraban duplicadas en el modal de importación desde manifiestos, aunque el objetivo era mostrar solo placas únicas.

**Ejemplo del problema:**
- SZK561 (Load ID: 876543, Destino: BARRANQUILLA)
- SZK561 (Load ID: 876544, Destino: BARRANQUILLA) ← Duplicado
- XGD277 (Load ID: 876545, Destino: BARRANQUILLA)
- XGD277 (Load ID: 876546, Destino: BARRANQUILLA) ← Duplicado

## 🔧 Solución Implementada

### 1. Backend - Corrección en `/api/carros`

**Problema:** El código agregaba una entrada por cada manifiesto, sin verificar si la placa ya existía.

**Solución:** Usar un diccionario para agrupar por placa:

```python
# ANTES (problemático)
placas_no_registradas = []
for m in manifiestos:
    # ... validaciones ...
    placas_no_registradas.append({...})  # Siempre agregaba

# AHORA (corregido)
placas_dict = {}  # Diccionario para agrupar por placa
for m in manifiestos:
    # ... validaciones ...
    if placa_normalizada not in placas_dict:
        placas_dict[placa_normalizada] = {...}  # Solo agrega si no existe
```

### 2. Mejora Adicional - Consolidación de Información

**Mejora:** Cuando una placa aparece en múltiples manifiestos, el sistema ahora:

1. **Cuenta las ocurrencias** de cada placa
2. **Consolida la información** manteniendo los datos más relevantes
3. **Agrega metadatos** sobre múltiples manifiestos

```python
# Contador de manifiestos con esta placa
'count': 1

# Si hay múltiples, agrega información adicional
if data['count'] > 1:
    result_data['manifiesto_info']['multiple_manifestos'] = True
    result_data['manifiesto_info']['total_manifiestos'] = data['count']
```

### 3. Frontend - Mejora Visual

**Mejora:** Mostrar visualmente cuando una placa proviene de múltiples manifiestos:

```jsx
// Indicador visual de múltiples manifiestos
{placaData.manifiesto_info?.multiple_manifestos && (
  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
    Múltiple
  </span>
)}

// Información adicional en la descripción
{placaData.manifiesto_info.multiple_manifestos && (
  <span className="text-amber-600 font-medium">
    • {placaData.manifiesto_info.total_manifiestos} manifiestos
  </span>
)}
```

## 📊 Resultado Esperado

### Antes de la Corrección:
```
SZK561 • Conductor: Juan Pérez • Load ID: 876543 • Destino: BARRANQUILLA
SZK561 • Conductor: Juan Pérez • Load ID: 876544 • Destino: BARRANQUILLA  ← Duplicado
XGD277 • Conductor: María López • Load ID: 876545 • Destino: BARRANQUILLA
XGD277 • Conductor: María López • Load ID: 876546 • Destino: BARRANQUILLA  ← Duplicado
```

### Después de la Corrección:
```
SZK561 • Conductor: Juan Pérez • Load ID: 876543 • Destino: BARRANQUILLA • 2 manifiestos
XGD277 • Conductor: María López • Load ID: 876545 • Destino: BARRANQUILLA • 2 manifiestos
```

Con indicadores visuales:
- **SZK561** [De manifiesto] [Múltiple]
- **XGD277** [De manifiesto] [Múltiple]

## 🧪 Verificación

1. **Backend**: ✅ Endpoint corregido y validado
2. **Frontend**: ✅ Componente actualizado
3. **Servidor**: ✅ Reiniciado y funcionando
4. **Autenticación**: ✅ Requerida y funcionando

## 📝 Archivos Modificados

1. `backend/app/api/carros.py` - Lógica de agrupación por placa
2. `frontend/src/components/operaciones/CarrosTable/CarrosTable.jsx` - Visualización mejorada

## 🎯 Beneficios

- **Sin duplicados**: Cada placa aparece solo una vez
- **Información consolidada**: Mantiene los datos más relevantes
- **Claridad visual**: Indica cuando hay múltiples manifiestos
- **Mejor UX**: Usuario ve claramente cuántas veces aparece cada placa

---

**Estado**: ✅ **CORRECCIÓN COMPLETA Y FUNCIONAL**
