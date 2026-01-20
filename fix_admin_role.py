"""
Script para actualizar el rol de un usuario a admin
"""
import sqlite3
import os
import sys

DB_FILE = os.path.join('data', 'lector_manifiestos.db')

def update_user_to_admin(username):
    """Actualiza el rol de un usuario a admin"""
    if not os.path.exists(DB_FILE):
        print(f"[ERROR] Base de datos no encontrada: {DB_FILE}")
        return False
    
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # Verificar si el usuario existe
    cursor.execute('SELECT username, role FROM users WHERE username = ?', (username,))
    user = cursor.fetchone()
    
    if not user:
        print(f"[ERROR] Usuario '{username}' no encontrado")
        conn.close()
        return False
    
    print(f"[INFO] Usuario '{user[0]}' tiene rol actual: '{user[1]}'")
    
    # Actualizar rol a admin
    cursor.execute('UPDATE users SET role = ? WHERE username = ?', ('admin', username))
    conn.commit()
    
    # Verificar
    cursor.execute('SELECT role FROM users WHERE username = ?', (username,))
    new_role = cursor.fetchone()[0]
    
    conn.close()
    
    if new_role == 'admin':
        print(f"[OK] Rol de '{username}' actualizado a 'admin'")
        return True
    else:
        print(f"[ERROR] No se pudo actualizar el rol")
        return False

if __name__ == '__main__':
    if len(sys.argv) > 1:
        username = sys.argv[1]
    else:
        username = 'administrador'
    
    update_user_to_admin(username)
