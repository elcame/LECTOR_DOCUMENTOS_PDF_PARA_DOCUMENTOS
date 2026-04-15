"""
Repositorio para operaciones con datos GPS en Firebase
Almacena ubicaciones de dispositivos GPS SinoTrack
"""
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from .firebase_repository import FirebaseRepository


class GPSDevicesRepository(FirebaseRepository):
    """Repositorio para gestión de dispositivos GPS registrados"""
    
    def __init__(self):
        super().__init__('gps_devices')
    
    def register_device(self, imei: str, name: str = '', 
                        placa: str = '', conductor: str = '') -> str:
        """
        Registra o actualiza un dispositivo GPS
        
        Args:
            imei: IMEI del dispositivo
            name: nombre descriptivo
            placa: placa del vehículo asociado
            conductor: nombre del conductor
        
        Returns:
            str: ID del documento
        """
        existing = self.find_one([('imei', '==', imei)])
        
        data = {
            'imei': imei,
            'name': name or f'GPS-{imei[-4:]}',
            'placa': placa,
            'conductor': conductor,
            'active': True,
            'last_seen': datetime.now().isoformat(),
        }
        
        if existing:
            self.update(existing['id'], data)
            return existing['id']
        else:
            return self.create(data, doc_id=f'device_{imei}')
    
    def update_last_seen(self, imei: str):
        """Actualiza el timestamp de última conexión"""
        device = self.find_one([('imei', '==', imei)])
        if device:
            self.update(device['id'], {
                'last_seen': datetime.now().isoformat(),
                'active': True,
            })
    
    def get_device_by_imei(self, imei: str) -> Optional[Dict[str, Any]]:
        """Obtiene un dispositivo por su IMEI"""
        return self.find_one([('imei', '==', imei)])
    
    def get_all_devices(self) -> List[Dict[str, Any]]:
        """Obtiene todos los dispositivos registrados"""
        return self.get_all(order_by='name')
    
    def get_active_devices(self) -> List[Dict[str, Any]]:
        """Obtiene dispositivos activos"""
        return self.get_all(filters=[('active', '==', True)])


class GPSLocationsRepository(FirebaseRepository):
    """Repositorio para almacenar y consultar ubicaciones GPS"""
    
    def __init__(self):
        super().__init__('gps_locations')
    
    def save_location(self, imei: str, gps_data: Dict[str, Any]) -> str:
        """
        Guarda una nueva ubicación GPS
        
        Args:
            imei: IMEI del dispositivo
            gps_data: datos GPS parseados (lat, lng, speed, etc.)
        
        Returns:
            str: ID del documento creado
        """
        data = {
            'imei': imei,
            'latitude': gps_data.get('latitude', 0),
            'longitude': gps_data.get('longitude', 0),
            'speed': gps_data.get('speed', 0),
            'course': gps_data.get('course', 0),
            'satellites': gps_data.get('satellites', 0),
            'gps_valid': gps_data.get('gps_valid', False),
            'device_timestamp': gps_data.get('timestamp', ''),
            'server_timestamp': datetime.now().isoformat(),
        }
        
        return self.create(data)
    
    def get_latest_location(self, imei: str) -> Optional[Dict[str, Any]]:
        """
        Obtiene la última ubicación conocida de un dispositivo
        
        Args:
            imei: IMEI del dispositivo
        
        Returns:
            dict con la ubicación más reciente o None
        """
        results = self.get_all(
            filters=[('imei', '==', imei)],
            order_by='server_timestamp',
            limit=1
        )
        
        # Firestore ordena ascendente por defecto, necesitamos el último
        # Alternativa: traer los últimos N y tomar el más reciente
        all_locations = self.get_all(
            filters=[('imei', '==', imei)],
        )
        
        if not all_locations:
            return None
        
        # Ordenar por timestamp descendente en Python
        all_locations.sort(key=lambda x: x.get('server_timestamp', ''), reverse=True)
        return all_locations[0]
    
    def get_latest_all_devices(self) -> List[Dict[str, Any]]:
        """
        Obtiene la última ubicación de todos los dispositivos
        
        Returns:
            Lista con la última ubicación de cada dispositivo
        """
        all_locations = self.get_all()
        
        if not all_locations:
            return []
        
        # Agrupar por IMEI y tomar el más reciente de cada uno
        latest_by_imei: Dict[str, Dict] = {}
        for loc in all_locations:
            imei = loc.get('imei', '')
            ts = loc.get('server_timestamp', '')
            
            if imei not in latest_by_imei or ts > latest_by_imei[imei].get('server_timestamp', ''):
                latest_by_imei[imei] = loc
        
        return list(latest_by_imei.values())
    
    def get_history(self, imei: str, hours: int = 24, 
                    limit: int = 500) -> List[Dict[str, Any]]:
        """
        Obtiene el historial de ubicaciones de un dispositivo
        
        Args:
            imei: IMEI del dispositivo
            hours: horas hacia atrás a consultar
            limit: máximo de registros
        
        Returns:
            Lista de ubicaciones ordenadas por timestamp
        """
        since = (datetime.now() - timedelta(hours=hours)).isoformat()
        
        locations = self.get_all(
            filters=[
                ('imei', '==', imei),
                ('server_timestamp', '>=', since),
            ],
        )
        
        # Ordenar por timestamp
        locations.sort(key=lambda x: x.get('server_timestamp', ''))
        
        # Limitar
        if len(locations) > limit:
            locations = locations[-limit:]
        
        return locations
    
    def cleanup_old_locations(self, days: int = 30) -> int:
        """
        Elimina ubicaciones más antiguas que N días
        
        Args:
            days: días de antigüedad máxima
        
        Returns:
            int: número de documentos eliminados
        """
        cutoff = (datetime.now() - timedelta(days=days)).isoformat()
        
        old_locations = self.get_all(
            filters=[('server_timestamp', '<', cutoff)],
        )
        
        count = 0
        for loc in old_locations:
            if self.delete(loc['id']):
                count += 1
        
        return count
