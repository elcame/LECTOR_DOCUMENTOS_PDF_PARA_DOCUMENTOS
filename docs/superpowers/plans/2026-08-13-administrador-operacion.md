# Administrador de operación Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar la página única `/operaciones` por el módulo Administrador de operación (hub, asistente de carga, carpetas procesadas, consultar, estadísticas con duplicados visibles) y rediseñar el Dashboard general.

**Architecture:** Rutas nuevas bajo `/administrador-operacion`, menú en `AppShell` con título navegable, páginas delgadas y componentes por carpeta de responsabilidad. Se reutilizan `manifiestosService`, `PDFList`, `ManifiestosTable` y el overview existente. Duplicados se agrupan en cliente; el backend solo añade `archivo_original` en duplicados de Firebase.

**Tech Stack:** React 18, React Router 6, Vite 5, Tailwind, Axios, Flask (un cambio pequeño en `process_folder`).

## Global Constraints

- Respuestas de UI en español.
- No meter el módulo entero en una sola carpeta: páginas en `frontend/src/pages/administrador-operacion/`, UI en `frontend/src/components/administrador-operacion/` (carga, duplicados, hub, carpetas, consultar, estadisticas) y dashboard en `frontend/src/components/dashboard/`.
- Conductores no ven el módulo (`requireAdmin` / `!isConductor`), igual que Operaciones.
- No inventar APIs de estadísticas: derivar KPIs de `getOverview`.
- No borrar duplicados automáticamente.
- `/operaciones` y `?section=` deben redirigir a las rutas nuevas.
- No commitear a menos que el usuario lo pida; los pasos de commit del plan se omiten hasta entonces.

---

### Task 1: Rutas, constantes y redirección

**Files:**
- Modify: `frontend/src/config/constants.js`
- Create: `frontend/src/pages/administrador-operacion/OperacionesRedirect.jsx`
- Modify: `frontend/src/App.jsx`

**Interfaces:**
- Consumes: `ROUTES` actual, `useSearchParams`
- Produces: `ROUTES.ADMIN_OPERACION`, `CARGAR`, `CARPETAS`, `CONSULTAR`, `ESTADISTICAS`; `OperacionesRedirect` mapea query `section`

- [ ] **Step 1: Añadir rutas en constants.js**

En `ROUTES` de `frontend/src/config/constants.js`, dejar `OPERACIONES: '/operaciones'` y agregar:

```javascript
  ADMIN_OPERACION: '/administrador-operacion',
  ADMIN_OPERACION_CARGAR: '/administrador-operacion/cargar',
  ADMIN_OPERACION_CARPETAS: '/administrador-operacion/carpetas',
  ADMIN_OPERACION_CONSULTAR: '/administrador-operacion/consultar',
  ADMIN_OPERACION_ESTADISTICAS: '/administrador-operacion/estadisticas',
```

- [ ] **Step 2: Crear OperacionesRedirect.jsx**

```jsx
import { Navigate, useSearchParams } from 'react-router-dom'
import { ROUTES } from '../../config/constants'

const SECTION_MAP = {
  subir: ROUTES.ADMIN_OPERACION_CARGAR,
  procesar: ROUTES.ADMIN_OPERACION_CARPETAS,
  pdfs: ROUTES.ADMIN_OPERACION_CONSULTAR,
  tabla: ROUTES.ADMIN_OPERACION_CONSULTAR,
  stats: ROUTES.ADMIN_OPERACION_ESTADISTICAS,
}

export default function OperacionesRedirect() {
  const [searchParams] = useSearchParams()
  const section = (searchParams.get('section') || '').trim().toLowerCase()
  const to = SECTION_MAP[section] || ROUTES.ADMIN_OPERACION
  return <Navigate to={to} replace />
}
```

- [ ] **Step 3: Registrar redirect en App.jsx**

Sustituir el `Route` de `ROUTES.OPERACIONES` que renderiza `<Operaciones />` por:

```jsx
<Route
  path={ROUTES.OPERACIONES}
  element={<ProtectedRoute requireAdmin><OperacionesRedirect /></ProtectedRoute>}
/>
```

Dejar placeholders temporales de las rutas nuevas en el Task 3 (aún no existen las páginas). En este task solo el redirect de `/operaciones`.

- [ ] **Step 4: Verificar**

Con el frontend en `http://localhost:3000`, ir a `/operaciones?section=stats` logueado como admin: debe cambiar la URL a `/administrador-operacion/estadisticas` (puede 404 hasta Task 3). `/operaciones` → `/administrador-operacion`.

---

### Task 2: Menú AppShell — título navega, subítems nuevos

**Files:**
- Modify: `frontend/src/components/layout/AppShell.jsx`

**Interfaces:**
- Consumes: `ROUTES.ADMIN_OPERACION*`
- Produces: grupo `Administrador de operación`; `Group` con `to` opcional; chevron solo toggle

- [ ] **Step 1: Cambiar `Group` para separar navegación y toggle**

Reemplazar el `button` único de `Group` por una fila: `NavLink` o `button` de título si hay `to`, y un botón chevron que llama `onToggle`. Si `collapsed`, el clic en el icono del grupo navega a `to` si existe.

Firma:

```javascript
function Group({ id, title, icon, collapsed, open, onToggle, to, children }) {
```

Si `to` está definido y no `collapsed`, el texto del título es `NavLink` a `to` con `end`. El chevron no navega.

- [ ] **Step 2: Reemplazar `operacionesLinks`**

```javascript
  const adminOperacionLinks = useMemo(
    () => [
      { to: ROUTES.ADMIN_OPERACION_CARGAR, label: 'Cargar y procesar', icon: '⬆️' },
      { to: ROUTES.ADMIN_OPERACION_CARPETAS, label: 'Carpetas procesadas', icon: '📁' },
      { to: ROUTES.ADMIN_OPERACION_CONSULTAR, label: 'Consultar', icon: '📋' },
      { to: ROUTES.ADMIN_OPERACION_ESTADISTICAS, label: 'Estadísticas', icon: '📊' },
    ],
    []
  )
```

Importar `ROUTES` desde `../../config/constants`.

Grupo:

```jsx
<Group
  id="operaciones"
  title="Administrador de operación"
  icon="📊"
  collapsed={collapsed}
  open={!!groups.operaciones}
  onToggle={() => setGroups((g) => ({ ...g, operaciones: !g.operaciones }))}
  to={ROUTES.ADMIN_OPERACION}
>
```

`SideItem` debe marcar activo con `NavLink`; para query-less paths funciona con `end={false}` en subrutas. El hub usa `end` en el `NavLink` del título.

- [ ] **Step 3: Verificar**

Menú muestra el nuevo nombre y 4 ítems. Clic en el título va a `/administrador-operacion`. Clic en la flecha solo abre/cierra. Conductor no ve el grupo.

---

### Task 3: Páginas vacías y rutas del módulo

**Files:**
- Create: `frontend/src/pages/administrador-operacion/HubPage.jsx`
- Create: `frontend/src/pages/administrador-operacion/CargarYProcesarPage.jsx`
- Create: `frontend/src/pages/administrador-operacion/CarpetasProcesadasPage.jsx`
- Create: `frontend/src/pages/administrador-operacion/ConsultarPage.jsx`
- Create: `frontend/src/pages/administrador-operacion/EstadisticasPage.jsx`
- Modify: `frontend/src/App.jsx`

**Interfaces:**
- Consumes: `ROUTES.ADMIN_OPERACION*`
- Produces: cinco páginas montables con título visible

- [ ] **Step 1: Crear las cinco páginas** con un `h1` y un `p` descriptivo (sin lógica). Ejemplo Hub:

```jsx
export default function HubPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">Administrador de operación</h1>
      <p className="text-sm text-slate-500">Resumen y accesos a las herramientas de manifiestos.</p>
    </div>
  )
}
```

Títulos de las otras: `Cargar y procesar`, `Carpetas procesadas`, `Consultar`, `Estadísticas`.

- [ ] **Step 2: Registrar rutas en App.jsx** dentro de `ProtectedRoute requireAdmin` + `AppShell`, mismas que Dashboard.

```jsx
import HubPage from './pages/administrador-operacion/HubPage'
import CargarYProcesarPage from './pages/administrador-operacion/CargarYProcesarPage'
import CarpetasProcesadasPage from './pages/administrador-operacion/CarpetasProcesadasPage'
import ConsultarPage from './pages/administrador-operacion/ConsultarPage'
import EstadisticasPage from './pages/administrador-operacion/EstadisticasPage'
```

Cinco `<Route path={ROUTES.ADMIN_OPERACION...} />`. Quitar el import de `Operaciones` si ya no se usa.

- [ ] **Step 3: Verificar**

Cada ítem del menú abre su página con el título correcto. No hay pantalla en blanco ni error de import.

---

### Task 4: Util de duplicados + enriquecimiento backend

**Files:**
- Create: `frontend/src/components/administrador-operacion/duplicados/groupDuplicatePairs.js`
- Create: `frontend/src/components/administrador-operacion/duplicados/groupDuplicatePairs.test.js`
- Modify: `backend/app/api/manifiestos_processing.py` (bloques que arman `manifiestos_duplicados_firebase`, ~207 y ~225)

**Interfaces:**
- Consumes: `archivos_duplicados[]`, `manifiestos_duplicados_firebase[]`
- Produces: `groupDuplicatePairs({ archivosDuplicados, duplicadosFirebase }) => Array<{ key, identificador, original, duplicates }>`

- [ ] **Step 1: Escribir `groupDuplicatePairs.js`**

```javascript
function pairKey(item) {
  if (item?.load_id && item.load_id !== 'No encontrado') return `load:${item.load_id}`
  if (item?.remesa && item.remesa !== 'No encontrada') return `remesa:${item.remesa}`
  return `archivo:${item?.archivo_original || item?.archivo || 'desconocido'}`
}

export function groupDuplicatePairs({ archivosDuplicados = [], duplicadosFirebase = [] } = {}) {
  const groups = new Map()

  const add = (item, source) => {
    const key = pairKey(item)
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        identificador: item.identificador || item.message || key,
        original: item.archivo_original
          ? { archivo: item.archivo_original, load_id: item.load_id, remesa: item.remesa }
          : null,
        duplicates: [],
      })
    }
    const g = groups.get(key)
    if (!g.original && item.archivo_original) {
      g.original = { archivo: item.archivo_original, load_id: item.load_id, remesa: item.remesa }
    }
    g.duplicates.push({ ...item, source })
  }

  archivosDuplicados.forEach((item) => add(item, 'lote'))
  duplicadosFirebase.forEach((item) => add(item, 'firebase'))
  return Array.from(groups.values())
}
```

- [ ] **Step 2: Test con `node --test`**

`groupDuplicatePairs.test.js`:

```javascript
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { groupDuplicatePairs } from './groupDuplicatePairs.js'

test('agrupa copia con su original por load_id', () => {
  const pairs = groupDuplicatePairs({
    archivosDuplicados: [
      {
        archivo: 'copia.pdf',
        archivo_original: 'original.pdf',
        load_id: 'L1',
        remesa: null,
        identificador: 'load_id: L1',
      },
    ],
    duplicadosFirebase: [],
  })
  assert.equal(pairs.length, 1)
  assert.equal(pairs[0].original.archivo, 'original.pdf')
  assert.equal(pairs[0].duplicates[0].archivo, 'copia.pdf')
})
```

Correr desde `frontend`:

```
node --test src/components/administrador-operacion/duplicados/groupDuplicatePairs.test.js
```

Expected: PASS (package.json frontend tiene `"type": "module"`).

- [ ] **Step 3: En backend, al armar duplicados Firebase**

Cuando `existing` esté presente, incluir:

```python
'archivo_original': existing.get('archivo') or existing.get('filename'),
'folder_original': existing.get('folder_name'),
```

en ambos `manifiestos_duplicados_firebase.append(...)`.

Reiniciar no hace falta si Flask debug recarga.

---

### Task 5: Vista DuplicatePairsView

**Files:**
- Create: `frontend/src/components/administrador-operacion/duplicados/DuplicatePairsView.jsx`
- Create: `frontend/src/components/administrador-operacion/duplicados/index.js`

**Interfaces:**
- Consumes: `groupDuplicatePairs`, props `{ data, folderName }`
- Produces: UI Original / Duplicado

- [ ] **Step 1: Implementar DuplicatePairsView**

Props: `data` (respuesta `processFolder`), `folderName`.

Si no hay duplicados, mensaje “No se detectaron duplicados”.

Si hay, una tarjeta por par: columna izquierda “Original” (`original.archivo`), derecha lista de `duplicates` con badge `lote` o `ya existía`, `load_id`/`remesa`, y texto del identificador.

- [ ] **Step 2: Exportar en index.js** `DuplicatePairsView` y `groupDuplicatePairs`.

---

### Task 6: Asistente Cargar y procesar

**Files:**
- Create: `frontend/src/components/administrador-operacion/carga/CargaWizard.jsx`
- Create: `frontend/src/components/administrador-operacion/carga/WizardSteps.jsx`
- Create: `frontend/src/hooks/administrador-operacion/useCargaWizard.js` (opcional si el estado cabe en CargaWizard; si el archivo pasa de ~200 líneas, extraer el hook)
- Modify: `frontend/src/pages/administrador-operacion/CargarYProcesarPage.jsx`

**Interfaces:**
- Consumes: `manifiestosService.getOverview`, `uploadFolder`, `processFolder`; `DuplicatePairsView`; `ProcessingResults` para guardados/errores
- Produces: wizard de 4 pasos

- [ ] **Step 1: WizardSteps** — barra 1–4: Carpeta, Subir, Procesar, Resultado. El paso activo en azul; los anteriores clicables solo si ya se completaron.

- [ ] **Step 2: CargaWizard estado**

```javascript
const [step, setStep] = useState(1)
const [folders, setFolders] = useState([])
const [folderName, setFolderName] = useState('')
const [mode, setMode] = useState('nueva') // 'nueva' | 'existente'
const [files, setFiles] = useState([])
const [uploading, setUploading] = useState(false)
const [processing, setProcessing] = useState(false)
const [error, setError] = useState('')
const [result, setResult] = useState(null)
```

Paso 1: radio Nueva / Existente. Nueva: input nombre. Existente: `<select>` de `folders` (`name`, `pdf_count`). Botón Siguiente exige nombre.

Paso 2: inputs `webkitdirectory` y `multiple` accept `.pdf` (misma lógica que `FolderUpload.handleSelectFolder` / `handleSelectFiles`). Si `mode === 'existente'`, botón “Saltar y procesar” → paso 3. Subir llama `manifiestosService.uploadFolder(folderName, files)` y avanza a 3.

Paso 3: confirma carpeta y botón Procesar → `processFolder`. Éxito: `setResult` y paso 4. Error: `setError` y se queda en 3.

Paso 4: resumen de `total_procesados` / `total_duplicados` / `total_errores`, `DuplicatePairsView`, y `ProcessingResults` (o solo pestañas guardados/errores si ProcessingResults pesa demasiado; mínimo duplicados + conteos). Botón “Procesar otra carpeta” resetea a paso 1.

- [ ] **Step 3: Montar en CargarYProcesarPage**

```jsx
import CargaWizard from '../../components/administrador-operacion/carga/CargaWizard'
```

- [ ] **Step 4: Verificar manual**

Subir 2 PDFs a carpeta de prueba y procesar. Si hay duplicado, el paso 4 muestra original y copia. Procesar carpeta existente sin subir también llega al paso 4.

---

### Task 7: Carpetas procesadas

**Files:**
- Create: `frontend/src/components/administrador-operacion/carpetas/FolderPicker.jsx`
- Create: `frontend/src/components/administrador-operacion/carpetas/FolderContents.jsx`
- Modify: `frontend/src/pages/administrador-operacion/CarpetasProcesadasPage.jsx`

**Interfaces:**
- Consumes: `getOverview(folderName)`, `PDFList`, `ManifiestosTable`
- Produces: lista + pestañas PDFs / Manifiestos

- [ ] **Step 1: FolderPicker** — lista de `folders` como tarjetas clicables (`name`, `pdf_count`). Prop `onSelect(name)`, `selected`.

- [ ] **Step 2: FolderContents** — tabs `pdfs` | `manifiestos`. PDFs: `PDFList` con `pdfs` del overview filtrado y `folderName`. Manifiestos: `ManifiestosTable folderName={selected}`.

- [ ] **Step 3: Página carga overview sin filtro para la lista; al seleccionar, `getOverview(name)` para PDFs de esa carpeta.**

Query opcional `?folder=` para deep-link.

- [ ] **Step 4: Verificar**

Elegir una carpeta real (p. ej. una de las 26) y ver PDFs y tabla de manifiestos sin mezclar otras carpetas.

---

### Task 8: Consultar global

**Files:**
- Create: `frontend/src/components/administrador-operacion/consultar/ConsultarTabs.jsx`
- Modify: `frontend/src/pages/administrador-operacion/ConsultarPage.jsx`

**Interfaces:**
- Consumes: `getOverview()` sin filtro, `PDFList`, `ManifiestosTable` con `folderName={null}`

- [ ] **Step 1: ConsultarTabs** — pestañas `Tabla` y `PDFs`. Header con total PDFs / carpetas del overview. Botón Actualizar.

- [ ] **Step 2: Montar en ConsultarPage y verificar** que la tabla global y la lista de PDFs (727) cargan, con filtro de carpeta interno de `PDFList`.

---

### Task 9: Estadísticas de operación

**Files:**
- Create: `frontend/src/components/administrador-operacion/estadisticas/buildOperacionStats.js`
- Create: `frontend/src/components/administrador-operacion/estadisticas/OperacionStats.jsx`
- Create: `frontend/src/components/administrador-operacion/estadisticas/StorageSummary.jsx`
- Modify: `frontend/src/pages/administrador-operacion/EstadisticasPage.jsx`

**Interfaces:**
- Consumes: `overview.pdfs`, `overview.folders`, `overview.storage`
- Produces: KPIs + ranking de carpetas + recientes; storage compacto

- [ ] **Step 1: `buildOperacionStats(overview)`**

```javascript
export function buildOperacionStats(overview) {
  const pdfs = overview?.pdfs || []
  const folders = overview?.folders || []
  const byFolder = [...folders].sort((a, b) => b.pdf_count - a.pdf_count)
  const recent = [...pdfs].sort((a, b) => String(b.uploaded_at || '').localeCompare(String(a.uploaded_at || ''))).slice(0, 8)
  return {
    totalPdfs: pdfs.length,
    totalCarpetas: folders.length,
    topCarpetas: byFolder.slice(0, 10),
    recientes: recent,
  }
}
```

- [ ] **Step 2: OperacionStats** — 2–3 cards (PDFs, carpetas), barras o filas para top carpetas (nombre + pdf_count), lista recientes (filename, folder, fecha).

- [ ] **Step 3: StorageSummary** — una barra “X MB de 5 GB” usando `overview.storage` (mismos campos que `StorageStats`: `total_size_bytes` / `total_size_mb`). Sin tabs Vista General / Por carpetas / Archivos grandes.

- [ ] **Step 4: Página carga `getOverview()`, muestra OperacionStats arriba y StorageSummary abajo.** Verificar que ya no es la vista de storage como protagonista.

---

### Task 10: Hub del administrador

**Files:**
- Create: `frontend/src/components/administrador-operacion/hub/HubSummary.jsx`
- Create: `frontend/src/components/administrador-operacion/hub/HubShortcuts.jsx`
- Modify: `frontend/src/pages/administrador-operacion/HubPage.jsx`

**Interfaces:**
- Consumes: `getOverview()`, `ROUTES.ADMIN_OPERACION_*`
- Produces: métricas + 4 atajos + recientes

- [ ] **Step 1: HubSummary** — cards PDFs, carpetas, espacio usado (`storage.total_size_mb`).

- [ ] **Step 2: HubShortcuts** — cuatro `Link` grandes: Cargar y procesar, Carpetas procesadas, Consultar, Estadísticas.

- [ ] **Step 3: HubPage** carga overview, resume 5 archivos recientes, monta summary + shortcuts. Verificar clic del título del menú aterriza aquí con números reales.

---

### Task 11: Dashboard general

**Files:**
- Create: `frontend/src/components/dashboard/DashboardHeader.jsx`
- Create: `frontend/src/components/dashboard/DashboardMetrics.jsx`
- Create: `frontend/src/components/dashboard/DashboardShortcuts.jsx`
- Modify: `frontend/src/pages/Dashboard.jsx`

**Interfaces:**
- Consumes: `useAuth`, `getOverview` si `!isConductor`, `ROUTES`
- Produces: portada con métricas y atajos; sin botón Salir duplicado (el shell ya tiene Salir)

- [ ] **Step 1: DashboardHeader** — “Bienvenido, {username}”, subtítulo con rol.

- [ ] **Step 2: DashboardMetrics** — si admin, cards con total PDFs y carpetas del overview; conductor: no llama overview.

- [ ] **Step 3: DashboardShortcuts** — mismos destinos que hoy (Manifiestos, Administrador de operación → `ROUTES.ADMIN_OPERACION`, Carros, GPS, Proveedores, Administración) con copy breve. Quitar el `handleLogout` de la página.

- [ ] **Step 4: Reescribir Dashboard.jsx** para componer esos tres bloques. Verificar que `/dashboard` ya no es solo tres frases y que Operaciones apunta al hub nuevo.

---

### Task 12: Cierre y limpieza

**Files:**
- Modify: `frontend/src/pages/Operaciones.jsx` — puede quedar un re-export de `OperacionesRedirect` o eliminarse si App.jsx ya no lo importa.
- Modify: `frontend/src/components/operaciones/ProcessingResults/ProcessingResults.jsx` — en tab duplicates, renderizar `DuplicatePairsView` además o en lugar de las dos tablas sueltas, para que el wizard y cualquier uso viejo coincidan.

**Interfaces:**
- Consumes: Task 5 `DuplicatePairsView`

- [ ] **Step 1: En ProcessingResults tab `duplicates`, usar `<DuplicatePairsView data={data} folderName={folderName} />`.**

- [ ] **Step 2: Confirmar que App.jsx no importa `pages/Operaciones.jsx`.** Si el archivo ya no se usa, dejarlo como:

```jsx
export { default } from './administrador-operacion/OperacionesRedirect'
```

para no romper imports residuales.

- [ ] **Step 3: Recorrido manual**

1. Login admin → Dashboard con métricas.
2. Menú Administrador de operación → hub.
3. Cargar y procesar (carpeta nueva y existente).
4. Resultado con duplicados si aplica.
5. Carpetas procesadas → PDFs y manifiestos.
6. Consultar global.
7. Estadísticas de operación + storage secundario.
8. `/operaciones?section=subir` redirige a cargar.

---

## Cobertura del spec

| Spec | Task |
| --- | --- |
| Menú título + 4 ítems | 2 |
| Rutas y redirects | 1, 3 |
| Dashboard general | 11 |
| Hub | 10 |
| Asistente 4 pasos | 6 |
| Carpetas procesadas PDFs+Manifiestos | 7 |
| Consultar global | 8 |
| Estadísticas operación + storage secundario | 9 |
| Duplicados original vs copia | 4, 5, 6, 12 |
| Separación de carpetas | todas las Create paths |
| Conductor sin módulo | 2, 3 (`requireAdmin`) |
