"""
Punto de entrada de la aplicación
"""
import os
import sys
from pathlib import Path

# Agregar ruta raíz del proyecto al path para importar módulos
ROOT_DIR = Path(__file__).parent.parent.parent
BACKEND_DIR = Path(__file__).parent.parent

# Agregar rutas necesarias al path
sys.path.insert(0, str(ROOT_DIR))
sys.path.insert(0, str(BACKEND_DIR))

from app import create_app, config

# Determinar entorno
env = os.environ.get('FLASK_ENV', 'development')
app = create_app(config.get(env, config['default']))

# Inicializar autenticación y base de datos
with app.app_context():
    try:
        from modules.auth import init_auth
        init_auth()
        print("✓ Autenticación y base de datos inicializadas")
    except ImportError as e:
        print(f"⚠️ Advertencia: No se pudo importar módulos: {e}")
        print("⚠️ Asegúrate de que los módulos estén en la ruta correcta")
    except Exception as e:
        print(f"⚠️ Advertencia: Error al inicializar: {e}")

if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=app.config['DEBUG']
    )
