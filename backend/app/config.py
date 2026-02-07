"""
Configuración de la aplicación
"""
import os
from pathlib import Path

class Config:
    """Configuración base"""
    # IMPORTANTE: En producción (Cloud Run), configurar SECRET_KEY como variable de entorno
    # Si no se configura, se usa un fallback fijo para que los JWT sobrevivan cold starts
    # Para mayor seguridad, ejecutar en Cloud Run:
    #   gcloud run services update lector-manifiestos-backend --set-env-vars SECRET_KEY=tu-clave-secreta-aqui
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'lector-manifiestos-default-jwt-secret-2026'
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'  # JWT maneja auth cross-origin, cookies solo para desarrollo
    SESSION_COOKIE_SECURE = False  # True en producción con HTTPS
    
    # Base de datos
    BASE_DIR = Path(__file__).parent.parent.parent
    DATA_DIR = BASE_DIR / 'data'
    DB_FILE = DATA_DIR / 'lector_manifiestos.db'
    
    # Carpetas
    BASE_FOLDER = BASE_DIR / 'MANIFIESTOS'
    EXCEL_FOLDER = BASE_DIR / 'EXCEL'
    
    # Configuración de archivos
    ALLOWED_EXTENSIONS = {'pdf'}
    MAX_CONTENT_LENGTH = 500 * 1024 * 1024  # 500MB
    
    # Configuración de Firebase (opcional)
    # Ruta: backend/app/config/firebase-credentials.json
    FIREBASE_CREDENTIALS_PATH = Path(__file__).parent / 'config' / 'firebase-credentials.json'
    FIREBASE_PROJECT_ID = os.environ.get('FIREBASE_PROJECT_ID', '')
    FIREBASE_STORAGE_BUCKET = os.environ.get('FIREBASE_STORAGE_BUCKET', 'almacenamiento-acr.firebasestorage.app')
    
    @staticmethod
    def init_app(app):
        """Inicializar aplicación"""
        # Crear carpetas necesarias
        Config.DATA_DIR.mkdir(exist_ok=True)
        Config.BASE_FOLDER.mkdir(exist_ok=True)
        Config.EXCEL_FOLDER.mkdir(exist_ok=True)
        
        # Inicializar Firebase si está disponible
        try:
            from app.config.firebase_config import FirebaseConfig
            if Config.FIREBASE_CREDENTIALS_PATH.exists():
                FirebaseConfig.initialize(
                    credentials_path=str(Config.FIREBASE_CREDENTIALS_PATH),
                    project_id=Config.FIREBASE_PROJECT_ID if Config.FIREBASE_PROJECT_ID else None,
                    storage_bucket=Config.FIREBASE_STORAGE_BUCKET if Config.FIREBASE_STORAGE_BUCKET else None
                )
        except ImportError:
            pass  # Firebase no está disponible

class DevelopmentConfig(Config):
    """Configuración de desarrollo"""
    DEBUG = True

class ProductionConfig(Config):
    """Configuración de producción"""
    DEBUG = False
    SESSION_COOKIE_SECURE = True

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
