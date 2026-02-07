"""
API de consulta de datos procesados (PDFs, manifiestos, conductores)
"""
from flask import Blueprint, request, jsonify
from .manifiestos_utils import login_required_api, get_current_user

bp = Blueprint('manifiestos_data', __name__)


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
            
            return jsonify({'success': True, 'pdfs': pdfs})
        except ImportError:
            return jsonify({'success': False, 'error': 'Firebase no está disponible'}), 503
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


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
            repo = PDFsRepository()
            pdfs = repo.get_pdfs_by_username(username)
            
            total_size = sum(p.get('file_size', 0) for p in pdfs)
            largest = max(pdfs, key=lambda p: p.get('file_size', 0)) if pdfs else None
            recent = sorted(pdfs, key=lambda p: p.get('uploaded_at', ''), reverse=True)[:5]
            
            by_folder = {}
            folder_sizes = {}
            folder_files = {}
            
            for p in pdfs:
                fn = p.get('folder_name') or 'Sin carpeta'
                by_folder[fn] = by_folder.get(fn, 0) + 1
                folder_sizes[fn] = folder_sizes.get(fn, 0) + p.get('file_size', 0)
                
                if fn not in folder_files:
                    folder_files[fn] = []
                folder_files[fn].append({
                    'filename': p.get('filename'),
                    'size': p.get('file_size', 0),
                    'uploaded_at': p.get('uploaded_at')
                })
            
            folders = [
                {
                    'name': k,
                    'folder_name': k,
                    'count': v,
                    'pdf_count': v,
                    'size': folder_sizes[k],
                    'files': sorted(folder_files[k], key=lambda x: x.get('size', 0), reverse=True)[:10]
                } 
                for k, v in sorted(by_folder.items(), key=lambda x: -x[1])
            ]
            
            stats = {
                'total_files': len(pdfs),
                'total_size_bytes': total_size,
                'total_size_mb': round(total_size / (1024 * 1024), 2),
                'folders_count': len(by_folder),
                'folders': folders,
                'largest_file': {
                    'filename': largest.get('filename') if largest else None,
                    'folder_name': largest.get('folder_name') if largest else None,
                    'size_mb': round(largest.get('file_size', 0) / (1024 * 1024), 2) if largest else 0
                } if largest else None,
                'recent_files': [
                    {
                        'filename': r.get('filename'),
                        'folder_name': r.get('folder_name'),
                        'uploaded_at': r.get('uploaded_at'),
                        'size_mb': round(r.get('file_size', 0) / (1024 * 1024), 2)
                    } for r in recent
                ],
                'by_folder': folders
            }
            
            return jsonify({'success': True, 'data': stats})
        except ImportError:
            return jsonify({'success': False, 'error': 'Firebase no está disponible'}), 503
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/manifiestos_data', methods=['GET'])
@login_required_api
def get_manifiestos_data():
    """
    API para obtener manifiestos procesados del usuario actual desde Firebase.
    Query params opcionales: folder_name, limit
    """
    try:
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        folder_name = request.args.get('folder_name')
        limit = request.args.get('limit', type=int)
        
        try:
            from app.database.manifiestos_repository import ManifiestosRepository
            repo = ManifiestosRepository()
            
            filters = [('username', '==', username), ('active', '==', True)]
            if folder_name:
                filters.append(('folder_name', '==', folder_name))
            
            manifiestos = repo.get_all(filters=filters, limit=limit)
            
            print(f"[DEBUG] get_manifiestos_data - Username: {username}, Folder: {folder_name}, Count: {len(manifiestos)}")
            if len(manifiestos) == 0:
                print(f"[WARN] No se encontraron manifiestos con filtros: {filters}")
            
            return jsonify({
                'success': True,
                'data': manifiestos,
                'manifiestos': manifiestos,
                'count': len(manifiestos)
            })
        except ImportError:
            return jsonify({'success': False, 'error': 'Firebase no está disponible'}), 503
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/conductores', methods=['GET'])
@login_required_api
def get_conductores():
    """
    API para obtener lista única de conductores de los manifiestos del usuario.
    Útil para autocompletar o filtros.
    """
    try:
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        try:
            from app.database.manifiestos_repository import ManifiestosRepository
            repo = ManifiestosRepository()
            
            filters = [('username', '==', username), ('active', '==', True)]
            manifiestos = repo.get_all(filters=filters)
            
            conductores = set()
            for m in manifiestos:
                conductor = m.get('conductor')
                if conductor and conductor != 'No encontrado':
                    conductores.add(conductor)
            
            conductores_list = sorted(list(conductores))
            
            return jsonify({
                'success': True,
                'conductores': conductores_list,
                'count': len(conductores_list)
            })
        except ImportError:
            return jsonify({'success': False, 'error': 'Firebase no está disponible'}), 503
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
