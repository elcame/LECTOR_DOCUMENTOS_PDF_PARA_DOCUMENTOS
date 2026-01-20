# Backend - Lector de Manifiestos

## 📁 Estructura del Backend

```
backend/
├── app/
│   ├── __init__.py          # Factory de Flask
│   ├── config.py            # Configuración principal
│   ├── main.py              # Punto de entrada
│   ├── api/                 # APIs REST
│   │   ├── auth.py          # Autenticación
│   │   ├── manifiestos.py   # Manifiestos y PDFs
│   │   ├── usuarios.py      # Gestión de usuarios
│   │   ├── operaciones.py   # Operaciones y análisis
│   │   └── gastos.py        # Gastos y pagos
│   ├── modules/             # Módulos de negocio
│   │   ├── auth.py
│   │   ├── database.py
│   │   ├── pdf_processor.py
│   │   ├── data_extractor.py
│   │   ├── excel_generator.py
│   │   ├── analytics.py
│   │   ├── payment_manager.py
│   │   └── qr_extractor.py
│   ├── config/              # Configuración adicional
│   │   ├── app_config.py
│   │   └── firebase_config.py
│   ├── database/            # Repositorios Firebase
│   │   ├── firebase_repository.py
│   │   ├── users_repository.py
│   │   ├── qr_data_repository.py
│   │   ├── gastos_repository.py
│   │   └── pagos_repository.py
│   ├── models/              # Modelos de datos
│   ├── services/            # Servicios de negocio
│   └── utils/               # Utilidades
│       └── helpers.py
└── requirements.txt
```

## 🚀 Inicio Rápido

### Instalación

```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

### Ejecutar

```bash
python app/main.py
```

El servidor se iniciará en `http://localhost:5000`

## 📡 APIs Disponibles

### Autenticación (`/api/auth`)
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/me` - Usuario actual

### Manifiestos (`/api/manifiestos`)
- `GET /api/manifiestos/folders` - Obtener carpetas
- `POST /api/manifiestos/process_folder` - Procesar carpeta
- `GET /api/manifiestos/archivos_qr` - Archivos QR
- `POST /api/manifiestos/process_folder_qr` - Procesar QR

### Usuarios (`/api/usuarios`)
- `GET /api/usuarios` - Listar usuarios (admin)
- `POST /api/usuarios` - Crear usuario (admin)
- `PUT /api/usuarios/<username>/rol` - Actualizar rol (admin)

### Operaciones (`/api/operaciones`)
- `GET /api/operaciones` - Operaciones generales
- `GET /api/operaciones/<mes>` - Operaciones por mes

### Gastos (`/api/gastos`)
- `GET /api/gastos/viajes` - Gastos de viajes
- `POST /api/gastos/viajes` - Crear gasto
- `GET /api/gastos/resumen-pagos` - Resumen de pagos

## ⚙️ Configuración

Las variables de entorno se pueden configurar en un archivo `.env`:

```
FLASK_ENV=development
SECRET_KEY=tu-secret-key
FIREBASE_PROJECT_ID=tu-project-id
FIREBASE_CREDENTIALS_PATH=config/firebase-credentials.json
```

## 📝 Notas

- Los módulos se importan desde la raíz del proyecto
- Las rutas de archivos son relativas a la raíz del proyecto
- Firebase es opcional, la app funciona sin él
