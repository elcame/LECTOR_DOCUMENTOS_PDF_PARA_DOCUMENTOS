#!/bin/bash
# Script de configuración inicial

echo "🚀 Configurando proyecto Lector de Manifiestos..."

# Backend
echo "📦 Configurando backend..."
cd backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..

# Frontend
echo "📦 Configurando frontend..."
cd frontend
npm install
cd ..

echo "✅ Configuración completada!"
echo ""
echo "Para iniciar el desarrollo:"
echo "  Backend:  cd backend && python app/main.py"
echo "  Frontend: cd frontend && npm run dev"
