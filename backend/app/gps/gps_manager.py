"""
GPS Manager - Orquesta el servidor TCP y el almacenamiento en Firebase
Es el punto central que conecta la recepción de datos GPS con la persistencia.
"""
import logging
import threading
from typing import Optional, Dict

from .tcp_server import GPSTCPServer

logger = logging.getLogger(__name__)

# Instancia global del manager
_gps_manager: Optional['GPSManager'] = None
_manager_lock = threading.Lock()


class GPSManager:
    """
    Administra el servidor TCP GPS y almacena datos en Firebase.
    Singleton - solo debe existir una instancia.
    """
    
    def __init__(self, tcp_host: str = '0.0.0.0', tcp_port: int = 5001):
        self.tcp_host = tcp_host
        self.tcp_port = tcp_port
        self.tcp_server: Optional[GPSTCPServer] = None
        self._devices_repo = None
        self._locations_repo = None
        self._started = False
    
    @property
    def devices_repo(self):
        """Lazy loading del repositorio de dispositivos"""
        if self._devices_repo is None:
            from app.database.gps_repository import GPSDevicesRepository
            self._devices_repo = GPSDevicesRepository()
        return self._devices_repo
    
    @property
    def locations_repo(self):
        """Lazy loading del repositorio de ubicaciones"""
        if self._locations_repo is None:
            from app.database.gps_repository import GPSLocationsRepository
            self._locations_repo = GPSLocationsRepository()
        return self._locations_repo
    
    def start(self):
        """Inicia el servidor TCP GPS"""
        if self._started:
            logger.warning("[GPSManager] Ya está iniciado")
            return
        
        logger.info(f"[GPSManager] Iniciando servidor TCP en {self.tcp_host}:{self.tcp_port}")
        
        self.tcp_server = GPSTCPServer(
            host=self.tcp_host,
            port=self.tcp_port,
            on_location=self._on_location_received,
            on_login=self._on_device_login,
        )
        self.tcp_server.start()
        self._started = True
        
        logger.info("[GPSManager] Servidor GPS TCP iniciado correctamente")
    
    def stop(self):
        """Detiene el servidor TCP GPS"""
        if self.tcp_server:
            self.tcp_server.stop()
            self._started = False
            logger.info("[GPSManager] Servidor GPS detenido")
    
    def _on_device_login(self, imei: str, address: tuple):
        """Callback cuando un dispositivo se conecta y envía su IMEI"""
        try:
            self.devices_repo.update_last_seen(imei)
            logger.info(f"[GPSManager] Dispositivo {imei} conectado desde {address}")
        except Exception as e:
            logger.error(f"[GPSManager] Error al registrar login de {imei}: {e}")
    
    def _on_location_received(self, imei: str, gps_data: dict):
        """Callback cuando se recibe una ubicación GPS"""
        try:
            # Guardar la ubicación
            self.locations_repo.save_location(imei, gps_data)
            
            # Actualizar última vez visto del dispositivo
            self.devices_repo.update_last_seen(imei)
            
            logger.info(
                f"[GPSManager] Ubicación guardada - {imei}: "
                f"({gps_data.get('latitude')}, {gps_data.get('longitude')})"
            )
        except Exception as e:
            logger.error(f"[GPSManager] Error guardando ubicación de {imei}: {e}")
    
    @property
    def is_running(self) -> bool:
        """Verifica si el servidor está corriendo"""
        return self._started and self.tcp_server is not None and self.tcp_server.running
    
    def get_status(self) -> dict:
        """Retorna el estado actual del servidor GPS"""
        connected = []
        if self.tcp_server:
            connected = self.tcp_server.get_connected_devices()
        
        return {
            'running': self.is_running,
            'host': self.tcp_host,
            'port': self.tcp_port,
            'connected_devices': connected,
            'connected_count': len(connected),
        }


def get_gps_manager(tcp_host: str = '0.0.0.0', tcp_port: int = 5001) -> GPSManager:
    """
    Obtiene la instancia singleton del GPSManager.
    Si no existe, la crea pero NO la inicia automáticamente.
    
    Args:
        tcp_host: IP donde escuchar
        tcp_port: puerto TCP para el servidor GPS
    
    Returns:
        GPSManager: instancia del manager
    """
    global _gps_manager
    
    with _manager_lock:
        if _gps_manager is None:
            _gps_manager = GPSManager(tcp_host=tcp_host, tcp_port=tcp_port)
    
    return _gps_manager
