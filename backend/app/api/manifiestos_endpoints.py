"""
Endpoint adicional para obtener manifiestos con sus datos completos
"""
from flask import Blueprint, request, jsonify
from functools import wraps

def create_manifiestos_data_endpoint(bp, get_current_user_func, is_authenticated_func):
    """
    Crea el endpoint para obtener manifiestos con datos completos
    """
    
    def login_required_api(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not is_authenticated_func():
                return jsonify({'success': False, 'error': 'No autenticado'}), 401
            return f(*args, **kwargs)
        return decorated_function
    
    @bp.route('/manifiestos_data', methods=['GET'])
    @login_required_api
    def get_manifiestos_data():
        """
        API para obtener manifiestos con todos sus datos desde Firestore
        Opcionalmente filtrar por folder_name
        """
        try:
            username = get_current_user_func()
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
