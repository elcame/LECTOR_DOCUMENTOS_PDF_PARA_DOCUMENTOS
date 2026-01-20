@echo off
REM Script para iniciar backend y frontend en ventanas separadas
echo Iniciando Backend y Frontend...
echo.

REM Cambiar al directorio raíz del proyecto (donde está este script)
cd /d "%~dp0"

REM Iniciar backend en nueva ventana (desde la raíz)
start "Backend Flask" cmd /k "cd /d %~dp0 && if exist venv\Scripts\activate.bat (call venv\Scripts\activate.bat) && python backend\run.py"

REM Esperar un poco
timeout /t 2 /nobreak >nul

REM Iniciar frontend en nueva ventana (desde la raíz)
start "Frontend React" cmd /k "cd /d %~dp0\frontend && npm run dev"

echo.
echo Backend y Frontend iniciados en ventanas separadas
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo.
pause
