"""
API de autenticación (Firebase)
"""
import sys
from pathlib import Path
from flask import Blueprint, request, jsonify, session
from functools import wraps
import hashlib

# Agregar ruta raíz al path
ROOT_DIR = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))

try:
    from app.database.usuarios_repository import UsuariosRepository
    from app.database.roles_repository import RolesRepository
except ImportError as e:
    print(f"Advertencia: Error al importar módulos en auth.py: {e}")

bp = Blueprint('auth', __name__)

def hash_password(password: str) -> str:
    """Hashea una contraseña"""
    return hashlib.sha256(password.encode()).hexdigest()

def is_authenticated() -> bool:
    """Verifica si el usuario está autenticado"""
    return 'username' in session and session.get('username') is not None

def get_current_user():
    """Obtiene el usuario actual de la sesión"""
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
        
        # Crear sesión
        session['username'] = username
        
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
            'message': 'Login exitoso',
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
            # Crear sesión
            session['username'] = username
            
            # Obtener nombre del rol
            role_name = 'conductor'
            if role_id:
                role = roles_repo.get_by_id(role_id)
                if role:
                    role_name = role.get('role_name', 'conductor')
            
            return jsonify({
                'success': True,
                'message': 'Usuario registrado exitosamente',
                'user': {
                    'username': username,
                    'email': email,
                    'full_name': full_name,
                    'role': role_name,
                    'role_id': role_id,
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
