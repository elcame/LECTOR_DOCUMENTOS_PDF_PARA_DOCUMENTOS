# 🚀 Guía de Despliegue - Lector de Manifiestos

Esta guía te ayudará a desplegar tu aplicación en **Google Cloud Run** (backend) y **Firebase Hosting** (frontend).

## 📋 Requisitos Previos

### Instalar herramientas necesarias:

1. **Google Cloud SDK (gcloud)**
   ```bash
   # Descargar de: https://cloud.google.com/sdk/docs/install
   ```

2. **Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

3. **Docker** (opcional, para testing local)
   ```bash
   # Descargar de: https://www.docker.com/products/docker-desktop
   ```

## 🔧 Configuración Inicial

### 1. Configurar Google Cloud Project

```bash
# Autenticarse en Google Cloud
gcloud auth login

# Crear un nuevo proyecto (o usar uno existente)
gcloud projects create lector-manifiestos --name="Lector de Manifiestos"

# Establecer el proyecto activo
gcloud config set project lector-manifiestos

# Habilitar APIs necesarias
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### 2. Configurar Firebase

```bash
# Autenticarse en Firebase
firebase login

# Inicializar Firebase en el proyecto (si no está inicializado)
cd frontend
firebase init hosting

# Seleccionar:
# - Proyecto existente: tu-proyecto-firebase
# - Public directory: dist
# - Single-page app: Yes
# - GitHub deploys: No (por ahora)
```

### 3. Configurar Credenciales de Firebase en Cloud Run

```bash
# Crear un secreto con las credenciales de Firebase
gcloud secrets create firebase-credentials \
  --data-file=backend/firebase-credentials.json \
  --replication-policy="automatic"

# Dar permisos al servicio de Cloud Run para acceder al secreto
gcloud secrets add-iam-policy-binding firebase-credentials \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## 🐳 Despliegue del Backend (Cloud Run)

### Opción 1: Deploy Manual

```bash
cd backend

# Build y push de la imagen
gcloud builds submit --tag gcr.io/lector-manifiestos/backend

# Deploy a Cloud Run
gcloud run deploy lector-manifiestos-backend \
  --image gcr.io/lector-manifiestos/backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 0 \
  --set-env-vars FLASK_ENV=production \
  --set-secrets /secrets/firebase-credentials.json=firebase-credentials:latest
```

### Opción 2: Deploy Automático con Cloud Build

```bash
cd backend

# Configurar trigger de Cloud Build (conectar con GitHub)
gcloud builds triggers create github \
  --repo-name=tu-repo \
  --repo-owner=tu-usuario \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml

# O hacer deploy directo
gcloud builds submit --config=cloudbuild.yaml
```

### Obtener URL del Backend

```bash
gcloud run services describe lector-manifiestos-backend \
  --platform managed \
  --region us-central1 \
  --format 'value(status.url)'
```

**Copia esta URL** - la necesitarás para el frontend.

## 🌐 Despliegue del Frontend (Firebase Hosting)

### 1. Actualizar configuración del API

Edita `frontend/.env.production` con la URL de Cloud Run:

```env
VITE_API_BASE_URL=https://lector-manifiestos-backend-XXXXXXXXXX-uc.a.run.app
```

### 2. Actualizar archivo de configuración de Firebase

Edita `frontend/.firebaserc` con tu proyecto:

```json
{
  "projects": {
    "default": "tu-proyecto-firebase"
  }
}
```

### 3. Deploy a Firebase Hosting

```bash
cd frontend

# Instalar dependencias
npm install

# Build de producción
npm run build

# Deploy a Firebase Hosting
firebase deploy --only hosting

# O usar el script npm
npm run deploy
```

### URL del Frontend

Después del deploy, Firebase te dará una URL como:
```
https://tu-proyecto.web.app
```

## 🔐 Configurar CORS en el Backend

Después del primer deploy, necesitas actualizar la configuración de CORS en el backend.

Edita `backend/app/main.py` y actualiza la URL del frontend:

```python
CORS(app, 
     origins=['https://tu-proyecto.web.app'],
     supports_credentials=True)
```

Luego re-deploya el backend:

```bash
cd backend
gcloud builds submit --tag gcr.io/lector-manifiestos/backend
gcloud run deploy lector-manifiestos-backend --image gcr.io/lector-manifiestos/backend
```

## 🧪 Testing Local con Docker

### Backend

```bash
cd backend

# Build de la imagen
docker build -t lector-manifiestos-backend .

# Ejecutar localmente
docker run -p 8080:8080 \
  -e FLASK_ENV=development \
  -v $(pwd)/firebase-credentials.json:/secrets/firebase-credentials.json \
  lector-manifiestos-backend
```

### Frontend

```bash
cd frontend

# Desarrollo local
npm run dev

# Preview de producción
npm run build
npm run preview
```

## 📊 Monitoreo y Logs

### Ver logs del backend

```bash
# Logs en tiempo real
gcloud run services logs tail lector-manifiestos-backend --region us-central1

# Ver logs en Cloud Console
# https://console.cloud.google.com/run
```

### Ver métricas

```bash
# Abrir Cloud Console
gcloud run services describe lector-manifiestos-backend \
  --platform managed \
  --region us-central1
```

## 💰 Estimación de Costos

### Cloud Run (Backend)
- **Tier gratuito:** 2 millones de requests/mes
- **Después:** ~$0.40 por millón de requests
- **Memoria (2GB):** ~$0.0025/GB-segundo
- **CPU (2 vCPU):** ~$0.024/vCPU-segundo

**Estimado mensual:** $5-20 para uso moderado

### Firebase Hosting (Frontend)
- **Tier gratuito:** 10GB almacenamiento, 360MB/día transferencia
- **Después:** $0.026/GB almacenamiento, $0.15/GB transferencia

**Estimado mensual:** $0 (dentro del tier gratuito)

### Firebase Storage + Firestore
- **Storage:** $0.026/GB/mes
- **Firestore:** Tier gratuito generoso (50K lecturas/día)

**Estimado mensual:** $5-15 dependiendo del uso

**Total estimado:** $10-35/mes

## 🔄 Actualización de la Aplicación

### Backend

```bash
cd backend
gcloud builds submit --tag gcr.io/lector-manifiestos/backend
gcloud run deploy lector-manifiestos-backend --image gcr.io/lector-manifiestos/backend
```

### Frontend

```bash
cd frontend
npm run deploy
```

## 🛠️ Troubleshooting

### Error: "Permission denied" en Cloud Run

```bash
# Dar permisos de invocación pública
gcloud run services add-iam-policy-binding lector-manifiestos-backend \
  --region=us-central1 \
  --member="allUsers" \
  --role="roles/run.invoker"
```

### Error: "Cannot access Firebase"

Verifica que el secreto esté correctamente configurado:

```bash
gcloud secrets versions access latest --secret="firebase-credentials"
```

### Error de CORS en el frontend

Asegúrate de que la URL del frontend esté en la lista de orígenes permitidos en `backend/app/main.py`.

### Build falla por falta de memoria

Aumenta la memoria en `cloudbuild.yaml`:

```yaml
options:
  machineType: 'E2_HIGHCPU_8'
```

## 📚 Recursos Adicionales

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Cloud Build Documentation](https://cloud.google.com/build/docs)
- [Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)

## 🎯 Checklist de Despliegue

- [ ] Instalar gcloud CLI y Firebase CLI
- [ ] Crear proyecto en Google Cloud
- [ ] Habilitar APIs necesarias
- [ ] Configurar credenciales de Firebase en Secret Manager
- [ ] Desplegar backend en Cloud Run
- [ ] Obtener URL del backend
- [ ] Actualizar `.env.production` con URL del backend
- [ ] Actualizar `.firebaserc` con proyecto de Firebase
- [ ] Desplegar frontend en Firebase Hosting
- [ ] Actualizar CORS en backend con URL del frontend
- [ ] Re-desplegar backend con CORS actualizado
- [ ] Probar la aplicación en producción
- [ ] Configurar monitoreo y alertas

## 🚀 ¡Listo!

Tu aplicación ahora está desplegada en la nube con:
- ✅ Backend escalable en Cloud Run
- ✅ Frontend rápido en Firebase Hosting
- ✅ Storage y base de datos en Firebase
- ✅ HTTPS automático
- ✅ CDN global
- ✅ Escalado automático

**URLs de tu aplicación:**
- Frontend: `https://tu-proyecto.web.app`
- Backend: `https://lector-manifiestos-backend-XXXXXXXXXX-uc.a.run.app`
