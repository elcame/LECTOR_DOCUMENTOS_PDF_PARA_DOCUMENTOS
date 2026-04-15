"""
Aplicación Flask principal
"""
from flask import Flask
from flask_cors import CORS
# Importar Config desde el archivo config.py (no la carpeta)
import sys
from pathlib import Path

# Agregar el directorio app al path para importar config.py
APP_DIR = Path(__file__).parent
sys.path.insert(0, str(APP_DIR))

# Importar Config y config desde el archivo config.py
import importlib.util
config_file = APP_DIR / 'config.py'
spec = importlib.util.spec_from_file_location("config_module", config_file)
config_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(config_module)
Config = config_module.Config
config = config_module.config

def create_app(config_class=Config):
    """Factory para crear la aplicación Flask"""
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Inicializar aplicación
    config_class.init_app(app)
    
    # Configurar CORS para permitir requests del frontend
    CORS(app, 
         origins=["http://localhost:3000", "http://localhost:5173", "https://almacenamiento-acr.web.app", "https://almacenamiento-acr.firebaseapp.com"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         allow_headers=["Content-Type", "Authorization", "Accept", "X-Requested-With"],
         supports_credentials=True)
    
    # Registrar blueprints
    from app.api.auth import bp as auth_bp
    from app.api.usuarios import bp as usuarios_bp
    from app.api.operaciones import bp as operaciones_bp
    from app.api.gastos import bp as gastos_bp
    from app.api.roles import bp as roles_bp
    from app.api.usuarios_firebase import bp as usuarios_firebase_bp
    from app.api.expenses import bp as expenses_bp
    
    # Blueprints modulares de manifiestos
    from app.api.manifiestos_folders import bp as manifiestos_folders_bp
    from app.api.manifiestos_upload import bp as manifiestos_upload_bp
    from app.api.manifiestos_data import bp as manifiestos_data_bp
    from app.api.manifiestos_processing import bp as manifiestos_processing_bp
    from app.api.manifiestos_qr import bp as manifiestos_qr_bp
    from app.api.manifiestos_pdf_ops import bp as manifiestos_pdf_ops_bp
    from app.api.carros import bp as carros_bp
    from app.api.ingresos_detalle import bp as ingresos_detalle_bp  # 🔥 NUEVO
    from app.api.gps import bp as gps_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(usuarios_bp, url_prefix='/api/usuarios')
    app.register_blueprint(operaciones_bp, url_prefix='/api/operaciones')
    app.register_blueprint(gastos_bp, url_prefix='/api/gastos')
    app.register_blueprint(roles_bp, url_prefix='/api/roles')
    app.register_blueprint(usuarios_firebase_bp, url_prefix='/api/usuarios-firebase')
    app.register_blueprint(expenses_bp, url_prefix='/api/expenses')
    
    # Registrar blueprints modulares de manifiestos (todos bajo /api/manifiestos)
    app.register_blueprint(manifiestos_folders_bp, url_prefix='/api/manifiestos')
    app.register_blueprint(manifiestos_upload_bp, url_prefix='/api/manifiestos')
    app.register_blueprint(manifiestos_data_bp, url_prefix='/api/manifiestos')
    app.register_blueprint(manifiestos_processing_bp, url_prefix='/api/manifiestos')
    app.register_blueprint(manifiestos_qr_bp, url_prefix='/api/manifiestos')
    app.register_blueprint(manifiestos_pdf_ops_bp, url_prefix='/api/manifiestos')
    app.register_blueprint(carros_bp, url_prefix='/api')
    app.register_blueprint(ingresos_detalle_bp, url_prefix='/api/ingresos')  # 🔥 NUEVO
    app.register_blueprint(gps_bp, url_prefix='/api/gps')
    
    return app
