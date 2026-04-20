"""
API para hojas de gasto reutilizables (plantillas) y aplicación a manifiestos
"""
from flask import Blueprint, request, jsonify
from functools import wraps

from modules.auth import is_authenticated, get_current_user, get_current_user_role

bp = Blueprint('expense_sheets', __name__)


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


@bp.route('', methods=['GET'])
@login_required_api
def list_sheets():
    try:
        username = get_current_user()
        owner = _get_owner_username(username)

        from app.database.expense_sheets_repository import ExpenseSheetsRepository
        repo = ExpenseSheetsRepository()
        sheets = repo.get_by_owner(owner)

        return jsonify({'success': True, 'data': sheets})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('', methods=['POST'])
@login_required_api
def create_sheet():
    try:
        username = get_current_user()
        owner = _get_owner_username(username)

        data = request.get_json() or {}
        name = (data.get('name') or '').strip()
        items = data.get('items') or []

        if not name:
            return jsonify({'success': False, 'error': 'Nombre requerido'}), 400
        if not isinstance(items, list) or len(items) == 0:
            return jsonify({'success': False, 'error': 'Items requeridos'}), 400

        # normalizar items
        normalized = []
        for it in items:
            expense_type = (it.get('expense_type') or '').strip()
            amount = it.get('amount')
            if not expense_type:
                continue
            try:
                amount_val = float(amount)
            except Exception:
                amount_val = 0.0
            normalized.append({'expense_type': expense_type, 'amount': amount_val})

        if len(normalized) == 0:
            return jsonify({'success': False, 'error': 'Items inválidos'}), 400

        from app.database.expense_sheets_repository import ExpenseSheetsRepository
        repo = ExpenseSheetsRepository()
        sheet_id = repo.create_sheet(owner, name, normalized)
        if not sheet_id:
            return jsonify({'success': False, 'error': 'No se pudo crear'}), 500

        return jsonify({'success': True, 'data': {'id': sheet_id}}), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/<sheet_id>', methods=['PUT'])
@login_required_api
def update_sheet(sheet_id: str):
    try:
        username = get_current_user()
        owner = _get_owner_username(username)

        from app.database.expense_sheets_repository import ExpenseSheetsRepository
        repo = ExpenseSheetsRepository()
        sheet = repo.get_by_id(sheet_id)
        if not sheet or sheet.get('owner_username') != owner:
            return jsonify({'success': False, 'error': 'Hoja no encontrada'}), 404

        data = request.get_json() or {}
        updates = {}
        if 'name' in data:
            updates['name'] = (data.get('name') or '').strip()
        if 'items' in data:
            items = data.get('items') or []
            normalized = []
            for it in items:
                expense_type = (it.get('expense_type') or '').strip()
                amount = it.get('amount')
                if not expense_type:
                    continue
                try:
                    amount_val = float(amount)
                except Exception:
                    amount_val = 0.0
                normalized.append({'expense_type': expense_type, 'amount': amount_val})
            updates['items'] = normalized

        if not updates:
            return jsonify({'success': False, 'error': 'Sin cambios'}), 400

        ok = repo.update_sheet(sheet_id, updates)
        if not ok:
            return jsonify({'success': False, 'error': 'No se pudo actualizar'}), 500

        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/<sheet_id>', methods=['DELETE'])
@login_required_api
def delete_sheet(sheet_id: str):
    try:
        username = get_current_user()
        owner = _get_owner_username(username)

        from app.database.expense_sheets_repository import ExpenseSheetsRepository
        repo = ExpenseSheetsRepository()
        sheet = repo.get_by_id(sheet_id)
        if not sheet or sheet.get('owner_username') != owner:
            return jsonify({'success': False, 'error': 'Hoja no encontrada'}), 404

        ok = repo.delete_sheet(sheet_id)
        return jsonify({'success': True}) if ok else (jsonify({'success': False, 'error': 'No se pudo eliminar'}), 500)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/apply', methods=['POST'])
@login_required_api
def apply_sheet_to_manifest():
    """
    Aplica una hoja a un manifiesto, creando trip-expenses para el owner.
    body: { sheet_id, manifest_id }
    """
    try:
        username = get_current_user()
        owner = _get_owner_username(username)

        data = request.get_json() or {}
        sheet_id = data.get('sheet_id')
        manifest_id = data.get('manifest_id')
        if not sheet_id or not manifest_id:
            return jsonify({'success': False, 'error': 'sheet_id y manifest_id requeridos'}), 400

        from app.database.expense_sheets_repository import ExpenseSheetsRepository
        sheet_repo = ExpenseSheetsRepository()
        sheet = sheet_repo.get_by_id(sheet_id)
        if not sheet or sheet.get('owner_username') != owner:
            return jsonify({'success': False, 'error': 'Hoja no encontrada'}), 404

        from app.database.trip_expenses_repository import TripExpensesRepository
        trip_repo = TripExpensesRepository()

        created = 0
        for it in (sheet.get('items') or []):
            expense_type = (it.get('expense_type') or '').strip()
            amount = it.get('amount')
            if not expense_type:
                continue
            try:
                amount_val = float(amount)
            except Exception:
                amount_val = 0.0
            if amount_val <= 0:
                continue
            eid = trip_repo.create_expense(
                manifest_id=manifest_id,
                username=owner,
                expense_type=expense_type,
                amount=amount_val,
            )
            if eid:
                created += 1

        return jsonify({'success': True, 'data': {'created': created}})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

