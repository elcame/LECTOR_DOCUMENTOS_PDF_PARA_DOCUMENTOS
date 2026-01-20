"""
API de usuarios y administración
"""
import sys
from pathlib import Path
from flask import Blueprint, request, jsonify
from functools import wraps

# Agregar ruta raíz al path
ROOT_DIR = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))

from modules.auth import (
    get_current_user, is_authenticated, is_admin,
    register_user
)
from modules.database import (
    get_all_users, get_user_role, update_user_role,
    get_user_placa_asignada, update_user_placa_asignada
)

bp = Blueprint('usuarios', __name__)

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
    @login_required_api
    def decorated_function(*args, **kwargs):
        if not is_admin():
            return jsonify({'success': False, 'error': 'No autorizado'}), 403
        return f(*args, **kwargs)
    return decorated_function

@bp.route('', methods=['GET'])
@admin_required_api
def get_usuarios():
    """API para obtener todos los usuarios (solo admins)"""
    try:
        usuarios = get_all_users()
        # Limpiar información sensible
        usuarios_limpios = []
        for usuario in usuarios:
            usuarios_limpios.append({
                'username': usuario.get('username', ''),
                'email': usuario.get('email', ''),
                'full_name': usuario.get('full_name', ''),
                'role': usuario.get('role', 'conductor'),
                'created_at': usuario.get('created_at', ''),
                'last_login': usuario.get('last_login', ''),
                'placa_asignada': usuario.get('placa_asignada', '')
            })
        
        return jsonify({'success': True, 'usuarios': usuarios_limpios})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('', methods=['POST'])
@admin_required_api
def create_usuario():
    """API para crear un nuevo usuario (solo admins)"""
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '')
        email = data.get('email', '').strip()
        full_name = data.get('full_name', '').strip()
        role = data.get('role', 'conductor').strip()
        
        # Validaciones
        if not username or not password:
            return jsonify({'success': False, 'error': 'Usuario y contraseña son requeridos'}), 400
        
        if role not in ['admin', 'conductor']:
            return jsonify({'success': False, 'error': 'Rol inválido. Debe ser "admin" o "conductor"'}), 400
        
        # Crear usuario
        resultado = register_user(username, password, email, full_name)
        
        if resultado['success']:
            # Asignar rol
            if update_user_role(username, role):
                return jsonify({'success': True, 'message': 'Usuario creado exitosamente'})
            else:
                return jsonify({'success': False, 'error': 'Usuario creado pero error al asignar rol'}), 500
        else:
            return jsonify({'success': False, 'error': resultado['message']}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/<username>/rol', methods=['PUT'])
@admin_required_api
def update_usuario_rol(username):
    """API para actualizar el rol de un usuario (solo admins)"""
    try:
        data = request.get_json()
        nuevo_rol = data.get('role', '').strip()
        
        if nuevo_rol not in ['admin', 'conductor']:
            return jsonify({'success': False, 'error': 'Rol inválido. Debe ser "admin" o "conductor"'}), 400
        
        if update_user_role(username, nuevo_rol):
            return jsonify({'success': True, 'message': f'Rol de {username} actualizado a {nuevo_rol}'})
        else:
            return jsonify({'success': False, 'error': 'Error al actualizar el rol'}), 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/conductores', methods=['GET'])
@admin_required_api
def get_conductores():
    """API para obtener lista de conductores"""
    try:
        usuarios = get_all_users()
        conductores = [
            {
                'username': u['username'],
                'full_name': u.get('full_name', ''),
                'email': u.get('email', ''),
                'placa_asignada': u.get('placa_asignada', ''),
                'role': u.get('role', 'conductor')
            }
            for u in usuarios
            if get_user_role(u['username']) == 'conductor'
        ]
        
        return jsonify({'success': True, 'conductores': conductores})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/asignar_placa', methods=['POST'])
@admin_required_api
def asignar_placa():
    """API para asignar una placa a un conductor"""
    try:
        data = request.get_json()
        conductor_username = data.get('conductor_username')
        placa = data.get('placa')
        
        if not conductor_username:
            return jsonify({'success': False, 'error': 'Nombre de conductor requerido'}), 400
        
        # Verificar que el usuario sea conductor
        if get_user_role(conductor_username) != 'conductor':
            return jsonify({'success': False, 'error': 'El usuario debe ser un conductor'}), 400
        
        success = update_user_placa_asignada(conductor_username, placa)
        
        if success:
            return jsonify({
                'success': True,
                'message': f'Placa {placa} asignada correctamente al conductor {conductor_username}'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Error al asignar la placa'
            }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/placas_disponibles', methods=['GET'])
@login_required_api
def get_placas_disponibles():
    """API para obtener placas disponibles"""
    try:
        # Aquí iría la lógica para obtener placas disponibles
        # Por ahora retornamos una lista vacía
        return jsonify({
            'success': True,
            'placas': []
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
