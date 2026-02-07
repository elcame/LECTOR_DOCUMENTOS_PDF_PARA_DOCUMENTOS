"""
API de operaciones sobre PDFs (páginas, thumbnails, descarga, renombrado, split, merge, delete)
"""
import os
import traceback
from pathlib import Path
from flask import Blueprint, request, jsonify, send_file
from io import BytesIO
from .manifiestos_utils import login_required_api, get_current_user, sanitize_filename, CACHE_THUMBNAILS_BASE

bp = Blueprint('manifiestos_pdf_ops', __name__)


@bp.route('/pdf/<path:filename>/pages', methods=['GET'])
@login_required_api
def get_pdf_pages(filename):
    """API para obtener información de páginas de un PDF desde Firebase Storage"""
    try:
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        folder_name = request.args.get('folder_name')
        if not folder_name:
            return jsonify({'success': False, 'error': 'folder_name requerido'}), 400
        
        try:
            from app.database.pdfs_repository import PDFsRepository
            from app.config.firebase_config import FirebaseConfig
            
            repo = PDFsRepository()
            pdfs = repo.get_pdfs_by_folder(username, folder_name)
            pdf_record = next((p for p in pdfs if p.get('filename') == filename), None)
            
            if not pdf_record:
                return jsonify({'success': False, 'error': 'PDF no encontrado'}), 404
            
            storage_path = pdf_record.get('file_path') or (pdf_record.get('metadata') or {}).get('storage_path')
            if not storage_path:
                return jsonify({'success': False, 'error': 'Ruta de almacenamiento no encontrada'}), 404
            
            bucket = FirebaseConfig.get_storage_bucket()
            blob = bucket.blob(storage_path)
            pdf_bytes = blob.download_as_bytes()
            
            import fitz
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            total_pages = len(doc)
            
            pages_info = []
            for i in range(total_pages):
                page = doc.load_page(i)
                rect = page.rect
                pages_info.append({
                    'page_number': i + 1,
                    'width': rect.width,
                    'height': rect.height
                })
            doc.close()
            
            return jsonify({
                'success': True,
                'total_pages': total_pages,
                'pages': pages_info
            })
        except ImportError:
            return jsonify({'success': False, 'error': 'Firebase o PyMuPDF no disponible'}), 503
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/pdf/<path:filename>/thumbnail', methods=['GET'])
@login_required_api
def get_pdf_thumbnail(filename):
    """API para obtener la miniatura de una página del PDF como imagen PNG con caché"""
    try:
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        folder_name = request.args.get('folder_name')
        page = request.args.get('page', 1, type=int)
        size = request.args.get('size', 150, type=int)
        
        if not folder_name:
            return jsonify({'success': False, 'error': 'folder_name requerido'}), 400
        
        cache_key = f"{username}_{folder_name}_{filename}_p{page}_s{size}.png"
        cache_path = CACHE_THUMBNAILS_BASE / cache_key
        
        if cache_path.exists():
            return send_file(str(cache_path), mimetype='image/png')
        
        try:
            from app.database.pdfs_repository import PDFsRepository
            from app.config.firebase_config import FirebaseConfig
            
            repo = PDFsRepository()
            pdfs = repo.get_pdfs_by_folder(username, folder_name)
            pdf_record = next((p for p in pdfs if p.get('filename') == filename), None)
            
            if not pdf_record:
                return jsonify({'success': False, 'error': 'PDF no encontrado'}), 404
            
            storage_path = pdf_record.get('file_path') or (pdf_record.get('metadata') or {}).get('storage_path')
            if not storage_path:
                return jsonify({'success': False, 'error': 'Ruta de almacenamiento no encontrada'}), 404
            
            bucket = FirebaseConfig.get_storage_bucket()
            blob = bucket.blob(storage_path)
            pdf_bytes = blob.download_as_bytes()
            
            import fitz
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            
            if page < 1 or page > len(doc):
                doc.close()
                return jsonify({'success': False, 'error': f'Página {page} fuera de rango'}), 400
            
            pdf_page = doc.load_page(page - 1)
            zoom = size / 100.0
            mat = fitz.Matrix(zoom, zoom)
            pix = pdf_page.get_pixmap(matrix=mat, alpha=False)
            
            img_bytes = pix.tobytes("png")
            doc.close()
            
            cache_path.parent.mkdir(parents=True, exist_ok=True)
            with open(cache_path, 'wb') as f:
                f.write(img_bytes)
            
            return send_file(BytesIO(img_bytes), mimetype='image/png')
        except ImportError:
            return jsonify({'success': False, 'error': 'Firebase o PyMuPDF no disponible'}), 503
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/pdf/<path:filename>/download', methods=['GET'])
@login_required_api
def download_pdf(filename):
    """API para descargar un PDF completo desde Firebase Storage"""
    try:
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        folder_name = request.args.get('folder_name')
        if not folder_name:
            return jsonify({'success': False, 'error': 'folder_name requerido'}), 400
        
        try:
            from app.database.pdfs_repository import PDFsRepository
            from app.config.firebase_config import FirebaseConfig
            
            repo = PDFsRepository()
            pdfs = repo.get_pdfs_by_folder(username, folder_name)
            pdf_record = next((p for p in pdfs if p.get('filename') == filename), None)
            
            if not pdf_record:
                return jsonify({'success': False, 'error': 'PDF no encontrado'}), 404
            
            storage_path = pdf_record.get('file_path') or (pdf_record.get('metadata') or {}).get('storage_path')
            if not storage_path:
                return jsonify({'success': False, 'error': 'Ruta de almacenamiento no encontrada'}), 404
            
            bucket = FirebaseConfig.get_storage_bucket()
            blob = bucket.blob(storage_path)
            pdf_bytes = blob.download_as_bytes()
            
            return send_file(
                BytesIO(pdf_bytes),
                mimetype='application/pdf',
                as_attachment=True,
                download_name=filename
            )
        except ImportError:
            return jsonify({'success': False, 'error': 'Firebase no disponible'}), 503
    except Exception as e:
        return jsonify({'success': False, 'error': f'Error al descargar PDF: {str(e)}'}), 500


@bp.route('/pdf/delete', methods=['DELETE'])
@login_required_api
def delete_pdf():
    """API para eliminar un PDF del sistema y Firebase Storage"""
    try:
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        data = request.get_json()
        folder_name = data.get('folder_name')
        filename = data.get('filename')
        
        if not folder_name or not filename:
            return jsonify({
                'success': False,
                'error': 'folder_name y filename son requeridos'
            }), 400
        
        try:
            from app.database.pdfs_repository import PDFsRepository
            from app.config.firebase_config import FirebaseConfig
            
            repo = PDFsRepository()
            pdfs = repo.get_pdfs_by_folder(username, folder_name)
            pdf_record = next((p for p in pdfs if p.get('filename') == filename), None)
            
            if not pdf_record:
                return jsonify({'success': False, 'error': 'PDF no encontrado'}), 404
            
            storage_path = pdf_record.get('file_path') or (pdf_record.get('metadata') or {}).get('storage_path')
            if storage_path:
                bucket = FirebaseConfig.get_storage_bucket()
                blob = bucket.blob(storage_path)
                if blob.exists():
                    blob.delete()
            
            repo.delete(pdf_record['id'])
            
            return jsonify({
                'success': True,
                'message': f'PDF "{filename}" eliminado correctamente'
            })
        except ImportError:
            return jsonify({'success': False, 'error': 'Firebase no disponible'}), 503
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/pdf/rename', methods=['POST'])
@login_required_api
def rename_pdf():
    """API para renombrar un PDF usando un patrón con campos del manifiesto"""
    try:
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        data = request.get_json()
        folder_name = data.get('folder_name')
        old_filename = data.get('old_filename')
        pattern = data.get('pattern', '{load_id}_{conductor}_{placa}.pdf')
        
        if not all([folder_name, old_filename]):
            return jsonify({
                'success': False,
                'error': 'folder_name y old_filename son requeridos'
            }), 400
        
        try:
            from app.database.pdfs_repository import PDFsRepository
            from app.database.manifiestos_repository import ManifiestosRepository
            from app.config.firebase_config import FirebaseConfig
            
            pdfs_repo = PDFsRepository()
            manifiestos_repo = ManifiestosRepository()
            
            pdfs = pdfs_repo.get_pdfs_by_folder(username, folder_name)
            pdf_record = next((p for p in pdfs if p.get('filename') == old_filename), None)
            
            if not pdf_record:
                return jsonify({'success': False, 'error': 'PDF no encontrado'}), 404
            
            filters = [
                ('username', '==', username),
                ('folder_name', '==', folder_name),
                ('archivo', '==', old_filename),
                ('active', '==', True)
            ]
            manifiestos = manifiestos_repo.get_all(filters=filters, limit=1)
            
            if not manifiestos:
                return jsonify({
                    'success': False,
                    'error': 'No se encontró manifiesto procesado para este PDF'
                }), 404
            
            manifiesto = manifiestos[0]
            
            new_filename = pattern
            for key, value in manifiesto.items():
                if isinstance(value, str):
                    new_filename = new_filename.replace(f'{{{key}}}', value)
            
            new_filename = sanitize_filename(new_filename)
            if not new_filename or not new_filename.endswith('.pdf'):
                if new_filename and not new_filename.endswith('.pdf'):
                    new_filename += '.pdf'
                else:
                    return jsonify({
                        'success': False,
                        'error': 'Nombre de archivo resultante inválido'
                    }), 400
            
            old_storage_path = pdf_record.get('file_path') or (pdf_record.get('metadata') or {}).get('storage_path')
            new_storage_path = f"pdfs/{username}/{folder_name}/{new_filename}"
            
            bucket = FirebaseConfig.get_storage_bucket()
            old_blob = bucket.blob(old_storage_path)
            new_blob = bucket.blob(new_storage_path)
            
            bucket.copy_blob(old_blob, bucket, new_storage_path)
            old_blob.delete()
            
            pdfs_repo.update(pdf_record['id'], {
                'filename': new_filename,
                'file_path': new_storage_path,
                'metadata.storage_path': new_storage_path
            })
            
            manifiestos_repo.update(manifiesto['id'], {'archivo': new_filename})
            
            return jsonify({
                'success': True,
                'message': f'PDF renombrado de "{old_filename}" a "{new_filename}"',
                'new_filename': new_filename
            })
        except ImportError:
            return jsonify({'success': False, 'error': 'Firebase no disponible'}), 503
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# NOTA: Los endpoints split, merge, bulk-rename y delete-pages son muy extensos
# y requieren PyMuPDF con operaciones complejas. Por ahora los marco como TODO
# para migración completa a Firebase Storage.

@bp.route('/pdf/split', methods=['POST'])
@login_required_api
def split_pdf():
    """API para dividir un PDF - TODO: migrar a Firebase Storage"""
    return jsonify({
        'success': False,
        'error': 'Endpoint en migración a Firebase Storage'
    }), 501


@bp.route('/pdf/merge', methods=['POST'])
@login_required_api
def merge_pdf_pages():
    """API para fusionar páginas de PDFs - TODO: migrar a Firebase Storage"""
    return jsonify({
        'success': False,
        'error': 'Endpoint en migración a Firebase Storage'
    }), 501


@bp.route('/pdf/delete-pages', methods=['POST'])
@login_required_api
def delete_pdf_pages():
    """API para eliminar páginas de un PDF - TODO: migrar a Firebase Storage"""
    return jsonify({
        'success': False,
        'error': 'Endpoint en migración a Firebase Storage'
    }), 501


@bp.route('/pdf/bulk-rename', methods=['POST'])
@login_required_api
def bulk_rename_pdfs():
    """API para renombrar múltiples PDFs usando un patrón con campos del manifiesto"""
    import traceback
    
    try:
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No se recibieron datos'}), 400
        
        folder_name = data.get('folder_name')
        pattern = data.get('pattern', '{load_id}_{remesa}')
        
        if not folder_name:
            return jsonify({'success': False, 'error': 'folder_name es requerido'}), 400
        
        try:
            from app.database.manifiestos_repository import ManifiestosRepository
            from app.database.pdfs_repository import PDFsRepository
            from app.config.firebase_config import FirebaseConfig
            
            manifiestos_repo = ManifiestosRepository()
            pdfs_repo = PDFsRepository()
            bucket = FirebaseConfig.get_storage_bucket()
            
            # Obtener manifiestos de la carpeta
            filters = [
                ('username', '==', username),
                ('folder_name', '==', folder_name),
                ('active', '==', True)
            ]
            manifiestos = manifiestos_repo.get_all(filters)
            
            if not manifiestos:
                return jsonify({
                    'success': False,
                    'error': f'No se encontraron manifiestos procesados en la carpeta "{folder_name}"'
                }), 404
            
            renamed_count = 0
            errors = []
            renamed_files = []
            
            for manifiesto in manifiestos:
                try:
                    old_filename = manifiesto.get('archivo')
                    if not old_filename:
                        continue
                    
                    # Generar nuevo nombre usando el patrón
                    new_filename = pattern
                    
                    # Reemplazar variables en el patrón
                    replacements = {
                        '{load_id}': manifiesto.get('load_id', 'NO_LOAD_ID'),
                        '{remesa}': manifiesto.get('remesa', 'NO_REMESA'),
                        '{placa}': manifiesto.get('placa', 'NO_PLACA'),
                        '{origen}': manifiesto.get('origen', 'NO_ORIGEN'),
                        '{destino}': manifiesto.get('destino', 'NO_DESTINO'),
                        '{empresa}': manifiesto.get('empresa', 'NO_EMPRESA'),
                        '{fecha_liquidacion}': manifiesto.get('fecha_liquidacion', 'NO_FECHA'),
                    }
                    
                    for key, value in replacements.items():
                        # Limpiar el valor para que sea válido como nombre de archivo
                        clean_value = str(value).replace('/', '-').replace('\\', '-').replace(':', '-')
                        clean_value = clean_value.replace('*', '').replace('?', '').replace('"', '')
                        clean_value = clean_value.replace('<', '').replace('>', '').replace('|', '')
                        new_filename = new_filename.replace(key, clean_value)
                    
                    # Agregar extensión .pdf si no la tiene
                    if not new_filename.lower().endswith('.pdf'):
                        new_filename += '.pdf'
                    
                    # Si el nombre no cambió, saltar
                    if new_filename == old_filename:
                        continue
                    
                    # Renombrar en Firebase Storage
                    old_storage_path = f"pdfs/{username}/{folder_name}/{old_filename}"
                    new_storage_path = f"pdfs/{username}/{folder_name}/{new_filename}"
                    
                    old_blob = bucket.blob(old_storage_path)
                    
                    if not old_blob.exists():
                        errors.append(f"{old_filename}: Archivo no encontrado en Firebase Storage")
                        continue
                    
                    new_blob = bucket.blob(new_storage_path)
                    
                    if new_blob.exists():
                        errors.append(f"{old_filename}: Ya existe un archivo con el nombre {new_filename}")
                        continue
                    
                    # Copiar a nuevo nombre
                    bucket.copy_blob(old_blob, bucket, new_storage_path)
                    
                    # Eliminar el archivo antiguo
                    old_blob.delete()
                    
                    # Actualizar manifiesto en Firestore
                    manifiestos_repo.update(manifiesto['id'], {'archivo': new_filename})
                    
                    # Actualizar registro de PDF en Firestore
                    pdf_filters = [
                        ('username', '==', username),
                        ('folder_name', '==', folder_name),
                        ('filename', '==', old_filename)
                    ]
                    pdfs = pdfs_repo.get_all(filters=pdf_filters, limit=1)
                    if pdfs:
                        pdfs_repo.update(pdfs[0]['id'], {
                            'filename': new_filename,
                            'file_path': new_storage_path
                        })
                    
                    renamed_count += 1
                    renamed_files.append({
                        'old_name': old_filename,
                        'new_name': new_filename
                    })
                    
                    print(f"[OK] Renombrado: {old_filename} -> {new_filename}")
                    
                except Exception as e:
                    errors.append(f"{old_filename}: {str(e)}")
                    print(f"[ERROR] Error al renombrar {old_filename}: {e}")
                    traceback.print_exc()
            
            return jsonify({
                'success': True,
                'message': f'Se renombraron {renamed_count} archivo(s)',
                'data': {
                    'renamed_count': renamed_count,
                    'total_count': len(manifiestos),
                    'errors': errors,
                    'renamed_files': renamed_files
                }
            })
            
        except ImportError:
            return jsonify({'success': False, 'error': 'Firebase no está disponible'}), 503
            
    except Exception as e:
        print(f"[ERROR] Error en bulk_rename_pdfs: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500
