"""
API de gastos, pagos y tarifas
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
    from modules.database import (
        save_gasto_viaje, get_gastos_viajes, update_gasto_viaje, delete_gasto_viaje
    )
    from modules.payment_manager import (
        guardar_gastos_adicionales, cargar_gastos_adicionales,
        guardar_tarifas_destino, cargar_tarifas_destino,
        obtener_destinos_unicos, leer_pagos_conductores,
        actualizar_multiple_pagos, obtener_resumen_pagos
    )
except ImportError as e:
    print(f"Advertencia: Error al importar módulos en gastos.py: {e}")

bp = Blueprint('gastos', __name__)

def login_required_api(f):
    """Decorador para APIs que requieren autenticación"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not is_authenticated():
            return jsonify({'success': False, 'error': 'No autenticado'}), 401
        return f(*args, **kwargs)
    return decorated_function

@bp.route('/viajes', methods=['GET'])
@login_required_api
def get_gastos_viajes():
    """API para obtener gastos de viajes"""
    try:
        username = get_current_user()
        gastos = get_gastos_viajes(username)
        
        return jsonify({
            'success': True,
            'gastos': gastos
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/viajes', methods=['POST'])
@login_required_api
def create_gasto_viaje():
    """API para crear un gasto de viaje"""
    try:
        username = get_current_user()
        data = request.get_json()
        
        numero_manifiesto = data.get('numero_manifiesto')
        concepto = data.get('concepto')
        valor = data.get('valor')
        fecha = data.get('fecha')
        placa = data.get('placa', '')
        
        if not all([numero_manifiesto, concepto, valor, fecha]):
            return jsonify({
                'success': False,
                'error': 'Datos incompletos'
            }), 400
        
        success = save_gasto_viaje(username, numero_manifiesto, concepto, valor, fecha, placa)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Gasto guardado correctamente'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Error al guardar el gasto'
            }), 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/viajes/<int:gasto_id>', methods=['PUT'])
@login_required_api
def update_gasto_viaje(gasto_id):
    """API para actualizar un gasto de viaje"""
    try:
        username = get_current_user()
        data = request.get_json()
        
        success = update_gasto_viaje(gasto_id, username, data)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Gasto actualizado correctamente'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Error al actualizar el gasto'
            }), 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/viajes/<int:gasto_id>', methods=['DELETE'])
@login_required_api
def delete_gasto_viaje(gasto_id):
    """API para eliminar un gasto de viaje"""
    try:
        username = get_current_user()
        success = delete_gasto_viaje(gasto_id, username)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Gasto eliminado correctamente'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Error al eliminar el gasto'
            }), 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/adicionales', methods=['GET'])
@login_required_api
def get_gastos_adicionales():
    """API para obtener gastos adicionales"""
    try:
        carpeta = request.args.get('carpeta')
        if not carpeta:
            return jsonify({
                'success': False,
                'error': 'Carpeta requerida'
            }), 400
        
        gastos = cargar_gastos_adicionales(carpeta)
        
        return jsonify({
            'success': True,
            'gastos': gastos
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/adicionales', methods=['POST'])
@login_required_api
def create_gasto_adicional():
    """API para crear un gasto adicional"""
    try:
        data = request.get_json()
        carpeta = data.get('carpeta')
        gastos = data.get('gastos', [])
        
        if not carpeta:
            return jsonify({
                'success': False,
                'error': 'Carpeta requerida'
            }), 400
        
        guardar_gastos_adicionales(carpeta, gastos)
        
        return jsonify({
            'success': True,
            'message': 'Gastos adicionales guardados correctamente'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/destinos-tarifas', methods=['GET'])
@login_required_api
def get_destinos_tarifas():
    """API para obtener tarifas por destino"""
    try:
        carpeta = request.args.get('carpeta')
        if not carpeta:
            return jsonify({
                'success': False,
                'error': 'Carpeta requerida'
            }), 400
        
        tarifas = cargar_tarifas_destino(carpeta)
        destinos = obtener_destinos_unicos()
        
        return jsonify({
            'success': True,
            'tarifas': tarifas,
            'destinos': destinos
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/destinos-tarifas', methods=['POST'])
@login_required_api
def create_destino_tarifa():
    """API para crear/actualizar tarifas por destino"""
    try:
        data = request.get_json()
        carpeta = data.get('carpeta')
        tarifas = data.get('tarifas', {})
        
        if not carpeta:
            return jsonify({
                'success': False,
                'error': 'Carpeta requerida'
            }), 400
        
        guardar_tarifas_destino(carpeta, tarifas)
        
        return jsonify({
            'success': True,
            'message': 'Tarifas guardadas correctamente'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/resumen-pagos', methods=['GET'])
@login_required_api
def get_resumen_pagos():
    """API para obtener resumen de pagos"""
    try:
        carpeta = request.args.get('carpeta')
        if not carpeta:
            return jsonify({
                'success': False,
                'error': 'Carpeta requerida'
            }), 400
        
        resumen = obtener_resumen_pagos(carpeta)
        
        return jsonify({
            'success': True,
            'resumen': resumen
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/pagos-conductor/<conductor>', methods=['GET'])
@login_required_api
def get_pagos_conductor(conductor):
    """API para obtener pagos de un conductor"""
    try:
        carpeta = request.args.get('carpeta')
        if not carpeta:
            return jsonify({
                'success': False,
                'error': 'Carpeta requerida'
            }), 400
        
        pagos = leer_pagos_conductores(carpeta, conductor)
        
        return jsonify({
            'success': True,
            'pagos': pagos
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/pagos-actualizar', methods=['POST'])
@login_required_api
def update_pagos():
    """API para actualizar múltiples pagos"""
    try:
        data = request.get_json()
        load_ids = data.get('load_ids', [])
        estado_pago = data.get('estado_pago')
        fecha_pago = data.get('fecha_pago')
        carpeta = data.get('carpeta')
        tipo_pago = data.get('tipo_pago', 'efectivo')
        
        if not all([load_ids, estado_pago, carpeta]):
            return jsonify({
                'success': False,
                'error': 'Datos incompletos'
            }), 400
        
        success = actualizar_multiple_pagos(load_ids, estado_pago, fecha_pago, carpeta, tipo_pago)
        
        if success:
            return jsonify({
                'success': True,
                'message': f'Se actualizaron {len(load_ids)} pagos correctamente'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Error al actualizar pagos'
            }), 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
