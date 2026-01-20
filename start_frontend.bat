@echo off
REM Script para iniciar el frontend en Windows
echo Iniciando Frontend React...
echo.

REM Cambiar al directorio raíz del proyecto (donde está este script)
cd /d "%~dp0"

REM Ir a frontend
cd frontend

REM Instalar dependencias si no existen
if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install
)

REM Ejecutar frontend
call npm run dev

pause
