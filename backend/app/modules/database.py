"""
Módulo para gestión de base de datos SQLite
"""
import os
import sqlite3
from datetime import datetime
from typing import Optional, Dict, List, Any
from contextlib import contextmanager
import json

# Ruta de la base de datos
DB_DIR = 'data'
DB_FILE = os.path.join(DB_DIR, 'lector_manifiestos.db')


def init_database():
    """
    Inicializa la base de datos y crea las tablas necesarias
    """
    # Crear directorio si no existe
    if not os.path.exists(DB_DIR):
        os.makedirs(DB_DIR)
    
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # Tabla de usuarios
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                email TEXT,
                full_name TEXT,
                created_at TEXT NOT NULL,
                last_login TEXT,
                placa_asignada TEXT
            )
        ''')
        
        # Tabla de tarifas por destino
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS tarifas_destino (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                carpeta_original TEXT NOT NULL,
                destino TEXT NOT NULL,
                tarifa REAL NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT,
                UNIQUE(carpeta_original, destino)
            )
        ''')
        
        # Tabla de gastos adicionales
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS gastos_adicionales (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                carpeta_original TEXT NOT NULL,
                concepto TEXT NOT NULL,
                valor REAL NOT NULL,
                fecha TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT
            )
        ''')
        
        # Tabla de pagos a conductores
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS pagos_conductores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                carpeta_original TEXT NOT NULL,
                numero_manifiesto TEXT NOT NULL,
                placa TEXT,
                conductor TEXT,
                valor_total REAL,
                anticipo REAL,
                saldo REAL,
                fecha_pago TEXT,
                estado TEXT DEFAULT 'pendiente',
                observaciones TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT,
                UNIQUE(carpeta_original, numero_manifiesto)
            )
        ''')
        
        # Tabla de datos QR extraídos
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS qr_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                carpeta TEXT NOT NULL,
                archivo TEXT NOT NULL,
                ruta_completa TEXT,
                placa TEXT,
                numero_manifiesto TEXT,
                fecha TEXT,
                hora TEXT,
                origen TEXT,
                destino TEXT,
                qr_raw TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT,
                UNIQUE(username, carpeta, archivo)
            )
        ''')
        
        # Índices para mejorar rendimiento
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_tarifas_carpeta ON tarifas_destino(carpeta_original)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_gastos_carpeta ON gastos_adicionales(carpeta_original)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_pagos_carpeta ON pagos_conductores(carpeta_original)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_pagos_manifiesto ON pagos_conductores(numero_manifiesto)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_qr_username ON qr_data(username)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_qr_carpeta ON qr_data(carpeta)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_qr_archivo ON qr_data(archivo)')
        
        # Tabla de gastos por viaje
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS gastos_viajes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                numero_manifiesto TEXT NOT NULL,
                placa TEXT,
                concepto TEXT NOT NULL,
                valor REAL NOT NULL,
                fecha TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT,
                FOREIGN KEY (username) REFERENCES users(username)
            )
        ''')
        
        # Migración: Agregar campos si no existen (compatible con tablas existentes)
        migrate_database_schema(cursor)
        
        # Índices para gastos_viajes
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_gastos_viajes_username ON gastos_viajes(username)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_gastos_viajes_manifiesto ON gastos_viajes(numero_manifiesto)')
        
        conn.commit()
        print("[OK] Base de datos inicializada correctamente")


def migrate_database_schema(cursor):
    """
    Migra el esquema de la base de datos agregando nuevos campos si no existen
    """
    try:
        # Agregar campo 'role' a tabla users si no existe
        try:
            cursor.execute('ALTER TABLE users ADD COLUMN role TEXT DEFAULT "admin"')
            print("[OK] Campo 'role' agregado a tabla users")
        except sqlite3.OperationalError:
            # La columna ya existe, no hacer nada
            pass
        
        # Agregar campo 'placa_asignada' a tabla users si no existe
        try:
            cursor.execute('ALTER TABLE users ADD COLUMN placa_asignada TEXT')
            print("[OK] Campo 'placa_asignada' agregado a tabla users")
        except sqlite3.OperationalError:
            # La columna ya existe, no hacer nada
            pass
        
        # Agregar campo 'conductor_id' a tabla qr_data si no existe
        try:
            cursor.execute('ALTER TABLE qr_data ADD COLUMN conductor_id TEXT')
            print("[OK] Campo 'conductor_id' agregado a tabla qr_data")
        except sqlite3.OperationalError:
            # La columna ya existe, no hacer nada
            pass
        
    except Exception as e:
        print(f"Advertencia al migrar esquema: {e}")


@contextmanager
def get_db_connection():
    """
    Context manager para obtener conexión a la base de datos
    """
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row  # Permite acceso por nombre de columna
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()


# ==================== OPERACIONES DE USUARIOS ====================

def create_user(username: str, password_hash: str, email: str = '', full_name: str = '') -> bool:
    """
    Crea un nuevo usuario en la base de datos
    
    Args:
        username: Nombre de usuario
        password_hash: Hash de la contraseña
        email: Email del usuario
        full_name: Nombre completo
    
    Returns:
        bool: True si se creó correctamente
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO users (username, password_hash, email, full_name, created_at)
                VALUES (?, ?, ?, ?, ?)
            ''', (username, password_hash, email, full_name, datetime.now().isoformat()))
            return True
    except sqlite3.IntegrityError:
        return False
    except Exception as e:
        print(f"Error al crear usuario: {e}")
        return False


def get_user_by_username(username: str) -> Optional[Dict]:
    """
    Obtiene un usuario por su nombre de usuario
    
    Args:
        username: Nombre de usuario
    
    Returns:
        dict: Datos del usuario o None si no existe
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM users WHERE LOWER(username) = LOWER(?)', (username,))
            row = cursor.fetchone()
            if row:
                return dict(row)
            return None
    except Exception as e:
        print(f"Error al obtener usuario: {e}")
        return None


def update_user_last_login(username: str) -> bool:
    """
    Actualiza la fecha de último login del usuario
    
    Args:
        username: Nombre de usuario
    
    Returns:
        bool: True si se actualizó correctamente
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE users 
                SET last_login = ? 
                WHERE LOWER(username) = LOWER(?)
            ''', (datetime.now().isoformat(), username))
            return cursor.rowcount > 0
    except Exception as e:
        print(f"Error al actualizar último login: {e}")
        return False


def get_all_users() -> List[Dict]:
    """
    Obtiene todos los usuarios
    
    Returns:
        list: Lista de usuarios
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM users ORDER BY username')
            return [dict(row) for row in cursor.fetchall()]
    except Exception as e:
        print(f"Error al obtener usuarios: {e}")
        return []


# ==================== OPERACIONES DE TARIFAS ====================

def save_tarifas_destino(carpeta_original: str, tarifas_data: Dict[str, float]) -> bool:
    """
    Guarda tarifas por destino para una carpeta
    
    Args:
        carpeta_original: Nombre de la carpeta
        tarifas_data: Diccionario con destino: tarifa
    
    Returns:
        bool: True si se guardó correctamente
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            now = datetime.now().isoformat()
            
            for destino, tarifa in tarifas_data.items():
                cursor.execute('''
                    INSERT OR REPLACE INTO tarifas_destino 
                    (carpeta_original, destino, tarifa, created_at, updated_at)
                    VALUES (?, ?, ?, 
                        COALESCE((SELECT created_at FROM tarifas_destino 
                                 WHERE carpeta_original = ? AND destino = ?), ?),
                        ?)
                ''', (carpeta_original, destino, tarifa, carpeta_original, destino, now, now))
            
            return True
    except Exception as e:
        print(f"Error al guardar tarifas: {e}")
        return False


def get_tarifas_destino(carpeta_original: str) -> Dict[str, float]:
    """
    Obtiene las tarifas por destino para una carpeta
    
    Args:
        carpeta_original: Nombre de la carpeta
    
    Returns:
        dict: Diccionario con destino: tarifa
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT destino, tarifa 
                FROM tarifas_destino 
                WHERE carpeta_original = ?
            ''', (carpeta_original,))
            
            return {row['destino']: row['tarifa'] for row in cursor.fetchall()}
    except Exception as e:
        print(f"Error al obtener tarifas: {e}")
        return {}


def get_all_tarifas() -> List[Dict]:
    """
    Obtiene todas las tarifas agrupadas por carpeta
    
    Returns:
        list: Lista de tarifas
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM tarifas_destino ORDER BY carpeta_original, destino')
            return [dict(row) for row in cursor.fetchall()]
    except Exception as e:
        print(f"Error al obtener todas las tarifas: {e}")
        return []


# ==================== OPERACIONES DE GASTOS ====================

def save_gastos_adicionales(carpeta_original: str, gastos_data: List[Dict]) -> bool:
    """
    Guarda gastos adicionales para una carpeta
    
    Args:
        carpeta_original: Nombre de la carpeta
        gastos_data: Lista de diccionarios con concepto, valor, fecha
    
    Returns:
        bool: True si se guardó correctamente
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            now = datetime.now().isoformat()
            
            # Eliminar gastos existentes de esta carpeta
            cursor.execute('DELETE FROM gastos_adicionales WHERE carpeta_original = ?', (carpeta_original,))
            
            # Insertar nuevos gastos
            for gasto in gastos_data:
                cursor.execute('''
                    INSERT INTO gastos_adicionales 
                    (carpeta_original, concepto, valor, fecha, created_at)
                    VALUES (?, ?, ?, ?, ?)
                ''', (carpeta_original, gasto.get('concepto', ''), 
                      gasto.get('valor', 0), gasto.get('fecha', now), now))
            
            return True
    except Exception as e:
        print(f"Error al guardar gastos: {e}")
        return False


def get_gastos_adicionales(carpeta_original: str) -> List[Dict]:
    """
    Obtiene los gastos adicionales para una carpeta
    
    Args:
        carpeta_original: Nombre de la carpeta
    
    Returns:
        list: Lista de gastos
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM gastos_adicionales 
                WHERE carpeta_original = ?
                ORDER BY fecha DESC
            ''', (carpeta_original,))
            
            return [dict(row) for row in cursor.fetchall()]
    except Exception as e:
        print(f"Error al obtener gastos: {e}")
        return []


# ==================== OPERACIONES DE PAGOS ====================

def save_pago_conductor(carpeta_original: str, numero_manifiesto: str, 
                        placa: str = '', conductor: str = '', 
                        valor_total: float = 0, anticipo: float = 0, 
                        saldo: float = 0, fecha_pago: str = '', 
                        estado: str = 'pendiente', observaciones: str = '') -> bool:
    """
    Guarda o actualiza un pago a conductor
    
    Args:
        carpeta_original: Nombre de la carpeta
        numero_manifiesto: Número del manifiesto
        placa: Placa del vehículo
        conductor: Nombre del conductor
        valor_total: Valor total
        anticipo: Anticipo
        saldo: Saldo pendiente
        fecha_pago: Fecha de pago
        estado: Estado del pago (pendiente, pagado, etc.)
        observaciones: Observaciones
    
    Returns:
        bool: True si se guardó correctamente
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            now = datetime.now().isoformat()
            
            # Verificar si existe
            cursor.execute('''
                SELECT id FROM pagos_conductores 
                WHERE carpeta_original = ? AND numero_manifiesto = ?
            ''', (carpeta_original, numero_manifiesto))
            
            exists = cursor.fetchone()
            
            if exists:
                # Actualizar
                cursor.execute('''
                    UPDATE pagos_conductores 
                    SET placa = ?, conductor = ?, valor_total = ?, anticipo = ?, 
                        saldo = ?, fecha_pago = ?, estado = ?, observaciones = ?, 
                        updated_at = ?
                    WHERE carpeta_original = ? AND numero_manifiesto = ?
                ''', (placa, conductor, valor_total, anticipo, saldo, fecha_pago, 
                      estado, observaciones, now, carpeta_original, numero_manifiesto))
            else:
                # Insertar
                cursor.execute('''
                    INSERT INTO pagos_conductores 
                    (carpeta_original, numero_manifiesto, placa, conductor, 
                     valor_total, anticipo, saldo, fecha_pago, estado, observaciones, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (carpeta_original, numero_manifiesto, placa, conductor, 
                      valor_total, anticipo, saldo, fecha_pago, estado, observaciones, now))
            
            return True
    except Exception as e:
        print(f"Error al guardar pago: {e}")
        return False


def get_pagos_conductores(carpeta_original: str = '') -> List[Dict]:
    """
    Obtiene los pagos a conductores
    
    Args:
        carpeta_original: Nombre de la carpeta (opcional, si está vacío obtiene todos)
    
    Returns:
        list: Lista de pagos
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            if carpeta_original:
                cursor.execute('''
                    SELECT * FROM pagos_conductores 
                    WHERE carpeta_original = ?
                    ORDER BY numero_manifiesto
                ''', (carpeta_original,))
            else:
                cursor.execute('''
                    SELECT * FROM pagos_conductores 
                    ORDER BY carpeta_original, numero_manifiesto
                ''')
            
            return [dict(row) for row in cursor.fetchall()]
    except Exception as e:
        print(f"Error al obtener pagos: {e}")
        return []


def update_multiple_pagos(pagos_data: List[Dict]) -> bool:
    """
    Actualiza múltiples pagos a la vez
    
    Args:
        pagos_data: Lista de diccionarios con los datos de los pagos
    
    Returns:
        bool: True si se actualizaron correctamente
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            now = datetime.now().isoformat()
            
            for pago in pagos_data:
                carpeta = pago.get('carpeta_original', '')
                manifiesto = pago.get('numero_manifiesto', '')
                
                if not carpeta or not manifiesto:
                    continue
                
                cursor.execute('''
                    UPDATE pagos_conductores 
                    SET fecha_pago = ?, estado = ?, observaciones = ?, updated_at = ?
                    WHERE carpeta_original = ? AND numero_manifiesto = ?
                ''', (pago.get('fecha_pago', ''), pago.get('estado', 'pendiente'),
                      pago.get('observaciones', ''), now, carpeta, manifiesto))
            
            return True
    except Exception as e:
        print(f"Error al actualizar múltiples pagos: {e}")
        return False


# ==================== OPERACIONES DE QR DATA ====================

def save_qr_data(username: str, carpeta: str, archivo: str, ruta_completa: str,
                 placa: str = '', numero_manifiesto: str = '', fecha: str = '',
                 hora: str = '', origen: str = '', destino: str = '', qr_raw: str = '') -> bool:
    """
    Guarda o actualiza datos de QR extraídos
    
    Args:
        username: Nombre de usuario
        carpeta: Nombre de la carpeta
        archivo: Nombre del archivo PDF
        ruta_completa: Ruta completa del archivo
        placa: Placa del vehículo
        numero_manifiesto: Número del manifiesto
        fecha: Fecha
        hora: Hora
        origen: Origen
        destino: Destino
        qr_raw: Datos raw del QR
    
    Returns:
        bool: True si se guardó correctamente
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            now = datetime.now().isoformat()
            
            # Verificar si existe
            cursor.execute('''
                SELECT id FROM qr_data 
                WHERE username = ? AND carpeta = ? AND archivo = ?
            ''', (username, carpeta, archivo))
            
            exists = cursor.fetchone()
            
            if exists:
                # Actualizar
                cursor.execute('''
                    UPDATE qr_data 
                    SET placa = ?, numero_manifiesto = ?, fecha = ?, hora = ?,
                        origen = ?, destino = ?, qr_raw = ?, ruta_completa = ?,
                        updated_at = ?
                    WHERE username = ? AND carpeta = ? AND archivo = ?
                ''', (placa, numero_manifiesto, fecha, hora, origen, destino, 
                      qr_raw, ruta_completa, now, username, carpeta, archivo))
            else:
                # Insertar
                cursor.execute('''
                    INSERT INTO qr_data 
                    (username, carpeta, archivo, ruta_completa, placa, numero_manifiesto,
                     fecha, hora, origen, destino, qr_raw, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (username, carpeta, archivo, ruta_completa, placa, numero_manifiesto,
                      fecha, hora, origen, destino, qr_raw, now))
            
            conn.commit()
            return True
    except Exception as e:
        print(f"Error al guardar datos QR: {e}")
        return False


def get_qr_data(username: str = '', carpeta: str = '', placa_filtro: str = None) -> List[Dict]:
    """
    Obtiene datos de QR almacenados
    
    Args:
        username: Nombre de usuario (opcional, si está vacío obtiene todos)
        carpeta: Nombre de carpeta (opcional, si está vacío obtiene todas)
        placa_filtro: Placa para filtrar (opcional, solo para conductores)
    
    Returns:
        list: Lista de datos QR
    """
    try:
        with get_db_connection() as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Si se especifica placa_filtro, filtrar por esa placa
            if placa_filtro:
                placa_upper = placa_filtro.upper().strip()
                if username and carpeta:
                    cursor.execute('''
                        SELECT * FROM qr_data 
                        WHERE username = ? AND carpeta = ? AND UPPER(TRIM(placa)) = ?
                        ORDER BY archivo
                    ''', (username, carpeta, placa_upper))
                elif username:
                    cursor.execute('''
                        SELECT * FROM qr_data 
                        WHERE username = ? AND UPPER(TRIM(placa)) = ?
                        ORDER BY carpeta, archivo
                    ''', (username, placa_upper))
                else:
                    cursor.execute('''
                        SELECT * FROM qr_data 
                        WHERE UPPER(TRIM(placa)) = ?
                        ORDER BY username, carpeta, archivo
                    ''', (placa_upper,))
            elif username and carpeta:
                cursor.execute('''
                    SELECT * FROM qr_data 
                    WHERE username = ? AND carpeta = ?
                    ORDER BY archivo
                ''', (username, carpeta))
            elif username:
                cursor.execute('''
                    SELECT * FROM qr_data 
                    WHERE username = ?
                    ORDER BY carpeta, archivo
                ''', (username,))
            else:
                cursor.execute('''
                    SELECT * FROM qr_data 
                    ORDER BY username, carpeta, archivo
                ''')
            
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
    except Exception as e:
        print(f"Error al obtener datos QR: {e}")
        return []


def delete_qr_data_by_carpeta(username: str, carpeta: str) -> bool:
    """
    Elimina todos los datos QR de una carpeta específica
    
    Args:
        username: Nombre de usuario
        carpeta: Nombre de carpeta
    
    Returns:
        bool: True si se eliminaron correctamente
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                DELETE FROM qr_data 
                WHERE username = ? AND carpeta = ?
            ''', (username, carpeta))
            conn.commit()
            return True
    except Exception as e:
        print(f"Error al eliminar datos QR: {e}")
        return False


def get_resumen_pagos(carpeta_original: str = '') -> Dict[str, Any]:
    """
    Obtiene un resumen de los pagos
    
    Args:
        carpeta_original: Nombre de la carpeta (opcional)
    
    Returns:
        dict: Resumen con totales y estadísticas
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            if carpeta_original:
                cursor.execute('''
                    SELECT 
                        COUNT(*) as total,
                        SUM(valor_total) as total_valor,
                        SUM(anticipo) as total_anticipo,
                        SUM(saldo) as total_saldo,
                        COUNT(CASE WHEN estado = 'pagado' THEN 1 END) as pagados,
                        COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pendientes
                    FROM pagos_conductores
                    WHERE carpeta_original = ?
                ''', (carpeta_original,))
            else:
                cursor.execute('''
                    SELECT 
                        COUNT(*) as total,
                        SUM(valor_total) as total_valor,
                        SUM(anticipo) as total_anticipo,
                        SUM(saldo) as total_saldo,
                        COUNT(CASE WHEN estado = 'pagado' THEN 1 END) as pagados,
                        COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pendientes
                    FROM pagos_conductores
                ''')
            
            row = cursor.fetchone()
            if row:
                return dict(row)
            return {}
    except Exception as e:
        print(f"Error al obtener resumen de pagos: {e}")
        return {}


# ==================== FUNCIONES PARA EDITAR QR DATA ====================

def update_qr_field(qr_id: int, field: str, value: str) -> bool:
    """
    Actualiza un campo específico de un registro QR
    
    Args:
        qr_id: ID del registro QR
        field: Nombre del campo a actualizar
        value: Nuevo valor
    
    Returns:
        bool: True si se actualizó correctamente
    """
    try:
        # Validar que el campo sea editable
        editable_fields = ['placa', 'numero_manifiesto', 'fecha', 'hora', 'origen', 'destino', 'conductor_id']
        if field not in editable_fields:
            print(f"Campo '{field}' no es editable")
            return False
        
        with get_db_connection() as conn:
            cursor = conn.cursor()
            now = datetime.now().isoformat()
            
            cursor.execute(f'''
                UPDATE qr_data 
                SET {field} = ?, updated_at = ?
                WHERE id = ?
            ''', (value, now, qr_id))
            
            conn.commit()
            return True
    except Exception as e:
        print(f"Error al actualizar campo QR: {e}")
        return False


# ==================== FUNCIONES PARA ROLES DE USUARIO ====================

def get_user_role(username: str) -> str:
    """
    Obtiene el rol de un usuario
    
    Args:
        username: Nombre de usuario
    
    Returns:
        str: Rol del usuario ('admin' o 'conductor'), 'admin' por defecto
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT role FROM users WHERE username = ?', (username,))
            row = cursor.fetchone()
            if row and row[0]:
                return row[0]
            return 'admin'  # Por defecto
    except Exception as e:
        print(f"Error al obtener rol de usuario: {e}")
        return 'admin'


def get_user_placa_asignada(username: str) -> Optional[str]:
    """
    Obtiene la placa asignada a un conductor
    
    Args:
        username: Nombre de usuario
    
    Returns:
        str: Placa asignada o None si no tiene
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT placa_asignada FROM users WHERE username = ?', (username,))
            row = cursor.fetchone()
            if row and row[0]:
                return row[0]
            return None
    except Exception as e:
        print(f"Error al obtener placa asignada: {e}")
        return None


def update_user_placa_asignada(username: str, placa: str) -> bool:
    """
    Asigna una placa a un conductor
    
    Args:
        username: Nombre de usuario
        placa: Placa a asignar
    
    Returns:
        bool: True si se actualizó correctamente
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE users 
                SET placa_asignada = ?
                WHERE username = ?
            ''', (placa.upper().strip() if placa else None, username))
            conn.commit()
            return cursor.rowcount > 0
    except Exception as e:
        print(f"Error al actualizar placa asignada: {e}")
        return False


def update_user_role(username: str, role: str) -> bool:
    """
    Actualiza el rol de un usuario
    
    Args:
        username: Nombre de usuario
        role: Nuevo rol ('admin' o 'conductor')
    
    Returns:
        bool: True si se actualizó correctamente
    """
    try:
        if role not in ['admin', 'conductor']:
            return False
        
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE users 
                SET role = ?
                WHERE username = ?
            ''', (role, username))
            conn.commit()
            return True
    except Exception as e:
        print(f"Error al actualizar rol de usuario: {e}")
        return False


# ==================== FUNCIONES PARA GASTOS DE VIAJES ====================

def save_gasto_viaje(username: str, numero_manifiesto: str, concepto: str, 
                     valor: float, fecha: str, placa: str = '') -> bool:
    """
    Guarda un gasto asociado a un viaje
    
    Args:
        username: Nombre de usuario
        numero_manifiesto: Número de manifiesto
        concepto: Concepto del gasto
        valor: Valor del gasto
        fecha: Fecha del gasto
        placa: Placa del vehículo (opcional)
    
    Returns:
        bool: True si se guardó correctamente
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            now = datetime.now().isoformat()
            
            cursor.execute('''
                INSERT INTO gastos_viajes 
                (username, numero_manifiesto, placa, concepto, valor, fecha, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (username, numero_manifiesto, placa, concepto, valor, fecha, now))
            
            conn.commit()
            return True
    except Exception as e:
        print(f"Error al guardar gasto de viaje: {e}")
        return False


def get_gastos_viajes(username: str = '', numero_manifiesto: str = '') -> List[Dict]:
    """
    Obtiene gastos de viajes
    
    Args:
        username: Nombre de usuario (opcional)
        numero_manifiesto: Número de manifiesto (opcional)
    
    Returns:
        list: Lista de gastos
    """
    try:
        with get_db_connection() as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            if username and numero_manifiesto:
                cursor.execute('''
                    SELECT * FROM gastos_viajes 
                    WHERE username = ? AND numero_manifiesto = ?
                    ORDER BY fecha DESC, created_at DESC
                ''', (username, numero_manifiesto))
            elif username:
                cursor.execute('''
                    SELECT * FROM gastos_viajes 
                    WHERE username = ?
                    ORDER BY fecha DESC, created_at DESC
                ''', (username,))
            elif numero_manifiesto:
                cursor.execute('''
                    SELECT * FROM gastos_viajes 
                    WHERE numero_manifiesto = ?
                    ORDER BY fecha DESC, created_at DESC
                ''', (numero_manifiesto,))
            else:
                cursor.execute('''
                    SELECT * FROM gastos_viajes 
                    ORDER BY fecha DESC, created_at DESC
                ''')
            
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
    except Exception as e:
        print(f"Error al obtener gastos de viajes: {e}")
        return []


def update_gasto_viaje(gasto_id: int, concepto: str = None, valor: float = None, 
                      fecha: str = None) -> bool:
    """
    Actualiza un gasto de viaje
    
    Args:
        gasto_id: ID del gasto
        concepto: Nuevo concepto (opcional)
        valor: Nuevo valor (opcional)
        fecha: Nueva fecha (opcional)
    
    Returns:
        bool: True si se actualizó correctamente
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            now = datetime.now().isoformat()
            
            updates = []
            params = []
            
            if concepto is not None:
                updates.append('concepto = ?')
                params.append(concepto)
            
            if valor is not None:
                updates.append('valor = ?')
                params.append(valor)
            
            if fecha is not None:
                updates.append('fecha = ?')
                params.append(fecha)
            
            if not updates:
                return False
            
            updates.append('updated_at = ?')
            params.append(now)
            params.append(gasto_id)
            
            cursor.execute(f'''
                UPDATE gastos_viajes 
                SET {', '.join(updates)}
                WHERE id = ?
            ''', params)
            
            conn.commit()
            return True
    except Exception as e:
        print(f"Error al actualizar gasto de viaje: {e}")
        return False


def delete_gasto_viaje(gasto_id: int) -> bool:
    """
    Elimina un gasto de viaje
    
    Args:
        gasto_id: ID del gasto
    
    Returns:
        bool: True si se eliminó correctamente
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM gastos_viajes WHERE id = ?', (gasto_id,))
            conn.commit()
            return True
    except Exception as e:
        print(f"Error al eliminar gasto de viaje: {e}")
        return False

