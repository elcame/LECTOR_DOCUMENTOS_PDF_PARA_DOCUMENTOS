"""
Script para migrar datos de archivos JSON a base de datos SQLite
"""
import os
import json
from modules.database import (
    init_database, create_user, save_tarifas_destino, 
    save_gastos_adicionales, get_user_by_username
)
from modules.auth import hash_password

def migrate_users():
    """Migra usuarios de users.json a la base de datos"""
    users_file = os.path.join('data', 'users.json')
    
    if not os.path.exists(users_file):
        print("⚠️  No se encontró users.json, saltando migración de usuarios")
        return
    
    print("📦 Migrando usuarios...")
    try:
        with open(users_file, 'r', encoding='utf-8') as f:
            users = json.load(f)
        
        migrated = 0
        skipped = 0
        
        for username, user_data in users.items():
            # Verificar si ya existe en la BD
            if get_user_by_username(username):
                print(f"  ⏭️  Usuario '{username}' ya existe en BD, saltando...")
                skipped += 1
                continue
            
            # Crear usuario en BD
            if create_user(
                username=user_data.get('username', username),
                password_hash=user_data.get('password_hash', ''),
                email=user_data.get('email', ''),
                full_name=user_data.get('full_name', '')
            ):
                print(f"  ✓ Usuario '{username}' migrado")
                migrated += 1
            else:
                print(f"  ❌ Error al migrar usuario '{username}'")
        
        print(f"✅ Usuarios migrados: {migrated}, omitidos: {skipped}")
        
    except Exception as e:
        print(f"❌ Error al migrar usuarios: {e}")


def migrate_tarifas():
    """Migra tarifas de archivos JSON a la base de datos"""
    data_folder = 'data'
    
    if not os.path.exists(data_folder):
        print("⚠️  No se encontró carpeta data, saltando migración de tarifas")
        return
    
    print("📦 Migrando tarifas...")
    
    # Buscar archivos de tarifas
    tarifas_files = [f for f in os.listdir(data_folder) 
                     if f.startswith('tarifas_destino_') and f.endswith('.json')]
    
    if not tarifas_files:
        print("  ⚠️  No se encontraron archivos de tarifas")
        return
    
    migrated = 0
    
    for tarifa_file in tarifas_files:
        try:
            file_path = os.path.join(data_folder, tarifa_file)
            
            # Extraer nombre de carpeta del nombre del archivo
            # Formato: tarifas_destino_{carpeta}.json
            carpeta = tarifa_file.replace('tarifas_destino_', '').replace('.json', '')
            
            with open(file_path, 'r', encoding='utf-8') as f:
                tarifas_data = json.load(f)
            
            if save_tarifas_destino(carpeta, tarifas_data):
                print(f"  ✓ Tarifas de '{carpeta}' migradas ({len(tarifas_data)} destinos)")
                migrated += 1
            else:
                print(f"  ❌ Error al migrar tarifas de '{carpeta}'")
                
        except Exception as e:
            print(f"  ❌ Error al procesar {tarifa_file}: {e}")
    
    print(f"✅ Tarifas migradas: {migrated} archivos")


def migrate_gastos():
    """Migra gastos adicionales de archivos JSON a la base de datos"""
    data_folder = 'data'
    
    if not os.path.exists(data_folder):
        print("⚠️  No se encontró carpeta data, saltando migración de gastos")
        return
    
    print("📦 Migrando gastos adicionales...")
    
    # Buscar en subcarpetas de usuarios
    migrated = 0
    
    for item in os.listdir(data_folder):
        item_path = os.path.join(data_folder, item)
        
        # Si es una carpeta de usuario
        if os.path.isdir(item_path):
            # Buscar archivos de gastos en la carpeta del usuario
            gastos_files = [f for f in os.listdir(item_path) 
                          if f.startswith('gastos_adicionales_') and f.endswith('.json')]
            
            for gasto_file in gastos_files:
                try:
                    file_path = os.path.join(item_path, gasto_file)
                    
                    # Extraer nombre de carpeta del nombre del archivo
                    carpeta = gasto_file.replace('gastos_adicionales_', '').replace('.json', '')
                    
                    with open(file_path, 'r', encoding='utf-8') as f:
                        gastos_data = json.load(f)
                    
                    # Convertir a formato de lista si es diccionario
                    if isinstance(gastos_data, dict):
                        gastos_list = list(gastos_data.values())
                    elif isinstance(gastos_data, list):
                        gastos_list = gastos_data
                    else:
                        gastos_list = []
                    
                    if save_gastos_adicionales(carpeta, gastos_list):
                        print(f"  ✓ Gastos de '{carpeta}' migrados ({len(gastos_list)} gastos)")
                        migrated += 1
                    else:
                        print(f"  ❌ Error al migrar gastos de '{carpeta}'")
                        
                except Exception as e:
                    print(f"  ❌ Error al procesar {gasto_file}: {e}")
    
    print(f"✅ Gastos migrados: {migrated} archivos")


def main():
    """Función principal de migración"""
    print("=" * 60)
    print("🚀 INICIANDO MIGRACIÓN A BASE DE DATOS SQLite")
    print("=" * 60)
    
    # Inicializar base de datos
    print("\n📊 Inicializando base de datos...")
    init_database()
    print("✅ Base de datos inicializada\n")
    
    # Migrar datos
    migrate_users()
    print()
    migrate_tarifas()
    print()
    migrate_gastos()
    print()
    
    print("=" * 60)
    print("✅ MIGRACIÓN COMPLETADA")
    print("=" * 60)
    print("\n💡 Nota: Los archivos JSON originales se mantienen como respaldo.")
    print("   Puedes eliminarlos manualmente después de verificar que todo funciona correctamente.")


if __name__ == '__main__':
    main()

