#!/bin/bash

# Script de despliegue completo - Backend y Frontend
# Uso: ./deploy-all.sh [PROJECT_ID]

set -e  # Salir si hay algún error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🚀 Despliegue Completo - Lector de Manifiestos      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Obtener PROJECT_ID
if [ -z "$1" ]; then
    PROJECT_ID=$(gcloud config get-value project)
    if [ -z "$PROJECT_ID" ]; then
        echo -e "${RED}❌ Error: No se pudo obtener el PROJECT_ID${NC}"
        echo "Uso: ./deploy-all.sh [PROJECT_ID]"
        exit 1
    fi
else
    PROJECT_ID=$1
fi

echo -e "${YELLOW}📦 Proyecto: ${PROJECT_ID}${NC}"
echo ""

# ============================================
# PASO 1: Desplegar Backend
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}📡 PASO 1: Desplegando Backend en Cloud Run${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""

cd backend

SERVICE_NAME="lector-manifiestos-backend"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo -e "${YELLOW}🔨 Construyendo imagen Docker...${NC}"
gcloud builds submit --tag $IMAGE_NAME --project $PROJECT_ID

echo -e "${YELLOW}🚢 Desplegando en Cloud Run...${NC}"
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 0 \
  --set-env-vars FLASK_ENV=production,SECRET_KEY=c30d5e615b836cfe403455a889e634db7347abf176c49c1e79fe83dbb50f8d68 \
  --set-secrets /secrets/firebase-credentials.json=firebase-credentials:latest \
  --project $PROJECT_ID

# Obtener URL del backend
BACKEND_URL=$(gcloud run services describe $SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --format 'value(status.url)' \
  --project $PROJECT_ID)

echo ""
echo -e "${GREEN}✅ Backend desplegado exitosamente${NC}"
echo -e "${YELLOW}URL: ${BACKEND_URL}${NC}"
echo ""

# ============================================
# PASO 2: Actualizar configuración del Frontend
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}⚙️  PASO 2: Actualizando configuración del Frontend${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""

cd ../frontend

# Actualizar .env.production con la URL del backend
echo "VITE_API_BASE_URL=${BACKEND_URL}" > .env.production
echo "VITE_ENV=production" >> .env.production

echo -e "${GREEN}✅ Configuración actualizada${NC}"
echo ""

# ============================================
# PASO 3: Desplegar Frontend
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}🌐 PASO 3: Desplegando Frontend en Firebase Hosting${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}📦 Instalando dependencias...${NC}"
npm install

echo -e "${YELLOW}🔨 Construyendo aplicación...${NC}"
npm run build

echo -e "${YELLOW}🚢 Desplegando en Firebase Hosting...${NC}"
firebase deploy --only hosting --project $PROJECT_ID

# Obtener URL del frontend
FRONTEND_URL="https://${PROJECT_ID}.web.app"

echo ""
echo -e "${GREEN}✅ Frontend desplegado exitosamente${NC}"
echo -e "${YELLOW}URL: ${FRONTEND_URL}${NC}"
echo ""

# ============================================
# RESUMEN FINAL
# ============================================
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  ✅ ¡DESPLIEGUE COMPLETADO EXITOSAMENTE!              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}🌐 URLs de tu aplicación:${NC}"
echo ""
echo -e "  ${YELLOW}Frontend:${NC} ${FRONTEND_URL}"
echo -e "  ${YELLOW}Backend:${NC}  ${BACKEND_URL}"
echo ""
echo -e "${YELLOW}💡 Próximos pasos:${NC}"
echo ""
echo "  1. Abre el frontend en tu navegador"
echo "  2. Verifica que todo funcione correctamente"
echo "  3. Si hay errores de CORS, actualiza backend/app/main.py"
echo "  4. Configura un dominio personalizado (opcional)"
echo "  5. Configura monitoreo y alertas en Google Cloud Console"
echo ""
echo -e "${GREEN}📚 Documentación completa en: DEPLOY.md${NC}"
echo ""
