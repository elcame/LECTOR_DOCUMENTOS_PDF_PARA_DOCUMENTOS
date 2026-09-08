"""
API de gestión de carpetas y overview de manifiestos
"""
import os
import shutil
from flask import Blueprint, request, jsonify
from .manifiestos_utils import login_required_api, get_current_user, normalize_pdf_record

bp = Blueprint('manifiestos_folders', __name__)


@bp.route('/folders', methods=['GET'])
@login_required_api
def get_folders():
    """API para obtener carpetas desde Firebase (1 sola lectura Firestore)."""
    try:
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        try:
            from app.database.pdfs_repository import PDFsRepository
            repo = PDFsRepository()
            folders = repo.get_folders_summary(username)
            return jsonify({'success': True, 'folders': folders})
        except ImportError:
            return jsonify({'success': False, 'error': 'Firebase no está disponible'}), 503
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/overview', methods=['GET'])
@login_required_api
def get_overview():
    """
    Obtiene PDFs, carpetas y storage en 1 sola lectura a Firebase.
    ?folder_name= opcional para filtrar PDFs por carpeta.
    """
    try:
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        folder_name = request.args.get('folder_name') or None
        
        try:
            from app.database.pdfs_repository import PDFsRepository
            from app.config.firebase_config import FirebaseConfig
            
            repo = PDFsRepository()
            all_pdfs = repo.get_pdfs_by_username(username)
            
            if folder_name:
                pdfs = [p for p in all_pdfs if p.get('folder_name') == folder_name]
            else:
                pdfs = all_pdfs
            
            by_folder = {}
            for p in all_pdfs:
                fn = p.get('folder_name') or 'Sin carpeta'
                by_folder[fn] = by_folder.get(fn, 0) + 1
            folders = [{'name': k, 'pdf_count': v} for k, v in sorted(by_folder.items(), key=lambda x: -x[1])]
            try:
                from app.database.carpetas_meta_repository import CarpetasMetaRepository
                meta_by_name = {
                    m.get('folder_name'): m
                    for m in CarpetasMetaRepository().list_by_username(username)
                }
                folders = [
                    {
                        **f,
                        'tipo_id': (meta_by_name.get(f['name']) or {}).get('tipo_id') or '',
                        'tipo_nombre': (meta_by_name.get(f['name']) or {}).get('tipo_nombre') or '',
                    }
                    for f in folders
                ]
            except Exception as e:
                print(f"[WARN] No se pudo adjuntar tipo a carpetas: {e}")
            
            total_size = sum(p.get('file_size', 0) for p in all_pdfs)
            largest = max(all_pdfs, key=lambda p: p.get('file_size', 0)) if all_pdfs else None
            recent = sorted(all_pdfs, key=lambda p: p.get('uploaded_at', ''), reverse=True)[:5]
            
            storage_stats = {
                'total_files': len(all_pdfs),
                'total_size_bytes': total_size,
                'total_size_mb': round(total_size / (1024 * 1024), 2),
                'largest_file': {
                    'filename': largest.get('filename') if largest else None,
                    'size_mb': round(largest.get('file_size', 0) / (1024 * 1024), 2) if largest else 0
                } if largest else None,
                'recent_files': [
                    {
                        'filename': r.get('filename'),
                        'folder_name': r.get('folder_name'),
                        'uploaded_at': r.get('uploaded_at')
                    } for r in recent
                ]
            }
            
            return jsonify({
                'success': True,
                'data': {
                    'pdfs': [normalize_pdf_record(p) for p in pdfs],
                    'folders': folders,
                    'storage': storage_stats
                }
            })
        except ImportError:
            return jsonify({'success': False, 'error': 'Firebase no está disponible'}), 503
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/folders/<path:folder_name>', methods=['DELETE'])
@login_required_api
def delete_folder(folder_name):
    """Elimina toda la data de una carpeta: Storage, pdfs, manifiestos, meta y QR."""
    try:
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401

        folder_name = folder_name.strip().replace('..', '').replace('/', '').replace('\\', '')
        if not folder_name:
            return jsonify({'success': False, 'error': 'Nombre de carpeta inválido'}), 400

        try:
            result = _purge_folder_data(username, folder_name)
            if not result.get('found'):
                return jsonify({
                    'success': False,
                    'error': f'Carpeta "{folder_name}" no encontrada en la base de datos',
                }), 404

            return jsonify({
                'success': True,
                'message': f'Carpeta "{folder_name}" eliminada correctamente',
                'deleted_count': result.get('deleted_count', 0),
                'errors': result.get('errors') or None,
            })
        except ImportError:
            return jsonify({'success': False, 'error': 'Firebase no está disponible'}), 503
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/folders/purge-all', methods=['POST'])
@login_required_api
def purge_all_folders():
    """Elimina TODAS las carpetas del usuario (Firestore + Storage + meta). Requiere confirm."""
    try:
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401

        data = request.get_json(silent=True) or {}
        if (data.get('confirm') or '').strip().upper() != 'ELIMINAR TODO':
            return jsonify({
                'success': False,
                'error': 'Debes enviar confirm: "ELIMINAR TODO" para continuar',
            }), 400

        try:
            from app.database.pdfs_repository import PDFsRepository
            repo = PDFsRepository()
            folders = repo.get_folders_summary(username)
            names = [f.get('name') for f in folders if f.get('name') and f.get('name') != 'Sin carpeta']

            # También meta huérfana sin PDFs activos
            try:
                from app.database.carpetas_meta_repository import CarpetasMetaRepository
                for meta in CarpetasMetaRepository().list_by_username(username):
                    name = meta.get('folder_name')
                    if name and name not in names:
                        names.append(name)
            except Exception as e:
                print(f"[WARN] No se pudo listar carpetas_meta: {e}")

            purged = []
            errors = []
            total_deleted = 0
            for name in names:
                result = _purge_folder_data(username, name, scan_storage_prefix=False)
                total_deleted += result.get('deleted_count', 0)
                purged.append(name)
                errors.extend(result.get('errors') or [])

            return jsonify({
                'success': True,
                'message': f'Se eliminaron {len(purged)} carpeta(s)',
                'folders': purged,
                'deleted_count': total_deleted,
                'errors': errors if errors else None,
            })
        except ImportError:
            return jsonify({'success': False, 'error': 'Firebase no está disponible'}), 503
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


def _purge_folder_data(username: str, folder_name: str, scan_storage_prefix: bool = True) -> dict:
    """
    Borra data de carpeta priorizando Firestore (para que desaparezca de la UI).
    Storage se limpia en best-effort sin blob.exists() (evita timeouts).
    """
    from app.database.pdfs_repository import PDFsRepository
    from app.config.firebase_config import FirebaseConfig

    repo = PDFsRepository()
    pdfs = repo.get_pdfs_by_folder(username, folder_name)
    errors = []
    deleted_count = 0
    found = bool(pdfs)

    # 1) Firestore primero: soft-delete de PDFs (rápido → la carpeta deja de listarse)
    storage_paths = []
    for pdf in pdfs:
        try:
            storage_path = pdf.get('file_path') or (pdf.get('metadata') or {}).get('storage_path')
            if storage_path:
                storage_paths.append(storage_path)
            # Siempre intentar prefijo estándar
            fname = pdf.get('filename') or ''
            if fname:
                storage_paths.append(f"pdfs/{username}/{folder_name}/{fname}")
            if repo.delete_pdf_record(username, folder_name, fname):
                deleted_count += 1
            elif pdf.get('id') and repo.delete(pdf['id']):
                deleted_count += 1
            else:
                errors.append(f"No se pudo desactivar PDF {fname}")
        except Exception as e:
            errors.append(f"Error al eliminar registro {pdf.get('filename')}: {str(e)}")

    # 2) Manifiestos
    try:
        from app.database.manifiestos_repository import ManifiestosRepository
        manifiestos_repo = ManifiestosRepository()
        manifestos_deleted, manifestos_errors = manifiestos_repo.hard_delete_by_folder(username, folder_name)
        deleted_count += manifestos_deleted
        errors.extend(manifestos_errors)
        if manifestos_deleted:
            found = True
    except Exception as e:
        errors.append(f"Error eliminando manifiestos: {str(e)}")

    # 3) Meta de carpeta
    try:
        from app.database.carpetas_meta_repository import CarpetasMetaRepository
        meta_repo = CarpetasMetaRepository()
        if meta_repo.get_for_folder(username, folder_name):
            found = True
            meta_repo.delete_for_folder(username, folder_name)
    except Exception as e:
        errors.append(f"Error eliminando meta de carpeta: {str(e)}")

    # 4) Storage best-effort (sin exists(); 404 se ignora)
    try:
        bucket = FirebaseConfig.get_storage_bucket()
        for storage_path in dict.fromkeys(storage_paths):
            try:
                bucket.blob(storage_path).delete()
            except Exception:
                pass
        if scan_storage_prefix:
            prefix = f"pdfs/{username}/{folder_name}/"
            try:
                for blob in bucket.list_blobs(prefix=prefix):
                    try:
                        blob.delete()
                    except Exception:
                        pass
            except Exception as e:
                errors.append(f"Error listando Storage {prefix}: {e}")
    except Exception as e:
        errors.append(f'Storage no disponible: {e}')

    # 5) QR + disco local
    try:
        from modules.database import delete_qr_data_by_carpeta
        delete_qr_data_by_carpeta(username, folder_name)
    except Exception as e:
        print(f"Advertencia: No se pudo eliminar datos QR: {e}")

    folder_path = os.path.join('MANIFIESTOS', username, 'Manifiesto', folder_name)
    if os.path.exists(folder_path):
        found = True
        try:
            shutil.rmtree(folder_path)
        except Exception as e:
            print(f"Advertencia: No se pudo eliminar carpeta física: {e}")

    return {
        'found': found,
        'deleted_count': deleted_count,
        'errors': errors,
    }


@bp.route('/download_folder_zip', methods=['GET'])
@login_required_api
def download_folder_zip():
    """API para descargar una carpeta completa como ZIP desde Firebase Storage."""
    try:
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        folder_name = request.args.get('folder_name')
        if not folder_name:
            return jsonify({'success': False, 'error': 'Se requiere folder_name'}), 400
        
        try:
            from app.database.pdfs_repository import PDFsRepository
            from app.config.firebase_config import FirebaseConfig
            import zipfile
            import tempfile
            import io
            
            repo = PDFsRepository()
            pdfs = repo.get_pdfs_by_folder(username, folder_name)
            
            if not pdfs:
                return jsonify({'success': False, 'error': 'La carpeta no existe o está vacía'}), 404
            
            # Crear ZIP en memoria (PDFs ya van comprimidos; STORED es más rápido)
            zip_buffer = io.BytesIO()
            firebase_config = FirebaseConfig()
            bucket = firebase_config.get_storage_bucket()

            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_STORED) as zip_file:
                for pdf in pdfs:
                    try:
                        storage_path = pdf.get('file_path') or (pdf.get('metadata') or {}).get('storage_path')
                        if not storage_path:
                            print(f"Advertencia: No se encontró storage_path para {pdf.get('filename')}")
                            continue

                        blob = bucket.blob(storage_path)

                        if blob.exists():
                            pdf_content = blob.download_as_bytes()
                            zip_file.writestr(pdf['filename'], pdf_content)
                        else:
                            print(f"Advertencia: Archivo no encontrado en Storage: {storage_path}")

                    except Exception as e:
                        print(f"Error al procesar PDF {pdf.get('filename')}: {e}")
                        continue

            zip_bytes = zip_buffer.getvalue()

            from flask import Response
            response = Response(
                zip_bytes,
                mimetype='application/zip',
                headers={
                    'Content-Disposition': f'attachment; filename={folder_name}.zip',
                    'Content-Length': str(len(zip_bytes)),
                }
            )

            return response
            
        except ImportError:
            return jsonify({'success': False, 'error': 'Firebase no está disponible'}), 503
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
