"""
API de usuarios (Firebase) con jerarquía de roles
"""
import sys
from pathlib import Path
from flask import Blueprint, request, jsonify
from functools import wraps
import hashlib

ROOT_DIR = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))

try:
    from modules.auth import (
        is_authenticated, is_admin, is_super_admin,
        get_current_user, get_current_user_role,
        super_admin_required, admin_required,
    )
    from app.database.usuarios_repository import UsuariosRepository
    from app.database.roles_repository import RolesRepository, ADMIN_ROLES
except ImportError as e:
    print(f"Advertencia: Error al importar módulos en usuarios_firebase.py: {e}")

bp = Blueprint('usuarios_firebase', __name__)


def login_required_api(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not is_authenticated():
            return jsonify({'success': False, 'error': 'No autenticado'}), 401
        return f(*args, **kwargs)
    return decorated


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def _strip_sensitive(usuario: dict) -> dict:
    usuario.pop('password_hash', None)
    return usuario


@bp.route('', methods=['GET'])
@login_required_api
def get_usuarios():
    """Obtener todos los usuarios (admin ve todos, conductor solo se ve a sí mismo)."""
    try:
        role = get_current_user_role()
        repo = UsuariosRepository()

        if role in ADMIN_ROLES or role == 'admin':
            active_only = request.args.get('active_only', 'false').lower() == 'true'
            if active_only:
                usuarios = repo.get_active_usuarios()
            else:
                usuarios = repo.get_all_usuarios()
        else:
            username = get_current_user()
            usuario = repo.get_usuario_by_username(username)
            usuarios = [usuario] if usuario else []

        return jsonify({
            'success': True,
            'data': [_strip_sensitive(u) for u in usuarios]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('', methods=['POST'])
@login_required_api
def create_usuario():
    """Crear usuario. super_admin puede crear cualquier rol; empresarial solo conductores."""
    try:
        caller_role = get_current_user_role()
        if caller_role not in ADMIN_ROLES and caller_role != 'admin':
            return jsonify({'success': False, 'error': 'Se requiere rol de administrador'}), 403

        data = request.get_json()
        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '')
        full_name = data.get('full_name', '').strip()
        role_id = data.get('role_id')
        carro_id = data.get('carro_id')
        active = data.get('active', True)

        if not username:
            return jsonify({'success': False, 'error': 'El nombre de usuario es requerido'}), 400
        if not password:
            return jsonify({'success': False, 'error': 'La contraseña es requerida'}), 400

        # Validar jerarquía: solo super_admin puede crear empresariales / super_admin
        if role_id and role_id in ADMIN_ROLES:
            if caller_role != 'super_admin':
                return jsonify({
                    'success': False,
                    'error': 'Solo un super administrador puede crear usuarios empresariales'
                }), 403

        password_hash = hash_password(password)
        repo = UsuariosRepository()
        success = repo.create_usuario(
            username, email, password_hash, full_name, role_id, active, carro_id
        )

        if success:
            usuario = repo.get_usuario_by_username(username)
            return jsonify({
                'success': True,
                'message': 'Usuario creado exitosamente',
                'data': _strip_sensitive(usuario)
            }), 201
        else:
            return jsonify({'success': False, 'error': 'El usuario ya existe'}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/<username>', methods=['GET'])
@login_required_api
def get_usuario(username):
    try:
        repo = UsuariosRepository()
        usuario = repo.get_usuario_by_username(username)
        if usuario:
            return jsonify({'success': True, 'data': _strip_sensitive(usuario)})
        return jsonify({'success': False, 'error': 'Usuario no encontrado'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/<username>', methods=['PUT'])
@login_required_api
def update_usuario(username):
    """Actualizar usuario con validación de jerarquía."""
    try:
        caller_role = get_current_user_role()
        if caller_role not in ADMIN_ROLES and caller_role != 'admin':
            return jsonify({'success': False, 'error': 'Se requiere rol de administrador'}), 403

        data = request.get_json()
        repo = UsuariosRepository()

        target = repo.get_usuario_by_username(username)
        if not target:
            return jsonify({'success': False, 'error': 'Usuario no encontrado'}), 404

        # empresarial no puede editar a otro empresarial o super_admin
        target_role = target.get('role_id', '')
        if target_role in ADMIN_ROLES and caller_role != 'super_admin':
            return jsonify({
                'success': False,
                'error': 'Solo un super administrador puede editar usuarios empresariales'
            }), 403

        if 'password' in data:
            data['password_hash'] = hash_password(data.pop('password'))

        data.pop('username', None)
        data.pop('id', None)
        data.pop('created_at', None)

        success = repo.update_usuario(username, data)
        if success:
            usuario = repo.get_usuario_by_username(username)
            return jsonify({
                'success': True,
                'message': 'Usuario actualizado exitosamente',
                'data': _strip_sensitive(usuario)
            })
        return jsonify({'success': False, 'error': 'No se pudo actualizar el usuario'}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/<username>', methods=['DELETE'])
@login_required_api
def delete_usuario(username):
    """Soft delete con validación de jerarquía."""
    try:
        caller_role = get_current_user_role()
        if caller_role not in ADMIN_ROLES and caller_role != 'admin':
            return jsonify({'success': False, 'error': 'Se requiere rol de administrador'}), 403

        repo = UsuariosRepository()
        target = repo.get_usuario_by_username(username)
        if not target:
            return jsonify({'success': False, 'error': 'Usuario no encontrado'}), 404

        if target.get('role_id', '') in ADMIN_ROLES and caller_role != 'super_admin':
            return jsonify({
                'success': False,
                'error': 'Solo un super administrador puede eliminar usuarios empresariales'
            }), 403

        success = repo.delete_usuario(username)
        if success:
            return jsonify({'success': True, 'message': 'Usuario eliminado exitosamente'})
        return jsonify({'success': False, 'error': 'No se pudo eliminar el usuario'}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/<username>/role', methods=['PUT'])
@login_required_api
def assign_role(username):
    """Asignar un rol a un usuario."""
    try:
        caller_role = get_current_user_role()
        if caller_role not in ADMIN_ROLES and caller_role != 'admin':
            return jsonify({'success': False, 'error': 'Se requiere rol de administrador'}), 403

        data = request.get_json()
        role_id = data.get('role_id')
        if not role_id:
            return jsonify({'success': False, 'error': 'El role_id es requerido'}), 400

        if role_id in ADMIN_ROLES and caller_role != 'super_admin':
            return jsonify({
                'success': False,
                'error': 'Solo super_admin puede asignar roles administrativos'
            }), 403

        repo = UsuariosRepository()
        success = repo.assign_role(username, role_id)
        if success:
            usuario = repo.get_usuario_by_username(username)
            return jsonify({
                'success': True,
                'message': 'Rol asignado exitosamente',
                'data': _strip_sensitive(usuario)
            })
        return jsonify({'success': False, 'error': 'No se pudo asignar el rol'}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/<username>/carro', methods=['PUT'])
@login_required_api
def assign_carro(username):
    """Asociar un carro a un usuario conductor."""
    try:
        caller_role = get_current_user_role()
        if caller_role not in ADMIN_ROLES and caller_role != 'admin':
            return jsonify({'success': False, 'error': 'Se requiere rol de administrador'}), 403

        data = request.get_json()
        carro_id = data.get('carro_id')

        repo = UsuariosRepository()
        success = repo.assign_carro(username, carro_id)
        if success:
            usuario = repo.get_usuario_by_username(username)
            return jsonify({
                'success': True,
                'message': 'Carro asignado exitosamente',
                'data': _strip_sensitive(usuario)
            })
        return jsonify({'success': False, 'error': 'No se pudo asignar el carro'}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/by-role/<role_id>', methods=['GET'])
@login_required_api
def get_usuarios_by_role(role_id):
    try:
        repo = UsuariosRepository()
        usuarios = repo.get_usuarios_by_role(role_id)
        return jsonify({
            'success': True,
            'data': [_strip_sensitive(u) for u in usuarios]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/conductores-with-carros', methods=['GET'])
@login_required_api
def get_conductores_with_carros():
    """Devuelve todos los conductores con su carro asociado."""
    try:
        repo = UsuariosRepository()
        conductores = repo.get_conductores_with_carros()
        return jsonify({'success': True, 'data': conductores})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
