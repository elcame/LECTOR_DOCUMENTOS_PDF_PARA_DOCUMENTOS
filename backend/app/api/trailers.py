"""
API para administración de trailers (placas, mantenimientos, ingresos, repuestos, historial y resumen).
"""
from flask import Blueprint, request, jsonify
from functools import wraps
from datetime import date

from modules.auth import is_authenticated, get_current_user, get_current_user_role

bp = Blueprint('trailers', __name__)


def login_required_api(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not is_authenticated():
            return jsonify({'success': False, 'error': 'No autenticado'}), 401
        return f(*args, **kwargs)
    return decorated


def _get_owner_username(username: str) -> str:
    """Para conductor: owner es parent_username; para otros: él mismo."""
    try:
        if get_current_user_role() != 'conductor':
            return username
        from app.database.usuarios_repository import UsuariosRepository
        u = UsuariosRepository().get_usuario_by_username(username) or {}
        return (u.get('parent_username') or username)
    except Exception:
        return username


def _plate_norm(value: str) -> str:
    return (value or '').strip().upper()


@bp.route('/trailers', methods=['GET'])
@login_required_api
def list_trailers():
    try:
        username = get_current_user()
        owner = _get_owner_username(username)
        from app.database.trailers_repository import TrailersRepository
        trailers = TrailersRepository().get_by_owner(owner)
        return jsonify({'success': True, 'data': trailers})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/trailers', methods=['POST'])
@login_required_api
def create_trailer():
    try:
        username = get_current_user()
        owner = _get_owner_username(username)
        data = request.get_json() or {}
        plate = _plate_norm(data.get('plate'))
        if not plate:
            return jsonify({'success': False, 'error': 'Placa requerida'}), 400

        from app.database.trailers_repository import TrailersRepository
        repo = TrailersRepository()
        existing = repo.get_by_plate(owner, plate)
        if existing:
            return jsonify({'success': False, 'error': 'Ya existe un trailer con esa placa'}), 409

        trailer_id = repo.create_trailer(owner, plate)
        if not trailer_id:
            return jsonify({'success': False, 'error': 'No se pudo crear el trailer'}), 500
        return jsonify({'success': True, 'data': {'id': trailer_id}}), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/trailers/<trailer_id>', methods=['PUT'])
@login_required_api
def update_trailer(trailer_id: str):
    try:
        username = get_current_user()
        owner = _get_owner_username(username)
        from app.database.trailers_repository import TrailersRepository
        repo = TrailersRepository()
        t = repo.get_by_id(trailer_id)
        if not t or t.get('owner_username') != owner or t.get('active') is False:
            return jsonify({'success': False, 'error': 'Trailer no encontrado'}), 404

        data = request.get_json() or {}
        updates = {}
        if 'plate' in data:
            updates['plate'] = _plate_norm(data.get('plate'))
        ok = repo.update_trailer(trailer_id, updates)
        return jsonify({'success': True, 'data': {'updated': ok}})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/trailers/<trailer_id>', methods=['DELETE'])
@login_required_api
def delete_trailer(trailer_id: str):
    try:
        username = get_current_user()
        owner = _get_owner_username(username)
        from app.database.trailers_repository import TrailersRepository
        repo = TrailersRepository()
        t = repo.get_by_id(trailer_id)
        if not t or t.get('owner_username') != owner or t.get('active') is False:
            return jsonify({'success': False, 'error': 'Trailer no encontrado'}), 404
        ok = repo.delete_trailer(trailer_id)
        return jsonify({'success': True, 'data': {'deleted': ok}})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/trailers/<trailer_id>/events', methods=['GET'])
@login_required_api
def list_events(trailer_id: str):
    try:
        username = get_current_user()
        owner = _get_owner_username(username)
        event_type = (request.args.get('type') or '').strip() or None

        from app.database.trailers_repository import TrailersRepository
        t = TrailersRepository().get_by_id(trailer_id)
        if not t or t.get('owner_username') != owner or t.get('active') is False:
            return jsonify({'success': False, 'error': 'Trailer no encontrado'}), 404

        from app.database.trailer_events_repository import TrailerEventsRepository
        events = TrailerEventsRepository().list_by_trailer(owner, trailer_id, event_type=event_type)
        return jsonify({'success': True, 'data': events})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/trailers/<trailer_id>/events', methods=['POST'])
@login_required_api
def create_event(trailer_id: str):
    try:
        username = get_current_user()
        owner = _get_owner_username(username)
        data = request.get_json() or {}
        event_type = (data.get('event_type') or '').strip()
        if event_type not in ('maintenance', 'income', 'part'):
            return jsonify({'success': False, 'error': 'event_type inválido'}), 400

        from app.database.trailers_repository import TrailersRepository
        t = TrailersRepository().get_by_id(trailer_id)
        if not t or t.get('owner_username') != owner or t.get('active') is False:
            return jsonify({'success': False, 'error': 'Trailer no encontrado'}), 404

        payload = {
            'date': data.get('date'),
            'amount': data.get('amount'),
            'title': data.get('title'),
            'note': data.get('note'),
            'meta': data.get('meta') or {},
        }

        from app.database.trailer_events_repository import TrailerEventsRepository
        repo = TrailerEventsRepository()
        event_id = repo.create_event(owner, trailer_id, event_type, payload)
        if not event_id:
            return jsonify({'success': False, 'error': 'No se pudo crear el evento'}), 500
        return jsonify({'success': True, 'data': {'id': event_id}}), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/trailers/<trailer_id>/summary', methods=['GET'])
@login_required_api
def trailer_summary(trailer_id: str):
    try:
        username = get_current_user()
        owner = _get_owner_username(username)

        from app.database.trailers_repository import TrailersRepository
        t = TrailersRepository().get_by_id(trailer_id)
        if not t or t.get('owner_username') != owner or t.get('active') is False:
            return jsonify({'success': False, 'error': 'Trailer no encontrado'}), 404

        from app.database.trailer_events_repository import TrailerEventsRepository
        repo = TrailerEventsRepository()
        totals = repo.totals_by_type(owner, trailer_id)
        net = float(totals.get('income', 0.0)) - float(totals.get('expense', 0.0))
        return jsonify({
            'success': True,
            'data': {
                'income': float(totals.get('income', 0.0)),
                'expense': float(totals.get('expense', 0.0)),
                'net': net,
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/trailers/<trailer_id>/tires', methods=['GET'])
@login_required_api
def list_tires(trailer_id: str):
    try:
        username = get_current_user()
        owner = _get_owner_username(username)

        from app.database.trailers_repository import TrailersRepository
        t = TrailersRepository().get_by_id(trailer_id)
        if not t or t.get('owner_username') != owner or t.get('active') is False:
            return jsonify({'success': False, 'error': 'Trailer no encontrado'}), 404

        from app.database.trailer_tires_repository import TrailerTiresRepository
        tires = TrailerTiresRepository().list_by_trailer(owner, trailer_id)
        return jsonify({'success': True, 'data': tires})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/trailers/<trailer_id>/tires/<position_id>', methods=['PUT'])
@login_required_api
def upsert_tire(trailer_id: str, position_id: str):
    try:
        username = get_current_user()
        owner = _get_owner_username(username)

        from app.database.trailers_repository import TrailersRepository
        t = TrailersRepository().get_by_id(trailer_id)
        if not t or t.get('owner_username') != owner or t.get('active') is False:
            return jsonify({'success': False, 'error': 'Trailer no encontrado'}), 404

        pos = (position_id or '').strip().upper()
        if not pos:
            return jsonify({'success': False, 'error': 'position_id requerido'}), 400

        data = request.get_json() or {}
        incoming_tire_id = data.get('tire_id')

        installed_at = data.get('installed_at')
        # Si se asigna una llanta y no se envía fecha, usar hoy
        if incoming_tire_id and (installed_at is None or str(installed_at).strip() == ''):
            installed_at = date.today().isoformat()

        payload = {
            'installed_at': installed_at,
            'tire_id': incoming_tire_id if incoming_tire_id else None,
            'meta': data.get('meta') or {},
        }

        from app.database.trailer_tires_repository import TrailerTiresRepository
        repo = TrailerTiresRepository()

        # Si se está moviendo una llanta ya instalada, liberarla de la posición anterior
        if incoming_tire_id:
            prev = repo.get_by_tire_id(owner, trailer_id, incoming_tire_id)
            if prev and prev.get('position_id') != pos:
                repo.upsert_position(owner, trailer_id, prev.get('position_id'), {
                    'tire_id': None,
                    'installed_at': prev.get('installed_at') or None,
                    'meta': prev.get('meta') or {},
                })

        doc_id = repo.upsert_position(owner, trailer_id, pos, payload)
        return jsonify({'success': True, 'data': {'id': doc_id}})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/trailers/<trailer_id>/tire-items', methods=['GET'])
@login_required_api
def list_tire_items(trailer_id: str):
    try:
        username = get_current_user()
        owner = _get_owner_username(username)

        from app.database.trailers_repository import TrailersRepository
        t = TrailersRepository().get_by_id(trailer_id)
        if not t or t.get('owner_username') != owner or t.get('active') is False:
            return jsonify({'success': False, 'error': 'Trailer no encontrado'}), 404

        from app.database.trailer_tire_items_repository import TrailerTireItemsRepository
        items = TrailerTireItemsRepository().list_by_trailer(owner, trailer_id)
        return jsonify({'success': True, 'data': items})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/trailers/<trailer_id>/tire-items', methods=['POST'])
@login_required_api
def create_tire_item(trailer_id: str):
    try:
        username = get_current_user()
        owner = _get_owner_username(username)

        from app.database.trailers_repository import TrailersRepository
        t = TrailersRepository().get_by_id(trailer_id)
        if not t or t.get('owner_username') != owner or t.get('active') is False:
            return jsonify({'success': False, 'error': 'Trailer no encontrado'}), 404

        data = request.get_json() or {}
        label = (data.get('label') or '').strip()

        from app.database.trailer_tire_items_repository import TrailerTireItemsRepository
        repo = TrailerTireItemsRepository()
        item_id = repo.create_item(owner, trailer_id, label=label)
        if not item_id:
            return jsonify({'success': False, 'error': 'No se pudo crear la llanta'}), 500

        return jsonify({'success': True, 'data': {'id': item_id}}), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

