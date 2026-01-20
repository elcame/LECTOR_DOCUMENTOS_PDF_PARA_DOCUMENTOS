"""
Configuración de la aplicación Flask
"""
import os
import secrets
from pathlib import Path
from typing import Dict, Any

class AppConfig:
    """Configuración de la aplicación"""
    
    # Directorio base del proyecto
    BASE_DIR = Path(__file__).parent.parent.parent.parent
    
    # Configuración de Flask
    SECRET_KEY: str = os.environ.get('SECRET_KEY', secrets.token_hex(16))
    SESSION_COOKIE_HTTPONLY: bool = True
    SESSION_COOKIE_SAMESITE: str = 'Lax'
    SESSION_COOKIE_SECURE: bool = os.environ.get('FLASK_ENV') == 'production'
    
    # Configuración de archivos
    BASE_FOLDER: str = str(BASE_DIR / 'MANIFIESTOS')
    ALLOWED_EXTENSIONS: set = {'pdf'}
    
    # Configuración de Firebase
    FIREBASE_CREDENTIALS_PATH: str = os.environ.get(
        'FIREBASE_CREDENTIALS_PATH', 
        str(BASE_DIR / 'config' / 'firebase-credentials.json')
    )
    FIREBASE_PROJECT_ID: str = os.environ.get('FIREBASE_PROJECT_ID', '')
    
    # Configuración de carpetas
    EXCEL_FOLDER: str = str(BASE_DIR / 'EXCEL')
    DATA_FOLDER: str = str(BASE_DIR / 'data')
    
    @classmethod
    def get_config(cls) -> Dict[str, Any]:
        """
        Obtiene la configuración como diccionario para Flask
        
        Returns:
            Dict con la configuración
        """
        return {
            'SECRET_KEY': cls.SECRET_KEY,
            'SESSION_COOKIE_HTTPONLY': cls.SESSION_COOKIE_HTTPONLY,
            'SESSION_COOKIE_SAMESITE': cls.SESSION_COOKIE_SAMESITE,
            'SESSION_COOKIE_SECURE': cls.SESSION_COOKIE_SECURE,
        }
    
    @classmethod
    def ensure_directories(cls):
        """Asegura que los directorios necesarios existan"""
        directories = [
            cls.BASE_FOLDER,
            cls.EXCEL_FOLDER,
            cls.DATA_FOLDER
        ]
        
        for directory in directories:
            if not os.path.exists(directory):
                os.makedirs(directory, exist_ok=True)
                print(f"✓ Directorio creado: {directory}")
