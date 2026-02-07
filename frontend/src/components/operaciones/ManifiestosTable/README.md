# ManifiestosTable Component

Componente de tabla para visualizar manifiestos PDF con opción de ver cada documento en detalle.

## Características

✅ **Tabla responsive** con scroll horizontal en pantallas pequeñas
✅ **Vista de páginas del PDF** mediante modal
✅ **Formateo automático** de fechas y tamaños de archivo
✅ **Estados de carga y error** manejados
✅ **Filtrado por carpeta** (opcional)
✅ **Refresh automático** cuando cambian los datos

## Uso

### Básico

```jsx
import ManifiestosTable from '../components/operaciones/ManifiestosTable'

function MiComponente() {
  return <ManifiestosTable />
}
```

### Con filtro por carpeta

```jsx
<ManifiestosTable folderName="JOSE" />
```

### Con botón de refrescar

```jsx
import { useState } from 'react'
import ManifiestosTable from '../components/operaciones/ManifiestosTable'

function MiComponente() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <>
      <button onClick={handleRefresh}>Refrescar</button>
      <ManifiestosTable refreshTrigger={refreshKey} />
    </>
  )
}
```

## Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `folderName` | `string \| null` | `null` | Nombre de carpeta para filtrar manifiestos |
| `refreshTrigger` | `number` | `0` | Cambiar este valor recarga los datos |

## Columnas de la Tabla

1. **Archivo** - Nombre del PDF con icono
2. **Carpeta** - Badge con el nombre de la carpeta
3. **Páginas** - Número de páginas con icono
4. **Tamaño** - Tamaño del archivo formateado (KB, MB, GB)
5. **Fecha** - Fecha de creación formateada
6. **Acciones** - Botón "Ver Manifiesto"

## Flujo de Usuario

1. Usuario ve la tabla con lista de manifiestos
2. Hace clic en "Ver Manifiesto"
3. Se abre modal `PDFPages` con miniaturas de las páginas
4. Usuario puede hacer clic en una página para verla completa
5. Se abre modal `PDFPageModal` con la página ampliada

## Estados

### Loading
Muestra spinner de carga mientras se obtienen los datos.

### Error
Muestra mensaje de error si falla la carga.

### Empty
Muestra mensaje cuando no hay manifiestos disponibles.

### Success
Muestra la tabla con los manifiestos.

## Integración con Operaciones

El componente está integrado en la página `Operaciones` con un sistema de alternancia entre vista de grid y vista de tabla:

```jsx
// En Operaciones.jsx
const [viewMode, setViewMode] = useState('grid') // 'grid' o 'table'

// Botón para cambiar vista
<button onClick={toggleViewMode}>
  {viewMode === 'grid' ? 'Vista Tabla' : 'Vista Grid'}
</button>

// Renderizado condicional
{viewMode === 'grid' ? (
  <PDFList ... />
) : (
  <ManifiestosTable ... />
)}
```

## Dependencias

- `manifiestosService` - Servicio para obtener datos de manifiestos
- `PDFPages` - Modal para mostrar páginas del PDF
- `Button` - Componente de botón
- `Loading` - Componente de carga

## Funciones Auxiliares

### formatFileSize(bytes)
Convierte bytes a formato legible (KB, MB, GB).

### formatDate(dateString)
Formatea fecha a formato español con hora.
