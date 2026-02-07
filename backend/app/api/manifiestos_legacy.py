"""
API de manifiestos y procesamiento de PDFs
"""
import os
import sys
from pathlib import Path
from datetime import datetime
from flask import Blueprint, request, jsonify, send_file
from io import BytesIO
from functools import wraps

# Agregar ruta raíz al path
ROOT_DIR = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))

# Ruta absoluta del caché de miniaturas (backend/cache/thumbnails) para no depender del cwd
_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
_CACHE_THUMBNAILS_BASE = _BACKEND_DIR / 'cache' / 'thumbnails'

from modules.auth import (
    get_current_user, is_authenticated,
    get_user_excel_folder, get_user_folder
)
from modules.pdf_processor import procesar_carpeta_pdfs, procesar_carpeta_qr

# Funciones auxiliares para obtener carpetas de usuario
def get_user_manifiesto_folder():
    """Obtiene la carpeta de manifiestos del usuario actual"""
    username = get_current_user()
    if not username:
        return None
    manifiesto_path = os.path.join('MANIFIESTOS', username, 'Manifiesto')
    if not os.path.exists(manifiesto_path):
        os.makedirs(manifiesto_path, exist_ok=True)
    return manifiesto_path

def get_user_manifiesto_qr_folder():
    """Obtiene la carpeta de manifiestos QR del usuario actual"""
    username = get_current_user()
    if not username:
        return None
    qr_path = os.path.join('MANIFIESTOS', username, 'ManifiestoQRinfo')
    if not os.path.exists(qr_path):
        os.makedirs(qr_path, exist_ok=True)
    return qr_path

def get_user_base_folder():
    """Obtiene la carpeta base del usuario"""
    username = get_current_user()
    if not username:
        return None
    return get_user_folder(username)
from modules.excel_generator import crear_excel
from modules.database import (
    get_qr_data, update_qr_field, save_qr_data, delete_qr_data_by_carpeta
)

bp = Blueprint('manifiestos', __name__)

def login_required_api(f):
    """Decorador para APIs que requieren autenticación"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not is_authenticated():
            return jsonify({'success': False, 'error': 'No autenticado'}), 401
        return f(*args, **kwargs)
    return decorated_function

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
            
            # Filtrar PDFs por carpeta si se indica
            if folder_name:
                pdfs = [p for p in all_pdfs if p.get('folder_name') == folder_name]
            else:
                pdfs = all_pdfs
            
            # Carpetas: agrupar por folder_name
            by_folder = {}
            for p in all_pdfs:
                fn = p.get('folder_name') or 'Sin carpeta'
                by_folder[fn] = by_folder.get(fn, 0) + 1
            folders = [{'name': k, 'pdf_count': v} for k, v in sorted(by_folder.items(), key=lambda x: -x[1])]
            
            # Storage
            total_files = len(all_pdfs)
            total_size = sum(p.get('file_size', 0) for p in all_pdfs)
            folders_stats = {}
            for p in all_pdfs:
                fn = p.get('folder_name', 'Sin carpeta')
                if fn not in folders_stats:
                    folders_stats[fn] = {'count': 0, 'size': 0, 'files': []}
                folders_stats[fn]['count'] += 1
                folders_stats[fn]['size'] += p.get('file_size', 0)
                folders_stats[fn]['files'].append({
                    'filename': p.get('filename'),
                    'size': p.get('file_size', 0),
                    'uploaded_at': p.get('uploaded_at')
                })
            storage_folders = [{'folder_name': k, 'count': v['count'], 'size': v['size'], 'files': sorted(v['files'], key=lambda x: x['size'], reverse=True)[:10]} for k, v in folders_stats.items()]
            storage_folders.sort(key=lambda x: x['size'], reverse=True)
            
            storage_info = {'available': False, 'bucket_name': None}
            try:
                bucket = FirebaseConfig.get_storage_bucket()
                if bucket:
                    storage_info = {'available': True, 'bucket_name': bucket.name}
            except Exception:
                pass
            
            def _file_item(p):
                return {'filename': p.get('filename'), 'folder_name': p.get('folder_name'), 'size': p.get('file_size', 0), 'uploaded_at': p.get('uploaded_at')}
            storage = {
                'total_files': total_files,
                'total_size': total_size,
                'folders': storage_folders,
                'largest_files': [_file_item(p) for p in sorted(all_pdfs, key=lambda x: x.get('file_size', 0), reverse=True)[:10]],
                'recent_files': [_file_item(p) for p in sorted([p for p in all_pdfs if p.get('uploaded_at')], key=lambda x: x.get('uploaded_at', ''), reverse=True)[:10]],
                'storage_info': storage_info,
                'username': username
            }
            
            return jsonify({
                'success': True,
                'data': {'pdfs': pdfs, 'folders': folders, 'storage': storage}
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
        import shutil
        from urllib.parse import unquote
        
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        # Decodificar el nombre de carpeta de la URL si es necesario
        try:
            folder_name = unquote(folder_name)
        except Exception:
            pass  # Si falla, usar el nombre tal cual
        
        # Obtener tipo de carpeta (Manifiesto o ManifiestoQRinfo)
        folder_type = request.args.get('type', 'Manifiesto')
        
        # Determinar la carpeta base según el tipo
        if folder_type == 'ManifiestoQRinfo':
            manifiestos_path = get_user_manifiesto_qr_folder()
        else:
            manifiestos_path = get_user_manifiesto_folder()
        
        if not manifiestos_path:
            return jsonify({
                'success': False,
                'error': 'No se pudo determinar la carpeta del usuario'
            }), 500
        
        # Construir ruta completa de la carpeta a eliminar
        folder_path = os.path.join(manifiestos_path, folder_name)
        
        # Validar que la carpeta existe
        if not os.path.exists(folder_path):
            return jsonify({
                'success': False,
                'error': f'La carpeta {folder_name} no existe'
            }), 404
        
        # Validar que es un directorio
        if not os.path.isdir(folder_path):
            return jsonify({
                'success': False,
                'error': f'{folder_name} no es una carpeta válida'
            }), 400
        
        deleted_items = {
            'folder': False,
            'pdfs_firebase': 0,
            'pdfs_firestore': 0,
            'manifiestos': 0,
            'qr_data': 0,
            'excel': False,
            'cache': 0
        }
        
        try:
            # 1. Eliminar archivos de Firebase Storage
            try:
                from app.config.firebase_config import FirebaseConfig
                bucket = FirebaseConfig.get_storage_bucket()
                storage_prefix = f"pdfs/{username}/{folder_name}/"
                
                # Listar todos los blobs con el prefijo
                blobs = bucket.list_blobs(prefix=storage_prefix)
                for blob in blobs:
                    try:
                        blob.delete()
                        deleted_items['pdfs_firebase'] += 1
                    except Exception as e:
                        print(f"Advertencia: No se pudo eliminar {blob.name} de Storage: {e}")
                
                print(f"[OK] Eliminados {deleted_items['pdfs_firebase']} archivos de Firebase Storage")
            except ImportError:
                print("[INFO] Firebase no está disponible, omitiendo eliminación de Storage")
            except Exception as e:
                print(f"Advertencia: Error al eliminar de Firebase Storage: {e}")
            
            # 2. Eliminar registros de PDFs de Firestore
            try:
                from app.database.pdfs_repository import PDFsRepository
                repo = PDFsRepository()
                
                # Obtener todos los PDFs de la carpeta
                pdfs = repo.get_all(filters=[
                    ('username', '==', username),
                    ('folder_name', '==', folder_name)
                ])
                
                for pdf in pdfs:
                    try:
                        repo.delete(pdf['id'])
                        deleted_items['pdfs_firestore'] += 1
                    except Exception as e:
                        print(f"Advertencia: No se pudo eliminar PDF {pdf.get('id')} de Firestore: {e}")
                
                print(f"[OK] Eliminados {deleted_items['pdfs_firestore']} registros de PDFs de Firestore")
            except ImportError:
                print("[INFO] Firebase no está disponible, omitiendo eliminación de PDFs de Firestore")
            except Exception as e:
                print(f"Advertencia: Error al eliminar PDFs de Firestore: {e}")
            
            # 3. Eliminar manifiestos asociados de Firestore (hard delete)
            try:
                from app.database.manifiestos_repository import ManifiestosRepository
                manifiestos_repo = ManifiestosRepository()
                
                # Obtener todos los manifiestos de la carpeta (incluyendo inactivos)
                manifiestos = manifiestos_repo.get_all(filters=[
                    ('username', '==', username),
                    ('folder_name', '==', folder_name)
                ])
                
                for manifiesto in manifiestos:
                    try:
                        # Eliminación permanente del registro
                        manifiestos_repo.delete(manifiesto['id'])
                        deleted_items['manifiestos'] += 1
                    except Exception as e:
                        print(f"Advertencia: No se pudo eliminar manifiesto {manifiesto.get('id')} de Firestore: {e}")
                
                print(f"[OK] Eliminados permanentemente {deleted_items['manifiestos']} manifiestos de Firestore")
            except ImportError:
                print("[INFO] ManifiestosRepository no está disponible, omitiendo eliminación de manifiestos")
            except Exception as e:
                print(f"Advertencia: Error al eliminar manifiestos de Firestore: {e}")
            
            # 4. Eliminar datos QR de la base de datos
            try:
                deleted_qr = delete_qr_data_by_carpeta(username, folder_name)
                if deleted_qr:
                    # Contar cuántos se eliminaron (aproximado)
                    qr_data_before = get_qr_data(username=username, carpeta=folder_name)
                    deleted_items['qr_data'] = len(qr_data_before) if qr_data_before else 0
                    print(f"[OK] Eliminados datos QR de la carpeta {folder_name}")
            except Exception as e:
                print(f"Advertencia: Error al eliminar datos QR: {e}")
            
            # 5. Eliminar Excel asociado (solo para tipo Manifiesto)
            if folder_type == 'Manifiesto':
                try:
                    excel_path = os.path.join(get_user_excel_folder(username), f'manifiestos_{folder_name}.xlsx')
                    if os.path.exists(excel_path):
                        os.remove(excel_path)
                        deleted_items['excel'] = True
                        print(f"[OK] Excel eliminado: {excel_path}")
                except Exception as e:
                    print(f"Advertencia: Error al eliminar Excel: {e}")
            
            # 6. Limpiar caché de miniaturas de la carpeta (ruta absoluta)
            cache_dir = _CACHE_THUMBNAILS_BASE / username
            if cache_dir.exists():
                try:
                    import hashlib
                    for cache_file in cache_dir.iterdir():
                        if cache_file.is_file():
                            try:
                                for page_num in range(100):
                                    cache_key = f"{username}_{folder_name}_"
                                    cache_hash = hashlib.md5(cache_key.encode()).hexdigest()
                                    if cache_file.name.startswith(cache_hash[:8]):
                                        cache_file.unlink()
                                        deleted_items['cache'] += 1
                                        break
                            except Exception:
                                pass
                    print(f"[OK] Eliminados {deleted_items['cache']} archivos de caché")
                except Exception as e:
                    print(f"Advertencia: Error al limpiar caché: {e}")
            
            # 7. Eliminar carpeta física (último paso)
            try:
                shutil.rmtree(folder_path)
                deleted_items['folder'] = True
                print(f"[OK] Carpeta física eliminada: {folder_path}")
            except Exception as e:
                print(f"[ERROR] Error al eliminar carpeta física: {e}")
                return jsonify({
                    'success': False,
                    'error': f'Error al eliminar carpeta física: {str(e)}',
                    'deleted_items': deleted_items
                }), 500
            
            return jsonify({
                'success': True,
                'message': f'Carpeta {folder_name} eliminada correctamente',
                'deleted_items': deleted_items
            })
            
        except Exception as e:
            print(f"[ERROR] Error durante la eliminación de carpeta: {e}")
            import traceback
            print(traceback.format_exc())
            return jsonify({
                'success': False,
                'error': f'Error al eliminar carpeta: {str(e)}',
                'deleted_items': deleted_items
            }), 500
            
    except Exception as e:
        print(f"[ERROR] Error general en delete_folder: {e}")
        import traceback
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Extensiones permitidas para subida
ALLOWED_EXTENSIONS = {'pdf'}

def _allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[-1].lower() in ALLOWED_EXTENSIONS

def _sanitize_folder_name(name):
    """Evita path traversal; solo permite caracteres seguros para nombre de carpeta."""
    if not name or not isinstance(name, str):
        return None
    clean = name.strip().replace('..', '').replace('/', '').replace('\\', '')
    return clean if clean else None


@bp.route('/upload_file', methods=['POST'])
@login_required_api
def upload_file():
    try:
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401

        folder_name = _sanitize_folder_name(request.form.get('folder_name', '').strip())
        if not folder_name:
            return jsonify({
                'success': False,
                'error': 'Nombre de carpeta requerido. Solo se permiten letras, números y guiones.'
            }), 400

        f = request.files.get('file')
        if not f or not f.filename:
            return jsonify({
                'success': False,
                'error': 'No se envió archivo. Adjunta un PDF en el campo "file".'
            }), 400

        if not _allowed_file(f.filename):
            return jsonify({
                'success': False,
                'error': 'Archivo no permitido. Solo se permiten PDFs.'
            }), 400

        safe_name = os.path.basename(f.filename)

        storage_url = None
        storage_path = f"pdfs/{username}/{folder_name}/{safe_name}"
        try:
            from app.config.firebase_config import FirebaseConfig
            bucket = FirebaseConfig.get_storage_bucket()
            blob = bucket.blob(storage_path)

            f.stream.seek(0)
            blob.upload_from_file(f.stream, content_type=f.content_type or 'application/pdf', rewind=True)

            try:
                blob.make_public()
                storage_url = blob.public_url
            except Exception:
                storage_url = blob.generate_signed_url(expiration=31536000)
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Error al subir a Storage: {str(e)}'
            }), 500

        file_size = None
        try:
            file_size = int(getattr(blob, 'size', None) or 0) or None
        except Exception:
            file_size = None

        try:
            from app.database.pdfs_repository import PDFsRepository
            pdfs_repo = PDFsRepository()
            pdfs_repo.create_pdf_record(
                username=username,
                folder_name=folder_name,
                filename=safe_name,
                file_path=storage_path,
                file_size=file_size or 0,
                metadata={
                    'original_filename': f.filename,
                    'content_type': f.content_type or 'application/pdf',
                    'storage_url': storage_url,
                    'storage_path': storage_path
                },
                total_pages=None
            )
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Error al guardar metadatos: {str(e)}'
            }), 500

        return jsonify({
            'success': True,
            'message': 'Archivo subido correctamente.',
            'data': {
                'folder_name': folder_name,
                'filename': safe_name,
                'size': file_size,
                'storage_url': storage_url,
                'storage_path': storage_path
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/upload_folder', methods=['POST'])
@login_required_api
def upload_folder():
    """API para subir archivos PDF de una carpeta. FormData: folder_name, files[]"""
    try:
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401

        folder_name = _sanitize_folder_name(request.form.get('folder_name', '').strip())
        if not folder_name:
            return jsonify({
                'success': False,
                'error': 'Nombre de carpeta requerido. Solo se permiten letras, números y guiones.'
            }), 400

        # Obtener archivos: 'files' o 'files[]'
        files = request.files.getlist('files') or request.files.getlist('files[]')
        if not files or all(not f or not f.filename for f in files):
            return jsonify({
                'success': False,
                'error': 'No se enviaron archivos. Selecciona al menos un PDF.'
            }), 400

        saved = 0
        skipped = 0
        saved_files = []
        
        # Intentar guardar metadatos en Firebase (opcional, no falla si no está disponible)
        pdfs_repo = None
        try:
            from app.database.pdfs_repository import PDFsRepository
            pdfs_repo = PDFsRepository()
        except Exception as e:
            print(f"Advertencia: No se pudo inicializar PDFsRepository: {e}")
        
        for f in files:
            if not f or not f.filename:
                continue
            if not _allowed_file(f.filename):
                skipped += 1
                continue
            # Usar solo el nombre del archivo para evitar sobrescribir con rutas
            safe_name = os.path.basename(f.filename)
            storage_url = None
            storage_path = f"pdfs/{username}/{folder_name}/{safe_name}"
            blob = None
            try:
                from app.config.firebase_config import FirebaseConfig
                bucket = FirebaseConfig.get_storage_bucket()
                blob = bucket.blob(storage_path)

                f.stream.seek(0)
                blob.upload_from_file(f.stream, content_type=f.content_type or 'application/pdf', rewind=True)

                try:
                    blob.make_public()
                    storage_url = blob.public_url
                except Exception:
                    storage_url = blob.generate_signed_url(expiration=31536000)  # 1 año

                print(f"[OK] Archivo subido a Firebase Storage: {storage_path}")
            except Exception as e:
                print(f"Advertencia: No se pudo subir a Firebase Storage para {safe_name}: {e}")
                skipped += 1
                continue

            file_size = None
            try:
                file_size = int(getattr(blob, 'size', None) or 0) if blob else None
            except Exception:
                file_size = None

            # Guardar metadatos en Firebase Firestore
            if pdfs_repo:
                try:
                    pdfs_repo.create_pdf_record(
                        username=username,
                        folder_name=folder_name,
                        filename=safe_name,
                        file_path=storage_path,
                        file_size=file_size or 0,
                        metadata={
                            'original_filename': f.filename,
                            'content_type': f.content_type or 'application/pdf',
                            'storage_url': storage_url,
                            'storage_path': storage_path
                        },
                        total_pages=None
                    )
                except Exception as e:
                    print(f"Advertencia: No se pudo guardar metadatos en Firebase para {safe_name}: {e}")

            saved += 1
            saved_files.append({
                'filename': safe_name,
                'size': file_size,
                'path': storage_path
            })

        return jsonify({
            'success': True,
            'message': f'Se subieron {saved} archivo(s) a la carpeta "{folder_name}".',
            'data': {
                'folder_name': folder_name,
                'saved_count': saved,
                'skipped_count': skipped,
                'files': saved_files
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/pdfs', methods=['GET'])
@login_required_api
def get_pdfs():
    """API para obtener PDFs guardados del usuario actual"""
    try:
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        folder_name = request.args.get('folder_name')
        
        try:
            from app.database.pdfs_repository import PDFsRepository
            repo = PDFsRepository()
            
            if folder_name:
                pdfs = repo.get_pdfs_by_folder(username, folder_name)
            else:
                pdfs = repo.get_pdfs_by_username(username)
            
            return jsonify({
                'success': True,
                'data': pdfs
            })
        except ImportError:
            return jsonify({
                'success': False,
                'error': 'Firebase no está disponible'
            }), 503
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/storage-stats', methods=['GET'])
@login_required_api
def get_storage_stats():
    """API para obtener estadísticas de almacenamiento del usuario actual"""
    try:
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        try:
            from app.database.pdfs_repository import PDFsRepository
            from app.config.firebase_config import FirebaseConfig
            
            repo = PDFsRepository()
            pdfs = repo.get_pdfs_by_username(username)
            
            # Calcular estadísticas
            total_files = len(pdfs)
            total_size = sum(pdf.get('file_size', 0) for pdf in pdfs)
            
            # Agrupar por carpeta
            folders_stats = {}
            for pdf in pdfs:
                folder = pdf.get('folder_name', 'Sin carpeta')
                if folder not in folders_stats:
                    folders_stats[folder] = {
                        'count': 0,
                        'size': 0,
                        'files': []
                    }
                
                folders_stats[folder]['count'] += 1
                folders_stats[folder]['size'] += pdf.get('file_size', 0)
                folders_stats[folder]['files'].append({
                    'filename': pdf.get('filename'),
                    'size': pdf.get('file_size', 0),
                    'uploaded_at': pdf.get('uploaded_at')
                })
            
            # Convertir a lista ordenada por tamaño
            folders_list = []
            for folder_name, stats in folders_stats.items():
                folders_list.append({
                    'folder_name': folder_name,
                    'count': stats['count'],
                    'size': stats['size'],
                    'files': sorted(stats['files'], key=lambda x: x['size'], reverse=True)[:10]  # Top 10 más grandes
                })
            
            folders_list.sort(key=lambda x: x['size'], reverse=True)
            
            # Obtener estadísticas de Firebase Storage si está disponible
            storage_info = {
                'available': False,
                'bucket_name': None
            }
            
            try:
                bucket = FirebaseConfig.get_storage_bucket()
                if bucket:
                    storage_info['available'] = True
                    storage_info['bucket_name'] = bucket.name
            except Exception as e:
                print(f"Firebase Storage no disponible: {e}")
            
            # Calcular archivos más grandes
            largest_files = sorted(pdfs, key=lambda x: x.get('file_size', 0), reverse=True)[:10]
            
            # Calcular archivos más recientes
            recent_files = sorted(
                [p for p in pdfs if p.get('uploaded_at')], 
                key=lambda x: x.get('uploaded_at', ''), 
                reverse=True
            )[:10]
            
            return jsonify({
                'success': True,
                'data': {
                    'total_files': total_files,
                    'total_size': total_size,
                    'folders': folders_list,
                    'largest_files': [{
                        'filename': f.get('filename'),
                        'folder_name': f.get('folder_name'),
                        'size': f.get('file_size', 0),
                        'uploaded_at': f.get('uploaded_at')
                    } for f in largest_files],
                    'recent_files': [{
                        'filename': f.get('filename'),
                        'folder_name': f.get('folder_name'),
                        'size': f.get('file_size', 0),
                        'uploaded_at': f.get('uploaded_at')
                    } for f in recent_files],
                    'storage_info': storage_info,
                    'username': username
                }
            })
        except ImportError as e:
            return jsonify({
                'success': False,
                'error': f'Firebase no está disponible: {str(e)}'
            }), 503
    except Exception as e:
        print(f"Error al obtener estadísticas de almacenamiento: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/pdf/<path:filename>/pages', methods=['GET'])
@login_required_api
def get_pdf_pages(filename):
    """API para obtener información de páginas de un PDF"""
    try:
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        folder_name = request.args.get('folder_name')
        if not folder_name:
            return jsonify({
                'success': False,
                'error': 'Nombre de carpeta requerido'
            }), 400
        
        # Buscar el PDF
        manifiesto_base = get_user_manifiesto_folder()
        if not manifiesto_base:
            return jsonify({'success': False, 'error': 'No se pudo determinar la carpeta del usuario'}), 500
        
        pdf_path = os.path.join(manifiesto_base, folder_name, filename)
        if not os.path.exists(pdf_path):
            return jsonify({
                'success': False,
                'error': 'PDF no encontrado'
            }), 404
        
        # Obtener información del PDF usando PyMuPDF
        try:
            import fitz
            doc = fitz.open(pdf_path)
            total_pages = len(doc)
            
            pages_info = []
            for page_num in range(total_pages):
                page = doc.load_page(page_num)
                page_info = {
                    'page_number': page_num + 1,
                    'width': page.rect.width,
                    'height': page.rect.height,
                    'rotation': page.rotation
                }
                pages_info.append(page_info)
            
            doc.close()
            
            return jsonify({
                'success': True,
                'data': {
                    'filename': filename,
                    'total_pages': total_pages,
                    'pages': pages_info
                }
            })
        except ImportError:
            return jsonify({
                'success': False,
                'error': 'PyMuPDF no está disponible'
            }), 503
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Error al leer PDF: {str(e)}'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/pdf/<path:filename>/thumbnail', methods=['GET'])
@login_required_api
def get_pdf_thumbnail(filename):
    """API para obtener la miniatura de una página del PDF como imagen PNG con caché"""
    try:
        import traceback
        
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        folder_name = request.args.get('folder_name')
        if not folder_name:
            return jsonify({
                'success': False,
                'error': 'Nombre de carpeta requerido'
            }), 400
        
        # Número de página (0-indexed), por defecto 0 (primera página)
        page_num = request.args.get('page', 0, type=int)

        # Calcular el zoom para la miniatura
        # Si se solicita tamaño grande (para modal), usar 800px, sino 150px
        size_param = request.args.get('size', 'small')
        
        # Decodificar el filename de la URL si es necesario
        try:
            from urllib.parse import unquote
            filename = unquote(filename)
        except Exception:
            pass  # Si falla, usar el filename tal cual
        
        # Generar ruta de caché para miniatura
        import hashlib
        cache_key = f"{username}_{folder_name}_{filename}_{page_num}_{size_param}"
        cache_hash = hashlib.md5(cache_key.encode()).hexdigest()
        
        # Directorio de caché (ruta absoluta para no depender del cwd)
        cache_dir = _CACHE_THUMBNAILS_BASE / username
        try:
            cache_dir.mkdir(parents=True, exist_ok=True)
        except Exception as e:
            print(f"[ERROR] Error al crear directorio de caché: {e}")
            return jsonify({
                'success': False,
                'error': f'Error al crear directorio de caché: {str(e)}'
            }), 500
        
        cache_path = cache_dir / f"{cache_hash}.png"
        cache_path_str = str(cache_path)
        
        # Verificar si existe en caché y es reciente (menos de 7 días)
        if cache_path.exists():
            try:
                import time
                file_age = time.time() - cache_path.stat().st_mtime
                max_age = 7 * 24 * 60 * 60  # 7 días en segundos
                
                if file_age < max_age:
                    return send_file(
                        cache_path_str,
                        mimetype='image/png',
                        as_attachment=False,
                        download_name=f'{filename}_page_{page_num + 1}.png',
                        max_age=604800
                    )
            except Exception as e:
                print(f"[ERROR] Error al leer caché: {e}")
                # Continuar para regenerar la miniatura
        
        # No está en caché o está antiguo, generar miniatura
        manifiesto_base = get_user_manifiesto_folder()
        if not manifiesto_base:
            print(f"[ERROR] No se pudo determinar la carpeta del usuario: {username}")
            return jsonify({'success': False, 'error': 'No se pudo determinar la carpeta del usuario'}), 500
        
        pdf_path = os.path.join(manifiesto_base, folder_name, filename)
        
        # Log para debugging
        print(f"[DEBUG] Buscando PDF en: {pdf_path}")
        print(f"[DEBUG] Ruta existe: {os.path.exists(pdf_path)}")
        
        if not os.path.exists(pdf_path):
            # Intentar buscar el archivo con diferentes variaciones del nombre
            folder_path = os.path.join(manifiesto_base, folder_name)
            if os.path.exists(folder_path):
                files_in_folder = os.listdir(folder_path)
                print(f"[DEBUG] Archivos en carpeta ({len(files_in_folder)} total): {files_in_folder[:10]}")  # Primeros 10 para no saturar
                # Buscar archivo similar
                for file in files_in_folder:
                    if file.replace(' ', '_') == filename.replace(' ', '_') or \
                       file.lower() == filename.lower():
                        pdf_path = os.path.join(folder_path, file)
                        print(f"[DEBUG] Archivo encontrado con variación: {pdf_path}")
                        break
        
        if not os.path.exists(pdf_path):
            print(f"[ERROR] PDF no encontrado en: {pdf_path}")
            print(f"[ERROR] Filename recibido: {filename}")
            print(f"[ERROR] Folder name: {folder_name}")
            return jsonify({
                'success': False,
                'error': f'PDF no encontrado: {filename}'
            }), 404
        
        # Generar miniatura de la página especificada usando PyMuPDF
        try:
            import fitz
            doc = None
            try:
                doc = fitz.open(pdf_path)
            except Exception as open_error:
                print(f"[ERROR] Error al abrir PDF: {open_error}")
                print(f"[ERROR] Traceback: {traceback.format_exc()}")
                return jsonify({
                    'success': False,
                    'error': f'Error al abrir PDF: {str(open_error)}'
                }), 500
            
            if len(doc) == 0:
                doc.close()
                return jsonify({
                    'success': False,
                    'error': 'PDF vacío'
                }), 400
            
            # Validar que el número de página sea válido
            if page_num < 0 or page_num >= len(doc):
                doc.close()
                return jsonify({
                    'success': False,
                    'error': f'Número de página inválido. El PDF tiene {len(doc)} página(s)'
                }), 400
            
            # Obtener la página solicitada
            try:
                page = doc.load_page(page_num)
            except Exception as page_error:
                doc.close()
                print(f"[ERROR] Error al cargar página {page_num}: {page_error}")
                print(f"[ERROR] Traceback: {traceback.format_exc()}")
                return jsonify({
                    'success': False,
                    'error': f'Error al cargar página: {str(page_error)}'
                }), 500
            
            # Calcular el zoom para la miniatura
            # Si se solicita tamaño grande (para modal), usar 800px, sino 150px
            max_width = 800 if size_param == 'large' else 150
            
            try:
                zoom = max_width / page.rect.width
                mat = fitz.Matrix(zoom, zoom)
            except Exception as zoom_error:
                doc.close()
                print(f"[ERROR] Error al calcular zoom: {zoom_error}")
                print(f"[ERROR] Traceback: {traceback.format_exc()}")
                return jsonify({
                    'success': False,
                    'error': f'Error al calcular zoom: {str(zoom_error)}'
                }), 500
            
            # Renderizar la página como imagen
            try:
                pix = page.get_pixmap(matrix=mat)
            except Exception as render_error:
                doc.close()
                print(f"[ERROR] Error al renderizar página: {render_error}")
                print(f"[ERROR] Traceback: {traceback.format_exc()}")
                return jsonify({
                    'success': False,
                    'error': f'Error al renderizar página: {str(render_error)}'
                }), 500
            
            # Guardar en caché
            try:
                pix.save(cache_path_str)
                print(f"[CACHE] Miniatura guardada: {cache_path_str}")
            except Exception as cache_error:
                print(f"[WARN] Error al guardar en caché: {cache_error}")
                # Continuar aunque falle el caché
            
            # Convertir a PNG en memoria para enviar
            try:
                img_bytes = BytesIO()
                img_bytes.write(pix.tobytes("png"))
                img_bytes.seek(0)
            except Exception as bytes_error:
                doc.close()
                print(f"[ERROR] Error al convertir a bytes: {bytes_error}")
                print(f"[ERROR] Traceback: {traceback.format_exc()}")
                return jsonify({
                    'success': False,
                    'error': f'Error al convertir imagen: {str(bytes_error)}'
                }), 500
            
            doc.close()
            
            # Devolver la imagen
            return send_file(
                img_bytes,
                mimetype='image/png',
                as_attachment=False,
                download_name=f'{filename}_page_{page_num + 1}.png',
                max_age=604800  # Cache en navegador por 7 días
            )
        except ImportError:
            print("[ERROR] PyMuPDF no está disponible")
            return jsonify({
                'success': False,
                'error': 'PyMuPDF no está disponible'
            }), 503
        except Exception as e:
            print(f"[ERROR] Error al generar miniatura: {e}")
            print(f"[ERROR] Traceback completo:")
            print(traceback.format_exc())
            return jsonify({
                'success': False,
                'error': f'Error al generar miniatura: {str(e)}'
            }), 500
            
    except Exception as e:
        print(f"[ERROR] Error general en get_pdf_thumbnail: {e}")
        print(f"[ERROR] Traceback completo:")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': f'Error interno: {str(e)}'
        }), 500

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
            
            # 1. Eliminar archivo físico local
            manifiesto_base = get_user_manifiesto_folder()
            if manifiesto_base:
                pdf_path = os.path.join(manifiesto_base, folder_name, filename)
                if os.path.exists(pdf_path):
                    try:
                        os.remove(pdf_path)
                        print(f"[OK] Archivo local eliminado: {pdf_path}")
                    except Exception as e:
                        print(f"Advertencia: No se pudo eliminar archivo local: {e}")
            
            # 2. Eliminar de Firebase Storage
            try:
                bucket = FirebaseConfig.get_storage_bucket()
                storage_path = f"pdfs/{username}/{folder_name}/{filename}"
                blob = bucket.blob(storage_path)
                
                if blob.exists():
                    blob.delete()
                    print(f"[OK] Archivo eliminado de Firebase Storage: {storage_path}")
                else:
                    print(f"[INFO] Archivo no encontrado en Storage: {storage_path}")
            except Exception as e:
                print(f"Advertencia: No se pudo eliminar de Firebase Storage: {e}")
            
            # 3. Eliminar de Firestore (soft delete)
            try:
                deleted = repo.soft_delete_pdf(username, folder_name, filename)
                if deleted:
                    print(f"[OK] PDF marcado como eliminado en Firestore: {filename}")
                else:
                    print(f"[INFO] PDF no encontrado en Firestore: {filename}")
            except Exception as e:
                print(f"Advertencia: No se pudo eliminar de Firestore: {e}")
            
            # 4. Limpiar caché de miniaturas (ruta absoluta)
            cache_dir = _CACHE_THUMBNAILS_BASE / username
            if cache_dir.exists():
                try:
                    import hashlib
                    for page_num in range(100):
                        cache_key = f"{username}_{folder_name}_{filename}_{page_num}"
                        cache_hash = hashlib.md5(cache_key.encode()).hexdigest()
                        cache_file = cache_dir / f"{cache_hash}.png"
                        if cache_file.exists():
                            cache_file.unlink()
                    print(f"[OK] Caché de miniaturas limpiado para: {filename}")
                except Exception as e:
                    print(f"Advertencia: Error al limpiar caché: {e}")
            
            return jsonify({
                'success': True,
                'message': f'PDF {filename} eliminado correctamente'
            })
            
        except ImportError as e:
            return jsonify({
                'success': False,
                'error': f'Firebase no está disponible: {str(e)}'
            }), 503
            
    except Exception as e:
        print(f"Error al eliminar PDF: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/pdf/<path:filename>/download', methods=['GET'])
@login_required_api
def download_pdf(filename):
    """API para descargar un PDF completo"""
    try:
        import traceback
        from urllib.parse import unquote
        
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        folder_name = request.args.get('folder_name')
        if not folder_name:
            return jsonify({
                'success': False,
                'error': 'Nombre de carpeta requerido'
            }), 400
        
        # Decodificar el filename de la URL si es necesario
        try:
            filename = unquote(filename)
        except Exception:
            pass  # Si falla, usar el filename tal cual
        
        # Buscar el PDF usando ruta absoluta desde _BACKEND_DIR
        manifiesto_base = get_user_manifiesto_folder()
        if not manifiesto_base:
            return jsonify({'success': False, 'error': 'No se pudo determinar la carpeta del usuario'}), 500
        
        # Construir ruta absoluta desde _BACKEND_DIR (los PDFs están en backend/MANIFIESTOS/)
        pdf_path = _BACKEND_DIR / manifiesto_base / folder_name / filename
        pdf_path = str(pdf_path)
        
        print(f"[DEBUG] Buscando PDF en: {pdf_path}")
        print(f"[DEBUG] Ruta existe: {os.path.exists(pdf_path)}")
        
        if not os.path.exists(pdf_path):
            # Intentar buscar el archivo con diferentes variaciones del nombre
            folder_path = _BACKEND_DIR / manifiesto_base / folder_name
            folder_path_str = str(folder_path)
            
            if os.path.exists(folder_path_str):
                try:
                    files_in_folder = os.listdir(folder_path_str)
                    print(f"[DEBUG] Archivos en carpeta ({len(files_in_folder)} total): {files_in_folder[:10]}")
                    # Buscar archivo similar
                    for file in files_in_folder:
                        if file.replace(' ', '_') == filename.replace(' ', '_') or \
                           file.lower() == filename.lower():
                            pdf_path = str(folder_path / file)
                            print(f"[DEBUG] Archivo encontrado con variación: {pdf_path}")
                            break
                except Exception as e:
                    print(f"[WARN] Error al listar archivos en carpeta: {e}")
            
            if not os.path.exists(pdf_path):
                print(f"[ERROR] PDF no encontrado en: {pdf_path}")
                print(f"[ERROR] Filename recibido: {filename}")
                print(f"[ERROR] Folder name: {folder_name}")
                return jsonify({
                    'success': False,
                    'error': f'PDF no encontrado: {filename}'
                }), 404
        
        # Verificar que es un archivo PDF
        if not pdf_path.lower().endswith('.pdf'):
            return jsonify({
                'success': False,
                'error': 'El archivo no es un PDF válido'
            }), 400
        
        print(f"[DEBUG] Descargando PDF: {pdf_path}")
        
        # Enviar el archivo PDF
        return send_file(
            pdf_path,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=filename
        )
        
    except Exception as e:
        print(f"[ERROR] Error al descargar PDF: {e}")
        print(f"[ERROR] Traceback completo:")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': f'Error al descargar PDF: {str(e)}'
        }), 500

@bp.route('/pdf/rename', methods=['POST'])
@login_required_api
def rename_pdf():
    """API para renombrar un PDF usando un patrón con campos del manifiesto"""
    import traceback
    
    try:
        print("[DEBUG] Iniciando rename_pdf")
        username = get_current_user()
        if not username:
            print("[ERROR] Usuario no autenticado")
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        data = request.get_json()
        if not data:
            print("[ERROR] No se recibieron datos JSON")
            return jsonify({
                'success': False,
                'error': 'No se recibieron datos en el cuerpo de la petición'
            }), 400
        
        print(f"[DEBUG] Datos recibidos: {data}")
        
        folder_name = data.get('folder_name')
        old_filename = data.get('old_filename')
        new_filename = data.get('new_filename')
        
        if not all([folder_name, old_filename, new_filename]):
            missing = []
            if not folder_name: missing.append('folder_name')
            if not old_filename: missing.append('old_filename')
            if not new_filename: missing.append('new_filename')
            print(f"[ERROR] Datos incompletos. Faltan: {', '.join(missing)}")
            return jsonify({
                'success': False,
                'error': f'Datos incompletos: {", ".join(missing)} son requeridos'
            }), 400
        
        # Validar que el nuevo nombre no esté vacío y tenga extensión .pdf
        new_filename = new_filename.strip()
        if not new_filename:
            return jsonify({
                'success': False,
                'error': 'El nuevo nombre no puede estar vacío'
            }), 400
        
        if not new_filename.lower().endswith('.pdf'):
            new_filename += '.pdf'
        
        # Sanitizar el nombre para evitar path traversal
        new_filename = os.path.basename(new_filename)
        
        manifiesto_base = get_user_manifiesto_folder()
        if not manifiesto_base:
            return jsonify({'success': False, 'error': 'No se pudo determinar la carpeta del usuario'}), 500
        
        old_path = _BACKEND_DIR / manifiesto_base / folder_name / old_filename
        new_path = _BACKEND_DIR / manifiesto_base / folder_name / new_filename
        
        old_path = str(old_path)
        new_path = str(new_path)
        
        print(f"[DEBUG] Ruta antigua: {old_path}")
        print(f"[DEBUG] Ruta nueva: {new_path}")
        
        if not os.path.exists(old_path):
            print(f"[ERROR] PDF no encontrado: {old_path}")
            return jsonify({
                'success': False,
                'error': f'PDF no encontrado: {old_filename}'
            }), 404
        
        if os.path.exists(new_path) and old_path != new_path:
            print(f"[ERROR] Ya existe un archivo con el nombre: {new_filename}")
            return jsonify({
                'success': False,
                'error': f'Ya existe un archivo con el nombre: {new_filename}'
            }), 400
        
        try:
            # Renombrar archivo
            os.rename(old_path, new_path)
            print(f"[OK] Archivo renombrado: {old_filename} -> {new_filename}")
            
            # Actualizar en Firebase Storage (si está disponible)
            try:
                from app.config.firebase_config import FirebaseConfig
                bucket = FirebaseConfig.get_storage_bucket()
                
                old_storage_path = f"pdfs/{username}/{folder_name}/{old_filename}"
                new_storage_path = f"pdfs/{username}/{folder_name}/{new_filename}"
                
                old_blob = bucket.blob(old_storage_path)
                if old_blob.exists():
                    # Copiar al nuevo nombre
                    bucket.copy_blob(old_blob, bucket, new_storage_path)
                    # Eliminar el antiguo
                    old_blob.delete()
                    print(f"[OK] PDF renombrado en Firebase Storage")
                else:
                    # Si no existe en storage, subir el nuevo
                    new_blob = bucket.blob(new_storage_path)
                    new_blob.upload_from_filename(new_path, content_type='application/pdf')
                    print(f"[OK] PDF subido a Firebase Storage con nuevo nombre")
            except ImportError:
                print("[WARN] Firebase no está disponible")
            except Exception as e:
                print(f"[WARN] No se pudo actualizar en Firebase Storage: {e}")
            
            # Actualizar en Firebase Firestore
            try:
                from app.database.pdfs_repository import PDFsRepository
                pdfs_repo = PDFsRepository()
                
                # Buscar el PDF por el nombre antiguo
                old_doc_id = f"{username}_{folder_name}_{old_filename}".replace('/', '_').replace('\\', '_')
                new_doc_id = f"{username}_{folder_name}_{new_filename}".replace('/', '_').replace('\\', '_')
                
                existing = pdfs_repo.get_by_id(old_doc_id)
                if existing:
                    # Eliminar el documento antiguo
                    pdfs_repo.delete(old_doc_id)
                    
                    # Crear nuevo documento con el nuevo nombre
                    existing['filename'] = new_filename
                    existing['file_path'] = new_path
                    if 'id' in existing:
                        del existing['id']
                    pdfs_repo.create(new_doc_id, existing)
                    print(f"[OK] Firestore actualizado")
            except Exception as e:
                print(f"[WARN] No se pudo actualizar Firestore: {e}")
            
            # Actualizar manifiesto en Firestore si existe
            try:
                from app.database.manifiestos_repository import ManifiestosRepository
                manifiestos_repo = ManifiestosRepository()
                
                # Buscar manifiesto por archivo
                filters = [
                    ('username', '==', username),
                    ('folder_name', '==', folder_name),
                    ('archivo', '==', old_filename)
                ]
                manifiestos = manifiestos_repo.get_all(filters)
                
                for manifiesto in manifiestos:
                    manifiestos_repo.update(manifiesto['id'], {
                        'archivo': new_filename
                    })
                    print(f"[OK] Manifiesto actualizado en Firestore")
            except Exception as e:
                print(f"[WARN] No se pudo actualizar manifiesto: {e}")
            
            # Limpiar y regenerar caché de miniaturas
            cache_dir = _CACHE_THUMBNAILS_BASE / username
            if cache_dir.exists():
                try:
                    import hashlib
                    # Eliminar miniaturas del archivo antiguo
                    for page_num in range(100):
                        old_cache_key = f"{username}_{folder_name}_{old_filename}_{page_num}"
                        old_cache_hash = hashlib.md5(old_cache_key.encode()).hexdigest()
                        old_cache_file = cache_dir / f"{old_cache_hash}.png"
                        if old_cache_file.exists():
                            old_cache_file.unlink()
                    print(f"[OK] Caché de miniaturas limpiado")
                except Exception as e:
                    print(f"[WARN] Error al limpiar caché: {e}")
            
            return jsonify({
                'success': True,
                'message': f'PDF renombrado correctamente: {old_filename} -> {new_filename}',
                'data': {
                    'old_filename': old_filename,
                    'new_filename': new_filename,
                    'folder_name': folder_name
                }
            })
            
        except Exception as e:
            print(f"[ERROR] Error al renombrar archivo: {e}")
            print(f"[ERROR] Traceback: {traceback.format_exc()}")
            return jsonify({
                'success': False,
                'error': f'Error al renombrar archivo: {str(e)}'
            }), 500
            
    except Exception as e:
        print(f"[ERROR] Error general en rename_pdf: {e}")
        print(f"[ERROR] Traceback completo:")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': f'Error interno: {str(e)}'
        }), 500

@bp.route('/pdf/bulk-rename', methods=['POST'])
@login_required_api
def bulk_rename_pdfs():
    """API para renombrar múltiples PDFs usando un patrón con campos del manifiesto"""
    import traceback
    import re
    
    try:
        print("[DEBUG] Iniciando bulk_rename_pdfs")
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No se recibieron datos en el cuerpo de la petición'
            }), 400
        
        folder_name = data.get('folder_name')
        pattern = data.get('pattern', '{load_id}_{remesa}')
        
        print(f"[DEBUG] folder_name: {folder_name}, pattern: {pattern}, username: {username}")
        
        if not folder_name:
            return jsonify({
                'success': False,
                'error': 'folder_name es requerido'
            }), 400
        
        # Obtener manifiestos de la carpeta
        try:
            from app.database.manifiestos_repository import ManifiestosRepository
            manifiestos_repo = ManifiestosRepository()
            
            filters = [
                ('username', '==', username),
                ('folder_name', '==', folder_name),
                ('active', '==', True)
            ]
            print(f"[DEBUG] Buscando manifiestos con filtros: {filters}")
            manifiestos = manifiestos_repo.get_all(filters)
            print(f"[DEBUG] Manifiestos encontrados: {len(manifiestos) if manifiestos else 0}")
            
            if not manifiestos:
                return jsonify({
                    'success': False,
                    'error': f'No se encontraron manifiestos procesados en esta carpeta. Usuario: {username}, Carpeta: {folder_name}'
                }), 404
            
            print(f"[DEBUG] Encontrados {len(manifiestos)} manifiestos para renombrar")
            
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
                        clean_value = str(value).replace('/', '-').replace('\\', '-').replace(':', '-').replace('*', '').replace('?', '').replace('"', '').replace('<', '').replace('>', '').replace('|', '')
                        new_filename = new_filename.replace(key, clean_value)
                    
                    # Agregar extensión .pdf si no la tiene
                    if not new_filename.lower().endswith('.pdf'):
                        new_filename += '.pdf'
                    
                    # Si el nombre no cambió, saltar
                    if new_filename == old_filename:
                        continue
                    
                    # Renombrar usando el endpoint interno
                    manifiesto_base = get_user_manifiesto_folder()
                    if not manifiesto_base:
                        continue
                    
                    old_path = _BACKEND_DIR / manifiesto_base / folder_name / old_filename
                    new_path = _BACKEND_DIR / manifiesto_base / folder_name / new_filename
                    
                    old_path = str(old_path)
                    new_path = str(new_path)
                    
                    if not os.path.exists(old_path):
                        errors.append(f"{old_filename}: Archivo no encontrado")
                        continue
                    
                    if os.path.exists(new_path):
                        errors.append(f"{old_filename}: Ya existe un archivo con el nombre {new_filename}")
                        continue
                    
                    # Renombrar archivo local
                    os.rename(old_path, new_path)
                    
                    # Renombrar archivo en Firebase Storage
                    firebase_renamed = False
                    try:
                        from app.config.firebase_config import FirebaseConfig
                        bucket = FirebaseConfig.get_storage_bucket()
                        
                        # Construir rutas en Firebase Storage
                        old_blob_path = f"pdfs/{username}/Manifiesto/{folder_name}/{old_filename}"
                        new_blob_path = f"pdfs/{username}/Manifiesto/{folder_name}/{new_filename}"
                        
                        print(f"[FIREBASE] Buscando archivo: {old_filename}")
                        print(f"[FIREBASE] Ruta esperada: {old_blob_path}")
                        
                        # Listar archivos en la carpeta para encontrar el archivo
                        prefix = f"{username}/Manifiesto/{folder_name}/"
                        blobs = list(bucket.list_blobs(prefix=prefix))
                        
                        print(f"[FIREBASE] Archivos encontrados en carpeta: {len(blobs)}")
                        
                        # Si no hay archivos, intentar con diferentes prefijos
                        if len(blobs) == 0:
                            print(f"[FIREBASE] Probando rutas alternativas...")
                            alternative_prefixes = [
                                f"{username}/{folder_name}/",
                                f"Manifiesto/{folder_name}/",
                                f"{folder_name}/",
                                f"{username}/",
                                ""  # Listar todo
                            ]
                            
                            for alt_prefix in alternative_prefixes:
                                alt_blobs = list(bucket.list_blobs(prefix=alt_prefix, max_results=10))
                                if len(alt_blobs) > 0:
                                    print(f"[FIREBASE] Encontrados {len(alt_blobs)} archivos con prefijo: '{alt_prefix}'")
                                    print(f"[FIREBASE] Ejemplos:")
                                    for i, b in enumerate(alt_blobs[:3]):
                                        print(f"[FIREBASE]   {i+1}. {b.name}")
                                    
                                    # Buscar el archivo en estos blobs
                                    for blob in alt_blobs:
                                        if blob.name.endswith(old_filename):
                                            blobs = [blob]
                                            print(f"[FIREBASE ✓] Archivo encontrado en prefijo alternativo: {blob.name}")
                                            break
                                    if len(blobs) > 0:
                                        break
                        
                        # Buscar el archivo por nombre
                        found_blob = None
                        for blob in blobs:
                            if blob.name.endswith(old_filename):
                                found_blob = blob
                                print(f"[FIREBASE ✓] Archivo encontrado: {blob.name}")
                                break
                        
                        if found_blob:
                            # Copiar a nuevo nombre
                            new_blob = bucket.blob(new_blob_path)
                            new_blob.upload_from_string(
                                found_blob.download_as_bytes(),
                                content_type='application/pdf'
                            )
                            # Eliminar el archivo antiguo
                            found_blob.delete()
                            firebase_renamed = True
                            print(f"[FIREBASE ✓] Renombrado exitosamente en Firebase Storage")
                            print(f"[FIREBASE ✓] De: {found_blob.name}")
                            print(f"[FIREBASE ✓] A: {new_blob_path}")
                        else:
                            print(f"[FIREBASE ⚠] Archivo no encontrado: {old_filename}")
                            if len(blobs) > 0:
                                print(f"[FIREBASE] Primeros archivos en la carpeta:")
                                for i, blob in enumerate(blobs[:5]):
                                    print(f"[FIREBASE]   {i+1}. {blob.name}")
                    except Exception as storage_error:
                        print(f"[FIREBASE ✗] Error al renombrar en Firebase Storage: {storage_error}")
                        import traceback
                        traceback.print_exc()
                        # No agregamos a errors porque el archivo local sí se renombró
                    
                    renamed_count += 1
                    renamed_files.append({
                        'old_name': old_filename,
                        'new_name': new_filename
                    })
                    
                    # Actualizar manifiesto en Firestore
                    manifiestos_repo.update(manifiesto['id'], {'archivo': new_filename})
                    
                    print(f"[OK] Renombrado localmente: {old_filename} -> {new_filename}")
                    
                except Exception as e:
                    errors.append(f"{old_filename}: {str(e)}")
                    print(f"[ERROR] Error al renombrar {old_filename}: {e}")
            
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
            return jsonify({
                'success': False,
                'error': 'Firebase no está disponible'
            }), 503
            
    except Exception as e:
        print(f"[ERROR] Error general en bulk_rename_pdfs: {e}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': f'Error interno: {str(e)}'
        }), 500

@bp.route('/pdf/split', methods=['POST'])
@login_required_api
def split_pdf():
    """API para dividir un PDF en dos archivos"""
    import traceback
    
    try:
        print("[DEBUG] Iniciando split_pdf")
        username = get_current_user()
        if not username:
            print("[ERROR] Usuario no autenticado")
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        data = request.get_json()
        if not data:
            print("[ERROR] No se recibieron datos JSON")
            return jsonify({
                'success': False,
                'error': 'No se recibieron datos en el cuerpo de la petición'
            }), 400
        
        print(f"[DEBUG] Datos recibidos: {data}")
        
        folder_name = data.get('folder_name')
        filename = data.get('filename')
        split_at_page = data.get('split_at_page')  # Página donde dividir (1-indexed)
        part1_name = data.get('part1_name', None)  # Nombre opcional para parte 1
        part2_name = data.get('part2_name', None)  # Nombre opcional para parte 2
        keep_original = data.get('keep_original', False)  # Si mantener el PDF original
        
        print(f"[DEBUG] folder_name: {folder_name}, filename: {filename}")
        print(f"[DEBUG] split_at_page: {split_at_page}, keep_original: {keep_original}")
        
        if not all([folder_name, filename, split_at_page]):
            missing = []
            if not folder_name: missing.append('folder_name')
            if not filename: missing.append('filename')
            if not split_at_page: missing.append('split_at_page')
            print(f"[ERROR] Datos incompletos. Faltan: {', '.join(missing)}")
            return jsonify({
                'success': False,
                'error': f'Datos incompletos: {", ".join(missing)} son requeridos'
            }), 400
        
        try:
            split_at_page = int(split_at_page)
        except (ValueError, TypeError):
            return jsonify({
                'success': False,
                'error': 'split_at_page debe ser un número válido'
            }), 400
        
        manifiesto_base = get_user_manifiesto_folder()
        if not manifiesto_base:
            print("[ERROR] No se pudo determinar la carpeta del usuario")
            return jsonify({'success': False, 'error': 'No se pudo determinar la carpeta del usuario'}), 500
        
        print(f"[DEBUG] Carpeta base del usuario: {manifiesto_base}")
        
        pdf_path = _BACKEND_DIR / manifiesto_base / folder_name / filename
        pdf_path = str(pdf_path)
        
        print(f"[DEBUG] Ruta del PDF: {pdf_path}")
        print(f"[DEBUG] Archivo existe: {os.path.exists(pdf_path)}")
        
        if not os.path.exists(pdf_path):
            print(f"[ERROR] PDF no encontrado en: {pdf_path}")
            return jsonify({
                'success': False,
                'error': f'PDF no encontrado: {filename} en carpeta {folder_name}'
            }), 404
        
        try:
            import fitz
            print("[DEBUG] PyMuPDF importado correctamente")
            
            # Abrir PDF
            print("[DEBUG] Abriendo PDF...")
            try:
                doc = fitz.open(pdf_path)
                print(f"[DEBUG] PDF abierto. Páginas totales: {len(doc)}")
            except Exception as e:
                print(f"[ERROR] Error al abrir PDF: {e}")
                print(f"[ERROR] Traceback: {traceback.format_exc()}")
                return jsonify({
                    'success': False,
                    'error': f'Error al abrir PDF: {str(e)}'
                }), 500
            
            total_pages = len(doc)
            
            # Validar página de división
            if split_at_page < 1 or split_at_page >= total_pages:
                doc.close()
                print(f"[ERROR] Página de división inválida: {split_at_page}, Total páginas: {total_pages}")
                return jsonify({
                    'success': False,
                    'error': f'La página de división debe estar entre 1 y {total_pages - 1}. El PDF tiene {total_pages} página(s)'
                }), 400
            
            print(f"[DEBUG] Dividiendo en página {split_at_page}")
            
            # Generar nombres para las partes si no se proporcionaron
            base_name = os.path.splitext(filename)[0]
            if not part1_name:
                part1_name = f"{base_name}_parte1.pdf"
            elif not part1_name.lower().endswith('.pdf'):
                part1_name += '.pdf'
            
            if not part2_name:
                part2_name = f"{base_name}_parte2.pdf"
            elif not part2_name.lower().endswith('.pdf'):
                part2_name += '.pdf'
            
            # Sanitizar nombres
            part1_name = os.path.basename(part1_name)
            part2_name = os.path.basename(part2_name)
            
            folder_path = _BACKEND_DIR / manifiesto_base / folder_name
            part1_path = str(folder_path / part1_name)
            part2_path = str(folder_path / part2_name)
            
            print(f"[DEBUG] Parte 1: {part1_path} (páginas 1-{split_at_page})")
            print(f"[DEBUG] Parte 2: {part2_path} (páginas {split_at_page + 1}-{total_pages})")
            
            # Verificar que los nombres no existan
            if os.path.exists(part1_path):
                doc.close()
                return jsonify({
                    'success': False,
                    'error': f'Ya existe un archivo con el nombre: {part1_name}'
                }), 400
            
            if os.path.exists(part2_path):
                doc.close()
                return jsonify({
                    'success': False,
                    'error': f'Ya existe un archivo con el nombre: {part2_name}'
                }), 400
            
            # Crear documentos para las partes
            print("[DEBUG] Creando documentos para las partes...")
            try:
                # Parte 1: páginas 0 a split_at_page-1 (0-indexed)
                part1_doc = fitz.open()
                part1_doc.insert_pdf(doc, from_page=0, to_page=split_at_page - 1)
                
                # Parte 2: páginas split_at_page a total_pages-1 (0-indexed)
                part2_doc = fitz.open()
                part2_doc.insert_pdf(doc, from_page=split_at_page, to_page=total_pages - 1)
                
                print(f"[DEBUG] Parte 1 creada con {len(part1_doc)} página(s)")
                print(f"[DEBUG] Parte 2 creada con {len(part2_doc)} página(s)")
            except Exception as e:
                doc.close()
                print(f"[ERROR] Error al crear partes: {e}")
                print(f"[ERROR] Traceback: {traceback.format_exc()}")
                return jsonify({
                    'success': False,
                    'error': f'Error al crear partes: {str(e)}'
                }), 500
            
            # Guardar las partes
            print("[DEBUG] Guardando partes...")
            try:
                part1_doc.save(part1_path, garbage=4, deflate=True)
                part1_doc.close()
                print(f"[OK] Parte 1 guardada: {part1_path}")
                
                part2_doc.save(part2_path, garbage=4, deflate=True)
                part2_doc.close()
                print(f"[OK] Parte 2 guardada: {part2_path}")
                
                doc.close()
            except Exception as e:
                try:
                    part1_doc.close()
                    part2_doc.close()
                    doc.close()
                except:
                    pass
                # Limpiar archivos si se crearon
                try:
                    if os.path.exists(part1_path):
                        os.remove(part1_path)
                    if os.path.exists(part2_path):
                        os.remove(part2_path)
                except:
                    pass
                print(f"[ERROR] Error al guardar partes: {e}")
                print(f"[ERROR] Traceback: {traceback.format_exc()}")
                return jsonify({
                    'success': False,
                    'error': f'Error al guardar partes: {str(e)}'
                }), 500
            
            # Eliminar original si se solicitó
            if not keep_original:
                try:
                    print("[DEBUG] Eliminando PDF original...")
                    os.remove(pdf_path)
                    print(f"[OK] PDF original eliminado: {pdf_path}")
                    
                    # Eliminar de Firebase Storage
                    try:
                        from app.config.firebase_config import FirebaseConfig
                        bucket = FirebaseConfig.get_storage_bucket()
                        storage_path = f"pdfs/{username}/{folder_name}/{filename}"
                        blob = bucket.blob(storage_path)
                        if blob.exists():
                            blob.delete()
                            print(f"[OK] PDF eliminado de Firebase Storage")
                    except Exception as e:
                        print(f"[WARN] No se pudo eliminar de Firebase Storage: {e}")
                    
                    # Eliminar de Firestore
                    try:
                        from app.database.pdfs_repository import PDFsRepository
                        pdfs_repo = PDFsRepository()
                        doc_id = f"{username}_{folder_name}_{filename}".replace('/', '_').replace('\\', '_')
                        pdfs_repo.delete(doc_id)
                        print(f"[OK] Registro eliminado de Firestore")
                    except Exception as e:
                        print(f"[WARN] No se pudo eliminar de Firestore: {e}")
                except Exception as e:
                    print(f"[WARN] No se pudo eliminar PDF original: {e}")
            
            # Subir partes a Firebase Storage
            storage_urls = {}
            try:
                from app.config.firebase_config import FirebaseConfig
                bucket = FirebaseConfig.get_storage_bucket()
                
                for part_name, part_path_str in [(part1_name, part1_path), (part2_name, part2_path)]:
                    storage_path = f"pdfs/{username}/{folder_name}/{part_name}"
                    blob = bucket.blob(storage_path)
                    blob.upload_from_filename(part_path_str, content_type='application/pdf')
                    try:
                        blob.make_public()
                        storage_urls[part_name] = blob.public_url
                    except:
                        storage_urls[part_name] = blob.generate_signed_url(expiration=31536000)
                    print(f"[OK] {part_name} subido a Firebase Storage")
            except ImportError:
                print("[WARN] Firebase no está disponible")
            except Exception as e:
                print(f"[WARN] No se pudo subir a Firebase Storage: {e}")
            
            # Crear registros en Firestore para las partes
            try:
                from app.database.pdfs_repository import PDFsRepository
                pdfs_repo = PDFsRepository()
                
                # Parte 1
                part1_size = os.path.getsize(part1_path) if os.path.exists(part1_path) else 0
                pdfs_repo.create_pdf_record(
                    username=username,
                    folder_name=folder_name,
                    filename=part1_name,
                    file_path=part1_path,
                    file_size=part1_size,
                    metadata={
                        'split_from': filename,
                        'part': 1,
                        'pages_range': f"1-{split_at_page}",
                        'storage_url': storage_urls.get(part1_name)
                    },
                    total_pages=split_at_page
                )
                
                # Parte 2
                part2_size = os.path.getsize(part2_path) if os.path.exists(part2_path) else 0
                part2_pages = total_pages - split_at_page
                pdfs_repo.create_pdf_record(
                    username=username,
                    folder_name=folder_name,
                    filename=part2_name,
                    file_path=part2_path,
                    file_size=part2_size,
                    metadata={
                        'split_from': filename,
                        'part': 2,
                        'pages_range': f"{split_at_page + 1}-{total_pages}",
                        'storage_url': storage_urls.get(part2_name)
                    },
                    total_pages=part2_pages
                )
                print(f"[OK] Registros creados en Firestore")
            except Exception as e:
                print(f"[WARN] No se pudo crear registros en Firestore: {e}")
            
            print("[DEBUG] División completada exitosamente")
            return jsonify({
                'success': True,
                'message': f'PDF dividido exitosamente en 2 partes',
                'data': {
                    'original_filename': filename,
                    'original_pages': total_pages,
                    'split_at_page': split_at_page,
                    'part1': {
                        'filename': part1_name,
                        'pages': split_at_page,
                        'pages_range': f"1-{split_at_page}"
                    },
                    'part2': {
                        'filename': part2_name,
                        'pages': total_pages - split_at_page,
                        'pages_range': f"{split_at_page + 1}-{total_pages}"
                    },
                    'original_deleted': not keep_original
                }
            })
            
        except ImportError as e:
            print(f"[ERROR] PyMuPDF no está disponible: {e}")
            return jsonify({
                'success': False,
                'error': f'PyMuPDF no está disponible: {str(e)}'
            }), 503
        except Exception as e:
            print(f"[ERROR] Error al dividir PDF: {e}")
            print(f"[ERROR] Traceback completo:")
            print(traceback.format_exc())
            return jsonify({
                'success': False,
                'error': f'Error al dividir PDF: {str(e)}',
                'details': traceback.format_exc()
            }), 500
            
    except Exception as e:
        print(f"[ERROR] Error general en split_pdf: {e}")
        print(f"[ERROR] Traceback completo:")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': f'Error interno: {str(e)}',
            'details': traceback.format_exc()
        }), 500

@bp.route('/pdf/delete-pages', methods=['POST'])
@login_required_api
def delete_pdf_pages():
    """API para eliminar páginas específicas de un PDF"""
    import traceback
    
    try:
        print("[DEBUG] Iniciando delete_pdf_pages")
        username = get_current_user()
        if not username:
            print("[ERROR] Usuario no autenticado")
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        print(f"[DEBUG] Usuario autenticado: {username}")
        
        data = request.get_json()
        if not data:
            print("[ERROR] No se recibieron datos JSON")
            return jsonify({
                'success': False,
                'error': 'No se recibieron datos en el cuerpo de la petición'
            }), 400
        
        print(f"[DEBUG] Datos recibidos: {data}")
        
        folder_name = data.get('folder_name')
        filename = data.get('filename')
        pages_to_delete = data.get('pages', [])  # Lista de números de página (1-indexed)
        
        print(f"[DEBUG] folder_name: {folder_name}, filename: {filename}")
        print(f"[DEBUG] pages_to_delete: {pages_to_delete}")
        
        if not all([folder_name, filename]):
            missing = []
            if not folder_name: missing.append('folder_name')
            if not filename: missing.append('filename')
            print(f"[ERROR] Datos incompletos. Faltan: {', '.join(missing)}")
            return jsonify({
                'success': False,
                'error': f'Datos incompletos: {", ".join(missing)} son requeridos'
            }), 400
        
        if not pages_to_delete or len(pages_to_delete) == 0:
            print("[ERROR] No se especificaron páginas para eliminar")
            return jsonify({
                'success': False,
                'error': 'Debe especificar al menos una página para eliminar'
            }), 400
        
        manifiesto_base = get_user_manifiesto_folder()
        if not manifiesto_base:
            print("[ERROR] No se pudo determinar la carpeta del usuario")
            return jsonify({'success': False, 'error': 'No se pudo determinar la carpeta del usuario'}), 500
        
        print(f"[DEBUG] Carpeta base del usuario: {manifiesto_base}")
        
        pdf_path = _BACKEND_DIR / manifiesto_base / folder_name / filename
        pdf_path = str(pdf_path)
        
        print(f"[DEBUG] Ruta del PDF: {pdf_path}")
        print(f"[DEBUG] Archivo existe: {os.path.exists(pdf_path)}")
        
        if not os.path.exists(pdf_path):
            print(f"[ERROR] PDF no encontrado en: {pdf_path}")
            return jsonify({
                'success': False,
                'error': f'PDF no encontrado: {filename} en carpeta {folder_name}'
            }), 404
        
        try:
            import fitz
            print("[DEBUG] PyMuPDF importado correctamente")
            
            # Abrir PDF
            print("[DEBUG] Abriendo PDF...")
            try:
                doc = fitz.open(pdf_path)
                print(f"[DEBUG] PDF abierto. Páginas totales: {len(doc)}")
            except Exception as e:
                print(f"[ERROR] Error al abrir PDF: {e}")
                print(f"[ERROR] Traceback: {traceback.format_exc()}")
                return jsonify({
                    'success': False,
                    'error': f'Error al abrir PDF: {str(e)}'
                }), 500
            
            total_pages = len(doc)
            
            # Validar páginas a eliminar
            valid_pages = sorted([p for p in pages_to_delete if 1 <= p <= total_pages], reverse=True)
            if not valid_pages:
                doc.close()
                print(f"[ERROR] No hay páginas válidas. Páginas solicitadas: {pages_to_delete}, Total páginas: {total_pages}")
                return jsonify({
                    'success': False,
                    'error': f'No hay páginas válidas para eliminar. El PDF tiene {total_pages} página(s)'
                }), 400
            
            # Verificar que no se eliminen todas las páginas
            if len(valid_pages) >= total_pages:
                doc.close()
                print(f"[ERROR] No se pueden eliminar todas las páginas del PDF")
                return jsonify({
                    'success': False,
                    'error': 'No se pueden eliminar todas las páginas del PDF. Debe quedar al menos una página.'
                }), 400
            
            print(f"[DEBUG] Páginas válidas a eliminar: {valid_pages}")
            
            # Eliminar páginas (en orden inverso para no afectar índices)
            print("[DEBUG] Eliminando páginas...")
            try:
                for page_num in valid_pages:
                    # page_num es 1-indexed, fitz usa 0-indexed
                    page_index = page_num - 1
                    print(f"[DEBUG] Eliminando página {page_num} (índice {page_index})")
                    doc.delete_page(page_index)
                print("[DEBUG] Páginas eliminadas correctamente")
            except Exception as e:
                doc.close()
                print(f"[ERROR] Error al eliminar páginas: {e}")
                print(f"[ERROR] Traceback: {traceback.format_exc()}")
                return jsonify({
                    'success': False,
                    'error': f'Error al eliminar páginas: {str(e)}'
                }), 500
            
            # Guardar el PDF actualizado
            # PyMuPDF no permite guardar sobre el mismo archivo sin modo incremental
            # cuando se eliminan páginas, así que guardamos en temporal y reemplazamos
            print("[DEBUG] Guardando PDF...")
            try:
                import tempfile
                import shutil
                
                new_total_pages = len(doc)
                
                # Crear archivo temporal
                temp_fd, temp_path = tempfile.mkstemp(suffix='.pdf')
                os.close(temp_fd)  # Cerrar el descriptor de archivo
                
                print(f"[DEBUG] Guardando en temporal: {temp_path}")
                doc.save(temp_path, garbage=4, deflate=True)
                doc.close()
                
                # Reemplazar el archivo original con el temporal
                print(f"[DEBUG] Reemplazando archivo original: {pdf_path}")
                shutil.move(temp_path, pdf_path)
                
                print(f"[DEBUG] PDF guardado correctamente en: {pdf_path}")
            except Exception as e:
                try:
                    doc.close()
                except:
                    pass
                # Limpiar archivo temporal si existe
                try:
                    if 'temp_path' in locals() and os.path.exists(temp_path):
                        os.remove(temp_path)
                except:
                    pass
                print(f"[ERROR] Error al guardar PDF: {e}")
                print(f"[ERROR] Traceback: {traceback.format_exc()}")
                return jsonify({
                    'success': False,
                    'error': f'Error al guardar PDF: {str(e)}'
                }), 500
            
            # Actualizar en Firebase Storage (si está disponible)
            storage_url = None
            try:
                from app.config.firebase_config import FirebaseConfig
                bucket = FirebaseConfig.get_storage_bucket()
                storage_path = f"pdfs/{username}/{folder_name}/{filename}"
                blob = bucket.blob(storage_path)
                blob.upload_from_filename(pdf_path, content_type='application/pdf')
                try:
                    blob.make_public()
                    storage_url = blob.public_url
                except:
                    storage_url = blob.generate_signed_url(expiration=31536000)
                print(f"[OK] PDF actualizado en Firebase Storage: {storage_path}")
            except ImportError:
                print("[WARN] Firebase no está disponible, omitiendo actualización de Storage")
            except Exception as e:
                print(f"[WARN] No se pudo actualizar en Firebase Storage: {e}")
                storage_url = None
            
            # Actualizar Firebase Firestore: actualizar tamaño y total de páginas
            try:
                from app.database.pdfs_repository import PDFsRepository
                pdfs_repo = PDFsRepository()
                new_size = os.path.getsize(pdf_path) if os.path.exists(pdf_path) else 0
                # Actualizar metadata del PDF
                doc_id = f"{username}_{folder_name}_{filename}".replace('/', '_').replace('\\', '_')
                # Obtener metadata actual
                existing = pdfs_repo.get_by_id(doc_id)
                metadata = existing.get('metadata', {}) if existing else {}
                metadata['deleted_pages'] = valid_pages
                metadata['last_modified'] = 'delete_pages'
                if storage_url:
                    metadata['storage_url'] = storage_url
                    metadata['storage_path'] = f"pdfs/{username}/{folder_name}/{filename}"
                pdfs_repo.update(doc_id, {
                    'file_size': new_size,
                    'total_pages': new_total_pages,
                    'metadata': metadata
                })
                print(f"[OK] Firestore actualizado para PDF")
            except Exception as e:
                print(f"[WARN] No se pudo actualizar Firestore: {e}")
            
            # Limpiar caché de miniaturas de las páginas eliminadas
            cache_dir = _CACHE_THUMBNAILS_BASE / username
            if cache_dir.exists():
                try:
                    import hashlib
                    for page_num in valid_pages:
                        cache_key = f"{username}_{folder_name}_{filename}_{page_num - 1}"
                        cache_hash = hashlib.md5(cache_key.encode()).hexdigest()
                        cache_file = cache_dir / f"{cache_hash}.png"
                        if cache_file.exists():
                            cache_file.unlink()
                    print(f"[OK] Caché de miniaturas limpiado")
                except Exception as e:
                    print(f"[WARN] Error al limpiar caché: {e}")
            
            print("[DEBUG] Eliminación de páginas completada exitosamente")
            return jsonify({
                'success': True,
                'message': f'Se eliminaron {len(valid_pages)} página(s) de "{filename}"',
                'data': {
                    'pages_deleted': valid_pages,
                    'original_total_pages': total_pages,
                    'new_total_pages': new_total_pages,
                    'filename': filename
                }
            })
            
        except ImportError as e:
            print(f"[ERROR] PyMuPDF no está disponible: {e}")
            return jsonify({
                'success': False,
                'error': f'PyMuPDF no está disponible: {str(e)}'
            }), 503
        except Exception as e:
            print(f"[ERROR] Error al eliminar páginas del PDF: {e}")
            print(f"[ERROR] Traceback completo:")
            print(traceback.format_exc())
            return jsonify({
                'success': False,
                'error': f'Error al eliminar páginas: {str(e)}',
                'details': traceback.format_exc()
            }), 500
            
    except Exception as e:
        print(f"[ERROR] Error general en delete_pdf_pages: {e}")
        print(f"[ERROR] Traceback completo:")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': f'Error interno: {str(e)}',
            'details': traceback.format_exc()
        }), 500

@bp.route('/pdf/merge', methods=['POST'])
@login_required_api
def merge_pdf_pages():
    """API para fusionar páginas de un PDF en otro PDF"""
    import traceback
    
    try:
        print("[DEBUG] Iniciando merge_pdf_pages")
        username = get_current_user()
        if not username:
            print("[ERROR] Usuario no autenticado")
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        print(f"[DEBUG] Usuario autenticado: {username}")
        
        data = request.get_json()
        if not data:
            print("[ERROR] No se recibieron datos JSON")
            return jsonify({
                'success': False,
                'error': 'No se recibieron datos en el cuerpo de la petición'
            }), 400
        
        print(f"[DEBUG] Datos recibidos: {data}")
        
        source_folder = data.get('source_folder')
        source_filename = data.get('source_filename')
        target_folder = data.get('target_folder')
        target_filename = data.get('target_filename')
        pages_to_move = data.get('pages', [])  # Lista de números de página (1-indexed)
        insert_position = data.get('insert_position', None)  # Posición de inserción (0-indexed, None = al final)
        
        print(f"[DEBUG] source_folder: {source_folder}, source_filename: {source_filename}")
        print(f"[DEBUG] target_folder: {target_folder}, target_filename: {target_filename}")
        print(f"[DEBUG] pages_to_move: {pages_to_move}, insert_position: {insert_position}")
        
        if not all([source_folder, source_filename, target_folder, target_filename]):
            missing = []
            if not source_folder: missing.append('source_folder')
            if not source_filename: missing.append('source_filename')
            if not target_folder: missing.append('target_folder')
            if not target_filename: missing.append('target_filename')
            print(f"[ERROR] Datos incompletos. Faltan: {', '.join(missing)}")
            return jsonify({
                'success': False,
                'error': f'Datos incompletos: {", ".join(missing)} son requeridos'
            }), 400
        
        manifiesto_base = get_user_manifiesto_folder()
        if not manifiesto_base:
            print("[ERROR] No se pudo determinar la carpeta del usuario")
            return jsonify({'success': False, 'error': 'No se pudo determinar la carpeta del usuario'}), 500
        
        print(f"[DEBUG] Carpeta base del usuario: {manifiesto_base}")
        
        source_path = os.path.join(manifiesto_base, source_folder, source_filename)
        target_path = os.path.join(manifiesto_base, target_folder, target_filename)
        
        print(f"[DEBUG] Ruta origen: {source_path}")
        print(f"[DEBUG] Ruta destino: {target_path}")
        print(f"[DEBUG] Archivo origen existe: {os.path.exists(source_path)}")
        print(f"[DEBUG] Archivo destino existe: {os.path.exists(target_path)}")
        
        if not os.path.exists(source_path):
            print(f"[ERROR] PDF origen no encontrado en: {source_path}")
            return jsonify({
                'success': False,
                'error': f'PDF origen no encontrado: {source_filename} en carpeta {source_folder}'
            }), 404
        
        if not os.path.exists(target_path):
            print(f"[ERROR] PDF destino no encontrado en: {target_path}")
            return jsonify({
                'success': False,
                'error': f'PDF destino no encontrado: {target_filename} en carpeta {target_folder}'
            }), 404
        
        try:
            import fitz
            print("[DEBUG] PyMuPDF importado correctamente")
            
            # Abrir PDFs
            print("[DEBUG] Abriendo PDF origen...")
            try:
                source_doc = fitz.open(source_path)
                print(f"[DEBUG] PDF origen abierto. Páginas: {len(source_doc)}")
            except Exception as e:
                print(f"[ERROR] Error al abrir PDF origen: {e}")
                print(f"[ERROR] Traceback: {traceback.format_exc()}")
                return jsonify({
                    'success': False,
                    'error': f'Error al abrir PDF origen: {str(e)}'
                }), 500
            
            print("[DEBUG] Abriendo PDF destino...")
            try:
                target_doc = fitz.open(target_path)
                print(f"[DEBUG] PDF destino abierto. Páginas: {len(target_doc)}")
            except Exception as e:
                source_doc.close()
                print(f"[ERROR] Error al abrir PDF destino: {e}")
                print(f"[ERROR] Traceback: {traceback.format_exc()}")
                return jsonify({
                    'success': False,
                    'error': f'Error al abrir PDF destino: {str(e)}'
                }), 500
            
            # Si no se especifican páginas, mover todas
            if not pages_to_move:
                pages_to_move = list(range(1, len(source_doc) + 1))
                print(f"[DEBUG] No se especificaron páginas, moviendo todas: {pages_to_move}")
            
            # Validar páginas
            valid_pages = [p for p in pages_to_move if 1 <= p <= len(source_doc)]
            if not valid_pages:
                source_doc.close()
                target_doc.close()
                print(f"[ERROR] No hay páginas válidas. Páginas solicitadas: {pages_to_move}, Total páginas origen: {len(source_doc)}")
                return jsonify({
                    'success': False,
                    'error': f'No hay páginas válidas para mover. El PDF origen tiene {len(source_doc)} página(s)'
                }), 400
            
            print(f"[DEBUG] Páginas válidas para mover: {valid_pages}")
            
            # Determinar posición de inserción
            # insert_position: None = al final, 0 = al inicio, N = después de la página N (0-indexed)
            if insert_position is None:
                # Insertar al final (comportamiento por defecto)
                insert_at = len(target_doc)
                print(f"[DEBUG] Insertando al final (posición {insert_at})")
            else:
                # Validar posición de inserción
                try:
                    insert_at = int(insert_position)
                    if insert_at < 0:
                        insert_at = 0
                    elif insert_at > len(target_doc):
                        insert_at = len(target_doc)
                    print(f"[DEBUG] Insertando en posición {insert_at}")
                except (ValueError, TypeError) as e:
                    source_doc.close()
                    target_doc.close()
                    print(f"[ERROR] Posición de inserción inválida: {insert_position}, error: {e}")
                    return jsonify({
                        'success': False,
                        'error': f'Posición de inserción inválida: {insert_position}'
                    }), 400
            
            # Insertar páginas del PDF origen al PDF destino en la posición especificada
            print("[DEBUG] Insertando páginas...")
            try:
                # Crear un documento temporal con solo las páginas seleccionadas
                # Esto es más eficiente y mantiene el orden correcto
                temp_doc = fitz.open()  # Crear documento vacío
                
                # Convertir números de página a índices (1-indexed -> 0-indexed) y ordenar
                page_indices = sorted([p - 1 for p in valid_pages])
                
                print(f"[DEBUG] Creando documento temporal con páginas: {valid_pages} (índices: {page_indices})")
                
                # Copiar las páginas seleccionadas al documento temporal
                for page_idx in page_indices:
                    temp_doc.insert_pdf(source_doc, from_page=page_idx, to_page=page_idx)
                    print(f"[DEBUG] Página {page_idx + 1} copiada al documento temporal")
                
                # Insertar todas las páginas del documento temporal en el documento destino
                print(f"[DEBUG] Insertando {len(temp_doc)} página(s) en posición {insert_at}")
                target_doc.insert_pdf(temp_doc, start_at=insert_at)
                
                # Cerrar documento temporal
                temp_doc.close()
                
                print("[DEBUG] Páginas insertadas correctamente")
            except Exception as e:
                source_doc.close()
                target_doc.close()
                if 'temp_doc' in locals():
                    temp_doc.close()
                print(f"[ERROR] Error al insertar páginas: {e}")
                print(f"[ERROR] Traceback: {traceback.format_exc()}")
                return jsonify({
                    'success': False,
                    'error': f'Error al insertar páginas: {str(e)}'
                }), 500
            
            # Guardar el PDF destino actualizado
            print("[DEBUG] Guardando PDF destino...")
            try:
                target_doc.save(target_path, incremental=True, encryption=fitz.PDF_ENCRYPT_KEEP)
                print(f"[DEBUG] PDF guardado correctamente en: {target_path}")
            except Exception as e:
                source_doc.close()
                target_doc.close()
                print(f"[ERROR] Error al guardar PDF destino: {e}")
                print(f"[ERROR] Traceback: {traceback.format_exc()}")
                return jsonify({
                    'success': False,
                    'error': f'Error al guardar PDF destino: {str(e)}'
                }), 500
            
            target_doc.close()
            
            # Actualizar en Firebase Storage (si está disponible)
            storage_url = None
            try:
                from app.config.firebase_config import FirebaseConfig
                bucket = FirebaseConfig.get_storage_bucket()
                storage_path = f"pdfs/{username}/{target_folder}/{target_filename}"
                blob = bucket.blob(storage_path)
                blob.upload_from_filename(target_path, content_type='application/pdf')
                try:
                    blob.make_public()
                    storage_url = blob.public_url
                except:
                    storage_url = blob.generate_signed_url(expiration=31536000)
                print(f"[OK] PDF actualizado en Firebase Storage: {storage_path}")
            except ImportError:
                print("[WARN] Firebase no está disponible, omitiendo actualización de Storage")
            except Exception as e:
                print(f"[WARN] No se pudo actualizar en Firebase Storage: {e}")
                storage_url = None
            
            # Si el PDF origen solo tenía una página y se movió, eliminarlo
            pages_moved = len(valid_pages)
            total_source_pages = len(source_doc)
            source_doc.close()
            
            print(f"[DEBUG] Páginas movidas: {pages_moved}, Total páginas origen: {total_source_pages}")
            
            delete_source = False
            if pages_moved == total_source_pages:
                # Todas las páginas se movieron, eliminar el PDF origen
                print("[DEBUG] Todas las páginas fueron movidas, eliminando PDF origen...")
                try:
                    os.remove(source_path)
                    delete_source = True
                    print(f"[OK] PDF origen eliminado: {source_path}")
                    
                    # Eliminar de Firebase Storage
                    try:
                        from app.config.firebase_config import FirebaseConfig
                        bucket = FirebaseConfig.get_storage_bucket()
                        source_storage_path = f"pdfs/{username}/{source_folder}/{source_filename}"
                        blob = bucket.blob(source_storage_path)
                        blob.delete()
                        print(f"[OK] PDF eliminado de Firebase Storage: {source_storage_path}")
                    except Exception as e:
                        print(f"[WARN] No se pudo eliminar de Firebase Storage: {e}")
                    
                    # Actualizar Firebase Firestore: eliminar registro del PDF origen
                    try:
                        from app.database.pdfs_repository import PDFsRepository
                        pdfs_repo = PDFsRepository()
                        pdfs_repo.delete_pdf_record(username, source_folder, source_filename)
                        print(f"[OK] Registro eliminado de Firestore")
                    except Exception as e:
                        print(f"[WARN] No se pudo actualizar Firestore: {e}")
                except Exception as e:
                    print(f"[WARN] No se pudo eliminar PDF origen: {e}")
            
            # Actualizar Firebase Firestore: actualizar tamaño del PDF destino
            try:
                from app.database.pdfs_repository import PDFsRepository
                pdfs_repo = PDFsRepository()
                new_size = os.path.getsize(target_path) if os.path.exists(target_path) else 0
                # Actualizar metadata del PDF destino
                doc_id = f"{username}_{target_folder}_{target_filename}".replace('/', '_').replace('\\', '_')
                # Obtener metadata actual
                existing = pdfs_repo.get_by_id(doc_id)
                metadata = existing.get('metadata', {}) if existing else {}
                metadata['merged_from'] = source_filename
                metadata['merged_pages'] = valid_pages
                if storage_url:
                    metadata['storage_url'] = storage_url
                    metadata['storage_path'] = f"pdfs/{username}/{target_folder}/{target_filename}"
                pdfs_repo.update(doc_id, {
                    'file_size': new_size,
                    'metadata': metadata
                })
                print(f"[OK] Firestore actualizado para PDF destino")
            except Exception as e:
                print(f"[WARN] No se pudo actualizar Firestore: {e}")
            
            print("[DEBUG] Merge completado exitosamente")
            return jsonify({
                'success': True,
                'message': f'Se movieron {pages_moved} página(s) de "{source_filename}" a "{target_filename}"',
                'data': {
                    'pages_moved': pages_moved,
                    'source_deleted': delete_source,
                    'target_filename': target_filename
                }
            })
            
        except ImportError as e:
            print(f"[ERROR] PyMuPDF no está disponible: {e}")
            return jsonify({
                'success': False,
                'error': f'PyMuPDF no está disponible: {str(e)}'
            }), 503
        except Exception as e:
            print(f"[ERROR] Error al fusionar PDFs: {e}")
            print(f"[ERROR] Traceback completo:")
            print(traceback.format_exc())
            return jsonify({
                'success': False,
                'error': f'Error al fusionar PDFs: {str(e)}',
                'details': traceback.format_exc()
            }), 500
            
    except Exception as e:
        print(f"[ERROR] Error general en merge_pdf_pages: {e}")
        print(f"[ERROR] Traceback completo:")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': f'Error interno: {str(e)}',
            'details': traceback.format_exc()
        }), 500

@bp.route('/process_folder', methods=['POST'])
@login_required_api
def process_folder():
    """API para procesar una carpeta específica del usuario actual y guardar en Firebase"""
    try:
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        data = request.get_json()
        folder_name = data.get('folder_name')
        
        if not folder_name:
            return jsonify({
                'success': False,
                'error': 'Nombre de carpeta requerido'
            }), 400
        
        # Validar y sanitizar nombre de carpeta
        folder_name = folder_name.strip().replace('..', '').replace('/', '').replace('\\', '')
        if not folder_name:
            return jsonify({
                'success': False,
                'error': 'Nombre de carpeta inválido'
            }), 400
        
        # Obtener PDFs desde Firestore y procesar desde Firebase Storage (sin disco)
        try:
            from app.database.pdfs_repository import PDFsRepository
            from app.config.firebase_config import FirebaseConfig
            from modules.data_extractor import (
                extraer_datos_manifiesto,
                extraer_datos_factura_electronica,
                limpiar_datos,
            )
        except ImportError as e:
            print(f"[ERROR] Dependencias no disponibles para procesar desde Firebase: {e}")
            return jsonify({
                'success': False,
                'error': 'No se pudo inicializar Firebase/procesador de datos'
            }), 503

        pdfs_repo = PDFsRepository()
        pdf_records = pdfs_repo.get_pdfs_by_folder(username, folder_name)
        if not pdf_records:
            return jsonify({
                'success': False,
                'error': f'No se encontraron PDFs en la carpeta "{folder_name}"'
            }), 404

        bucket = FirebaseConfig.get_bucket()

        def _extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
            try:
                import fitz
            except Exception as e:
                raise RuntimeError(f"PyMuPDF no está disponible: {e}")

            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            try:
                texto_completo = ""
                for numero_pagina in range(len(doc)):
                    pagina = doc.load_page(numero_pagina)
                    try:
                        texto_pagina = pagina.get_text(flags=11)
                    except Exception:
                        texto_pagina = pagina.get_text()
                    if texto_pagina:
                        texto_completo += f"\n--- PÁGINA {numero_pagina + 1} ---\n"
                        texto_completo += texto_pagina
                return texto_completo
            finally:
                doc.close()

        manifiestos = []
        facturas_electronicas = []
        archivos_duplicados = []
        load_ids_procesados = {}
        remesas_procesadas = {}

        for p in pdf_records:
            archivo = p.get('filename') or p.get('archivo') or ''
            storage_path = p.get('file_path') or (p.get('metadata') or {}).get('storage_path')

            if not archivo or not storage_path:
                archivos_duplicados.append({
                    'archivo': archivo or 'No encontrado',
                    'ruta_completa': storage_path or '',
                    'identificador': 'metadata_incompleta',
                    'archivo_original': None,
                    'load_id': None,
                    'remesa': None
                })
                continue

            print(f"Procesando (Firebase Storage): {archivo}")

            try:
                blob = bucket.blob(storage_path)
                pdf_bytes = blob.download_as_bytes()
                texto = _extract_text_from_pdf_bytes(pdf_bytes)
            except Exception as e:
                print(f"[ERROR] Error leyendo/procesando {archivo} desde Storage: {e}")
                continue

            if not texto:
                continue

            datos_manifiesto = extraer_datos_manifiesto(texto)
            datos_factura_electronica = extraer_datos_factura_electronica(texto)
            datos_manifiesto = limpiar_datos(datos_manifiesto)

            load_id = datos_manifiesto.get('load_id', 'No encontrado')
            remesa = datos_manifiesto.get('remesa', 'No encontrada')

            es_duplicado = False
            identificador_usado = None
            archivo_original = None

            if load_id and load_id != 'No encontrado':
                if load_id in load_ids_procesados:
                    es_duplicado = True
                    identificador_usado = f"load_id: {load_id}"
                    archivo_original = load_ids_procesados[load_id]
                else:
                    load_ids_procesados[load_id] = archivo
            elif remesa and remesa != 'No encontrada':
                if remesa in remesas_procesadas:
                    es_duplicado = True
                    identificador_usado = f"remesa (KBQ): {remesa}"
                    archivo_original = remesas_procesadas[remesa]
                else:
                    remesas_procesadas[remesa] = archivo

            if es_duplicado:
                print(f"[WARN] Archivo duplicado omitido: {archivo} (ya procesado con {identificador_usado})")
                archivos_duplicados.append({
                    'archivo': archivo,
                    'ruta_completa': storage_path,
                    'identificador': identificador_usado,
                    'archivo_original': archivo_original,
                    'load_id': load_id if load_id != 'No encontrado' else None,
                    'remesa': remesa if remesa != 'No encontrada' else None
                })
                continue

            datos_manifiesto['archivo'] = archivo
            datos_manifiesto['fecha_procesamiento'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            manifiestos.append(datos_manifiesto)
            facturas_electronicas.append(datos_factura_electronica)
            print(f"[OK] Archivo procesado correctamente: {archivo}")

        if not manifiestos:
            return jsonify({
                'success': False,
                'error': 'No se encontraron PDFs válidos para procesar en la carpeta'
            }), 400
        
        # Guardar manifiestos en Firebase con validación de duplicados
        manifiestos_repo = None
        manifiestos_guardados = []
        manifiestos_duplicados_firebase = []
        manifiestos_errores = []
        
        try:
            from app.database.manifiestos_repository import ManifiestosRepository
            manifiestos_repo = ManifiestosRepository()
        except ImportError as e:
            print(f"[WARN] No se pudo importar ManifiestosRepository: {e}")
            return jsonify({
                'success': False,
                'error': 'Error al inicializar repositorio de manifiestos'
            }), 500
        
        # Obtener lista de archivos PDF para mapear con manifiestos
        archivos_pdf = [p.get('filename') for p in pdf_records if (p.get('filename') or '').lower().endswith('.pdf')]
        
        # Guardar cada manifiesto en Firebase
        indices_guardados = []  # Índices de manifiestos guardados exitosamente
        
        for i, manifiesto in enumerate(manifiestos):
            archivo = manifiesto.get('archivo', '')
            if not archivo:
                # Intentar obtener el archivo de la lista
                if i < len(archivos_pdf):
                    archivo = archivos_pdf[i]
                else:
                    archivo = f"archivo_{i+1}.pdf"
            
            # Obtener datos de factura correspondiente
            factura_data = facturas_electronicas[i] if i < len(facturas_electronicas) else {}
            
            # Guardar en Firebase
            success, message, existing = manifiestos_repo.save_manifiesto(
                username=username,
                folder_name=folder_name,
                archivo=archivo,
                manifiesto_data=manifiesto,
                factura_data=factura_data
            )
            
            if success:
                if existing:
                    # Es un duplicado detectado por Firebase
                    manifiestos_duplicados_firebase.append({
                        'archivo': archivo,
                        'load_id': manifiesto.get('load_id', 'No encontrado'),
                        'remesa': manifiesto.get('remesa', 'No encontrada'),
                        'message': message,
                        'existing_id': existing.get('id')
                    })
                    print(f"[DUPLICADO] {archivo}: {message}")
                else:
                    # Guardado exitosamente
                    indices_guardados.append(i)
                    manifiestos_guardados.append({
                        'archivo': archivo,
                        'load_id': manifiesto.get('load_id', 'No encontrado'),
                        'remesa': manifiesto.get('remesa', 'No encontrada')
                    })
                    print(f"[OK] Manifiesto guardado en Firebase: {archivo}")
            else:
                # Error al guardar (puede ser duplicado o error real)
                if 'duplicado' in message.lower():
                    # Es un duplicado
                    manifiestos_duplicados_firebase.append({
                        'archivo': archivo,
                        'load_id': manifiesto.get('load_id', 'No encontrado'),
                        'remesa': manifiesto.get('remesa', 'No encontrada'),
                        'message': message
                    })
                else:
                    # Error real
                    manifiestos_errores.append({
                        'archivo': archivo,
                        'error': message
                    })
                    print(f"[ERROR] Error al guardar {archivo}: {message}")
        
        # Generar Excel solo con manifiestos guardados exitosamente (no duplicados)
        manifiestos_para_excel = [manifiestos[i] for i in indices_guardados]
        
        excel_path = None
        if manifiestos_para_excel:
            try:
                excel_path = crear_excel(manifiestos_para_excel, folder_name)
            except Exception as e:
                print(f"[WARN] Error al generar Excel: {e}")
        
        # Marcar PDFs como procesados en Firebase
        try:
            for archivo in archivos_pdf:
                try:
                    pdfs_repo.mark_as_processed(username, folder_name, archivo)
                except Exception as e:
                    print(f"Advertencia: No se pudo marcar {archivo} como procesado: {e}")
        except Exception as e:
            print(f"Advertencia: No se pudo actualizar estado de PDFs en Firebase: {e}")
        
        # Preparar respuesta
        total_guardados = len(manifiestos_guardados)
        total_duplicados = len(archivos_duplicados) + len(manifiestos_duplicados_firebase)
        total_errores = len(manifiestos_errores)
        
        return jsonify({
            'success': True,
            'message': f'Procesados {total_guardados} manifiesto(s). {total_duplicados} duplicado(s) detectado(s).',
            'data': {
                'manifiestos': manifiestos_para_excel,  # Solo los que se guardaron
                'facturas_electronicas': facturas_electronicas,
                'excel_path': excel_path,
                'total_manifiestos': total_guardados,
                'total_procesados': len(manifiestos),
                'archivos_duplicados': archivos_duplicados,
                'manifiestos_duplicados_firebase': manifiestos_duplicados_firebase,
                'manifiestos_errores': manifiestos_errores,
                'total_duplicados': total_duplicados,
                'total_errores': total_errores,
                'manifiestos_guardados': manifiestos_guardados
            }
        })
    except Exception as e:
        print(f"[ERROR] Error en process_folder: {e}")
        import traceback
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/update_field', methods=['POST'])
@login_required_api
def update_manifiesto_field():
    """API para actualizar un campo de un manifiesto en Firestore"""
    try:
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        data = request.get_json()
        manifest_id = data.get('manifest_id')
        field = data.get('field')
        value = data.get('value')
        
        if not all([manifest_id, field is not None]):
            return jsonify({
                'success': False,
                'error': 'manifest_id y field son requeridos'
            }), 400
        
        # Actualizar en Firestore
        try:
            from app.database.manifiestos_repository import ManifiestosRepository
            repo = ManifiestosRepository()
            
            # Actualizar el campo
            success = repo.update_manifiesto_field(manifest_id, field, value)
            
            if success:
                return jsonify({
                    'success': True,
                    'message': f'Campo {field} actualizado correctamente'
                })
            else:
                return jsonify({
                    'success': False,
                    'error': 'No se pudo actualizar el campo'
                }), 500
                
        except ImportError:
            return jsonify({
                'success': False,
                'error': 'ManifiestosRepository no está disponible'
            }), 503
            
    except Exception as e:
        print(f"Error al actualizar campo de manifiesto: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/archivos_qr', methods=['GET'])
@login_required_api
def get_archivos_qr():
    """API para obtener información del QR de una carpeta específica o todas las carpetas"""
    try:
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        folder_name = request.args.get('folder_name', None)
        user_base = get_user_base_folder()
        
        qr_data_list = []
        
        if folder_name:
            # Obtener datos del QR de una carpeta específica
            folder_path = os.path.join(user_base, folder_name)
            if not os.path.exists(folder_path):
                return jsonify({'success': False, 'error': 'Carpeta no encontrada'}), 404
            
            # Procesar PDFs de la carpeta
            manifiestos, _, _ = procesar_carpeta_pdfs(folder_path)
            
            # Extraer datos del QR
            for manifiesto in manifiestos:
                hora_final = manifiesto.get('qr_hora') or manifiesto.get('hora inicio', 'No encontrada')
                placa_final = manifiesto.get('qr_placa') or manifiesto.get('placa', 'No encontrada')
                fecha_qr = manifiesto.get('qr_fecha', '')
                
                fecha_liquidacion_final = manifiesto.get('fecha_liquidacion', '')
                if (fecha_liquidacion_final == 'No encontrada' or fecha_liquidacion_final == '') and fecha_qr:
                    fecha_liquidacion_final = fecha_qr
                elif not fecha_liquidacion_final or fecha_liquidacion_final == '':
                    fecha_liquidacion_final = 'No encontrada'
                
                qr_data_list.append({
                    'archivo': manifiesto.get('archivo', 'N/A'),
                    'carpeta': folder_name,
                    'hora': hora_final,
                    'placa': placa_final,
                    'origen': manifiesto.get('origen', 'No encontrado'),
                    'destino': manifiesto.get('destino', 'No encontrado'),
                    'empresa': manifiesto.get('empresa', 'No encontrada'),
                    'anticipo': manifiesto.get('anticipo', 'No encontrado'),
                    'valor_total': manifiesto.get('valor_total', 'No encontrado'),
                    'saldo': manifiesto.get('saldo', 'No encontrado'),
                    'fecha_liquidacion': fecha_liquidacion_final,
                    'fecha_pago': manifiesto.get('fecha_pago', 'No encontrada'),
                    'qr_fecha': fecha_qr,
                    'qr_numero_manifiesto': manifiesto.get('qr_numero_manifiesto', 'No encontrado'),
                    'qr_raw': manifiesto.get('qr_raw', 'N/A'),
                    'load_id': manifiesto.get('load_id', 'No encontrado'),
                    'row_id': f"{folder_name}_{manifiesto.get('archivo', '')}"
                })
        else:
            # Obtener datos del QR de todas las carpetas
            if os.path.exists(user_base):
                carpetas = [f for f in os.listdir(user_base) 
                           if os.path.isdir(os.path.join(user_base, f)) and not f.startswith('.')]
                
                for carpeta in carpetas:
                    folder_path = os.path.join(user_base, carpeta)
                    manifiestos, _, _ = procesar_carpeta_pdfs(folder_path)
                    
                    for manifiesto in manifiestos:
                        hora_final = manifiesto.get('qr_hora') or manifiesto.get('hora inicio', 'No encontrada')
                        placa_final = manifiesto.get('qr_placa') or manifiesto.get('placa', 'No encontrada')
                        fecha_qr = manifiesto.get('qr_fecha', '')
                        
                        fecha_liquidacion_final = manifiesto.get('fecha_liquidacion', '')
                        if (fecha_liquidacion_final == 'No encontrada' or fecha_liquidacion_final == '') and fecha_qr:
                            fecha_liquidacion_final = fecha_qr
                        elif not fecha_liquidacion_final or fecha_liquidacion_final == '':
                            fecha_liquidacion_final = 'No encontrada'
                        
                        qr_data_list.append({
                            'archivo': manifiesto.get('archivo', 'N/A'),
                            'carpeta': carpeta,
                            'hora': hora_final,
                            'placa': placa_final,
                            'origen': manifiesto.get('origen', 'No encontrado'),
                            'destino': manifiesto.get('destino', 'No encontrado'),
                            'empresa': manifiesto.get('empresa', 'No encontrada'),
                            'anticipo': manifiesto.get('anticipo', 'No encontrado'),
                            'valor_total': manifiesto.get('valor_total', 'No encontrado'),
                            'saldo': manifiesto.get('saldo', 'No encontrado'),
                            'fecha_liquidacion': fecha_liquidacion_final,
                            'fecha_pago': manifiesto.get('fecha_pago', 'No encontrada'),
                            'qr_fecha': fecha_qr,
                            'qr_numero_manifiesto': manifiesto.get('qr_numero_manifiesto', 'No encontrado'),
                            'qr_raw': manifiesto.get('qr_raw', 'N/A'),
                            'load_id': manifiesto.get('load_id', 'No encontrado'),
                            'row_id': f"{carpeta}_{manifiesto.get('archivo', '')}"
                        })
        
        return jsonify({
            'success': True,
            'data': qr_data_list
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/update_qr_field', methods=['POST'])
@login_required_api
def update_qr_field_api():
    """API para actualizar un campo de QR"""
    try:
        data = request.get_json()
        qr_id = data.get('qr_id')
        field = data.get('field')
        value = data.get('value')
        
        if not all([qr_id, field]):
            return jsonify({
                'success': False,
                'error': 'Datos incompletos'
            }), 400
        
        success = update_qr_field(qr_id, field, value)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Campo actualizado correctamente'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Error al actualizar el campo'
            }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/process_folder_qr', methods=['POST'])
@login_required_api
def process_folder_qr():
    """API para procesar una carpeta específica y extraer solo códigos QR"""
    try:
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        data = request.get_json()
        folder_name = data.get('folder_name')
        
        if not folder_name:
            return jsonify({
                'success': False,
                'error': 'Nombre de carpeta requerido'
            }), 400
        
        # Buscar la carpeta dentro de ManifiestoQRinfo
        manifiesto_qr_folder = get_user_manifiesto_qr_folder()
        if not manifiesto_qr_folder:
            return jsonify({
                'success': False,
                'error': 'No se pudo determinar la carpeta del usuario'
            }), 500
        
        if not os.path.exists(manifiesto_qr_folder):
            os.makedirs(manifiesto_qr_folder)
        
        folder_path = os.path.join(manifiesto_qr_folder, folder_name)
        if not os.path.exists(folder_path):
            return jsonify({
                'success': False,
                'error': f'Carpeta "{folder_name}" no encontrada en ManifiestoQRinfo'
            }), 404
        
        # Procesar solo QR de los PDFs en la carpeta
        resultados_qr = procesar_carpeta_qr(folder_path)
        
        # Guardar en la base de datos
        qr_data_list = []
        for resultado in resultados_qr:
            archivo = resultado.get('archivo', '')
            qr_data = {
                'username': username,
                'carpeta': folder_name,
                'archivo': archivo,
                'ruta_completa': resultado.get('ruta_completa', ''),
                'placa': resultado.get('placa', ''),
                'numero_manifiesto': resultado.get('numero_manifiesto', ''),
                'fecha': resultado.get('fecha', ''),
                'hora': resultado.get('hora', ''),
                'origen': resultado.get('origen', ''),
                'destino': resultado.get('destino', ''),
            }
            save_qr_data(qr_data)
            qr_data_list.append(qr_data)
        
        return jsonify({
            'success': True,
            'data': {
                'qr_data': qr_data_list,
                'total': len(qr_data_list)
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/manifiestos_data', methods=['GET'])
@login_required_api
def get_manifiestos_data():
    """
    API para obtener manifiestos con todos sus datos desde Firestore
    Opcionalmente filtrar por folder_name
    """
    try:
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        folder_name = request.args.get('folder_name')
        
        try:
            from app.database.manifiestos_repository import ManifiestosRepository
            repo = ManifiestosRepository()
            
            # Obtener manifiestos del usuario, opcionalmente filtrados por carpeta
            if folder_name:
                manifiestos = repo.get_manifiestos(username=username, folder_name=folder_name)
            else:
                manifiestos = repo.get_manifiestos(username=username)
            
            return jsonify({
                'success': True,
                'data': manifiestos
            })
            
        except ImportError:
            return jsonify({
                'success': False,
                'error': 'ManifiestosRepository no está disponible'
            }), 503
            
    except Exception as e:
        print(f"Error al obtener manifiestos: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/conductores', methods=['GET'])
@login_required_api
def get_conductores():
    """
    API para obtener lista única de conductores desde los manifiestos
    """
    try:
        try:
            from app.database.manifiestos_repository import ManifiestosRepository
            from app.database.usuarios_repository import UsuariosRepository
            
            repo = ManifiestosRepository()
            usuarios_repo = UsuariosRepository()
            
            # Obtener todos los manifiestos activos
            manifiestos = repo.get_all_manifiestos()
            
            # Extraer conductores únicos
            conductores_set = set()
            for manifiesto in manifiestos:
                conductor = manifiesto.get('conductor', '').strip()
                if conductor and conductor not in ['No encontrado', 'NO_ENCONTRADO', '']:
                    conductores_set.add(conductor)
            
            # Obtener usuarios existentes para verificar cuáles ya tienen cuenta
            usuarios_existentes = usuarios_repo.get_all_usuarios()
            usuarios_dict = {u.get('nombre', '').strip().upper(): u for u in usuarios_existentes}
            
            # Crear lista de conductores con información adicional
            conductores_list = []
            for conductor in sorted(conductores_set):
                conductor_upper = conductor.upper()
                usuario_existente = usuarios_dict.get(conductor_upper)
                
                conductores_list.append({
                    'nombre': conductor,
                    'tiene_usuario': usuario_existente is not None,
                    'usuario_id': usuario_existente.get('id') if usuario_existente else None,
                    'username': usuario_existente.get('username') if usuario_existente else None,
                    'rol': usuario_existente.get('rol') if usuario_existente else None,
                    'activo': usuario_existente.get('activo', False) if usuario_existente else False
                })
            
            return jsonify({
                'success': True,
                'data': conductores_list,
                'total': len(conductores_list)
            })
            
        except ImportError as ie:
            return jsonify({
                'success': False,
                'error': f'Repositorio no disponible: {str(ie)}'
            }), 503
            
    except Exception as e:
        print(f"Error al obtener conductores: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

