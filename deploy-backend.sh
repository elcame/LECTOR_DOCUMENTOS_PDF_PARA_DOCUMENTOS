#!/bin/bash

# Script de despliegue automatizado para el backend en Cloud Run
# Uso: ./deploy-backend.sh [PROJECT_ID]

set -e  # Salir si hay algún error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Iniciando despliegue del backend en Cloud Run${NC}"

# Verificar que estamos en el directorio correcto
if [ ! -f "requirements.txt" ]; then
    echo -e "${RED}❌ Error: No se encontró requirements.txt${NC}"
    echo "Asegúrate de ejecutar este script desde el directorio backend/"
    exit 1
fi

# Obtener PROJECT_ID
if [ -z "$1" ]; then
    PROJECT_ID=$(gcloud config get-value project)
    if [ -z "$PROJECT_ID" ]; then
        echo -e "${RED}❌ Error: No se pudo obtener el PROJECT_ID${NC}"
        echo "Uso: ./deploy-backend.sh [PROJECT_ID]"
        exit 1
    fi
else
    PROJECT_ID=$1
fi

echo -e "${YELLOW}📦 Proyecto: ${PROJECT_ID}${NC}"

# Configurar proyecto
gcloud config set project $PROJECT_ID

# Variables
SERVICE_NAME="lector-manifiestos-backend"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo -e "${YELLOW}🔨 Construyendo imagen Docker...${NC}"
gcloud builds submit --tag $IMAGE_NAME

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
  --set-secrets /secrets/firebase-credentials.json=firebase-credentials:latest

# Obtener URL del servicio
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --format 'value(status.url)')

echo ""
echo -e "${GREEN}✅ ¡Despliegue completado exitosamente!${NC}"
echo ""
echo -e "${GREEN}🌐 URL del backend:${NC}"
echo -e "${YELLOW}${SERVICE_URL}${NC}"
echo ""
echo -e "${YELLOW}💡 Próximos pasos:${NC}"
echo "1. Copia la URL del backend"
echo "2. Actualiza frontend/.env.production con esta URL"
echo "3. Despliega el frontend con: cd ../frontend && npm run deploy"
echo ""
