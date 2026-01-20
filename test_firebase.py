"""
Script de prueba para verificar que Firebase está configurado correctamente
"""
import sys
import os

def test_firebase_connection():
    """Prueba la conexión a Firebase"""
    print("=" * 60)
    print("🔥 PRUEBA DE CONFIGURACIÓN DE FIREBASE")
    print("=" * 60)
    
    # 1. Verificar archivo de credenciales
    print("\n1. Verificando archivo de credenciales...")
    creds_path = 'config/firebase-credentials.json'
    if os.path.exists(creds_path):
        print(f"   ✓ Archivo encontrado: {creds_path}")
    else:
        print(f"   ✗ ERROR: Archivo no encontrado: {creds_path}")
        print("   → Descarga las credenciales desde Firebase Console")
        return False
    
    # 2. Verificar que se puede importar firebase_admin
    print("\n2. Verificando instalación de Firebase...")
    try:
        import firebase_admin
        print("   ✓ firebase-admin instalado")
    except ImportError:
        print("   ✗ ERROR: firebase-admin no está instalado")
        print("   → Ejecuta: pip install firebase-admin")
        return False
    
    # 3. Verificar módulos de configuración
    print("\n3. Verificando módulos de configuración...")
    try:
        from config.firebase_config import FirebaseConfig
        from config.app_config import AppConfig
        print("   ✓ Módulos de configuración importados correctamente")
    except ImportError as e:
        print(f"   ✗ ERROR al importar módulos: {e}")
        return False
    
    # 4. Inicializar Firebase
    print("\n4. Inicializando Firebase...")
    try:
        AppConfig.ensure_directories()
        FirebaseConfig.initialize(
            credentials_path=AppConfig.FIREBASE_CREDENTIALS_PATH,
            project_id=AppConfig.FIREBASE_PROJECT_ID if AppConfig.FIREBASE_PROJECT_ID else None
        )
        print("   ✓ Firebase inicializado correctamente")
    except Exception as e:
        print(f"   ✗ ERROR al inicializar Firebase: {e}")
        print("   → Verifica que las credenciales son válidas")
        return False
    
    # 5. Probar conexión a Firestore
    print("\n5. Probando conexión a Firestore...")
    try:
        db = FirebaseConfig.get_db()
        print("   ✓ Conexión a Firestore establecida")
    except Exception as e:
        print(f"   ✗ ERROR al conectar a Firestore: {e}")
        return False
    
    # 6. Probar repositorios
    print("\n6. Probando repositorios...")
    try:
        from database.users_repository import UsersRepository
        from database.qr_data_repository import QRDataRepository
        
        users_repo = UsersRepository()
        qr_repo = QRDataRepository()
        print("   ✓ Repositorios creados correctamente")
    except Exception as e:
        print(f"   ✗ ERROR al crear repositorios: {e}")
        return False
    
    # 7. Probar operación de lectura
    print("\n7. Probando operación de lectura...")
    try:
        users = users_repo.get_all_users()
        print(f"   ✓ Lectura exitosa. Usuarios encontrados: {len(users)}")
    except Exception as e:
        print(f"   ✗ ERROR al leer datos: {e}")
        return False
    
    # 8. Probar operación de escritura (opcional)
    print("\n8. Probando operación de escritura...")
    try:
        test_username = f"test_user_{os.getpid()}"
        success = users_repo.create_user(
            username=test_username,
            password_hash="test_hash",
            email="test@test.com",
            full_name="Usuario de Prueba",
            role="conductor"
        )
        if success:
            print(f"   ✓ Escritura exitosa. Usuario de prueba creado: {test_username}")
            # Limpiar: eliminar usuario de prueba
            user = users_repo.get_user_by_username(test_username)
            if user:
                users_repo.delete(user['id'])
                print(f"   ✓ Usuario de prueba eliminado")
        else:
            print(f"   ⚠ Usuario de prueba ya existe (esto está bien)")
    except Exception as e:
        print(f"   ✗ ERROR al escribir datos: {e}")
        return False
    
    print("\n" + "=" * 60)
    print("✅ TODAS LAS PRUEBAS PASARON CORRECTAMENTE")
    print("=" * 60)
    print("\n🎉 Firebase está configurado y funcionando correctamente!")
    print("\nPróximos pasos:")
    print("1. Actualiza app.py para usar los nuevos repositorios")
    print("2. Migra tu código existente")
    print("3. Prueba la aplicación completa")
    
    return True

if __name__ == '__main__':
    success = test_firebase_connection()
    sys.exit(0 if success else 1)

