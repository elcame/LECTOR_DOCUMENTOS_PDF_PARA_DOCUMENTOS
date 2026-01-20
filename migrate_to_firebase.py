"""
Script para migrar datos de SQLite a Firebase
Ejecuta este script después de configurar Firebase
"""
import sqlite3
import os
from datetime import datetime

def migrate_database():
    """Migra datos de SQLite a Firebase"""
    print("=" * 60)
    print("🔄 MIGRACIÓN DE SQLITE A FIREBASE")
    print("=" * 60)
    
    # 1. Verificar que Firebase está configurado
    print("\n1. Verificando configuración de Firebase...")
    try:
        from config.firebase_config import FirebaseConfig
        from config.app_config import AppConfig
        
        AppConfig.ensure_directories()
        FirebaseConfig.initialize(AppConfig.FIREBASE_CREDENTIALS_PATH)
        print("   ✓ Firebase inicializado")
    except Exception as e:
        print(f"   ✗ ERROR: {e}")
        print("   → Configura Firebase primero siguiendo GUIA_MIGRACION_COMPLETA.md")
        return False
    
    # 2. Verificar que existe la base de datos SQLite
    db_path = 'data/lector_manifiestos.db'
    print(f"\n2. Verificando base de datos SQLite...")
    if not os.path.exists(db_path):
        print(f"   ⚠ Base de datos SQLite no encontrada: {db_path}")
        print("   → No hay datos para migrar")
        return True
    
    print(f"   ✓ Base de datos encontrada: {db_path}")
    
    # 3. Conectar a SQLite
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        print("   ✓ Conectado a SQLite")
    except Exception as e:
        print(f"   ✗ ERROR al conectar: {e}")
        return False
    
    # 4. Importar repositorios
    print("\n3. Cargando repositorios Firebase...")
    try:
        from database.users_repository import UsersRepository
        from database.qr_data_repository import QRDataRepository
        from database.gastos_repository import GastosRepository
        from database.pagos_repository import PagosRepository
        
        users_repo = UsersRepository()
        qr_repo = QRDataRepository()
        gastos_repo = GastosRepository()
        pagos_repo = PagosRepository()
        print("   ✓ Repositorios cargados")
    except Exception as e:
        print(f"   ✗ ERROR al cargar repositorios: {e}")
        conn.close()
        return False
    
    # 5. Migrar usuarios
    print("\n4. Migrando usuarios...")
    try:
        cursor.execute('SELECT * FROM users')
        users = cursor.fetchall()
        migrated_users = 0
        skipped_users = 0
        
        for row in users:
            user = dict(row)
            username = user['username']
            
            # Verificar si ya existe
            existing = users_repo.get_user_by_username(username)
            if existing:
                print(f"   ⚠ Usuario ya existe (omitiendo): {username}")
                skipped_users += 1
                continue
            
            # Migrar usuario
            success = users_repo.create_user(
                username=username,
                password_hash=user['password_hash'],
                email=user.get('email', '') or '',
                full_name=user.get('full_name', '') or '',
                role=user.get('role', 'conductor') or 'conductor'
            )
            
            if success:
                # Actualizar campos adicionales
                if user.get('placa_asignada'):
                    users_repo.update_user_placa_asignada(username, user['placa_asignada'])
                if user.get('last_login'):
                    users_repo.update_user_last_login(username)
                
                migrated_users += 1
                print(f"   ✓ Usuario migrado: {username}")
            else:
                print(f"   ✗ Error al migrar usuario: {username}")
        
        print(f"\n   ✅ Usuarios migrados: {migrated_users}, omitidos: {skipped_users}")
    except Exception as e:
        print(f"   ✗ ERROR al migrar usuarios: {e}")
    
    # 6. Migrar datos QR
    print("\n5. Migrando datos QR...")
    try:
        cursor.execute('SELECT * FROM qr_data')
        qr_data = cursor.fetchall()
        migrated_qr = 0
        
        for row in qr_data:
            qr = dict(row)
            try:
                success = qr_repo.save_qr_data(
                    username=qr['username'],
                    carpeta=qr['carpeta'],
                    archivo=qr['archivo'],
                    ruta_completa=qr.get('ruta_completa', '') or '',
                    placa=qr.get('placa', '') or '',
                    numero_manifiesto=qr.get('numero_manifiesto', '') or '',
                    fecha=qr.get('fecha', '') or '',
                    hora=qr.get('hora', '') or '',
                    origen=qr.get('origen', '') or '',
                    destino=qr.get('destino', '') or '',
                    qr_raw=qr.get('qr_raw', '') or '',
                    conductor_id=qr.get('conductor_id')
                )
                if success:
                    migrated_qr += 1
                    if migrated_qr % 10 == 0:
                        print(f"   ... {migrated_qr} registros migrados")
            except Exception as e:
                print(f"   ✗ Error al migrar QR {qr.get('archivo', 'N/A')}: {e}")
        
        print(f"\n   ✅ Datos QR migrados: {migrated_qr}")
    except Exception as e:
        print(f"   ✗ ERROR al migrar datos QR: {e}")
    
    # 7. Migrar gastos
    print("\n6. Migrando gastos de viajes...")
    try:
        cursor.execute('SELECT * FROM gastos_viajes')
        gastos = cursor.fetchall()
        migrated_gastos = 0
        
        for row in gastos:
            gasto = dict(row)
            try:
                success = gastos_repo.save_gasto_viaje(
                    username=gasto.get('username', '') or '',
                    numero_manifiesto=gasto.get('numero_manifiesto', '') or '',
                    concepto=gasto.get('concepto', '') or '',
                    valor=float(gasto.get('valor', 0) or 0),
                    fecha=gasto.get('fecha', '') or '',
                    placa=gasto.get('placa', '') or ''
                )
                if success:
                    migrated_gastos += 1
            except Exception as e:
                print(f"   ✗ Error al migrar gasto: {e}")
        
        print(f"\n   ✅ Gastos migrados: {migrated_gastos}")
    except Exception as e:
        print(f"   ✗ ERROR al migrar gastos: {e}")
    
    # 8. Migrar pagos
    print("\n7. Migrando pagos a conductores...")
    try:
        cursor.execute('SELECT * FROM pagos_conductores')
        pagos = cursor.fetchall()
        migrated_pagos = 0
        
        for row in pagos:
            pago = dict(row)
            try:
                success = pagos_repo.save_pago(
                    carpeta_original=pago.get('carpeta_original', '') or '',
                    numero_manifiesto=pago.get('numero_manifiesto', '') or '',
                    placa=pago.get('placa', '') or '',
                    conductor=pago.get('conductor', '') or '',
                    valor_total=float(pago.get('valor_total', 0) or 0),
                    anticipo=float(pago.get('anticipo', 0) or 0),
                    saldo=float(pago.get('saldo', 0) or 0),
                    fecha_pago=pago.get('fecha_pago', '') or '',
                    estado=pago.get('estado', 'pendiente') or 'pendiente',
                    observaciones=pago.get('observaciones', '') or ''
                )
                if success:
                    migrated_pagos += 1
            except Exception as e:
                print(f"   ✗ Error al migrar pago: {e}")
        
        print(f"\n   ✅ Pagos migrados: {migrated_pagos}")
    except Exception as e:
        print(f"   ✗ ERROR al migrar pagos: {e}")
    
    # 9. Cerrar conexión
    conn.close()
    
    print("\n" + "=" * 60)
    print("✅ MIGRACIÓN COMPLETADA")
    print("=" * 60)
    print("\n📊 Resumen:")
    print(f"   - Usuarios: {migrated_users} migrados, {skipped_users} omitidos")
    print(f"   - Datos QR: {migrated_qr} migrados")
    print(f"   - Gastos: {migrated_gastos} migrados")
    print(f"   - Pagos: {migrated_pagos} migrados")
    print("\n🎉 Verifica los datos en Firebase Console → Firestore Database")
    
    return True

if __name__ == '__main__':
    try:
        migrate_database()
    except KeyboardInterrupt:
        print("\n\n⚠ Migración cancelada por el usuario")
    except Exception as e:
        print(f"\n\n✗ ERROR FATAL: {e}")
        import traceback
        traceback.print_exc()

