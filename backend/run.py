"""
Script para ejecutar el backend
Funciona desde la raíz del proyecto o desde la carpeta backend
"""
import os
import sys
from pathlib import Path

# Obtener la ruta absoluta del script actual
SCRIPT_FILE = Path(__file__).resolve()
BACKEND_DIR = SCRIPT_FILE.parent

# Verificar que estamos en la carpeta backend
if BACKEND_DIR.name != 'backend':
    print(f"[ERROR] Este script debe estar en la carpeta 'backend/'")
    print(f"[ERROR] Ruta actual: {BACKEND_DIR}")
    sys.exit(1)

# La raíz del proyecto es el directorio padre de backend
ROOT_DIR = BACKEND_DIR.parent

# Verificar que la estructura es correcta
if not (ROOT_DIR / 'frontend').exists() and not (ROOT_DIR / 'MANIFIESTOS').exists():
    print(f"[WARN] No se detectó la estructura esperada del proyecto")
    print(f"[WARN] ROOT_DIR: {ROOT_DIR}")

# Agregar rutas al path de Python
sys.path.insert(0, str(ROOT_DIR))
sys.path.insert(0, str(BACKEND_DIR))

# Cambiar al directorio backend (importante para rutas relativas)
os.chdir(str(BACKEND_DIR))

# Debug: mostrar rutas (opcional, comentar en producción)
if os.environ.get('DEBUG_PATHS'):
    print(f"[DEBUG] ROOT_DIR: {ROOT_DIR}")
    print(f"[DEBUG] BACKEND_DIR: {BACKEND_DIR}")
    print(f"[DEBUG] CWD: {os.getcwd()}")

from app import create_app, config

# Determinar entorno
env = os.environ.get('FLASK_ENV', 'development')
app = create_app(config.get(env, config['default']))

# Inicializar autenticación y base de datos
with app.app_context():
    try:
        from modules.auth import init_auth
        init_auth()
        print("[OK] Autenticacion y base de datos inicializadas")
    except ImportError as e:
        print(f"[WARN] No se pudo importar modulos: {e}")
        print("[WARN] Asegurate de que los modulos esten en la ruta correcta")
    except Exception as e:
        print(f"[WARN] Error al inicializar: {e}")

if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("Backend Flask iniciando...")
    print("=" * 60)
    print("Servidor disponible en: http://localhost:5000")
    print("Presiona Ctrl+C para detener el servidor")
    print("=" * 60 + "\n")
    
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=app.config['DEBUG']
    )
