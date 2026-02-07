# Roadmap / Checklist — Lector de Manifiestos

Este documento es una guía operativa para ir cumpliendo, verificando y cerrando los puntos de mejora del proyecto.

## Convenciones

- Cada ítem tiene un **criterio de aceptación**.
- Marca con `- [x]` cuando esté validado.
- Si algo requiere decisión, se incluye como **Decisión pendiente**.

---

# Fase 0 — Estabilización de subida (sin timeouts)

## Subida por archivo (backend)

- [ ] **Endpoint `POST /api/manifiestos/upload_file` estable**
  - **Criterio de aceptación**:
    - Sube un PDF a Firebase Storage sin usar disco local.
    - Crea registro en Firestore (`pdfs`) con `file_path` (storage_path) y metadatos.

- [ ] **Manejo de duplicados/overwrite definido**
  - **Decisión pendiente**:
    - Si el mismo `filename` ya existe en `pdfs/{username}/{folder}/{filename}` ¿se sobreescribe o se omite?
  - **Criterio de aceptación**:
    - Comportamiento documentado y consistente (respuesta API + UI).

## Subida de carpeta (frontend)

- [ ] **Upload secuencial por archivo desde la UI**
  - **Criterio de aceptación**:
    - Subir 50+ PDFs no produce timeout.
    - La UI reporta `saved_count` y `skipped_count`.

- [ ] **Progreso en UI (mínimo viable)**
  - **Criterio de aceptación**:
    - Muestra “Subiendo X / N” y el nombre del archivo actual.

---

# Fase 1 — Migración `process_folder` (sin disco)

## Objetivo

Eliminar dependencia de `MANIFIESTOS/...` y procesar PDFs desde **Firebase Storage** usando los paths guardados en Firestore.

## Checklist técnico

- [ ] **Listar PDFs por carpeta desde Firestore**
  - **Implementación esperada**:
    - Query a colección `pdfs` por `username` + `folder_name`.
  - **Criterio de aceptación**:
    - Se obtiene lista consistente de PDFs de la carpeta recién subida.

- [ ] **Descargar bytes desde Firebase Storage por cada PDF**
  - **Implementación esperada**:
    - `bucket.blob(storage_path).download_as_bytes()`.
  - **Criterio de aceptación**:
    - Para un PDF válido, se obtienen bytes y se pueden abrir con PyMuPDF.

- [ ] **Procesar PDF en memoria (PyMuPDF) sin filesystem**
  - **Implementación esperada**:
    - `fitz.open(stream=pdf_bytes, filetype="pdf")`.
  - **Criterio de aceptación**:
    - Se extrae texto y se ejecuta extracción de datos con resultados equivalentes a la versión con disco.

- [ ] **Guardar manifiesto en Firestore y marcar PDF como procesado**
  - **Criterio de aceptación**:
    - Se crea/actualiza documento en colección de manifiestos.
    - El PDF queda con `processed=true` (y/o timestamp) en colección `pdfs`.

- [ ] **Manejo de errores por archivo (no abortar toda la carpeta)**
  - **Criterio de aceptación**:
    - Si 1 PDF falla, el endpoint sigue con los demás.
    - El resultado final indica cuántos procesó/omitió y por qué.

## Decisiones pendientes

- [ ] **Estrategia de concurrencia**
  - Opciones:
    - Secuencial (más estable, más lento)
    - Lotes pequeños (ej. 5 a la vez)
  - **Criterio de aceptación**:
    - Procesa carpeta grande sin agotar memoria ni exceder tiempos razonables.

---

# Fase 2 — Validación end-to-end (carpeta grande)

## Pruebas manuales mínimas

- [ ] **Subida de carpeta grande (>= 50 PDFs)**
  - **Criterio de aceptación**:
    - No hay timeouts.
    - Todos los PDFs existen en Storage.
    - Firestore `pdfs` tiene los registros.

- [ ] **Procesamiento de la carpeta recién subida**
  - **Criterio de aceptación**:
    - `process_folder` procesa desde Storage.
    - Se guardan manifiestos.
    - El overview refleja estados correctos.

- [ ] **Re-ejecución idempotente (procesar dos veces)**
  - **Criterio de aceptación**:
    - No duplica manifiestos o lo hace de forma controlada.
    - Define comportamiento: “skip si processed=true” o “reprocesar”.

---

# Fase 3 — Auditoría/Documentación (guía de operación)

## Mapeo de arquitectura actual (código real)

- [ ] **Lista de endpoints y contratos (request/response)**
  - **Criterio de aceptación**:
    - Documento con rutas: upload, overview, process, utilidades PDF.

- [ ] **Mapa de colecciones Firestore y estructura de documentos**
  - **Criterio de aceptación**:
    - Colecciones y campos usados por el backend (mínimo: `pdfs`, manifiestos).

## Roadmap incremental + quick wins

- [ ] **Tabla de problemas/riesgos y mitigaciones**
  - **Criterio de aceptación**:
    - Priorización (alto/medio/bajo) y acciones.

- [ ] **Arquitectura objetivo (sin disco + opcional async)**
  - **Criterio de aceptación**:
    - Propuesta concreta con pasos incrementales.

---

# Fase 4 (opcional) — Procesamiento asíncrono

> Solo si el volumen crece o el procesamiento empieza a tardar demasiado.

- [ ] **Modelo de job (202 + job_id)**
  - **Criterio de aceptación**:
    - `process_folder` crea job y retorna rápido.

- [ ] **Worker para procesamiento**
  - **Criterio de aceptación**:
    - Worker procesa y actualiza estado en Firestore.

---

# Referencias internas

- Backend: `backend/app/api/manifiestos.py`
- Procesamiento: `backend/app/modules/pdf_processor.py`
- Extracción: `backend/app/modules/data_extractor.py`
- Repositorio PDFs: `backend/app/database/pdfs_repository.py`
- Firebase: `backend/app/config/firebase_config.py`
