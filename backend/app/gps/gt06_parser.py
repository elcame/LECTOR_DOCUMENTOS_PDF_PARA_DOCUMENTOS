"""
Parser del protocolo GT06 para dispositivos GPS SinoTrack
Los dispositivos SinoTrack (ST-901, ST-906, ST-907, etc.) usan el protocolo GT06
que transmite datos binarios sobre TCP.

Formato general de un paquete GT06:
┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│ Start    │ Length   │ Protocol │ Data     │ Serial   │ CRC      │ Stop     │
│ 0x7878   │ 1 byte   │ 1 byte   │ variable │ 2 bytes  │ 2 bytes  │ 0x0D0A   │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘

Protocolos principales:
- 0x01: Login (el dispositivo envía su IMEI)
- 0x12: Datos de ubicación GPS
- 0x13: Status (heartbeat)
- 0x16: Datos GPS + LBS + Status combinados
- 0x1A: Datos GPS con información extendida
"""
import struct
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, Tuple

logger = logging.getLogger(__name__)

# Constantes del protocolo
START_BYTES = b'\x78\x78'
STOP_BYTES = b'\x0d\x0a'

# Tipos de protocolo
PROTOCOL_LOGIN = 0x01
PROTOCOL_GPS = 0x12
PROTOCOL_HEARTBEAT = 0x13
PROTOCOL_GPS_LBS_STATUS = 0x16
PROTOCOL_GPS_EXTENDED = 0x1A
PROTOCOL_ALARM = 0x26

PROTOCOL_NAMES = {
    0x01: 'LOGIN',
    0x12: 'GPS',
    0x13: 'HEARTBEAT',
    0x16: 'GPS_LBS_STATUS',
    0x1A: 'GPS_EXTENDED',
    0x26: 'ALARM',
}


def calculate_crc16(data: bytes) -> int:
    """
    Calcula CRC-16/X25 usado por el protocolo GT06
    
    Args:
        data: bytes sobre los cuales calcular el CRC
    
    Returns:
        int: valor CRC de 16 bits
    """
    crc = 0xFFFF
    for byte in data:
        crc ^= byte
        for _ in range(8):
            if crc & 1:
                crc = (crc >> 1) ^ 0x8408
            else:
                crc >>= 1
    return crc ^ 0xFFFF


def build_response(protocol_number: int, serial: int) -> bytes:
    """
    Construye un paquete de respuesta GT06
    
    Args:
        protocol_number: número del protocolo al que se responde
        serial: número de serie del paquete original
    
    Returns:
        bytes: paquete de respuesta completo
    """
    # Longitud fija para respuestas: protocol(1) + serial(2) + crc(2) = 5
    length = 0x05
    
    # Cuerpo del paquete (sin start/stop)
    body = struct.pack('!BB', length, protocol_number)
    body += struct.pack('!H', serial)
    
    # CRC sobre length + protocol + serial
    crc = calculate_crc16(body)
    
    packet = START_BYTES + body + struct.pack('!H', crc) + STOP_BYTES
    return packet


def parse_imei(data: bytes) -> str:
    """
    Extrae el IMEI de un paquete de login
    
    El IMEI viene como 8 bytes donde cada nibble (4 bits) es un dígito.
    Total: 16 nibbles = 15 dígitos IMEI (primer nibble puede ser 0)
    
    Args:
        data: 8 bytes del campo IMEI
    
    Returns:
        str: IMEI como string de 15 dígitos
    """
    imei = ''
    for byte in data:
        imei += f'{byte:02x}'
    # El IMEI real tiene 15 dígitos, el primer caracter puede ser padding
    return imei[-15:] if len(imei) > 15 else imei


def parse_gps_data(data: bytes) -> Dict[str, Any]:
    """
    Parsea los datos GPS de un paquete de ubicación GT06
    
    Formato de datos GPS (12 bytes):
    - Fecha/hora: 6 bytes (YY MM DD HH MM SS)
    - GPS info length + satellites: 1 byte
    - Latitud: 4 bytes (uint32, en minutos * 30000)
    - Longitud: 4 bytes (uint32, en minutos * 30000)
    - Velocidad: 1 byte (km/h)
    - Course + status: 2 bytes
    
    Args:
        data: bytes con los datos GPS
    
    Returns:
        dict con lat, lng, speed, course, timestamp, satellites, gps_valid
    """
    if len(data) < 18:
        logger.warning(f"Datos GPS muy cortos: {len(data)} bytes")
        return {}
    
    try:
        # Fecha y hora (6 bytes)
        year = 2000 + data[0]
        month = data[1]
        day = data[2]
        hour = data[3]
        minute = data[4]
        second = data[5]
        
        try:
            timestamp = datetime(year, month, day, hour, minute, second, tzinfo=timezone.utc)
        except ValueError:
            logger.warning(f"Fecha inválida: {year}-{month}-{day} {hour}:{minute}:{second}")
            timestamp = datetime.now(timezone.utc)
        
        # Satélites y longitud de datos GPS (1 byte)
        gps_info = data[6]
        gps_data_length = (gps_info >> 4) & 0x0F
        satellites = gps_info & 0x0F
        
        # Latitud (4 bytes) - en unidades de minutos / 30000
        lat_raw = struct.unpack('!I', data[7:11])[0]
        latitude = lat_raw / 1800000.0  # Convertir a grados decimales
        
        # Longitud (4 bytes)
        lng_raw = struct.unpack('!I', data[11:15])[0]
        longitude = lng_raw / 1800000.0
        
        # Velocidad (1 byte) en km/h
        speed = data[15]
        
        # Course y status (2 bytes)
        course_status = struct.unpack('!H', data[16:18])[0]
        
        # Bit 12: GPS real-time/differential
        # Bit 13: GPS positioned (1=posicionado, 0=no)
        # Bit 14: Longitud (0=Este, 1=Oeste)
        # Bit 15: Latitud (0=Sur, 1=Norte... invertido en GT06: 0=Norte)
        gps_valid = bool(course_status & 0x1000)
        is_west = bool(course_status & 0x0400)
        is_south = bool(course_status & 0x0800)
        course = course_status & 0x03FF  # Últimos 10 bits = dirección (0-360)
        
        # Ajustar signos según hemisferio
        if is_south:
            latitude = -latitude
        if is_west:
            longitude = -longitude
        
        return {
            'timestamp': timestamp.isoformat(),
            'latitude': round(latitude, 6),
            'longitude': round(longitude, 6),
            'speed': speed,
            'course': course,
            'satellites': satellites,
            'gps_valid': gps_valid,
        }
    
    except Exception as e:
        logger.error(f"Error parseando datos GPS: {e}")
        return {}


def parse_packet(raw_data: bytes) -> Optional[Dict[str, Any]]:
    """
    Parsea un paquete completo del protocolo GT06
    
    Args:
        raw_data: bytes crudos recibidos por TCP
    
    Returns:
        dict con la información parseada o None si es inválido
        {
            'protocol': int,
            'protocol_name': str,
            'serial': int,
            'imei': str (solo en login),
            'gps': dict (solo en paquetes GPS),
        }
    """
    if len(raw_data) < 10:
        logger.debug(f"Paquete muy corto: {len(raw_data)} bytes")
        return None
    
    # Verificar bytes de inicio
    if raw_data[:2] != START_BYTES:
        logger.warning(f"Start bytes inválidos: {raw_data[:2].hex()}")
        return None
    
    # Verificar bytes de fin
    if raw_data[-2:] != STOP_BYTES:
        logger.warning(f"Stop bytes inválidos: {raw_data[-2:].hex()}")
        return None
    
    # Longitud del paquete (sin contar start, length, crc, stop)
    packet_length = raw_data[2]
    
    # Número de protocolo
    protocol_number = raw_data[3]
    protocol_name = PROTOCOL_NAMES.get(protocol_number, f'UNKNOWN_0x{protocol_number:02X}')
    
    # Datos del paquete (entre protocol y serial)
    data_end = 2 + packet_length - 4  # -4 = serial(2) + crc(2)... pero offset desde start
    # Más preciso: data empieza en index 4, termina antes del serial
    serial_offset = len(raw_data) - 6  # 6 = serial(2) + crc(2) + stop(2)
    data = raw_data[4:serial_offset]
    
    # Serial number (2 bytes antes del CRC)
    serial = struct.unpack('!H', raw_data[serial_offset:serial_offset + 2])[0]
    
    result = {
        'protocol': protocol_number,
        'protocol_name': protocol_name,
        'serial': serial,
        'raw_hex': raw_data.hex(),
    }
    
    # Parsear según tipo de protocolo
    if protocol_number == PROTOCOL_LOGIN:
        # Login: data contiene el IMEI (8 bytes)
        if len(data) >= 8:
            result['imei'] = parse_imei(data[:8])
            logger.info(f"Login recibido - IMEI: {result['imei']}")
        else:
            logger.warning(f"Login con datos insuficientes: {len(data)} bytes")
    
    elif protocol_number in (PROTOCOL_GPS, PROTOCOL_GPS_LBS_STATUS, PROTOCOL_GPS_EXTENDED, PROTOCOL_ALARM):
        # Paquetes que contienen datos GPS
        gps = parse_gps_data(data)
        if gps:
            result['gps'] = gps
            logger.info(
                f"GPS - Lat: {gps.get('latitude')}, Lng: {gps.get('longitude')}, "
                f"Speed: {gps.get('speed')} km/h, Satellites: {gps.get('satellites')}"
            )
    
    elif protocol_number == PROTOCOL_HEARTBEAT:
        # Heartbeat - solo necesita respuesta, no tiene datos útiles
        logger.debug("Heartbeat recibido")
    
    else:
        logger.debug(f"Protocolo no manejado: {protocol_name} (0x{protocol_number:02X})")
    
    return result


def extract_packets(buffer: bytes) -> Tuple[list, bytes]:
    """
    Extrae todos los paquetes completos de un buffer de datos
    Útil cuando se reciben múltiples paquetes en una sola lectura TCP
    
    Args:
        buffer: datos acumulados del socket
    
    Returns:
        tuple: (lista de paquetes raw, bytes sobrantes sin procesar)
    """
    packets = []
    remaining = buffer
    
    while True:
        # Buscar inicio de paquete
        start_idx = remaining.find(START_BYTES)
        if start_idx == -1:
            break
        
        # Descartar datos antes del start
        if start_idx > 0:
            remaining = remaining[start_idx:]
        
        # Necesitamos al menos 3 bytes para leer la longitud
        if len(remaining) < 3:
            break
        
        # Longitud del contenido (sin contar start_bytes, length_byte, crc, stop_bytes)
        content_length = remaining[2]
        
        # Longitud total del paquete: start(2) + length(1) + content(N) + crc(2) + stop(2)
        total_length = 2 + 1 + content_length + 2 + 2
        
        # Verificar si tenemos el paquete completo
        if len(remaining) < total_length:
            break
        
        # Extraer el paquete
        packet = remaining[:total_length]
        
        # Verificar stop bytes
        if packet[-2:] == STOP_BYTES:
            packets.append(packet)
        else:
            logger.warning(f"Paquete con stop bytes inválidos, descartando")
        
        remaining = remaining[total_length:]
    
    return packets, remaining
