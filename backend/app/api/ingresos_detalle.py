"""
API para ingresos detallados por conductor y carro
"""
from flask import Blueprint, request, jsonify
from .manifiestos_utils import login_required_api, get_current_user

bp = Blueprint('ingresos_detalle', __name__)

@bp.route('/conductor', methods=['GET'])
@login_required_api
def get_ingresos_by_conductor():
    """Obtiene ingresos detallados por conductor con fechas específicas"""
    try:
        from app.database.manifiestos_repository import ManifiestosRepository
        repo = ManifiestosRepository()
        
        username = get_current_user()
        period = request.args.get('period', 'daily')
        days = int(request.args.get('days', 30))
        
        print(f"DEBUG: Solicitando ingresos por conductor para {username}, period={period}, days={days}")
        
        ingresos = repo.get_ingresos_by_conductor(username, period, days)
        
        return jsonify({
            'success': True,
            'data': ingresos,
            'count': len(ingresos)
        })
    except ImportError:
        return jsonify({'success': False, 'error': 'Firebase no está disponible'}), 503
    except Exception as e:
        print(f"Error en get_ingresos_by_conductor: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/carro', methods=['GET'])
@login_required_api
def get_ingresos_by_carro():
    """Obtiene ingresos detallados por carro (placa) con fechas específicas"""
    try:
        from app.database.manifiestos_repository import ManifiestosRepository
        repo = ManifiestosRepository()
        
        username = get_current_user()
        period = request.args.get('period', 'daily')
        days = int(request.args.get('days', 30))
        
        print(f"DEBUG: Solicitando ingresos por carro para {username}, period={period}, days={days}")
        
        ingresos = repo.get_ingresos_by_carro(username, period, days)
        
        return jsonify({
            'success': True,
            'data': ingresos,
            'count': len(ingresos)
        })
    except ImportError:
        return jsonify({'success': False, 'error': 'Firebase no está disponible'}), 503
    except Exception as e:
        print(f"Error en get_ingresos_by_carro: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
