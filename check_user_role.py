"""
Script para verificar y actualizar roles de usuarios
"""
import sqlite3
import os

DB_FILE = os.path.join('data', 'lector_manifiestos.db')

def check_and_fix_roles():
    """Verifica y corrige los roles de los usuarios"""
    if not os.path.exists(DB_FILE):
        print(f"[ERROR] Base de datos no encontrada: {DB_FILE}")
        return
    
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Verificar estructura de la tabla
    cursor.execute('PRAGMA table_info(users)')
    columns = [col[1] for col in cursor.fetchall()]
    print("Columnas en tabla users:", columns)
    
    # Agregar columna role si no existe
    if 'role' not in columns:
        print("\n[ADVERTENCIA] Columna 'role' no existe. Agregandola...")
        try:
            cursor.execute('ALTER TABLE users ADD COLUMN role TEXT DEFAULT "admin"')
            conn.commit()
            print("[OK] Columna 'role' agregada")
        except Exception as e:
            print(f"[ERROR] Error al agregar columna: {e}")
    
    # Obtener todos los usuarios
    cursor.execute('SELECT username, role FROM users')
    users = cursor.fetchall()
    
    print(f"\nUsuarios encontrados: {len(users)}")
    print("-" * 50)
    
    for user in users:
        username = user['username']
        role = user['role']
        
        if not role or role == '' or role is None:
            print(f"[ADVERTENCIA] Usuario '{username}' no tiene rol asignado. Asignando 'admin'...")
            cursor.execute('UPDATE users SET role = ? WHERE username = ?', ('admin', username))
            conn.commit()
            print(f"[OK] Rol 'admin' asignado a '{username}'")
        else:
            print(f"[OK] Usuario '{username}': rol = '{role}'")
    
    conn.close()
    print("\n[COMPLETADO] Verificacion completada")

if __name__ == '__main__':
    check_and_fix_roles()
