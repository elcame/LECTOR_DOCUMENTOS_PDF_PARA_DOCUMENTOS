# Administrador de operación — diseño

Fecha: 2026-08-13

## Objetivo

Separar el módulo que hoy vive en `/operaciones` (una sola página que apila secciones) en un **Administrador de operación** con pantalla de inicio y herramientas propias. Rediseñar también el **Dashboard general** como portada de toda la app. Tras procesar, mostrar **originales vs duplicados** de forma explícita.

## Decisiones acordadas

- Enfoque: módulo propio, reutilizando APIs actuales (`getOverview`, `uploadFile`/`uploadFolder`, `processFolder`, `getManifiestosData`).
- Dashboard general (`/dashboard`) se rediseña y **no** es el hub de operación.
- El clic en el título del grupo del menú abre el inicio del módulo. La flecha abre/cierra el grupo. No hay ítem “Inicio”.
- Subir y procesar es un **asistente guiado**. Procesar una carpeta que ya existe ocurre dentro de ese asistente (paso 1: elegir carpeta existente).
- “Procesar existente” se reemplaza por **Carpetas procesadas**: ver contenido de carpetas ya en el sistema.
- Al abrir una carpeta: pestañas **PDFs** y **Manifiestos**.
- **Consultar** es la vista global (todas las carpetas).
- Estadísticas = operación primero (PDFs por carpeta/fecha, actividad reciente). Almacenamiento solo como bloque secundario.
- Tras el procesamiento: paso/vista de duplicados que agrupa original + copias.

## Información de navegación

### Menú (grupo `Administrador de operación`)

| Control | Destino |
| --- | --- |
| Título del grupo | `/administrador-operacion` |
| Cargar y procesar | `/administrador-operacion/cargar` |
| Carpetas procesadas | `/administrador-operacion/carpetas` |
| Consultar | `/administrador-operacion/consultar` |
| Estadísticas | `/administrador-operacion/estadisticas` |
| Tipos de manifiesto | `/administrador-operacion/tipos` |

Visible solo si el usuario no es `conductor` (igual que Operaciones hoy: `requireAdmin` / `!isConductor`).

### Redirecciones de compatibilidad

| Antigua | Nueva |
| --- | --- |
| `/operaciones` | `/administrador-operacion` |
| `/operaciones?section=subir` | `/administrador-operacion/cargar` |
| `/operaciones?section=procesar` | `/administrador-operacion/carpetas` |
| `/operaciones?section=pdfs` o `tabla` | `/administrador-operacion/consultar` |
| `/operaciones?section=stats` | `/administrador-operacion/estadisticas` |

## Pantallas

### 1. Dashboard general (`/dashboard`)

Portada de la app: saludo, rol, métricas reales (PDFs, carpetas, manifiestos si el overview lo permite), atajos según rol (Manifiestos, Administrador de operación, Carros, GPS, Administración). Sin wizard de carga ni tablas de PDFs.

### 2. Hub (`/administrador-operacion`)

Resumen de operación: conteos, última actividad, bloque corto de almacenamiento, cuatro accesos grandes a las herramientas.

### 3. Cargar y procesar (`/administrador-operacion/cargar`)

Asistente:

1. Elegir o crear carpeta (nueva con nombre, o existente del overview).
2. Subir PDFs (carpeta o archivos sueltos). Si eligió existente, puede saltar la subida y pasar a procesar.
3. Procesar (`manifiestosService.processFolder`).
4. Resultado: guardados, errores, y **Duplicados** (pares original/copia).

Errores de red/validación se muestran en el paso actual; no se avanza si falla.

### 4. Carpetas procesadas (`/administrador-operacion/carpetas`)

Lista de carpetas del overview. Al seleccionar una: pestañas PDFs (`PDFList` filtrado) y Manifiestos (`ManifiestosTable` con `folderName`).

### 5. Consultar (`/administrador-operacion/consultar`)

Vista global: pestañas Tabla y PDFs, todas las carpetas, con el filtro de carpeta que ya tiene `PDFList`.

### 6. Estadísticas (`/administrador-operacion/estadisticas`)

KPIs de operación derivados del overview (totales, PDFs por carpeta, recientes). `StorageStats` o un resumen compacto debajo, no como vista principal.

## Duplicados

El backend ya devuelve `archivos_duplicados` (con `archivo_original`) y `manifiestos_duplicados_firebase`. Hay que:

- Enriquecer los de Firebase con `archivo_original` (nombre del manifiesto existente) cuando `save_manifiesto` devuelve `existing`.
- En frontend, agrupar por identificador (`load_id` o remesa) en pares: un original y una o más copias.
- UI: tarjetas/filas “Original” vs “Duplicado”, motivo, y acción de abrir PDF si hay `folderName` + nombre de archivo.

No se borra automáticamente el duplicado en esta iteración.

## Estructura de carpetas (frontend)

```
frontend/src/pages/administrador-operacion/
  HubPage.jsx
  CargarYProcesarPage.jsx
  CarpetasProcesadasPage.jsx
  ConsultarPage.jsx
  EstadisticasPage.jsx
  OperacionesRedirect.jsx

frontend/src/components/administrador-operacion/
  carga/          asistente
  duplicados/     agrupación + vista
  hub/            resumen e inicios
  carpetas/       selector y contenido
  consultar/      pestañas globales
  estadisticas/   KPIs de operación

frontend/src/components/dashboard/
  métricas y atajos del dashboard general
```

Reutilizar `PDFList`, `ManifiestosTable`, `FolderUpload` (lógica de upload/process extraída al asistente), `StorageStats` como bloque secundario.

`pages/Operaciones.jsx` deja de ser la UI; queda solo la redirección.

## Datos

- Seguir usando `GET /api/manifiestos/overview` (y `folder_name` cuando aplique).
- Upload: `POST` upload file por archivo (servicio actual).
- Process: `POST /api/manifiestos/process_folder`.
- Tabla: `getManifiestosData(folderName)`.
- No hay API nueva de “estadísticas de operación”; se calculan en cliente a partir del overview. Si más adelante hace falta procesados vs pendientes reales, sería otra iteración.

## Fuera de alcance

- Cambiar reglas de detección de duplicados (sigue siendo load_id / remesa).
- Comparador visual PDF lado a lado a pantalla completa.
- Tests e2e. Verificación: util de agrupación con `node --test` + prueba manual en local.
- Commit automático; solo si el usuario lo pide.
