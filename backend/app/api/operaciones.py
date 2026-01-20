"""
API de operaciones y análisis
"""
import sys
from pathlib import Path
from flask import Blueprint, request, jsonify
from functools import wraps

# Agregar ruta raíz al path
ROOT_DIR = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))

try:
    from modules.auth import is_authenticated
    from modules.analytics import build_operaciones_payload
except ImportError:
    # Fallback si los módulos no están disponibles
    def is_authenticated():
        return True
    def build_operaciones_payload(*args, **kwargs):
        return {}

bp = Blueprint('operaciones', __name__)

def login_required_api(f):
    """Decorador para APIs que requieren autenticación"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not is_authenticated():
            return jsonify({'success': False, 'error': 'No autenticado'}), 401
        return f(*args, **kwargs)
    return decorated_function

@bp.route('', methods=['GET'])
@login_required_api
def get_operaciones():
    """API endpoint para operaciones de manifiestos"""
    try:
        # Obtener parámetros de la consulta
        query = request.args.get('q', '').strip()
        debug = request.args.get('debug', 'false').lower() == 'true'
        include_all_data = request.args.get('all_data', 'false').lower() == 'true'
        
        # Construir payload usando el módulo de analytics
        payload = build_operaciones_payload(
            query=query if query else None,
            debug=debug,
            include_all_data=include_all_data
        )
        
        return jsonify({
            'success': True,
            'data': payload
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/<mes>', methods=['GET'])
@login_required_api
def get_operaciones_mes(mes):
    """API endpoint para obtener datos de operaciones de un mes específico"""
    try:
        # Construir payload para el mes específico
        payload = build_operaciones_payload(
            query=None,
            debug=False,
            include_all_data=True
        )
        
        # Filtrar por mes si es necesario
        # Aquí iría la lógica específica para filtrar por mes
        
        return jsonify({
            'success': True,
            'data': payload,
            'mes': mes
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/manifiestos_disponibles', methods=['GET'])
@login_required_api
def get_manifiestos_disponibles():
    """API para obtener manifiestos disponibles"""
    try:
        # Aquí iría la lógica para obtener manifiestos disponibles
        # Por ahora retornamos una lista vacía
        return jsonify({
            'success': True,
            'manifiestos': []
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
