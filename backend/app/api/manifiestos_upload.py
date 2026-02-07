"""
API de subida de archivos PDF
"""
import os
from flask import Blueprint, request, jsonify
from .manifiestos_utils import login_required_api, get_current_user

bp = Blueprint('manifiestos_upload', __name__)

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

        files = request.files.getlist('files') or request.files.getlist('files[]')
        if not files or all(not f or not f.filename for f in files):
            return jsonify({
                'success': False,
                'error': 'No se enviaron archivos. Selecciona al menos un PDF.'
            }), 400

        saved = 0
        skipped = 0
        saved_files = []
        
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
                    storage_url = blob.generate_signed_url(expiration=31536000)

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
