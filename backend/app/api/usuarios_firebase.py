"""
API de usuarios (Firebase)
"""
import sys
from pathlib import Path
from flask import Blueprint, request, jsonify
from functools import wraps
import hashlib

# Agregar ruta raíz al path
ROOT_DIR = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))

try:
    from modules.auth import is_authenticated, is_admin, get_current_user
    from app.database.usuarios_repository import UsuariosRepository
except ImportError as e:
    print(f"Advertencia: Error al importar módulos en usuarios_firebase.py: {e}")

bp = Blueprint('usuarios_firebase', __name__)

def login_required_api(f):
    """Decorador para APIs que requieren autenticación"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not is_authenticated():
            return jsonify({'success': False, 'error': 'No autenticado'}), 401
        return f(*args, **kwargs)
    return decorated_function

def admin_required_api(f):
    """Decorador para APIs que requieren rol de administrador"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not is_authenticated():
            return jsonify({'success': False, 'error': 'No autenticado'}), 401
        if not is_admin():
            return jsonify({'success': False, 'error': 'Se requiere rol de administrador'}), 403
        return f(*args, **kwargs)
    return decorated_function

def hash_password(password: str) -> str:
    """Hashea una contraseña"""
    return hashlib.sha256(password.encode()).hexdigest()

@bp.route('', methods=['GET'])
@login_required_api
def get_usuarios():
    """Obtener todos los usuarios"""
    try:
        repo = UsuariosRepository()
        active_only = request.args.get('active_only', 'false').lower() == 'true'
        
        if active_only:
            usuarios = repo.get_active_usuarios()
        else:
            usuarios = repo.get_all_usuarios()
        
        # No retornar password_hash por seguridad
        for usuario in usuarios:
            usuario.pop('password_hash', None)
        
        return jsonify({
            'success': True,
            'data': usuarios
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('', methods=['POST'])
@admin_required_api
def create_usuario():
    """Crear un nuevo usuario"""
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '')
        full_name = data.get('full_name', '').strip()
        role_id = data.get('role_id')
        active = data.get('active', True)
        
        if not username:
            return jsonify({
                'success': False,
                'error': 'El nombre de usuario es requerido'
            }), 400
        
        if not email:
            return jsonify({
                'success': False,
                'error': 'El email es requerido'
            }), 400
        
        if not password:
            return jsonify({
                'success': False,
                'error': 'La contraseña es requerida'
            }), 400
        
        password_hash = hash_password(password)
        repo = UsuariosRepository()
        success = repo.create_usuario(username, email, password_hash, full_name, role_id, active)
        
        if success:
            usuario = repo.get_usuario_by_username(username)
            usuario.pop('password_hash', None)
            return jsonify({
                'success': True,
                'message': 'Usuario creado exitosamente',
                'data': usuario
            }), 201
        else:
            return jsonify({
                'success': False,
                'error': 'El usuario ya existe'
            }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/<username>', methods=['GET'])
@login_required_api
def get_usuario(username):
    """Obtener un usuario por nombre de usuario"""
    try:
        repo = UsuariosRepository()
        usuario = repo.get_usuario_by_username(username)
        
        if usuario:
            usuario.pop('password_hash', None)
            return jsonify({
                'success': True,
                'data': usuario
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Usuario no encontrado'
            }), 404
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/<username>', methods=['PUT'])
@admin_required_api
def update_usuario(username):
    """Actualizar un usuario"""
    try:
        data = request.get_json()
        repo = UsuariosRepository()
        
        # Si se proporciona una nueva contraseña, hashearla
        if 'password' in data:
            data['password_hash'] = hash_password(data.pop('password'))
        
        # Remover campos que no se pueden actualizar directamente
        data.pop('username', None)
        data.pop('id', None)
        data.pop('created_at', None)
        
        success = repo.update_usuario(username, data)
        
        if success:
            usuario = repo.get_usuario_by_username(username)
            usuario.pop('password_hash', None)
            return jsonify({
                'success': True,
                'message': 'Usuario actualizado exitosamente',
                'data': usuario
            })
        else:
            return jsonify({
                'success': False,
                'error': 'No se pudo actualizar el usuario'
            }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/<username>', methods=['DELETE'])
@admin_required_api
def delete_usuario(username):
    """Eliminar un usuario (soft delete)"""
    try:
        repo = UsuariosRepository()
        success = repo.delete_usuario(username)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Usuario eliminado exitosamente'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'No se pudo eliminar el usuario'
            }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/<username>/role', methods=['PUT'])
@admin_required_api
def assign_role(username):
    """Asignar un rol a un usuario"""
    try:
        data = request.get_json()
        role_id = data.get('role_id')
        
        if not role_id:
            return jsonify({
                'success': False,
                'error': 'El role_id es requerido'
            }), 400
        
        repo = UsuariosRepository()
        success = repo.assign_role(username, role_id)
        
        if success:
            usuario = repo.get_usuario_by_username(username)
            usuario.pop('password_hash', None)
            return jsonify({
                'success': True,
                'message': 'Rol asignado exitosamente',
                'data': usuario
            })
        else:
            return jsonify({
                'success': False,
                'error': 'No se pudo asignar el rol'
            }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/by-role/<role_id>', methods=['GET'])
@login_required_api
def get_usuarios_by_role(role_id):
    """Obtener usuarios por rol"""
    try:
        repo = UsuariosRepository()
        usuarios = repo.get_usuarios_by_role(role_id)
        
        # No retornar password_hash por seguridad
        for usuario in usuarios:
            usuario.pop('password_hash', None)
        
        return jsonify({
            'success': True,
            'data': usuarios
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
