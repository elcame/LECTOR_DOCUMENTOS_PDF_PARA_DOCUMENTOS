"""
Script para inicializar las colecciones de Firebase
Crea las colecciones 'roles' y 'usuarios' con datos iniciales
"""
import sys
import os
from pathlib import Path

# Agregar ruta raíz al path
ROOT_DIR = Path(__file__).parent.parent
BACKEND_APP_DIR = ROOT_DIR / 'backend' / 'app'
sys.path.insert(0, str(ROOT_DIR))
sys.path.insert(0, str(BACKEND_APP_DIR))

# Importar directamente los módulos sin pasar por Flask
import os
os.chdir(str(BACKEND_APP_DIR))

from config.firebase_config import FirebaseConfig
from config.app_config import AppConfig
from database.roles_repository import RolesRepository
from database.usuarios_repository import UsuariosRepository
import hashlib

def hash_password(password: str) -> str:
    """Hashea una contraseña"""
    return hashlib.sha256(password.encode()).hexdigest()

def init_roles():
    """Inicializa los roles básicos"""
    print("\n[INFO] Inicializando coleccion 'roles'...")
    repo = RolesRepository()
    
    roles_initiales = [
        {
            'role_name': 'admin',
            'description': 'Administrador del sistema con acceso completo',
            'permissions': ['read', 'write', 'delete', 'admin', 'manage_users', 'manage_roles']
        },
        {
            'role_name': 'conductor',
            'description': 'Conductor con acceso a manifiestos y operaciones',
            'permissions': ['read', 'write']
        },
        {
            'role_name': 'supervisor',
            'description': 'Supervisor con acceso a lectura y reportes',
            'permissions': ['read', 'view_reports']
        }
    ]
    
    roles_creados = 0
    for role_data in roles_initiales:
        try:
            # Verificar si ya existe
            existing = repo.get_role_by_name(role_data['role_name'])
            if existing:
                print(f"   [WARN] Rol '{role_data['role_name']}' ya existe, omitiendo...")
            else:
                success = repo.create_role(
                    role_data['role_name'],
                    role_data['description'],
                    role_data['permissions']
                )
                if success:
                    print(f"   [OK] Rol '{role_data['role_name']}' creado exitosamente")
                    roles_creados += 1
                else:
                    print(f"   [ERROR] Error al crear rol '{role_data['role_name']}'")
        except Exception as e:
            print(f"   [ERROR] Error al crear rol '{role_data['role_name']}': {e}")
    
    print(f"\n[OK] Coleccion 'roles' inicializada. Roles creados: {roles_creados}/{len(roles_initiales)}")
    return roles_creados

def init_usuarios():
    """Inicializa un usuario administrador por defecto"""
    print("\n[INFO] Inicializando coleccion 'usuarios'...")
    repo = UsuariosRepository()
    roles_repo = RolesRepository()
    
    # Obtener el rol de admin
    admin_role = roles_repo.get_role_by_name('admin')
    if not admin_role:
        print("   [WARN] No se encontro el rol 'admin'. Crea los roles primero.")
        return 0
    
    # Crear usuario administrador por defecto
    admin_user = {
        'username': 'admin',
        'email': 'admin@example.com',
        'password': 'admin123',  # Cambiar en producción
        'full_name': 'Administrador',
        'role_id': admin_role['id']
    }
    
    try:
        existing = repo.get_usuario_by_username(admin_user['username'])
        if existing:
            print(f"   [WARN] Usuario '{admin_user['username']}' ya existe, omitiendo...")
            return 0
        
        password_hash = hash_password(admin_user['password'])
        success = repo.create_usuario(
            admin_user['username'],
            admin_user['email'],
            password_hash,
            admin_user['full_name'],
            admin_user['role_id'],
            True
        )
        
        if success:
            print(f"   [OK] Usuario '{admin_user['username']}' creado exitosamente")
            print(f"   Email: {admin_user['email']}")
            print(f"   Contrasena: {admin_user['password']} (Cambiala en produccion!)")
            return 1
        else:
            print(f"   [ERROR] Error al crear usuario '{admin_user['username']}'")
            return 0
    except Exception as e:
        print(f"   [ERROR] Error al crear usuario: {e}")
        return 0

def main():
    """Función principal"""
    print("=" * 60)
    print("INICIALIZACION DE COLECCIONES FIREBASE")
    print("=" * 60)
    
    # 1. Verificar credenciales
    print("\n1. Verificando credenciales de Firebase...")
    # Buscar credenciales en diferentes ubicaciones
    possible_paths = [
        ROOT_DIR / 'backend' / 'app' / 'config' / 'firebase-credentials.json',
        ROOT_DIR / 'config' / 'firebase-credentials.json',
        Path(AppConfig.FIREBASE_CREDENTIALS_PATH)
    ]
    
    creds_path = None
    for path in possible_paths:
        if path.exists():
            creds_path = str(path)
            break
    
    if not creds_path or not Path(creds_path).exists():
        print(f"   [ERROR] Archivo de credenciales no encontrado")
        print("   Buscado en:")
        for path in possible_paths:
            print(f"     - {path}")
        print("   Descarga las credenciales desde Firebase Console")
        print("   Colocalas en: backend/app/config/firebase-credentials.json")
        return False
    
    print(f"   [OK] Credenciales encontradas: {creds_path}")
    
    # 2. Inicializar Firebase
    print("\n2. Inicializando Firebase...")
    try:
        FirebaseConfig.initialize(
            credentials_path=creds_path,
            project_id=AppConfig.FIREBASE_PROJECT_ID if AppConfig.FIREBASE_PROJECT_ID else None
        )
        print("   [OK] Firebase inicializado correctamente")
    except Exception as e:
        print(f"   [ERROR] ERROR al inicializar Firebase: {e}")
        print(f"   Verifica que las credenciales sean validas")
        print(f"   Verifica que el proyecto de Firebase este activo")
        return False
    
    # 3. Inicializar roles
    roles_count = init_roles()
    
    # 4. Inicializar usuarios
    usuarios_count = init_usuarios()
    
    # 5. Resumen
    print("\n" + "=" * 60)
    print("[OK] INICIALIZACION COMPLETADA")
    print("=" * 60)
    print(f"\nResumen:")
    print(f"   - Roles creados: {roles_count}")
    print(f"   - Usuarios creados: {usuarios_count}")
    print(f"\nLas colecciones 'roles' y 'usuarios' estan listas para usar!")
    print("\nProximos pasos:")
    print("   1. Accede a Firebase Console para ver las colecciones")
    print("   2. Cambia la contrasena del usuario admin en produccion")
    print("   3. Crea mas usuarios desde el frontend o la API")
    print("\nFirebase Console: https://console.firebase.google.com/")
    
    return True

if __name__ == '__main__':
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n[WARN] Proceso cancelado por el usuario")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] Error inesperado: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
