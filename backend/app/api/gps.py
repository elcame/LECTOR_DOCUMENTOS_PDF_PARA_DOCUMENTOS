"""
API endpoints para el módulo GPS
Permite consultar ubicaciones, dispositivos y controlar el servidor TCP GPS
"""
from flask import Blueprint, request, jsonify
import logging

logger = logging.getLogger(__name__)

bp = Blueprint('gps', __name__)


# ============================================================
# DISPOSITIVOS
# ============================================================

@bp.route('/devices', methods=['GET'])
def get_devices():
    """Obtiene todos los dispositivos GPS registrados"""
    try:
        from app.database.gps_repository import GPSDevicesRepository
        repo = GPSDevicesRepository()
        devices = repo.get_all_devices()
        return jsonify({'success': True, 'devices': devices, 'count': len(devices)})
    except Exception as e:
        logger.error(f"Error obteniendo dispositivos: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/devices', methods=['POST'])
def register_device():
    """
    Registra un nuevo dispositivo GPS
    
    Body JSON:
    {
        "imei": "123456789012345",
        "name": "Camión 01",
        "placa": "ABC123",
        "conductor": "Juan Pérez"
    }
    """
    try:
        data = request.get_json()
        if not data or 'imei' not in data:
            return jsonify({'success': False, 'error': 'IMEI es requerido'}), 400
        
        imei = data['imei'].strip()
        if len(imei) != 15 or not imei.isdigit():
            return jsonify({'success': False, 'error': 'IMEI debe tener 15 dígitos numéricos'}), 400
        
        from app.database.gps_repository import GPSDevicesRepository
        repo = GPSDevicesRepository()
        doc_id = repo.register_device(
            imei=imei,
            name=data.get('name', ''),
            placa=data.get('placa', ''),
            conductor=data.get('conductor', ''),
        )
        
        return jsonify({'success': True, 'id': doc_id, 'message': 'Dispositivo registrado'})
    except Exception as e:
        logger.error(f"Error registrando dispositivo: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/devices/<imei>', methods=['GET'])
def get_device(imei):
    """Obtiene información de un dispositivo por IMEI"""
    try:
        from app.database.gps_repository import GPSDevicesRepository
        repo = GPSDevicesRepository()
        device = repo.get_device_by_imei(imei)
        
        if not device:
            return jsonify({'success': False, 'error': 'Dispositivo no encontrado'}), 404
        
        return jsonify({'success': True, 'device': device})
    except Exception as e:
        logger.error(f"Error obteniendo dispositivo {imei}: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/devices/<imei>', methods=['PUT'])
def update_device(imei):
    """
    Actualiza información de un dispositivo
    
    Body JSON:
    {
        "name": "Nuevo nombre",
        "placa": "XYZ789",
        "conductor": "Pedro López"
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'Datos requeridos'}), 400
        
        from app.database.gps_repository import GPSDevicesRepository
        repo = GPSDevicesRepository()
        device = repo.get_device_by_imei(imei)
        
        if not device:
            return jsonify({'success': False, 'error': 'Dispositivo no encontrado'}), 404
        
        update_data = {}
        for field in ['name', 'placa', 'conductor', 'active']:
            if field in data:
                update_data[field] = data[field]
        
        if update_data:
            repo.update(device['id'], update_data)
        
        return jsonify({'success': True, 'message': 'Dispositivo actualizado'})
    except Exception as e:
        logger.error(f"Error actualizando dispositivo {imei}: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================================
# UBICACIONES
# ============================================================

@bp.route('/location/<imei>', methods=['GET'])
def get_latest_location(imei):
    """
    Obtiene la última ubicación conocida de un dispositivo
    
    Returns:
    {
        "success": true,
        "location": {
            "imei": "123456789012345",
            "latitude": 4.710989,
            "longitude": -74.072092,
            "speed": 45,
            "course": 180,
            "satellites": 8,
            "gps_valid": true,
            "device_timestamp": "2026-03-25T10:30:00+00:00",
            "server_timestamp": "2026-03-25T10:30:05"
        }
    }
    """
    try:
        from app.database.gps_repository import GPSLocationsRepository
        repo = GPSLocationsRepository()
        location = repo.get_latest_location(imei)
        
        if not location:
            return jsonify({'success': False, 'error': 'Sin ubicaciones para este dispositivo'}), 404
        
        return jsonify({'success': True, 'location': location})
    except Exception as e:
        logger.error(f"Error obteniendo ubicación de {imei}: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/location/all', methods=['GET'])
def get_all_latest_locations():
    """Obtiene la última ubicación de todos los dispositivos"""
    try:
        from app.database.gps_repository import GPSLocationsRepository, GPSDevicesRepository
        loc_repo = GPSLocationsRepository()
        dev_repo = GPSDevicesRepository()
        
        locations = loc_repo.get_latest_all_devices()
        devices = {d['imei']: d for d in dev_repo.get_all_devices()}
        
        # Enriquecer ubicaciones con datos del dispositivo
        for loc in locations:
            imei = loc.get('imei', '')
            if imei in devices:
                loc['device_name'] = devices[imei].get('name', '')
                loc['placa'] = devices[imei].get('placa', '')
                loc['conductor'] = devices[imei].get('conductor', '')
        
        return jsonify({'success': True, 'locations': locations, 'count': len(locations)})
    except Exception as e:
        logger.error(f"Error obteniendo ubicaciones: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/history/<imei>', methods=['GET'])
def get_location_history(imei):
    """
    Obtiene el historial de ubicaciones de un dispositivo
    
    Query params:
    - hours: horas hacia atrás (default: 24)
    - limit: máximo de registros (default: 500)
    """
    try:
        hours = request.args.get('hours', 24, type=int)
        limit = request.args.get('limit', 500, type=int)
        
        # Validaciones
        hours = min(max(hours, 1), 720)  # Entre 1 hora y 30 días
        limit = min(max(limit, 1), 5000)
        
        from app.database.gps_repository import GPSLocationsRepository
        repo = GPSLocationsRepository()
        history = repo.get_history(imei, hours=hours, limit=limit)
        
        return jsonify({
            'success': True, 
            'history': history, 
            'count': len(history),
            'imei': imei,
            'hours': hours,
        })
    except Exception as e:
        logger.error(f"Error obteniendo historial de {imei}: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================================
# SERVIDOR TCP GPS
# ============================================================

@bp.route('/server/status', methods=['GET'])
def get_server_status():
    """Obtiene el estado del servidor TCP GPS"""
    try:
        from app.gps.gps_manager import get_gps_manager
        manager = get_gps_manager()
        status = manager.get_status()
        return jsonify({'success': True, **status})
    except Exception as e:
        logger.error(f"Error obteniendo estado del servidor: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/server/start', methods=['POST'])
def start_gps_server():
    """Inicia el servidor TCP GPS"""
    try:
        data = request.get_json() or {}
        port = data.get('port', 5001)
        
        from app.gps.gps_manager import get_gps_manager
        manager = get_gps_manager(tcp_port=port)
        
        if manager.is_running:
            return jsonify({'success': True, 'message': 'El servidor ya está corriendo', **manager.get_status()})
        
        manager.start()
        return jsonify({'success': True, 'message': f'Servidor GPS iniciado en puerto {port}', **manager.get_status()})
    except Exception as e:
        logger.error(f"Error iniciando servidor GPS: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/server/stop', methods=['POST'])
def stop_gps_server():
    """Detiene el servidor TCP GPS"""
    try:
        from app.gps.gps_manager import get_gps_manager
        manager = get_gps_manager()
        manager.stop()
        return jsonify({'success': True, 'message': 'Servidor GPS detenido'})
    except Exception as e:
        logger.error(f"Error deteniendo servidor GPS: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================================
# LIMPIEZA
# ============================================================

@bp.route('/cleanup', methods=['POST'])
def cleanup_old_data():
    """
    Elimina ubicaciones antiguas
    
    Body JSON:
    {
        "days": 30
    }
    """
    try:
        data = request.get_json() or {}
        days = data.get('days', 30)
        days = min(max(days, 1), 365)
        
        from app.database.gps_repository import GPSLocationsRepository
        repo = GPSLocationsRepository()
        deleted = repo.cleanup_old_locations(days=days)
        
        return jsonify({
            'success': True, 
            'message': f'Se eliminaron {deleted} ubicaciones con más de {days} días',
            'deleted': deleted,
        })
    except Exception as e:
        logger.error(f"Error en limpieza: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
