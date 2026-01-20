"""
Funciones auxiliares para las APIs
"""
import os
import sys
from pathlib import Path

# Agregar ruta raíz al path
ROOT_DIR = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))

from modules.auth import get_current_user, get_user_folder

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
