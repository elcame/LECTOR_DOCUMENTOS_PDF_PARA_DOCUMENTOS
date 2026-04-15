"""
Servidor TCP para recibir datos de dispositivos GPS SinoTrack (protocolo GT06)

Este servidor corre en un thread separado del servidor Flask.
Escucha conexiones TCP de los dispositivos GPS, parsea los paquetes GT06,
y almacena los datos de ubicación en Firebase.

Cada dispositivo mantiene una conexión TCP persistente y envía:
1. Paquete de Login (IMEI) al conectarse
2. Paquetes GPS periódicos con ubicación
3. Heartbeats para mantener la conexión viva
"""
import socket
import threading
import logging
import time
from typing import Dict, Optional, Callable

from .gt06_parser import (
    parse_packet, extract_packets, build_response,
    PROTOCOL_LOGIN, PROTOCOL_GPS, PROTOCOL_HEARTBEAT,
    PROTOCOL_GPS_LBS_STATUS, PROTOCOL_GPS_EXTENDED, PROTOCOL_ALARM
)

logger = logging.getLogger(__name__)

# Protocolos que requieren respuesta obligatoria
PROTOCOLS_REQUIRING_RESPONSE = {
    PROTOCOL_LOGIN,
    PROTOCOL_HEARTBEAT,
    PROTOCOL_GPS,
    PROTOCOL_GPS_LBS_STATUS,
    PROTOCOL_GPS_EXTENDED,
    PROTOCOL_ALARM,
}


class GPSClientHandler(threading.Thread):
    """
    Maneja la conexión de un dispositivo GPS individual.
    Cada dispositivo GPS tiene su propio thread.
    """
    
    def __init__(self, client_socket: socket.socket, address: tuple,
                 on_location: Optional[Callable] = None,
                 on_login: Optional[Callable] = None):
        """
        Args:
            client_socket: socket de la conexión del cliente
            address: tupla (ip, port) del cliente
            on_location: callback cuando se recibe ubicación -> (imei, gps_data)
            on_login: callback cuando un dispositivo hace login -> (imei, address)
        """
        super().__init__(daemon=True)
        self.client_socket = client_socket
        self.address = address
        self.imei: Optional[str] = None
        self.on_location = on_location
        self.on_login = on_login
        self.running = True
        self.buffer = b''
    
    def run(self):
        """Loop principal de recepción de datos del dispositivo"""
        logger.info(f"[GPS] Nueva conexión desde {self.address}")
        
        try:
            self.client_socket.settimeout(300)  # 5 minutos timeout
            
            while self.running:
                try:
                    data = self.client_socket.recv(1024)
                    if not data:
                        logger.info(f"[GPS] Dispositivo {self.imei or self.address} desconectado")
                        break
                    
                    self.buffer += data
                    self._process_buffer()
                    
                except socket.timeout:
                    logger.warning(f"[GPS] Timeout en dispositivo {self.imei or self.address}")
                    break
                except ConnectionResetError:
                    logger.info(f"[GPS] Conexión reseteada: {self.imei or self.address}")
                    break
                except OSError as e:
                    logger.error(f"[GPS] Error de socket: {e}")
                    break
        
        except Exception as e:
            logger.error(f"[GPS] Error fatal en handler {self.address}: {e}")
        
        finally:
            self._cleanup()
    
    def _process_buffer(self):
        """Procesa todos los paquetes completos en el buffer"""
        packets, self.buffer = extract_packets(self.buffer)
        
        for raw_packet in packets:
            try:
                parsed = parse_packet(raw_packet)
                if parsed is None:
                    continue
                
                protocol = parsed['protocol']
                serial = parsed['serial']
                
                # Login - el dispositivo envía su IMEI
                if protocol == PROTOCOL_LOGIN:
                    self.imei = parsed.get('imei')
                    if self.imei and self.on_login:
                        self.on_login(self.imei, self.address)
                    logger.info(f"[GPS] Dispositivo autenticado: IMEI={self.imei}")
                
                # Datos GPS
                elif protocol in (PROTOCOL_GPS, PROTOCOL_GPS_LBS_STATUS, 
                                  PROTOCOL_GPS_EXTENDED, PROTOCOL_ALARM):
                    gps_data = parsed.get('gps', {})
                    if gps_data and self.imei and self.on_location:
                        gps_data['imei'] = self.imei
                        self.on_location(self.imei, gps_data)
                
                # Heartbeat - solo responder
                elif protocol == PROTOCOL_HEARTBEAT:
                    logger.debug(f"[GPS] Heartbeat de {self.imei}")
                
                # Enviar respuesta si es requerida
                if protocol in PROTOCOLS_REQUIRING_RESPONSE:
                    response = build_response(protocol, serial)
                    self.client_socket.sendall(response)
                    logger.debug(f"[GPS] Respuesta enviada para protocolo 0x{protocol:02X}")
            
            except Exception as e:
                logger.error(f"[GPS] Error procesando paquete: {e}", exc_info=True)
    
    def _cleanup(self):
        """Cierra la conexión del cliente"""
        self.running = False
        try:
            self.client_socket.close()
        except Exception:
            pass
        logger.info(f"[GPS] Conexión cerrada: {self.imei or self.address}")
    
    def stop(self):
        """Detiene el handler"""
        self.running = False


class GPSTCPServer:
    """
    Servidor TCP que acepta conexiones de múltiples dispositivos GPS.
    Corre en un thread separado del servidor Flask principal.
    """
    
    def __init__(self, host: str = '0.0.0.0', port: int = 5001,
                 on_location: Optional[Callable] = None,
                 on_login: Optional[Callable] = None):
        """
        Args:
            host: dirección IP donde escuchar (0.0.0.0 para todas las interfaces)
            port: puerto TCP (por defecto 5001, diferente al Flask 5000)
            on_location: callback global para ubicaciones
            on_login: callback global para logins
        """
        self.host = host
        self.port = port
        self.on_location = on_location
        self.on_login = on_login
        self.server_socket: Optional[socket.socket] = None
        self.running = False
        self.clients: Dict[str, GPSClientHandler] = {}  # imei -> handler
        self._server_thread: Optional[threading.Thread] = None
        self._lock = threading.Lock()
    
    def start(self):
        """Inicia el servidor TCP en un thread separado"""
        if self.running:
            logger.warning("[GPS-TCP] El servidor ya está corriendo")
            return
        
        self.running = True
        self._server_thread = threading.Thread(target=self._run, daemon=True, name="GPS-TCP-Server")
        self._server_thread.start()
        logger.info(f"[GPS-TCP] Servidor iniciado en {self.host}:{self.port}")
    
    def _run(self):
        """Loop principal del servidor TCP"""
        try:
            self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            self.server_socket.settimeout(1.0)  # Para poder verificar self.running
            self.server_socket.bind((self.host, self.port))
            self.server_socket.listen(50)  # Hasta 50 dispositivos en cola
            
            logger.info(f"[GPS-TCP] Escuchando en {self.host}:{self.port}")
            
            while self.running:
                try:
                    client_socket, address = self.server_socket.accept()
                    handler = GPSClientHandler(
                        client_socket=client_socket,
                        address=address,
                        on_location=self._handle_location,
                        on_login=self._handle_login,
                    )
                    handler.start()
                    
                except socket.timeout:
                    continue  # Verificar si todavía estamos running
                except OSError:
                    if self.running:
                        logger.error("[GPS-TCP] Error aceptando conexión")
                    break
        
        except Exception as e:
            logger.error(f"[GPS-TCP] Error fatal: {e}", exc_info=True)
        
        finally:
            self._cleanup()
    
    def _handle_login(self, imei: str, address: tuple):
        """Registra un nuevo dispositivo conectado"""
        with self._lock:
            self.clients[imei] = None  # Se actualiza cuando se asigna el handler
        logger.info(f"[GPS-TCP] Dispositivo registrado: IMEI={imei} desde {address}")
        
        if self.on_login:
            try:
                self.on_login(imei, address)
            except Exception as e:
                logger.error(f"[GPS-TCP] Error en callback on_login: {e}")
    
    def _handle_location(self, imei: str, gps_data: dict):
        """Procesa una nueva ubicación recibida"""
        logger.info(
            f"[GPS-TCP] Ubicación de {imei}: "
            f"({gps_data.get('latitude')}, {gps_data.get('longitude')}) "
            f"@ {gps_data.get('speed')} km/h"
        )
        
        if self.on_location:
            try:
                self.on_location(imei, gps_data)
            except Exception as e:
                logger.error(f"[GPS-TCP] Error en callback on_location: {e}")
    
    def get_connected_devices(self) -> list:
        """Retorna lista de IMEIs de dispositivos conectados"""
        with self._lock:
            return list(self.clients.keys())
    
    def _cleanup(self):
        """Limpieza al cerrar el servidor"""
        self.running = False
        if self.server_socket:
            try:
                self.server_socket.close()
            except Exception:
                pass
        logger.info("[GPS-TCP] Servidor detenido")
    
    def stop(self):
        """Detiene el servidor TCP"""
        logger.info("[GPS-TCP] Deteniendo servidor...")
        self.running = False
        if self._server_thread:
            self._server_thread.join(timeout=5)
