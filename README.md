# Lector de Manifiestos · Plataforma logística end-to-end

> Sistema web full-stack para flotas de transporte que automatiza la lectura de manifiestos en PDF, extrae placas y datos clave, organiza la información por viaje/usuario en Firestore, y agrega un módulo de productividad integrado con Google Calendar.

[![Python](https://img.shields.io/badge/python-3.11-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/flask-3.x-black.svg)](https://flask.palletsprojects.com/)
[![React](https://img.shields.io/badge/react-18-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/vite-5-646cff.svg)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/firebase-firestore%20%2B%20hosting-ffca28.svg)](https://firebase.google.com/)
[![Cloud Run](https://img.shields.io/badge/cloud%20run-deployed-4285f4.svg)](https://cloud.google.com/run)

---

## Tabla de contenidos

- [Resumen](#resumen)
- [Capturas](#capturas)
- [Características](#características)
- [Stack técnico](#stack-técnico)
- [Arquitectura](#arquitectura)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Puesta en marcha local](#puesta-en-marcha-local)
- [Despliegue](#despliegue)
- [Seguridad](#seguridad)
- [Performance](#performance)
- [Roadmap](#roadmap)
- [Licencia](#licencia)

---

## Resumen

Plataforma utilizada por una empresa real de logística para gestionar la operación diaria de su flota: subir manifiestos en PDF, extraer y validar la información, llevar el control de carros, conductores, gastos y rendimientos, todo desde una sola UI web.

**Métricas operativas** (rellenar con tus valores reales):

| Indicador | Valor |
| --- | --- |
| PDFs procesados al día | _e.g. 250+ manifiestos / día_ |
| Placas detectadas automáticamente | _e.g. 95 % de acierto_ |
| Usuarios activos | _e.g. 20+ conductores y administradores_ |
| Tiempo medio de procesamiento por PDF | _< 2 s en Cloud Run_ |

> Reemplaza los valores anteriores con tus números reales en producción para que el impacto del proyecto sea claro a la primera lectura.

---

## Capturas

> Añade tus screenshots en `docs/screenshots/` y descomenta las imágenes:

<!--
![Dashboard](docs/screenshots/dashboard.png)
![Lectura de manifiesto](docs/screenshots/manifiesto.png)
![Módulo de productividad GTD](docs/screenshots/productividad.png)
-->

---

## Características

### Lectura inteligente de manifiestos
- Subida masiva de PDFs por carpeta de operación.
- Extracción automática de placas, IDs de carga, remesas y totales mediante `PyMuPDF`.
- Decodificación de QR embebidos para cruce con el ERP.
- Miniaturas de las primeras páginas con caché global y throttle del lado cliente.

### Gestión de operación
- Carpetas por viaje/fecha con resumen instantáneo de archivos y estado de procesamiento.
- Tabla de manifiestos con edición inline, búsqueda y filtros.
- Asignación de carros, conductores y trailers.
- Control de gastos por viaje y hojas de gastos consolidadas.

### Analítica
- Ingresos por destino / conductor / carro.
- Tiempos entre viajes y patrones temporales.
- Análisis comparativo configurable por periodo.

### Productividad GTD + Google Calendar
- Inbox, Today, Next, Someday y Done según el método GTD.
- Captura rápida desde el atajo de teclado.
- OAuth 2.0 por usuario para sincronizar tareas con Google Calendar.
- Métricas diarias de tareas completadas.

### Operación multi-usuario
- Autenticación JWT con sesiones de 7 días.
- Roles: `super_admin`, `admin`, `empresarial`, `conductor`.
- Carpetas y datos aislados por usuario.

---

## Stack técnico

| Capa | Tecnologías |
| --- | --- |
| **Frontend** | React 18, Vite 5, React Router 6, Axios, Tailwind CSS |
| **Backend** | Python 3.11, Flask 3, Flask-CORS, Flask-Limiter, PyJWT, bcrypt |
| **Procesamiento PDF** | PyMuPDF (fitz), Pillow, openpyxl |
| **Datos** | Firestore (NoSQL), Firebase Storage |
| **Integraciones** | Google Calendar API, Google OAuth 2.0 |
| **Auth y seguridad** | JWT (HS256), bcrypt 12 rounds, rate limiting por IP, OAuth 2.0 PKCE |
| **Deploy** | Cloud Run (backend) + Firebase Hosting (frontend), Cloud Build |
| **Tooling** | gunicorn, python-dotenv, cryptography (Fernet) |

---

## Arquitectura

```
            ┌────────────────────────────┐
            │      Usuario (browser)     │
            └──────────────┬─────────────┘
                           │ HTTPS
                ┌──────────▼──────────┐
                │   Firebase Hosting   │  ← React SPA (Vite build)
                └──────────┬──────────┘
                           │ /api/*  (Bearer JWT)
                ┌──────────▼──────────┐
                │      Cloud Run       │  ← Flask + gunicorn
                │  (lector-manifiestos │
                │       -backend)      │
                └─────┬──────────┬─────┘
                      │          │
              ┌───────▼───┐  ┌───▼──────────────┐
              │ Firestore │  │ Firebase Storage │
              │ usuarios, │  │  PDFs originales │
              │ manifies- │  │  + miniaturas    │
              │ tos, pdfs,│  └──────────────────┘
              │ tasks,…   │
              └───────────┘
                      │
              ┌───────▼─────────────┐
              │ Google Calendar API │  ← OAuth 2.0 por usuario
              └─────────────────────┘
```

### Separación de responsabilidades en el backend

```
backend/app/
├── api/              ← Blueprints Flask (entry points HTTP)
├── modules/          ← Lógica de negocio (auth, password, rate_limit, productivity, …)
├── database/         ← Repositorios sobre Firestore (1 colección = 1 repo)
├── config/           ← Credenciales y config de Firebase / OAuth
└── utils/            ← Helpers transversales
```

---

## Estructura del proyecto

```
LECTOR DE MANIFIESTOS/
├── backend/
│   ├── app/
│   │   ├── api/                # auth, manifiestos_*, productividad/, etc.
│   │   ├── modules/            # password_security, rate_limit, productivity/, …
│   │   ├── database/           # *_repository.py
│   │   ├── config/             # firebase y google oauth
│   │   └── __init__.py         # create_app()
│   ├── docs/                   # Documentación operativa (OAuth, etc.)
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── api/                # endpoints + cliente axios
│   │   ├── components/         # operaciones/, productividad/, layout/, …
│   │   ├── pages/              # Dashboard, Productividad, …
│   │   ├── services/           # manifiestosService, productividadService, …
│   │   ├── utils/              # thumbnailCache, authenticatedApiUrl, …
│   │   └── App.jsx
│   ├── index.html
│   └── vite.config.js
├── firebase.json
├── firestore.indexes.json
├── firestore.rules
└── start_frontend.bat
```

---

## Puesta en marcha local

### Requisitos

- Node.js 18+
- Python 3.11+
- Cuenta de Firebase con Firestore y Storage habilitados
- (Opcional) Credenciales de Google Cloud OAuth para el módulo de productividad

### 1. Clonar e instalar dependencias

```bash
git clone <repo-url>
cd "LECTOR DE MANIFIESTOS"

# Backend
cd backend
python -m venv venv311
venv311\Scripts\activate                 # PowerShell
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
```

### 2. Configurar variables de entorno

Copia los ejemplos y completa con tus valores:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local      # si existe
```

Variables principales (`backend/.env`):

```env
SECRET_KEY=<string-aleatorio-largo>
FIREBASE_CREDENTIALS_PATH=app/config/firebase-credentials.json
FIRESTORE_PROJECT_ID=<tu-project-id>
FIREBASE_STORAGE_BUCKET=<tu-bucket>.appspot.com

# Google Calendar OAuth (opcional)
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:5000/api/productividad/google/callback
FRONTEND_URL=http://localhost:5173

# Rate limiting (opcional, en memoria por defecto)
# RATELIMIT_STORAGE_URI=redis://localhost:6379/0
```

> Para más detalle sobre OAuth de Google Calendar, mira `backend/docs/GOOGLE_CALENDAR_OAUTH.md`.

### 3. Levantar el stack

```bash
# Terminal 1 – backend
cd backend
python run.py
# → http://localhost:5000

# Terminal 2 – frontend
cd frontend
npm run dev
# → http://localhost:5173
```

> En Windows también puedes usar `start_frontend.bat` y `start_backend.bat`.

---

## Despliegue

### Backend (Cloud Run)

```bash
gcloud builds submit --tag gcr.io/<PROJECT_ID>/lector-manifiestos-backend
gcloud run deploy lector-manifiestos-backend \
  --image gcr.io/<PROJECT_ID>/lector-manifiestos-backend \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars SECRET_KEY=...,GOOGLE_OAUTH_CLIENT_ID=...,GOOGLE_OAUTH_CLIENT_SECRET=...
```

### Frontend (Firebase Hosting)

```bash
cd frontend
npm run build
firebase deploy --only hosting
```

### Índices de Firestore

```bash
firebase deploy --only firestore:indexes
```

---

## Seguridad

| Vector | Mitigación |
| --- | --- |
| Contraseñas | **bcrypt 12 rounds** con salt automático. Migración transparente desde hashes legacy SHA-256 al iniciar sesión. |
| Fuerza bruta | **Flask-Limiter** en `/api/auth/login` (5/min, 30/h) y `/api/auth/register` (3/min, 10/h). |
| JWT | HS256 con `SECRET_KEY` rotable, expiración de 7 días. |
| OAuth refresh tokens | Cifrados con **Fernet** derivado del `SECRET_KEY` antes de guardarse en Firestore. |
| CORS | Whitelist explícita de orígenes para dev y producción. |
| Datos sensibles | `.gitignore` cubre `.env`, credenciales Firebase y JSON de OAuth. |
| Subida de PDFs | Validación de tipo de contenido y aislamiento por usuario en Storage. |

---

## Performance

- **Miniaturas de PDF** servidas con caché en memoria global del navegador y throttle de 4 requests concurrentes (`frontend/src/utils/thumbnailCache.js`). Las miniaturas se deduplican entre componentes y se reciclan con LRU.
- **Queries a Firestore** con `DEFAULT_MAX_RESULTS = 2000` en `FirebaseRepository.get_all` y `DEFAULT_PDF_QUERY_LIMIT = 1000` en consultas por usuario/carpeta para evitar lecturas descontroladas.
- **Índices compuestos** definidos en `firestore.indexes.json` para las queries hot path (manifiestos por usuario+fecha, tareas por usuario+lista, etc.).
- **Procesamiento de PDFs** en streaming con PyMuPDF, sin cargar todo el archivo en memoria.

---

## Roadmap

- [ ] Tests automatizados (pytest backend, vitest frontend).
- [ ] Webhooks de Google Calendar para reflejar cambios externos.
- [ ] Dashboard analítico con gráficos interactivos (Recharts / Chart.js).
- [ ] Modo offline para captura de manifiestos en ruta.
- [ ] Multi-tenant real con organizaciones.

---

## Licencia

Uso interno. Para licenciamiento contactar al autor.

---

<sub>Hecho con Flask, React y mucho café.</sub>
