"""
API para Proveedores (productos y servicios)
"""
from flask import Blueprint, request, jsonify
from functools import wraps

from modules.auth import is_authenticated, get_current_user, get_current_user_role

bp = Blueprint('providers', __name__)


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


@bp.route('/providers', methods=['GET'])
@login_required_api
def list_providers():
    try:
        username = get_current_user()
        owner = _get_owner_username(username)
        from app.database.providers_repository import ProvidersRepository
        providers = ProvidersRepository().list_by_owner(owner)
        return jsonify({'success': True, 'data': providers})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/providers', methods=['POST'])
@login_required_api
def create_provider():
    try:
        username = get_current_user()
        owner = _get_owner_username(username)

        data = request.get_json() or {}
        name = (data.get('name') or '').strip()
        if not name:
            return jsonify({'success': False, 'error': 'Nombre requerido'}), 400
        phone = (data.get('phone') or '').strip()
        notes = (data.get('notes') or '').strip()

        from app.database.providers_repository import ProvidersRepository
        repo = ProvidersRepository()
        pid = repo.create_provider(owner, name=name, phone=phone, notes=notes)
        if not pid:
            return jsonify({'success': False, 'error': 'No se pudo crear'}), 500
        return jsonify({'success': True, 'data': {'id': pid}}), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/providers/<provider_id>/items', methods=['GET'])
@login_required_api
def list_provider_items(provider_id: str):
    try:
        username = get_current_user()
        owner = _get_owner_username(username)
        from app.database.provider_items_repository import ProviderItemsRepository
        items = ProviderItemsRepository().list_by_provider(owner, provider_id)
        return jsonify({'success': True, 'data': items})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/providers/<provider_id>/items', methods=['POST'])
@login_required_api
def create_provider_item(provider_id: str):
    try:
        username = get_current_user()
        owner = _get_owner_username(username)

        data = request.get_json() or {}
        item_type = (data.get('item_type') or '').strip().lower()
        if item_type not in ('product', 'service'):
            return jsonify({'success': False, 'error': 'item_type inválido'}), 400
        name = (data.get('name') or '').strip()
        if not name:
            return jsonify({'success': False, 'error': 'Nombre requerido'}), 400
        try:
            price = float(data.get('price') or 0)
        except Exception:
            price = 0.0

        from app.database.provider_items_repository import ProviderItemsRepository
        repo = ProviderItemsRepository()
        iid = repo.create_item(owner, provider_id, item_type=item_type, name=name, price=price)
        if not iid:
            return jsonify({'success': False, 'error': 'No se pudo crear'}), 500
        return jsonify({'success': True, 'data': {'id': iid}}), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

