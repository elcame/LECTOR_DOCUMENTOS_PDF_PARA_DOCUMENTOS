"""
Utilidades compartidas para los módulos de manifiestos
"""
import os
import sys
from pathlib import Path
from functools import wraps
from flask import jsonify

# Agregar ruta raíz al path
ROOT_DIR = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))

# Ruta absoluta del caché de miniaturas (backend/cache/thumbnails)
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
CACHE_THUMBNAILS_BASE = BACKEND_DIR / 'cache' / 'thumbnails'

from modules.auth import (
    get_current_user, is_authenticated,
    get_user_excel_folder, get_user_folder
)


def login_required_api(f):
    """Decorador para APIs que requieren autenticación"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not is_authenticated():
            return jsonify({'success': False, 'error': 'No autenticado'}), 401
        return f(*args, **kwargs)
    return decorated_function


def get_user_manifiesto_folder():
    """Obtiene la carpeta de manifiestos del usuario actual"""
    username = get_current_user()
    if not username:
        return None
    manifiesto_path = os.path.join('MANIFIESTOS', username, 'Manifiesto')
    if not os.path.exists(manifiesto_path):
        os.makedirs(manifiesto_path, exist_ok=True)
    return manifiesto_path


def get_user_manifiesto_qr_folder():
    """Obtiene la carpeta de manifiestos QR del usuario actual"""
    username = get_current_user()
    if not username:
        return None
    qr_path = os.path.join('MANIFIESTOS', username, 'ManifiestoQRinfo')
    if not os.path.exists(qr_path):
        os.makedirs(qr_path, exist_ok=True)
    return qr_path


def get_user_base_folder():
    """Obtiene la carpeta base del usuario"""
    username = get_current_user()
    if not username:
        return None
    return get_user_folder(username)


def sanitize_filename(filename: str) -> str:
    """
    Sanitiza un nombre de archivo eliminando caracteres peligrosos
    
    Args:
        filename: Nombre de archivo a sanitizar
    
    Returns:
        str: Nombre de archivo sanitizado
    """
    if not filename:
        return ''
    
    clean = os.path.basename(filename)
    clean = clean.replace('..', '')
    clean = ''.join(c for c in clean if c.isalnum() or c in '._- áéíóúÁÉÍÓÚñÑ')
    clean = clean.strip()
    return clean if clean else None
