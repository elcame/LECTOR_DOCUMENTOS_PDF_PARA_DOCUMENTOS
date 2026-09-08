"""API de piezas instaladas en un carro."""
from flask import Blueprint, request, jsonify
from .carros import login_required_api
from modules.auth import get_current_user  # type: ignore

bp = Blueprint('carro_piezas', __name__)


def _parse_km(value):
    if value is None or value == '':
        return ''
    try:
        return int(value)
    except (TypeError, ValueError):
        try:
            return float(value)
        except (TypeError, ValueError):
            return None


@bp.route('/carros/<car_id>/piezas', methods=['GET'])
@login_required_api
def list_piezas(car_id):
    try:
        username = get_current_user()
        from app.database.carros_repository import CarrosRepository
        from app.database.carro_piezas_repository import CarroPiezasRepository
        from app.database.carro_piezas_catalog import catalog_list, POSITIONS

        carro = CarrosRepository().get_by_id(car_id)
        if not carro or carro.get('username') != username:
            return jsonify({'success': False, 'error': 'Carro no encontrado'}), 404

        repo = CarroPiezasRepository()
        history = request.args.get('history', 'false').lower() == 'true'
        position_id = (request.args.get('position_id') or '').strip()

        if history:
            if position_id not in POSITIONS:
                return jsonify({'success': False, 'error': 'Posición no válida'}), 400
            data = repo.list_history(username, car_id, position_id)
            return jsonify({'success': True, 'data': data})

        activas = repo.list_by_carro(username, car_id, active_only=True)
        return jsonify({
            'success': True,
            'data': {
                'catalog': catalog_list(),
                'activas': activas,
            },
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/carros/<car_id>/piezas', methods=['POST'])
@login_required_api
def create_pieza(car_id):
    try:
        username = get_current_user()
        body = request.get_json() or {}
        position_id = (body.get('position_id') or '').strip()
        installed_at = (body.get('installed_at') or '').strip()
        km_installed = _parse_km(body.get('km_installed'))
        marca = (body.get('marca') or '').strip()
        numeracion = (body.get('numeracion') or '').strip()
        if km_installed is None:
            return jsonify({'success': False, 'error': 'Kilometraje no válido'}), 400
        if not installed_at:
            return jsonify({'success': False, 'error': 'La fecha de instalación es requerida'}), 400

        from app.database.carros_repository import CarrosRepository
        from app.database.carro_piezas_repository import CarroPiezasRepository
        from app.database.carro_piezas_catalog import POSITIONS

        if position_id not in POSITIONS:
            return jsonify({'success': False, 'error': 'Posición no válida'}), 400
        carro = CarrosRepository().get_by_id(car_id)
        if not carro or carro.get('username') != username:
            return jsonify({'success': False, 'error': 'Carro no encontrado'}), 404

        repo = CarroPiezasRepository()
        if repo.get_active(username, car_id, position_id):
            return jsonify({'success': False, 'error': 'Ya hay una pieza activa. Usa registrar cambio.'}), 400

        doc_id = repo.place_pieza(username, car_id, position_id, installed_at, km_installed, marca, numeracion)
        if not doc_id:
            return jsonify({'success': False, 'error': 'No se pudo colocar la pieza'}), 500
        return jsonify({'success': True, 'data': repo.get_by_id(doc_id)}), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/carros/<car_id>/piezas/cambio', methods=['POST'])
@login_required_api
def cambiar_pieza(car_id):
    try:
        username = get_current_user()
        body = request.get_json() or {}
        position_id = (body.get('position_id') or '').strip()
        installed_at = (body.get('installed_at') or '').strip()
        km_installed = _parse_km(body.get('km_installed'))
        km_removed = _parse_km(body.get('km_removed'))
        marca = (body.get('marca') or '').strip()
        numeracion = (body.get('numeracion') or '').strip()
        if km_installed is None or km_removed is None:
            return jsonify({'success': False, 'error': 'Kilometraje no válido'}), 400
        if not installed_at:
            return jsonify({'success': False, 'error': 'La fecha de instalación es requerida'}), 400

        from app.database.carros_repository import CarrosRepository
        from app.database.carro_piezas_repository import CarroPiezasRepository
        from app.database.carro_piezas_catalog import POSITIONS

        if position_id not in POSITIONS:
            return jsonify({'success': False, 'error': 'Posición no válida'}), 400
        carro = CarrosRepository().get_by_id(car_id)
        if not carro or carro.get('username') != username:
            return jsonify({'success': False, 'error': 'Carro no encontrado'}), 404

        repo = CarroPiezasRepository()
        current = repo.get_active(username, car_id, position_id)
        if not current:
            return jsonify({'success': False, 'error': 'No hay pieza activa. Coloca la primera.'}), 400

        repo.close_pieza(current['id'], installed_at, km_removed)
        doc_id = repo.place_pieza(username, car_id, position_id, installed_at, km_installed, marca, numeracion)
        return jsonify({'success': True, 'data': repo.get_by_id(doc_id)})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
