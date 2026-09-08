"""API de tipos de manifiesto y asignación a carpetas."""
from flask import Blueprint, request, jsonify
from .manifiestos_utils import login_required_api, get_current_user

bp = Blueprint('tipos_manifiesto', __name__)


def _resolve_tipo(username: str, tipo_id: str):
    if not tipo_id:
        return '', ''
    from app.database.tipos_manifiesto_repository import TiposManifiestoRepository
    tipo = TiposManifiestoRepository().get_by_id(tipo_id)
    if not tipo or tipo.get('username') != username.lower():
        return None, None
    return tipo.get('id') or tipo_id, tipo.get('nombre') or ''


@bp.route('/tipos-manifiesto', methods=['GET'])
@login_required_api
def list_tipos():
    try:
        username = get_current_user()
        active_only = request.args.get('active_only', 'true').lower() == 'true'
        from app.database.tipos_manifiesto_repository import TiposManifiestoRepository
        data = TiposManifiestoRepository().list_by_username(username, active_only=active_only)
        data.sort(key=lambda t: (t.get('nombre') or '').lower())
        return jsonify({'success': True, 'data': data})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/tipos-manifiesto', methods=['POST'])
@login_required_api
def create_tipo():
    try:
        username = get_current_user()
        nombre = ((request.get_json() or {}).get('nombre') or '').strip()
        if not nombre:
            return jsonify({'success': False, 'error': 'El nombre es requerido'}), 400
        from app.database.tipos_manifiesto_repository import TiposManifiestoRepository
        repo = TiposManifiestoRepository()
        existing = repo.find_by_nombre(username, nombre)
        if existing and existing.get('active', True):
            return jsonify({'success': False, 'error': 'Ya existe un tipo con ese nombre'}), 400
        tipo_id = repo.create_tipo(username, nombre)
        if not tipo_id:
            return jsonify({'success': False, 'error': 'No se pudo crear el tipo'}), 500
        return jsonify({'success': True, 'data': repo.get_by_id(tipo_id)}), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/tipos-manifiesto/<tipo_id>', methods=['PUT'])
@login_required_api
def update_tipo(tipo_id):
    try:
        username = get_current_user()
        nombre = ((request.get_json() or {}).get('nombre') or '').strip()
        if not nombre:
            return jsonify({'success': False, 'error': 'El nombre es requerido'}), 400
        from app.database.tipos_manifiesto_repository import TiposManifiestoRepository
        from app.database.manifiestos_repository import ManifiestosRepository
        repo = TiposManifiestoRepository()
        tipo = repo.get_by_id(tipo_id)
        if not tipo or tipo.get('username') != username.lower():
            return jsonify({'success': False, 'error': 'Tipo no encontrado'}), 404
        other = repo.find_by_nombre(username, nombre)
        if other and other.get('id') != tipo_id and other.get('active', True):
            return jsonify({'success': False, 'error': 'Ya existe un tipo con ese nombre'}), 400
        repo.rename_tipo(tipo_id, nombre)
        for m in ManifiestosRepository().get_manifiestos(username=username):
            if m.get('tipo_id') == tipo_id:
                ManifiestosRepository().update(m['id'], {'tipo_nombre': nombre})
        from app.database.carpetas_meta_repository import CarpetasMetaRepository
        meta_repo = CarpetasMetaRepository()
        for meta in meta_repo.list_by_username(username):
            if meta.get('tipo_id') == tipo_id:
                meta_repo.update(meta['id'], {'tipo_nombre': nombre})
        return jsonify({'success': True, 'data': repo.get_by_id(tipo_id)})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/tipos-manifiesto/<tipo_id>', methods=['DELETE'])
@login_required_api
def deactivate_tipo(tipo_id):
    try:
        username = get_current_user()
        from app.database.tipos_manifiesto_repository import TiposManifiestoRepository
        repo = TiposManifiestoRepository()
        tipo = repo.get_by_id(tipo_id)
        if not tipo or tipo.get('username') != username.lower():
            return jsonify({'success': False, 'error': 'Tipo no encontrado'}), 404
        repo.deactivate_tipo(tipo_id)
        return jsonify({'success': True, 'message': 'Tipo desactivado'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/manifiestos/folder_tipo', methods=['POST'])
@login_required_api
def set_folder_tipo():
    try:
        username = get_current_user()
        body = request.get_json() or {}
        folder_name = (body.get('folder_name') or '').strip().replace('..', '').replace('/', '').replace('\\', '')
        tipo_id = (body.get('tipo_id') or '').strip()
        apply_to_manifiestos = bool(body.get('apply_to_manifiestos', True))
        if not folder_name:
            return jsonify({'success': False, 'error': 'folder_name requerido'}), 400

        tipo_nombre = ''
        if tipo_id:
            resolved_id, tipo_nombre = _resolve_tipo(username, tipo_id)
            if resolved_id is None:
                return jsonify({'success': False, 'error': 'Tipo no válido'}), 400
            tipo_id = resolved_id

        from app.database.carpetas_meta_repository import CarpetasMetaRepository
        CarpetasMetaRepository().upsert_tipo(username, folder_name, tipo_id, tipo_nombre)

        updated = 0
        if apply_to_manifiestos:
            from app.database.manifiestos_repository import ManifiestosRepository
            repo = ManifiestosRepository()
            for m in repo.get_manifiestos(username=username, folder_name=folder_name):
                if repo.update(m['id'], {'tipo_id': tipo_id, 'tipo_nombre': tipo_nombre}):
                    updated += 1

        return jsonify({
            'success': True,
            'data': {
                'folder_name': folder_name,
                'tipo_id': tipo_id,
                'tipo_nombre': tipo_nombre,
                'manifiestos_actualizados': updated,
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
