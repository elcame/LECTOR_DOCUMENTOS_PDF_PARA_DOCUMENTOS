"""
Resolución de manifiestos/PDFs duplicados tras procesar una carpeta.
"""
from flask import Blueprint, request, jsonify
from .manifiestos_utils import login_required_api, get_current_user

bp = Blueprint('manifiestos_duplicates', __name__)

VALID_ACTIONS = {'keep_original', 'keep_duplicate', 'keep_both'}


def _delete_pdf_file(username: str, folder_name: str, filename: str) -> tuple:
    """Elimina PDF de Storage + soft-delete del registro. Retorna (ok, error)."""
    if not folder_name or not filename:
        return False, 'Carpeta o archivo inválido'
    try:
        from app.database.pdfs_repository import PDFsRepository
        from app.config.firebase_config import FirebaseConfig

        repo = PDFsRepository()
        pdfs = repo.get_pdfs_by_folder(username, folder_name)
        pdf_record = next((p for p in pdfs if p.get('filename') == filename), None)
        if not pdf_record:
            return False, f'PDF no encontrado: {filename}'

        storage_path = pdf_record.get('file_path') or (pdf_record.get('metadata') or {}).get('storage_path')
        if storage_path:
            try:
                bucket = FirebaseConfig.get_storage_bucket()
                bucket.blob(storage_path).delete()
            except Exception:
                pass

        repo.delete_pdf_record(username, folder_name, filename)
        return True, None
    except Exception as e:
        return False, str(e)


def _extract_from_storage(username: str, folder_name: str, filename: str) -> tuple:
    """
    Lee el PDF de Storage y extrae manifiesto + factura.
    Retorna (manifiesto_data, factura_data, error).
    """
    try:
        from app.database.pdfs_repository import PDFsRepository
        from app.config.firebase_config import FirebaseConfig
        from modules.data_extractor import (
            extraer_datos_manifiesto,
            extraer_datos_factura_electronica,
            limpiar_datos,
        )
        import fitz

        repo = PDFsRepository()
        pdfs = repo.get_pdfs_by_folder(username, folder_name)
        pdf_record = next((p for p in pdfs if p.get('filename') == filename), None)
        if not pdf_record:
            return None, None, f'PDF no encontrado en la carpeta: {filename}'

        storage_path = pdf_record.get('file_path') or (pdf_record.get('metadata') or {}).get('storage_path')
        if not storage_path:
            return None, None, 'Sin ruta de Storage para el PDF'

        bucket = FirebaseConfig.get_storage_bucket()
        pdf_bytes = bucket.blob(storage_path).download_as_bytes()

        doc = fitz.open(stream=pdf_bytes, filetype='pdf')
        try:
            texto = ''
            for i in range(len(doc)):
                page = doc.load_page(i)
                try:
                    texto_pagina = page.get_text(flags=11)
                except Exception:
                    texto_pagina = page.get_text()
                if texto_pagina:
                    texto += f"\n--- PÁGINA {i + 1} ---\n{texto_pagina}"
        finally:
            doc.close()

        manifiesto = limpiar_datos(extraer_datos_manifiesto(texto) or {})
        manifiesto['archivo'] = filename
        factura = extraer_datos_factura_electronica(texto) or {}
        return manifiesto, factura, None
    except Exception as e:
        return None, None, str(e)


@bp.route('/duplicates/resolve', methods=['POST'])
@login_required_api
def resolve_duplicate():
    """
    Elige qué conservar ante un duplicado:
    - keep_original: borra el PDF duplicado (el manifiesto original ya quedó)
    - keep_duplicate: desactiva el manifiesto original, borra PDF original si aplica, guarda el duplicado
    - keep_both: guarda el duplicado como segundo manifiesto (IDs distintos); deja ambos PDFs
    """
    try:
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401

        data = request.get_json() or {}
        action = (data.get('action') or '').strip().lower()
        folder_name = (data.get('folder_name') or '').strip().replace('..', '').replace('/', '').replace('\\', '')
        duplicate_archivo = (data.get('duplicate_archivo') or '').strip()
        original_archivo = (data.get('original_archivo') or '').strip()
        original_folder = (data.get('original_folder') or folder_name or '').strip()
        load_id = data.get('load_id') or None
        remesa = data.get('remesa') or None

        if action not in VALID_ACTIONS:
            return jsonify({'success': False, 'error': 'Acción inválida'}), 400
        if not folder_name or not duplicate_archivo:
            return jsonify({'success': False, 'error': 'folder_name y duplicate_archivo son requeridos'}), 400

        from app.database.manifiestos_repository import ManifiestosRepository
        from app.database.carpetas_meta_repository import CarpetasMetaRepository

        manifiestos_repo = ManifiestosRepository()
        tipo_id = ''
        tipo_nombre = ''
        try:
            meta = CarpetasMetaRepository().get_for_folder(username, folder_name)
            if meta:
                tipo_id = meta.get('tipo_id') or ''
                tipo_nombre = meta.get('tipo_nombre') or ''
        except Exception:
            pass

        if action == 'keep_original':
            ok, err = _delete_pdf_file(username, folder_name, duplicate_archivo)
            if not ok:
                return jsonify({'success': False, 'error': err or 'No se pudo eliminar el duplicado'}), 400
            return jsonify({
                'success': True,
                'action': action,
                'message': f'Se conservó el original y se eliminó “{duplicate_archivo}”.',
            })

        # keep_duplicate | keep_both → reextraer y guardar el PDF duplicado
        manifiesto_data, factura_data, extract_err = _extract_from_storage(username, folder_name, duplicate_archivo)
        if extract_err:
            return jsonify({'success': False, 'error': extract_err}), 400

        if load_id and (not manifiesto_data.get('load_id') or manifiesto_data.get('load_id') == 'No encontrado'):
            manifiesto_data['load_id'] = load_id
        if remesa and (not manifiesto_data.get('remesa') or manifiesto_data.get('remesa') == 'No encontrada'):
            manifiesto_data['remesa'] = remesa

        if action == 'keep_duplicate':
            force_mode = 'replace'
            # Quitar PDF original si está en alguna carpeta conocida
            if original_archivo:
                target_folder = original_folder or folder_name
                _delete_pdf_file(username, target_folder, original_archivo)
                if target_folder != folder_name:
                    _delete_pdf_file(username, folder_name, original_archivo)
        else:
            force_mode = 'keep_both'

        success, message, _existing = manifiestos_repo.save_manifiesto(
            username=username,
            folder_name=folder_name,
            archivo=duplicate_archivo,
            manifiesto_data=manifiesto_data,
            factura_data=factura_data,
            tipo_id=tipo_id,
            tipo_nombre=tipo_nombre,
            force_mode=force_mode,
        )
        if not success:
            return jsonify({'success': False, 'error': message}), 400

        if action == 'keep_duplicate':
            msg = f'Se conservó “{duplicate_archivo}” como manifiesto activo.'
        else:
            msg = f'Se conservaron ambos. El duplicado “{duplicate_archivo}” también quedó guardado.'

        return jsonify({
            'success': True,
            'action': action,
            'message': msg,
            'manifiesto': {
                'archivo': duplicate_archivo,
                'load_id': manifiesto_data.get('load_id'),
                'remesa': manifiesto_data.get('remesa'),
            },
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
