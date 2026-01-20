# Script de configuración para Windows PowerShell

Write-Host "🚀 Configurando proyecto Lector de Manifiestos..." -ForegroundColor Green

# Backend
Write-Host "📦 Configurando backend..." -ForegroundColor Yellow
Set-Location backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Set-Location ..

# Frontend
Write-Host "📦 Configurando frontend..." -ForegroundColor Yellow
Set-Location frontend
npm install
Set-Location ..

Write-Host "✅ Configuración completada!" -ForegroundColor Green
Write-Host ""
Write-Host "Para iniciar el desarrollo:" -ForegroundColor Cyan
Write-Host "  Backend:  cd backend && python app/main.py" -ForegroundColor White
Write-Host "  Frontend: cd frontend && npm run dev" -ForegroundColor White
