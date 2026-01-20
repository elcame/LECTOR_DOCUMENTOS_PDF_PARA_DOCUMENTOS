@echo off
REM Script para iniciar el backend en Windows
echo Iniciando Backend Flask...
echo.

REM Cambiar al directorio raíz del proyecto (donde está este script)
cd /d "%~dp0"

REM Verificar que estamos en la raíz correcta
if not exist "backend\run.py" (
    echo [ERROR] No se encontro backend\run.py
    echo [ERROR] Asegurate de ejecutar este script desde la raiz del proyecto
    pause
    exit /b 1
)

REM Activar entorno virtual si existe
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
)

REM Ejecutar backend desde la raíz (usar run_backend.py si existe, sino backend\run.py)
if exist "run_backend.py" (
    python run_backend.py
) else (
    python backend\run.py
)

pause
