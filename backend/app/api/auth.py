"""
API de autenticación (Firebase + JWT)
"""
import sys
from pathlib import Path
from flask import Blueprint, request, jsonify, session, current_app
from functools import wraps
import hashlib
import jwt
from datetime import datetime, timedelta, timezone

# Agregar ruta raíz al path
ROOT_DIR = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))

try:
    from app.database.usuarios_repository import UsuariosRepository
    from app.database.roles_repository import RolesRepository
except ImportError as e:
    print(f"Advertencia: Error al importar módulos en auth.py: {e}")

bp = Blueprint('auth', __name__)

def get_jwt_secret():
    """Obtener el secreto JWT desde la configuración de Flask"""
    return current_app.config.get('SECRET_KEY', 'default-secret-key-change-in-production')

def generate_token(username):
    """Genera un token JWT para el usuario"""
    payload = {
        'username': username,
        'exp': datetime.now(timezone.utc) + timedelta(days=7),  # Token válido por 7 días
        'iat': datetime.now(timezone.utc)
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm='HS256')

def decode_token(token):
    """Decodifica y verifica un token JWT"""
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def get_token_from_header():
    """Extrae el token del header Authorization o query parameter"""
    # Debug: Imprimir toda la información de la request
    print(f"DEBUG BACKEND - request.full_path: {request.full_path}")
    print(f"DEBUG BACKEND - request.query_string: {request.query_string}")
    print(f"DEBUG BACKEND - request.args: {dict(request.args)}")
    print(f"DEBUG BACKEND - request.url: {request.url}")
    
    # Primero intentar header Authorization
    auth_header = request.headers.get('Authorization')
    print(f"DEBUG BACKEND - Authorization header: {auth_header}")
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        print(f"DEBUG BACKEND - Token extraído de header: {token[:50]}...")
        return token
    
    # Si no hay header, intentar query parameter
    token = request.args.get('token')
    print(f"DEBUG BACKEND - Token from request.args.get('token'): {token}")
    if token:
        print(f"DEBUG BACKEND - Token extraído de query param: {token[:50]}...")
        return token
    
    print(f"DEBUG BACKEND - No se encontró token en header ni query params")
    return None

def hash_password(password: str) -> str:
    """Hashea una contraseña"""
    return hashlib.sha256(password.encode()).hexdigest()

def is_authenticated() -> bool:
    """Verifica si el usuario está autenticado (via JWT o sesión legacy)"""
    print(f"DEBUG BACKEND - is_authenticated() llamado")
    # Primero intentar JWT
    token = get_token_from_header()
    print(f"DEBUG BACKEND - Token from header: {'SÍ' if token else 'NO'}")
    if token:
        payload = decode_token(token)
        print(f"DEBUG BACKEND - Payload decodificado: {payload}")
        if payload and 'username' in payload:
            return True
    # Fallback a sesión legacy
    session_user = session.get('username')
    print(f"DEBUG BACKEND - Session username: {session_user}")
    return 'username' in session and session.get('username') is not None

def get_current_user():
    """Obtiene el usuario actual del token JWT o sesión"""
    # Primero intentar JWT
    token = get_token_from_header()
    if token:
        payload = decode_token(token)
        if payload and 'username' in payload:
            return payload['username']
    # Fallback a sesión legacy
    return session.get('username')

@bp.route('/login', methods=['POST'])
def login():
    """Iniciar sesión con Firebase"""
    try:
        data = request.get_json()
        username = data.get('username', '').strip().lower()
        password = data.get('password', '')
        
        if not username or not password:
            return jsonify({
                'success': False,
                'message': 'Usuario y contraseña son requeridos'
            }), 400
        
        # Buscar usuario en Firebase
        repo = UsuariosRepository()
        usuario = repo.get_usuario_by_username(username)
        
        if not usuario:
            return jsonify({
                'success': False,
                'message': 'Usuario o contraseña incorrectos'
            }), 401
        
        # Verificar si el usuario está activo
        if not usuario.get('active', True):
            return jsonify({
                'success': False,
                'message': 'Usuario inactivo. Contacta al administrador.'
            }), 403
        
        # Verificar contraseña
        password_hash = hash_password(password)
        if usuario.get('password_hash') != password_hash:
            return jsonify({
                'success': False,
                'message': 'Usuario o contraseña incorrectos'
            }), 401
        
        # Actualizar último login
        repo.update_usuario(username, {'last_login': repo._get_timestamp()})
        
        # Obtener información del rol
        role_name = 'conductor'  # Por defecto
        role_id = usuario.get('role_id')
        if role_id:
            roles_repo = RolesRepository()
            role = roles_repo.get_by_id(role_id)
            if role:
                role_name = role.get('role_name', 'conductor')
        
        # Crear sesión (legacy) y generar token JWT
        session['username'] = username
        token = generate_token(username)
        
        # Preparar datos del usuario (sin password_hash)
        user_data = {
            'username': usuario.get('username'),
            'email': usuario.get('email', ''),
            'full_name': usuario.get('full_name', ''),
            'role': role_name,
            'role_id': role_id,
            'carro_id': usuario.get('carro_id'),
            'active': usuario.get('active', True)
        }
        
        return jsonify({
            'success': True,
            'message': 'Login exitoso',
            'token': token,
            'user': user_data
        })
    except Exception as e:
        print(f"Error en login: {e}")
        return jsonify({
            'success': False,
            'message': 'Error al iniciar sesión'
        }), 500

@bp.route('/register', methods=['POST'])
def register():
    """Registrar nuevo usuario en Firebase"""
    try:
        data = request.get_json() or {}
        username = (data.get('username') or '').strip().lower()
        password = data.get('password') or ''
        email = (data.get('email') or '').strip().lower()
        full_name = (data.get('full_name') or '').strip()
        
        if not username or not password:
            return jsonify({
                'success': False,
                'message': 'Usuario y contraseña son requeridos'
            }), 400
        
        # Verificar si es el primer usuario
        repo = UsuariosRepository()
        usuarios = repo.get_all_usuarios()
        
        # Determinar rol
        roles_repo = RolesRepository()
        if len(usuarios) == 0:
            # Primer usuario: asignar rol admin
            admin_role = roles_repo.get_role_by_name('admin')
            role_id = admin_role.get('id') if admin_role else None
        else:
            # Usuarios subsecuentes: asignar rol conductor
            conductor_role = roles_repo.get_role_by_name('conductor')
            role_id = conductor_role.get('id') if conductor_role else None
        
        # Verificar si el usuario ya existe
        existing = repo.get_usuario_by_username(username)
        if existing:
            return jsonify({
                'success': False,
                'message': 'El usuario ya existe'
            }), 400
        
        # Verificar si el email ya existe
        if email:
            existing_email = repo.get_usuario_by_email(email)
            if existing_email:
                return jsonify({
                    'success': False,
                    'message': 'El email ya está registrado'
                }), 400
        
        # Crear usuario
        password_hash = hash_password(password)
        success = repo.create_usuario(
            username=username,
            email=email,
            password_hash=password_hash,
            full_name=full_name,
            role_id=role_id,
            active=True
        )
        
        if success:
            # Crear sesión (legacy) y generar token JWT
            session['username'] = username
            token = generate_token(username)
            
            # Obtener nombre del rol
            role_name = 'conductor'
            if role_id:
                role = roles_repo.get_by_id(role_id)
                if role:
                    role_name = role.get('role_name', 'conductor')
            
            return jsonify({
                'success': True,
                'message': 'Usuario registrado exitosamente',
                'token': token,
                'user': {
                    'username': username,
                    'email': email,
                    'full_name': full_name,
                    'role': role_name,
                    'role_id': role_id,
                    'carro_id': None,
                    'active': True
                }
            }), 201
        else:
            return jsonify({
                'success': False,
                'message': 'Error al crear el usuario'
            }), 500
    except Exception as e:
        print(f"Error en register: {e}")
        return jsonify({
            'success': False,
            'message': 'Error al registrar usuario'
        }), 500

@bp.route('/logout', methods=['POST'])
def logout_route():
    """Cerrar sesión"""
    session.clear()
    return jsonify({
        'success': True,
        'message': 'Sesión cerrada'
    })

@bp.route('/me', methods=['GET'])
def get_me():
    """Obtener usuario actual desde Firebase"""
    try:
        if not is_authenticated():
            return jsonify({
                'success': False,
                'message': 'No autenticado'
            }), 401
        
        username = get_current_user()
        repo = UsuariosRepository()
        usuario = repo.get_usuario_by_username(username)
        
        if not usuario:
            session.clear()
            return jsonify({
                'success': False,
                'message': 'Usuario no encontrado'
            }), 404
        
        # Obtener información del rol
        role_name = 'conductor'
        role_id = usuario.get('role_id')
        if role_id:
            roles_repo = RolesRepository()
            role = roles_repo.get_by_id(role_id)
            if role:
                role_name = role.get('role_name', 'conductor')
        
        # Preparar datos del usuario (sin password_hash)
        user_data = {
            'username': usuario.get('username'),
            'email': usuario.get('email', ''),
            'full_name': usuario.get('full_name', ''),
            'role': role_name,
            'role_id': role_id,
            'active': usuario.get('active', True)
        }
        
        return jsonify({
            'success': True,
            'user': user_data
        })
    except Exception as e:
        print(f"Error en get_me: {e}")
        return jsonify({
            'success': False,
            'message': 'Error al obtener usuario'
        }), 500
