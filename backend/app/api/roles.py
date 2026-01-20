"""
API de roles
"""
import sys
from pathlib import Path
from flask import Blueprint, request, jsonify
from functools import wraps

# Agregar ruta raíz al path
ROOT_DIR = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))

try:
    from modules.auth import is_authenticated, is_admin, get_current_user
    from app.database.roles_repository import RolesRepository
except ImportError as e:
    print(f"Advertencia: Error al importar módulos en roles.py: {e}")

bp = Blueprint('roles', __name__)

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

@bp.route('', methods=['GET'])
@login_required_api
def get_roles():
    """Obtener todos los roles"""
    try:
        repo = RolesRepository()
        active_only = request.args.get('active_only', 'false').lower() == 'true'
        
        if active_only:
            roles = repo.get_active_roles()
        else:
            roles = repo.get_all_roles()
        
        return jsonify({
            'success': True,
            'data': roles
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('', methods=['POST'])
@admin_required_api
def create_role():
    """Crear un nuevo rol"""
    try:
        data = request.get_json()
        role_name = data.get('role_name', '').strip()
        description = data.get('description', '').strip()
        permissions = data.get('permissions', [])
        
        if not role_name:
            return jsonify({
                'success': False,
                'error': 'El nombre del rol es requerido'
            }), 400
        
        repo = RolesRepository()
        success = repo.create_role(role_name, description, permissions)
        
        if success:
            role = repo.get_role_by_name(role_name)
            return jsonify({
                'success': True,
                'message': 'Rol creado exitosamente',
                'data': role
            }), 201
        else:
            return jsonify({
                'success': False,
                'error': 'El rol ya existe'
            }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/<role_name>', methods=['GET'])
@login_required_api
def get_role(role_name):
    """Obtener un rol por nombre"""
    try:
        repo = RolesRepository()
        role = repo.get_role_by_name(role_name)
        
        if role:
            return jsonify({
                'success': True,
                'data': role
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Rol no encontrado'
            }), 404
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/<role_name>', methods=['PUT'])
@admin_required_api
def update_role(role_name):
    """Actualizar un rol"""
    try:
        data = request.get_json()
        repo = RolesRepository()
        
        # Remover campos que no se pueden actualizar directamente
        data.pop('role_name', None)
        data.pop('id', None)
        
        success = repo.update_role(role_name, data)
        
        if success:
            role = repo.get_role_by_name(role_name)
            return jsonify({
                'success': True,
                'message': 'Rol actualizado exitosamente',
                'data': role
            })
        else:
            return jsonify({
                'success': False,
                'error': 'No se pudo actualizar el rol'
            }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/<role_name>', methods=['DELETE'])
@admin_required_api
def delete_role(role_name):
    """Eliminar un rol (soft delete)"""
    try:
        repo = RolesRepository()
        success = repo.delete_role(role_name)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Rol eliminado exitosamente'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'No se pudo eliminar el rol'
            }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/<role_name>/permissions', methods=['POST'])
@admin_required_api
def add_permission(role_name):
    """Agregar un permiso a un rol"""
    try:
        data = request.get_json()
        permission = data.get('permission', '').strip()
        
        if not permission:
            return jsonify({
                'success': False,
                'error': 'El permiso es requerido'
            }), 400
        
        repo = RolesRepository()
        success = repo.add_permission_to_role(role_name, permission)
        
        if success:
            role = repo.get_role_by_name(role_name)
            return jsonify({
                'success': True,
                'message': 'Permiso agregado exitosamente',
                'data': role
            })
        else:
            return jsonify({
                'success': False,
                'error': 'No se pudo agregar el permiso'
            }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/<role_name>/permissions', methods=['DELETE'])
@admin_required_api
def remove_permission(role_name):
    """Eliminar un permiso de un rol"""
    try:
        data = request.get_json()
        permission = data.get('permission', '').strip()
        
        if not permission:
            return jsonify({
                'success': False,
                'error': 'El permiso es requerido'
            }), 400
        
        repo = RolesRepository()
        success = repo.remove_permission_from_role(role_name, permission)
        
        if success:
            role = repo.get_role_by_name(role_name)
            return jsonify({
                'success': True,
                'message': 'Permiso eliminado exitosamente',
                'data': role
            })
        else:
            return jsonify({
                'success': False,
                'error': 'No se pudo eliminar el permiso'
            }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
