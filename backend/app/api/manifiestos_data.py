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
    Query params opcionales: folder_name, limit, placa
    """
    try:
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        folder_name = request.args.get('folder_name')
        limit = request.args.get('limit', type=int)
        placa_param = request.args.get('placa')
        
        try:
            from app.database.manifiestos_repository import ManifiestosRepository
            from app.database.usuarios_repository import UsuariosRepository
            from app.database.carros_repository import CarrosRepository
            from modules.auth import get_current_user_role

            repo = ManifiestosRepository()
            
            filters = [('username', '==', username), ('active', '==', True)]
            if folder_name:
                filters.append(('folder_name', '==', folder_name))

            # Si es conductor, filtrar por la placa del carro asignado (en backend, obligatorio)
            role = get_current_user_role()
            placa_forzada = None
            if role == 'conductor':
                usuarios_repo = UsuariosRepository()
                user = usuarios_repo.get_usuario_by_username(username)
                carro_id = (user or {}).get('carro_id')
                if carro_id:
                    carro = CarrosRepository().get_by_id(carro_id)
                    if carro and carro.get('placa'):
                        placa_forzada = str(carro.get('placa')).strip().upper()
                        # Intento 1: filtro en Firestore por coincidencia exacta
                        filters.append(('placa', '==', placa_forzada))

            # Filtro opcional por placa (para admins/empresarial). Para conductor se ignora si ya hay placa_forzada
            placa_filtro = None
            if placa_param:
                placa_filtro = str(placa_param).strip().upper()
                if placa_filtro and placa_filtro != 'NO ENCONTRADA' and placa_filtro != 'NO_ENCONTRADA':
                    if role != 'conductor':
                        filters.append(('placa', '==', placa_filtro))
            
            manifiestos = repo.get_all(filters=filters, limit=limit)

            # Seguridad extra: filtrar en memoria por normalización, por si la placa almacenada no es consistente
            if placa_forzada:
                manifiestos = [
                    m for m in manifiestos
                    if str(m.get('placa', '')).strip().upper() == placa_forzada
                ]
            elif placa_filtro and role != 'conductor':
                manifiestos = [
                    m for m in manifiestos
                    if str(m.get('placa', '')).strip().upper() == placa_filtro
                ]
            
            print(f"[DEBUG] get_manifiestos_data - Username: {username}, Folder: {folder_name}, Count: {len(manifiestos)}")
            if len(manifiestos) == 0:
                print(f"[WARN] No se encontraron manifiestos con filtros: {filters}")
            
            return jsonify({
                'success': True,
                'data': manifiestos,
                'manifiestos': manifiestos,
                'count': len(manifiestos),
                'placa_forzada': placa_forzada,
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


@bp.route('/placas', methods=['GET'])
@login_required_api
def get_placas():
    """
    API para obtener lista única de placas de los manifiestos del usuario.
    Útil para autocompletar o para importar carros desde manifiestos.
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
            
            placas = set()
            for m in manifiestos:
                placa = m.get('placa')
                if placa and placa != 'No encontrada' and placa.strip():
                    # Normalizar placa (mayúsculas, sin espacios)
                    placa_normalizada = placa.strip().upper()
                    # Validar que sea una placa razonable (mínimo 3 caracteres, alfanumérica)
                    if len(placa_normalizada) >= 3 and placa_normalizada.replace('-', '').replace('_', '').isalnum():
                        placas.add(placa_normalizada)
            
            placas_list = sorted(list(placas))
            
            return jsonify({
                'success': True,
                'placas': placas_list,
                'count': len(placas_list)
            })
        except ImportError:
            return jsonify({'success': False, 'error': 'Firebase no está disponible'}), 503
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/stats', methods=['GET'])
@login_required_api
def get_manifiestos_stats():
    """
    API para obtener estadísticas de manifiestos para gráficos de rendimiento.
    Incluye métricas financieras (valormanifiesto) y temporales (tiempos entre viajes).
    """
    try:
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        period = request.args.get('period', 'daily')
        days = int(request.args.get('days', 30))
        
        try:
            from app.database.manifiestos_repository import ManifiestosRepository
            repo = ManifiestosRepository()
            
            # Obtener estadísticas
            stats, ingresos_por_dia_semana = repo.get_stats_by_period(username, period, days)
            ingresos_destino = repo.get_ingresos_by_destino(username, period, days)
            ingresos_conductor = repo.get_ingresos_by_conductor(username, period, days)
            distribucion_valores = repo.get_distribucion_valores(username)
            tiempos_viajes = repo.get_tiempos_entre_viajes(username, period, days)
            tiempos_conductor = repo.get_tiempos_por_conductor(username, period, days)
            patrones_temporales = repo.get_patrones_temporales(username, period, days)
            analisis_comparativo = repo.get_analisis_comparativo(username, days)
            
            # Calcular resumen
            total_ingresos = sum(item['total'] for item in stats) if stats else 0
            total_manifiestos = sum(item['count'] for item in stats) if stats else 0
            valor_promedio = total_ingresos / total_manifiestos if total_manifiestos > 0 else 0
            tiempo_promedio = sum(item['tiempo_promedio_hs'] for item in tiempos_conductor) / len(tiempos_conductor) if tiempos_conductor else 0
            
            mejor_dia = max(stats, key=lambda x: x['total'])['date'] if stats else None
            mejor_destino = max(ingresos_destino, key=lambda x: x['total'])['destino'] if ingresos_destino else None
            conductor_mas_rapido = min(tiempos_conductor, key=lambda x: x['tiempo_promedio_hs'])['conductor'] if tiempos_conductor else None
            
            return jsonify({
                'success': True,
                'period': period,
                'data': {
                    'ingresos_por_fecha': stats,
                    'ingresos_por_dia_semana': ingresos_por_dia_semana,
                    'ingresos_por_destino': ingresos_destino,
                    'ingresos_por_conductor': ingresos_conductor,
                    'distribucion_valores': distribucion_valores,
                    'tiempos_entre_viajes': tiempos_viajes,
                    'tiempos_por_conductor': tiempos_conductor,
                    'patrones_temporales': patrones_temporales,
                    'analisis_comparativo': analisis_comparativo,
                    'summary': {
                        'total_ingresos': total_ingresos,
                        'total_manifiestos': total_manifiestos,
                        'valor_promedio': valor_promedio,
                        'tiempo_promedio_entre_viajes': tiempo_promedio,
                        'mejor_dia': mejor_dia,
                        'mejor_destino': mejor_destino,
                        'conductor_mas_rapido': conductor_mas_rapido
                    }
                }
            })
        except ImportError:
            return jsonify({'success': False, 'error': 'Firebase no está disponible'}), 503
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
