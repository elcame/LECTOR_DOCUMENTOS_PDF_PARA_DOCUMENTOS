"""
Módulo de autenticación y gestión de usuarios
Soporta autenticación por JWT (producción cross-origin) y sesión Flask (desarrollo)
"""
import os
import json
import hashlib
from datetime import datetime
from typing import Optional, Dict
from functools import wraps
from flask import session, redirect, url_for, request, jsonify, current_app

# JWT para autenticación por token (necesario en producción cross-origin)
try:
    import jwt as pyjwt
except ImportError:
    pyjwt = None

# Importar módulo de base de datos
from modules.database import (
    init_database, create_user as db_create_user, 
    get_user_by_username as db_get_user, 
    update_user_last_login as db_update_last_login,
    get_user_role as db_get_user_role
)


# ============================================================
# Funciones auxiliares JWT (para producción cross-origin)
# ============================================================

def _get_jwt_secret():
    """Obtener secreto JWT desde la configuración de Flask"""
    try:
        return current_app.config.get('SECRET_KEY', None)
    except RuntimeError:
        # Fuera de contexto de Flask (ej. scripts)
        return None


def _get_token_from_request():
    """Extraer token JWT del header Authorization o query parameter"""
    try:
        # 1. Header Authorization: Bearer <token>
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            return auth_header.split(' ')[1]
        
        # 2. Query parameter ?token=<token>
        token = request.args.get('token')
        if token:
            return token
    except RuntimeError:
        # Fuera de contexto de request (ej. scripts)
        pass
    return None


def _decode_jwt_token(token):
    """Decodificar y verificar un token JWT"""
    if not pyjwt:
        return None
    try:
        secret = _get_jwt_secret()
        if not secret:
            return None
        payload = pyjwt.decode(token, secret, algorithms=['HS256'])
        return payload
    except (pyjwt.ExpiredSignatureError, pyjwt.InvalidTokenError, Exception):
        return None

# Ruta para almacenar datos de usuarios (mantener para compatibilidad)
USERS_DATA_DIR = 'data'
USERS_FILE = os.path.join(USERS_DATA_DIR, 'users.json')


def init_auth():
    """
    Inicializa el sistema de autenticación y la base de datos
    """
    # Crear directorio de datos si no existe
    if not os.path.exists(USERS_DATA_DIR):
        os.makedirs(USERS_DATA_DIR)
    
    # Inicializar base de datos
    init_database()
    
    # Mantener archivo JSON para compatibilidad (opcional)
    if not os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'w', encoding='utf-8') as f:
            json.dump({}, f, ensure_ascii=False, indent=2)


def hash_password(password: str) -> str:
    """
    Genera un hash SHA-256 de la contraseña
    
    Args:
        password (str): Contraseña en texto plano
    
    Returns:
        str: Hash de la contraseña
    """
    return hashlib.sha256(password.encode('utf-8')).hexdigest()


def register_user(username: str, password: str, email: str = '', full_name: str = '') -> Dict[str, any]:
    """
    Registra un nuevo usuario en el sistema (usa base de datos)
    
    Args:
        username (str): Nombre de usuario
        password (str): Contraseña
        email (str): Email del usuario (opcional)
        full_name (str): Nombre completo (opcional)
    
    Returns:
        dict: Resultado de la operación con 'success' y 'message'
    """
    init_auth()
    
    # Validar entrada
    if not username or not password:
        return {'success': False, 'message': 'Usuario y contraseña son requeridos'}
    
    if len(username) < 3:
        return {'success': False, 'message': 'El nombre de usuario debe tener al menos 3 caracteres'}
    
    if len(password) < 6:
        return {'success': False, 'message': 'La contraseña debe tener al menos 6 caracteres'}
    
    # Verificar si el usuario ya existe en la base de datos
    if db_get_user(username):
        return {'success': False, 'message': 'El nombre de usuario ya existe'}
    
    # Crear usuario en la base de datos
    password_hash = hash_password(password)
    if db_create_user(username, password_hash, email, full_name):
        # Crear carpetas del usuario
        user_folder = get_user_folder(username)
        if not os.path.exists(user_folder):
            os.makedirs(user_folder)
        
        user_excel_folder = get_user_excel_folder(username)
        if not os.path.exists(user_excel_folder):
            os.makedirs(user_excel_folder)
        
        return {'success': True, 'message': 'Usuario registrado exitosamente'}
    else:
        return {'success': False, 'message': 'Error al registrar usuario en la base de datos'}


def verify_user(username: str, password: str) -> Dict[str, any]:
    """
    Verifica las credenciales de un usuario (usa base de datos)
    
    Args:
        username (str): Nombre de usuario
        password (str): Contraseña
    
    Returns:
        dict: Resultado con 'success' y 'message', y 'user' si es exitoso
    """
    init_auth()
    
    # Buscar usuario en la base de datos
    user = db_get_user(username)
    
    if not user:
        return {'success': False, 'message': 'Usuario o contraseña incorrectos'}
    
    # Verificar contraseña
    password_hash = hash_password(password)
    if user['password_hash'] != password_hash:
        return {'success': False, 'message': 'Usuario o contraseña incorrectos'}
    
    # Actualizar último login
    db_update_last_login(username)
    
    return {
        'success': True,
        'message': 'Login exitoso',
        'user': {
            'username': user['username'],
            'email': user.get('email', ''),
            'full_name': user.get('full_name', '')
        }
    }


def get_user_folder(username: str) -> str:
    """
    Obtiene la ruta de la carpeta de manifiestos del usuario
    
    Args:
        username (str): Nombre de usuario
    
    Returns:
        str: Ruta de la carpeta
    """
    return os.path.join('MANIFIESTOS', username)


def get_user_excel_folder(username: str) -> str:
    """
    Obtiene la ruta de la carpeta EXCEL del usuario
    
    Args:
        username (str): Nombre de usuario
    
    Returns:
        str: Ruta de la carpeta
    """
    return os.path.join('EXCEL', username)


def get_user_data_folder(username: str) -> str:
    """
    Obtiene la ruta de la carpeta de datos del usuario
    
    Args:
        username (str): Nombre de usuario
    
    Returns:
        str: Ruta de la carpeta
    """
    return os.path.join('data', username)


def get_current_user() -> Optional[str]:
    """
    Obtiene el usuario actual (JWT token o sesión Flask)
    
    En producción (cross-origin), se usa JWT token.
    En desarrollo (mismo origen), se usa sesión Flask como fallback.
    
    Returns:
        str: Nombre de usuario o None si no hay sesión/token
    """
    # 1. Intentar JWT token (prioritario, funciona cross-origin)
    token = _get_token_from_request()
    if token:
        payload = _decode_jwt_token(token)
        if payload and 'username' in payload:
            return payload['username']
    
    # 2. Fallback a sesión Flask (funciona en mismo origen)
    return session.get('username')


def is_authenticated() -> bool:
    """
    Verifica si hay un usuario autenticado (JWT token o sesión Flask)
    
    En producción (cross-origin), se verifica JWT token.
    En desarrollo (mismo origen), se verifica sesión Flask como fallback.
    
    Returns:
        bool: True si hay usuario autenticado
    """
    # 1. Intentar JWT token (prioritario, funciona cross-origin)
    token = _get_token_from_request()
    if token:
        payload = _decode_jwt_token(token)
        if payload and 'username' in payload:
            return True
    
    # 2. Fallback a sesión Flask (funciona en mismo origen)
    return 'username' in session and session.get('username') is not None


def login_required(f):
    """
    Decorador para proteger rutas que requieren autenticación
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not is_authenticated():
            if request.is_json or request.path.startswith('/api/'):
                return jsonify({'success': False, 'error': 'No autenticado', 'redirect': '/login'}), 401
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function


def logout():
    """
    Cierra la sesión del usuario actual
    """
    session.clear()


def get_user_info(username: str) -> Optional[Dict]:
    """
    Obtiene información de un usuario (usa base de datos)
    
    Args:
        username (str): Nombre de usuario
    
    Returns:
        dict: Información del usuario o None si no existe
    """
    init_auth()
    
    user = db_get_user(username)
    if user:
        # Crear copia sin el hash de la contraseña
        user_info = dict(user)
        user_info.pop('password_hash', None)
        return user_info
    
    return None


def get_current_user_role() -> str:
    """
    Obtiene el rol del usuario actual (usa Firebase).

    Returns:
        str: 'super_admin' | 'empresarial' | 'conductor' (por defecto)
    """
    username = get_current_user()
    if not username:
        return 'conductor'

    try:
        from app.database.usuarios_repository import UsuariosRepository
        from app.database.roles_repository import RolesRepository

        repo = UsuariosRepository()
        usuario = repo.get_usuario_by_username(username)

        if usuario and usuario.get('role_id'):
            roles_repo = RolesRepository()
            role = roles_repo.get_by_id(usuario.get('role_id'))
            if role:
                return role.get('role_name', 'conductor')

        return db_get_user_role(username)
    except Exception as e:
        print(f"Error al obtener rol desde Firebase: {e}")
        return db_get_user_role(username)


def is_super_admin() -> bool:
    """True si el usuario actual es super_admin."""
    return get_current_user_role() in ('super_admin', 'admin')


def is_admin() -> bool:
    """True si el usuario es super_admin o empresarial (roles administrativos)."""
    return get_current_user_role() in ('super_admin', 'empresarial', 'admin')


def is_conductor() -> bool:
    """True si el usuario actual es conductor."""
    return get_current_user_role() == 'conductor'


def super_admin_required(f):
    """Decorador para endpoints que requieren super_admin."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if not is_authenticated():
            return jsonify({'success': False, 'error': 'No autenticado'}), 401
        if not is_super_admin():
            return jsonify({'success': False, 'error': 'Se requiere rol de super administrador'}), 403
        return f(*args, **kwargs)
    return decorated


def admin_required(f):
    """Decorador para endpoints que requieren super_admin o empresarial."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if not is_authenticated():
            return jsonify({'success': False, 'error': 'No autenticado'}), 401
        if not is_admin():
            return jsonify({'success': False, 'error': 'Se requiere rol de administrador'}), 403
        return f(*args, **kwargs)
    return decorated

