"""
API de manifiestos y procesamiento de PDFs
"""
import os
import sys
from pathlib import Path
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
            
            # 2. Eliminar registros de Firestore
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
                
                print(f"[OK] Eliminados {deleted_items['pdfs_firestore']} registros de Firestore")
            except ImportError:
                print("[INFO] Firebase no está disponible, omitiendo eliminación de Firestore")
            except Exception as e:
                print(f"Advertencia: Error al eliminar de Firestore: {e}")
            
            # 3. Eliminar datos QR de la base de datos
            try:
                deleted_qr = delete_qr_data_by_carpeta(username, folder_name)
                if deleted_qr:
                    # Contar cuántos se eliminaron (aproximado)
                    qr_data_before = get_qr_data(username=username, carpeta=folder_name)
                    deleted_items['qr_data'] = len(qr_data_before) if qr_data_before else 0
                    print(f"[OK] Eliminados datos QR de la carpeta {folder_name}")
            except Exception as e:
                print(f"Advertencia: Error al eliminar datos QR: {e}")
            
            # 4. Eliminar Excel asociado (solo para tipo Manifiesto)
            if folder_type == 'Manifiesto':
                try:
                    excel_path = os.path.join(get_user_excel_folder(username), f'manifiestos_{folder_name}.xlsx')
                    if os.path.exists(excel_path):
                        os.remove(excel_path)
                        deleted_items['excel'] = True
                        print(f"[OK] Excel eliminado: {excel_path}")
                except Exception as e:
                    print(f"Advertencia: Error al eliminar Excel: {e}")
            
            # 5. Limpiar caché de miniaturas de la carpeta (ruta absoluta)
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
            
            # 6. Eliminar carpeta física (último paso)
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

        manifiesto_base = get_user_manifiesto_folder()
        if not manifiesto_base:
            return jsonify({'success': False, 'error': 'No se pudo determinar la carpeta del usuario'}), 500

        target_dir = os.path.join(manifiesto_base, folder_name)
        os.makedirs(target_dir, exist_ok=True)

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
            dest = os.path.join(target_dir, safe_name)
            
            # Guardar archivo en el sistema de archivos (para compatibilidad con procesamiento existente)
            f.save(dest)
            
            # Obtener tamaño del archivo
            file_size = os.path.getsize(dest) if os.path.exists(dest) else 0
            
            # Subir a Firebase Storage (opcional, no falla si no está disponible)
            storage_url = None
            try:
                from app.config.firebase_config import FirebaseConfig
                bucket = FirebaseConfig.get_storage_bucket()
                
                # Ruta en Storage: pdfs/{username}/{folder_name}/{filename}
                storage_path = f"pdfs/{username}/{folder_name}/{safe_name}"
                blob = bucket.blob(storage_path)
                
                # Subir archivo a Storage
                blob.upload_from_filename(dest, content_type='application/pdf')
                
                # Generar URL firmada (válida por 1 año) o URL pública
                try:
                    # Intentar hacer público (requiere permisos)
                    blob.make_public()
                    storage_url = blob.public_url
                except:
                    # Si no se puede hacer público, generar URL firmada
                    storage_url = blob.generate_signed_url(expiration=31536000)  # 1 año
                
                print(f"[OK] Archivo subido a Firebase Storage: {storage_path}")
            except Exception as e:
                print(f"Advertencia: No se pudo subir a Firebase Storage para {safe_name}: {e}")
                # Continuar sin Storage si falla
            
            # Obtener total_pages con PyMuPDF para evitar get_pdf_pages en el frontend
            total_pages = None
            try:
                import fitz
                doc = fitz.open(dest)
                total_pages = len(doc)
                doc.close()
            except Exception:
                pass

            # Guardar metadatos en Firebase Firestore
            if pdfs_repo:
                try:
                    pdfs_repo.create_pdf_record(
                        username=username,
                        folder_name=folder_name,
                        filename=safe_name,
                        file_path=dest,
                        file_size=file_size,
                        metadata={
                            'original_filename': f.filename,
                            'content_type': f.content_type or 'application/pdf',
                            'storage_url': storage_url,
                            'storage_path': f"pdfs/{username}/{folder_name}/{safe_name}" if storage_url else None
                        },
                        total_pages=total_pages
                    )
                except Exception as e:
                    print(f"Advertencia: No se pudo guardar metadatos en Firebase para {safe_name}: {e}")
            
            saved += 1
            saved_files.append({
                'filename': safe_name,
                'size': file_size,
                'path': dest
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
        
        # Decodificar el filename de la URL si es necesario
        try:
            from urllib.parse import unquote
            filename = unquote(filename)
        except Exception:
            pass  # Si falla, usar el filename tal cual
        
        # Generar ruta de caché para miniatura
        import hashlib
        cache_key = f"{username}_{folder_name}_{filename}_{page_num}"
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
            size_param = request.args.get('size', 'small')
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

@bp.route('/pdf/merge', methods=['POST'])
@login_required_api
def merge_pdf_pages():
    """API para fusionar páginas de un PDF en otro PDF"""
    try:
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        data = request.get_json()
        source_folder = data.get('source_folder')
        source_filename = data.get('source_filename')
        target_folder = data.get('target_folder')
        target_filename = data.get('target_filename')
        pages_to_move = data.get('pages', [])  # Lista de números de página (1-indexed)
        insert_position = data.get('insert_position', None)  # Posición de inserción (0-indexed, None = al final)
        
        if not all([source_folder, source_filename, target_folder, target_filename]):
            return jsonify({
                'success': False,
                'error': 'Datos incompletos: source_folder, source_filename, target_folder, target_filename son requeridos'
            }), 400
        
        manifiesto_base = get_user_manifiesto_folder()
        if not manifiesto_base:
            return jsonify({'success': False, 'error': 'No se pudo determinar la carpeta del usuario'}), 500
        
        source_path = os.path.join(manifiesto_base, source_folder, source_filename)
        target_path = os.path.join(manifiesto_base, target_folder, target_filename)
        
        if not os.path.exists(source_path):
            return jsonify({
                'success': False,
                'error': f'PDF origen no encontrado: {source_filename}'
            }), 404
        
        if not os.path.exists(target_path):
            return jsonify({
                'success': False,
                'error': f'PDF destino no encontrado: {target_filename}'
            }), 404
        
        try:
            import fitz
            
            # Abrir PDFs
            source_doc = fitz.open(source_path)
            target_doc = fitz.open(target_path)
            
            # Si no se especifican páginas, mover todas
            if not pages_to_move:
                pages_to_move = list(range(1, len(source_doc) + 1))
            
            # Validar páginas
            valid_pages = [p for p in pages_to_move if 1 <= p <= len(source_doc)]
            if not valid_pages:
                source_doc.close()
                target_doc.close()
                return jsonify({
                    'success': False,
                    'error': 'No hay páginas válidas para mover'
                }), 400
            
            # Determinar posición de inserción
            # insert_position: None = al final, 0 = al inicio, N = después de la página N (0-indexed)
            if insert_position is None:
                # Insertar al final (comportamiento por defecto)
                insert_at = len(target_doc)
            else:
                # Validar posición de inserción
                insert_at = int(insert_position)
                if insert_at < 0:
                    insert_at = 0
                elif insert_at > len(target_doc):
                    insert_at = len(target_doc)
            
            # Insertar páginas del PDF origen al PDF destino en la posición especificada
            # Insertar en orden inverso para mantener el orden correcto
            for i, page_num in enumerate(valid_pages):
                # page_num es 1-indexed, fitz usa 0-indexed
                # Insertar cada página en la posición correcta
                source_doc[page_num - 1].copy_to(target_doc, insert_at + i)
            
            # Guardar el PDF destino actualizado
            target_doc.save(target_path, incremental=True, encryption=fitz.PDF_ENCRYPT_KEEP)
            target_doc.close()
            
            # Actualizar en Firebase Storage (si está disponible)
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
            except Exception as e:
                print(f"Advertencia: No se pudo actualizar en Firebase Storage: {e}")
                storage_url = None
            
            # Si el PDF origen solo tenía una página y se movió, eliminarlo
            pages_moved = len(valid_pages)
            total_source_pages = len(source_doc)
            source_doc.close()
            
            delete_source = False
            if pages_moved == total_source_pages:
                # Todas las páginas se movieron, eliminar el PDF origen
                try:
                    os.remove(source_path)
                    delete_source = True
                    
                    # Eliminar de Firebase Storage
                    try:
                        from app.config.firebase_config import FirebaseConfig
                        bucket = FirebaseConfig.get_storage_bucket()
                        source_storage_path = f"pdfs/{username}/{source_folder}/{source_filename}"
                        blob = bucket.blob(source_storage_path)
                        blob.delete()
                        print(f"[OK] PDF eliminado de Firebase Storage: {source_storage_path}")
                    except Exception as e:
                        print(f"Advertencia: No se pudo eliminar de Firebase Storage: {e}")
                    
                    # Actualizar Firebase Firestore: eliminar registro del PDF origen
                    try:
                        from app.database.pdfs_repository import PDFsRepository
                        pdfs_repo = PDFsRepository()
                        pdfs_repo.delete_pdf_record(username, source_folder, source_filename)
                    except Exception as e:
                        print(f"Advertencia: No se pudo actualizar Firestore: {e}")
                except Exception as e:
                    print(f"Advertencia: No se pudo eliminar PDF origen: {e}")
            
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
            except Exception as e:
                print(f"Advertencia: No se pudo actualizar Firestore: {e}")
            
            return jsonify({
                'success': True,
                'message': f'Se movieron {pages_moved} página(s) de "{source_filename}" a "{target_filename}"',
                'data': {
                    'pages_moved': pages_moved,
                    'source_deleted': delete_source,
                    'target_filename': target_filename
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
                'error': f'Error al fusionar PDFs: {str(e)}'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
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
        
        # Buscar la carpeta dentro de Manifiesto
        manifiesto_folder = get_user_manifiesto_folder()
        folder_path = os.path.join(manifiesto_folder, folder_name)
        if not os.path.exists(folder_path):
            return jsonify({
                'success': False,
                'error': f'Carpeta "{folder_name}" no encontrada en Manifiesto'
            }), 404
        
        # Procesar PDFs en la carpeta
        manifiestos, facturas_electronicas, archivos_duplicados = procesar_carpeta_pdfs(folder_path)
        
        if not manifiestos:
            return jsonify({
                'success': False,
                'error': 'No se encontraron PDFs válidos en la carpeta'
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
        archivos_pdf = [f for f in os.listdir(folder_path) if f.lower().endswith('.pdf')]
        
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
            from app.database.pdfs_repository import PDFsRepository
            pdfs_repo = PDFsRepository()
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
    """API para actualizar un campo de un manifiesto"""
    try:
        data = request.get_json()
        folder_name = data.get('folder_name')
        archivo = data.get('archivo')
        field = data.get('field')
        value = data.get('value')
        
        if not all([folder_name, archivo, field]):
            return jsonify({
                'success': False,
                'error': 'Datos incompletos'
            }), 400
        
        # Aquí iría la lógica para actualizar el campo
        # Por ahora retornamos éxito
        return jsonify({
            'success': True,
            'message': 'Campo actualizado correctamente'
        })
    except Exception as e:
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
