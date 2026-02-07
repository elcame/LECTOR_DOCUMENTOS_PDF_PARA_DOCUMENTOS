#!/bin/bash

# Script de despliegue automatizado para el frontend en Firebase Hosting
# Uso: ./deploy-frontend.sh

set -e  # Salir si hay algún error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Iniciando despliegue del frontend en Firebase Hosting${NC}"

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: No se encontró package.json${NC}"
    echo "Asegúrate de ejecutar este script desde el directorio frontend/"
    exit 1
fi

# Verificar que existe .env.production
if [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}⚠️  Advertencia: No se encontró .env.production${NC}"
    echo "Asegúrate de configurar la URL del backend en .env.production"
    read -p "¿Deseas continuar? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo -e "${YELLOW}📦 Instalando dependencias...${NC}"
npm install

echo -e "${YELLOW}🔨 Construyendo aplicación para producción...${NC}"
npm run build

echo -e "${YELLOW}🚢 Desplegando en Firebase Hosting...${NC}"
firebase deploy --only hosting

# Obtener URL del proyecto
PROJECT_ID=$(firebase projects:list | grep "(current)" | awk '{print $2}')

echo ""
echo -e "${GREEN}✅ ¡Despliegue completado exitosamente!${NC}"
echo ""
echo -e "${GREEN}🌐 URL del frontend:${NC}"
echo -e "${YELLOW}https://${PROJECT_ID}.web.app${NC}"
echo ""
echo -e "${YELLOW}💡 Próximos pasos:${NC}"
echo "1. Verifica que la aplicación funcione correctamente"
echo "2. Si hay errores de CORS, actualiza la configuración en el backend"
echo "3. Configura un dominio personalizado (opcional)"
echo ""
