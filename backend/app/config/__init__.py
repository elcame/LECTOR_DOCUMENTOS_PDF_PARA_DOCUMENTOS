"""
Configuración de la aplicación
"""
# Importar desde el archivo config.py del nivel superior
import importlib.util
import sys
from pathlib import Path

# Ruta al archivo config.py
config_file_path = Path(__file__).parent.parent / 'config.py'

if config_file_path.exists():
    # Cargar el módulo config.py dinámicamente
    spec = importlib.util.spec_from_file_location("app_config_module", config_file_path)
    config_module = importlib.util.module_from_spec(spec)
    sys.modules['app_config_module'] = config_module
    spec.loader.exec_module(config_module)
    
    # Exportar las clases
    Config = config_module.Config
    DevelopmentConfig = config_module.DevelopmentConfig
    ProductionConfig = config_module.ProductionConfig
    config = config_module.config
else:
    Config = None
    DevelopmentConfig = None
    ProductionConfig = None
    config = None

# También exportar desde la carpeta config
from .app_config import AppConfig
from .firebase_config import FirebaseConfig

__all__ = ['AppConfig', 'FirebaseConfig']
if Config:
    __all__.extend(['Config', 'DevelopmentConfig', 'ProductionConfig', 'config'])