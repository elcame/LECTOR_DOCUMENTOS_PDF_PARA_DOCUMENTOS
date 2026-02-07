"""
API de gestión de carpetas y overview de manifiestos
"""
import os
import shutil
from flask import Blueprint, request, jsonify
from .manifiestos_utils import login_required_api, get_current_user

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
                    'pdfs': pdfs,
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
    """API para eliminar una carpeta completa del sistema"""
    try:
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        folder_name = folder_name.strip().replace('..', '').replace('/', '').replace('\\', '')
        if not folder_name:
            return jsonify({'success': False, 'error': 'Nombre de carpeta inválido'}), 400
        
        try:
            from app.database.pdfs_repository import PDFsRepository
            from app.config.firebase_config import FirebaseConfig
            
            repo = PDFsRepository()
            pdfs = repo.get_pdfs_by_folder(username, folder_name)
            
            if not pdfs:
                return jsonify({
                    'success': False,
                    'error': f'Carpeta "{folder_name}" no encontrada'
                }), 404
            
            bucket = FirebaseConfig.get_storage_bucket()
            deleted_count = 0
            errors = []
            
            for pdf in pdfs:
                try:
                    storage_path = pdf.get('file_path') or (pdf.get('metadata') or {}).get('storage_path')
                    if storage_path:
                        blob = bucket.blob(storage_path)
                        if blob.exists():
                            blob.delete()
                    
                    repo.delete(pdf['id'])
                    deleted_count += 1
                except Exception as e:
                    errors.append(f"Error al eliminar {pdf.get('filename')}: {str(e)}")
            
            from modules.database import delete_qr_data_by_carpeta
            try:
                delete_qr_data_by_carpeta(username, folder_name)
            except Exception as e:
                print(f"Advertencia: No se pudo eliminar datos QR: {e}")
            
            folder_path = os.path.join('MANIFIESTOS', username, 'Manifiesto', folder_name)
            if os.path.exists(folder_path):
                try:
                    shutil.rmtree(folder_path)
                except Exception as e:
                    print(f"Advertencia: No se pudo eliminar carpeta física: {e}")
            
            return jsonify({
                'success': True,
                'message': f'Carpeta "{folder_name}" eliminada correctamente',
                'deleted_count': deleted_count,
                'errors': errors if errors else None
            })
            
        except ImportError:
            return jsonify({'success': False, 'error': 'Firebase no está disponible'}), 503
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


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
            
            # Crear ZIP en memoria
            zip_buffer = io.BytesIO()
            
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                for pdf in pdfs:
                    try:
                        # Obtener storage_path del PDF
                        storage_path = pdf.get('file_path') or (pdf.get('metadata') or {}).get('storage_path')
                        if not storage_path:
                            print(f"Advertencia: No se encontró storage_path para {pdf.get('filename')}")
                            continue
                        
                        # Obtener PDF desde Firebase Storage
                        firebase_config = FirebaseConfig()
                        bucket = firebase_config.get_storage_bucket()
                        
                        # Obtener blob desde Firebase Storage usando storage_path
                        blob = bucket.blob(storage_path)
                        
                        if blob.exists():
                            # Descargar contenido del PDF
                            pdf_content = blob.download_as_bytes()
                            
                            # Agregar al ZIP con el nombre original
                            zip_file.writestr(pdf['filename'], pdf_content)
                        else:
                            print(f"Advertencia: Archivo no encontrado en Storage: {storage_path}")
                            
                    except Exception as e:
                        print(f"Error al procesar PDF {pdf.get('filename')}: {e}")
                        continue
            
            zip_buffer.seek(0)
            
            # Preparar respuesta
            from flask import Response
            response = Response(
                zip_buffer.getvalue(),
                mimetype='application/zip',
                headers={
                    'Content-Disposition': f'attachment; filename={folder_name}.zip'
                }
            )
            
            return response
            
        except ImportError:
            return jsonify({'success': False, 'error': 'Firebase no está disponible'}), 503
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
