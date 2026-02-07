# Estructura Modular de APIs de Manifiestos

## Resumen

El módulo monolítico `manifiestos.py` (143KB, ~25 endpoints) ha sido refactorizado en **6 módulos especializados** para mejorar la mantenibilidad, claridad y escalabilidad del código.

---

## Módulos

### 1. `manifiestos_utils.py` (Utilidades compartidas)
**Propósito:** Funciones auxiliares y decoradores comunes a todos los módulos.

**Contenido:**
- `login_required_api`: Decorador de autenticación
- `get_user_manifiesto_folder()`: Obtiene carpeta de manifiestos del usuario
- `get_user_manifiesto_qr_folder()`: Obtiene carpeta QR del usuario
- `get_user_base_folder()`: Obtiene carpeta base del usuario
- `sanitize_filename()`: Sanitiza nombres de archivo
- Constantes: `BACKEND_DIR`, `CACHE_THUMBNAILS_BASE`

---

### 2. `manifiestos_folders.py` (Gestión de carpetas)
**Propósito:** Operaciones sobre carpetas y overview general.

**Endpoints:**
- `GET /api/manifiestos/folders` - Lista carpetas del usuario desde Firestore
- `GET /api/manifiestos/overview` - Overview completo (PDFs, carpetas, storage stats)
- `DELETE /api/manifiestos/folders/<folder_name>` - Elimina carpeta completa

**Estado:** ✅ Migrado a Firebase Storage/Firestore

---

### 3. `manifiestos_upload.py` (Subida de archivos)
**Propósito:** Subida de PDFs a Firebase Storage.

**Endpoints:**
- `POST /api/manifiestos/upload_file` - Sube un PDF individual
- `POST /api/manifiestos/upload_folder` - Sube múltiples PDFs

**Estado:** ✅ Migrado a Firebase Storage (streaming, sin disco)

---

### 4. `manifiestos_data.py` (Consulta de datos)
**Propósito:** Consulta de PDFs, manifiestos procesados y estadísticas.

**Endpoints:**
- `GET /api/manifiestos/pdfs` - Lista PDFs del usuario
- `GET /api/manifiestos/storage-stats` - Estadísticas de almacenamiento
- `GET /api/manifiestos/manifiestos_data` - Manifiestos procesados (con filtros)
- `GET /api/manifiestos/conductores` - Lista única de conductores

**Estado:** ✅ Migrado a Firebase Firestore

---

### 5. `manifiestos_processing.py` (Procesamiento)
**Propósito:** Extracción de datos de PDFs y actualización de manifiestos.

**Endpoints:**
- `POST /api/manifiestos/process_folder` - Procesa carpeta completa (extrae datos)
- `POST /api/manifiestos/update_field` - Actualiza campo de manifiesto

**Estado:** ✅ Migrado a Firebase Storage (lee PDFs en memoria, sin disco)

**Cambios importantes:**
- Ya no usa `MANIFIESTOS/<username>/Manifiesto/...`
- Lee PDFs desde Firebase Storage con `bucket.blob(storage_path).download_as_bytes()`
- Procesa con PyMuPDF en memoria: `fitz.open(stream=pdf_bytes, filetype="pdf")`
- Mantiene detección de duplicados por `load_id`/`remesa`

---

### 6. `manifiestos_qr.py` (Operaciones QR)
**Propósito:** Extracción y gestión de códigos QR de manifiestos.

**Endpoints:**
- `GET /api/manifiestos/archivos_qr` - Obtiene información QR de carpetas
- `POST /api/manifiestos/update_qr_field` - Actualiza campo QR
- `POST /api/manifiestos/process_folder_qr` - Procesa carpeta solo para QR

**Estado:** ⚠️ Legacy (aún usa disco `MANIFIESTOS/...`)

**Pendiente:** Migrar a Firebase Storage

---

### 7. `manifiestos_pdf_ops.py` (Operaciones sobre PDFs)
**Propósito:** Operaciones avanzadas sobre archivos PDF individuales.

**Endpoints implementados:**
- `GET /api/manifiestos/pdf/<filename>/pages` - Info de páginas del PDF
- `GET /api/manifiestos/pdf/<filename>/thumbnail` - Miniatura de página (con caché)
- `GET /api/manifiestos/pdf/<filename>/download` - Descarga PDF completo
- `DELETE /api/manifiestos/pdf/delete` - Elimina PDF
- `POST /api/manifiestos/pdf/rename` - Renombra PDF con patrón

**Endpoints pendientes (retornan 501):**
- `POST /api/manifiestos/pdf/split` - Dividir PDF
- `POST /api/manifiestos/pdf/merge` - Fusionar páginas
- `POST /api/manifiestos/pdf/delete-pages` - Eliminar páginas
- `POST /api/manifiestos/pdf/bulk-rename` - Renombrado masivo

**Estado:** 🔄 Parcialmente migrado a Firebase Storage

---

## Registro de Blueprints

Los blueprints se registran en `backend/app/__init__.py`:

```python
from app.api.manifiestos_folders import bp as manifiestos_folders_bp
from app.api.manifiestos_upload import bp as manifiestos_upload_bp
from app.api.manifiestos_data import bp as manifiestos_data_bp
from app.api.manifiestos_processing import bp as manifiestos_processing_bp
from app.api.manifiestos_qr import bp as manifiestos_qr_bp
from app.api.manifiestos_pdf_ops import bp as manifiestos_pdf_ops_bp

app.register_blueprint(manifiestos_folders_bp, url_prefix='/api/manifiestos')
app.register_blueprint(manifiestos_upload_bp, url_prefix='/api/manifiestos')
app.register_blueprint(manifiestos_data_bp, url_prefix='/api/manifiestos')
app.register_blueprint(manifiestos_processing_bp, url_prefix='/api/manifiestos')
app.register_blueprint(manifiestos_qr_bp, url_prefix='/api/manifiestos')
app.register_blueprint(manifiestos_pdf_ops_bp, url_prefix='/api/manifiestos')
```

**Nota:** Todos los blueprints usan el mismo prefijo `/api/manifiestos` para mantener compatibilidad con el frontend.

---

## Archivo Legacy

El archivo original `manifiestos.py` ha sido renombrado a **`manifiestos_legacy.py`** como referencia para:
- Migrar endpoints pendientes (split, merge, delete-pages, bulk-rename)
- Consultar implementaciones complejas de PyMuPDF
- Comparar comportamiento antes/después de la refactorización

**No se usa en producción.**

---

## Roadmap de Migración

### ✅ Completado
- [x] Separación en módulos funcionales
- [x] Migración de upload a Firebase Storage (sin disco)
- [x] Migración de process_folder a Firebase Storage (sin disco)
- [x] Endpoints de consulta (overview, pdfs, manifiestos_data, conductores)
- [x] Operaciones básicas de PDF (pages, thumbnail, download, delete, rename)

### 🔄 En Progreso
- [ ] Migrar operaciones complejas de PDF (split, merge, delete-pages) a Firebase Storage
- [ ] Migrar endpoints QR a Firebase Storage

### 📋 Pendiente
- [ ] Tests unitarios por módulo
- [ ] Tests de integración end-to-end
- [ ] Documentación de contratos API (OpenAPI/Swagger)
- [ ] Métricas y observabilidad por módulo

---

## Ventajas de la Nueva Estructura

1. **Mantenibilidad:** Cada módulo tiene una responsabilidad clara (~200-400 líneas vs 3000+)
2. **Testabilidad:** Módulos independientes facilitan unit tests
3. **Escalabilidad:** Fácil agregar nuevos endpoints sin afectar otros módulos
4. **Claridad:** Nombres descriptivos y organización lógica
5. **Colaboración:** Múltiples desarrolladores pueden trabajar en paralelo sin conflictos
6. **Migración gradual:** Endpoints legacy pueden coexistir durante la transición

---

## Notas Técnicas

### Imports Relativos
Los módulos usan imports relativos para compartir utilidades:
```python
from .manifiestos_utils import login_required_api, get_current_user
```

### Decoradores
Todos los endpoints usan `@login_required_api` para autenticación consistente.

### Firebase Storage
Los endpoints migrados usan:
```python
from app.config.firebase_config import FirebaseConfig
bucket = FirebaseConfig.get_bucket()
blob = bucket.blob(storage_path)
pdf_bytes = blob.download_as_bytes()
```

### PyMuPDF en Memoria
Para procesar PDFs sin disco:
```python
import fitz
doc = fitz.open(stream=pdf_bytes, filetype="pdf")
```

---

## Contacto y Soporte

Para preguntas sobre la estructura modular o migración de endpoints pendientes, consultar:
- `ROADMAP_CHECKLIST.md` (raíz del proyecto)
- `backend/app/api/manifiestos_legacy.py` (referencia de implementaciones originales)
