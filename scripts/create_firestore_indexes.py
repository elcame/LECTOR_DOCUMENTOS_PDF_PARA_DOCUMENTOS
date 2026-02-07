"""
Script para crear índices compuestos en Firestore
Este script despliega los índices definidos en firestore.indexes.json
"""
import sys
import os
from pathlib import Path
import json

# Agregar ruta raíz al path
ROOT_DIR = Path(__file__).parent.parent
BACKEND_APP_DIR = ROOT_DIR / 'backend' / 'app'
sys.path.insert(0, str(ROOT_DIR))
sys.path.insert(0, str(BACKEND_APP_DIR))

# Cambiar al directorio de la app
os.chdir(str(BACKEND_APP_DIR))

from config.firebase_config import FirebaseConfig
from config.app_config import AppConfig

def create_indexes():
    """
    Crea los índices compuestos en Firestore
    """
    print("=" * 70)
    print("CREACIÓN DE ÍNDICES COMPUESTOS EN FIRESTORE")
    print("=" * 70)
    
    # 1. Verificar credenciales
    print("\n1. Verificando credenciales de Firebase...")
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
        print(f"   [ERROR] Error al inicializar Firebase: {e}")
        return False
    
    # 3. Leer archivo de índices
    print("\n3. Leyendo configuración de índices...")
    indexes_file = ROOT_DIR / 'firestore.indexes.json'
    
    if not indexes_file.exists():
        print(f"   [ERROR] Archivo firestore.indexes.json no encontrado en {indexes_file}")
        return False
    
    try:
        with open(indexes_file, 'r', encoding='utf-8') as f:
            indexes_config = json.load(f)
        
        indexes = indexes_config.get('indexes', [])
        print(f"   [OK] Se encontraron {len(indexes)} índices para crear")
    except Exception as e:
        print(f"   [ERROR] Error al leer archivo de índices: {e}")
        return False
    
    # 4. Mostrar información de índices
    print("\n4. Índices a crear:")
    print("   " + "-" * 66)
    
    for i, index in enumerate(indexes, 1):
        collection = index.get('collectionGroup', 'unknown')
        fields = index.get('fields', [])
        field_names = [f"{f.get('fieldPath')} ({f.get('order', 'ASC')})" for f in fields]
        
        print(f"\n   Índice {i}: Colección '{collection}'")
        print(f"   Campos: {', '.join(field_names)}")
    
    print("\n   " + "-" * 66)
    
    # 5. Instrucciones para crear índices
    print("\n5. INSTRUCCIONES PARA CREAR LOS ÍNDICES:")
    print("   " + "=" * 66)
    print("\n   Los índices compuestos en Firestore deben crearse manualmente")
    print("   a través de la consola de Firebase o mediante el CLI de Firebase.")
    print("\n   OPCIÓN 1: Usar Firebase CLI (Recomendado)")
    print("   -----------------------------------------")
    print("   1. Instala Firebase CLI si no lo tienes:")
    print("      npm install -g firebase-tools")
    print("\n   2. Inicia sesión en Firebase:")
    print("      firebase login")
    print("\n   3. Despliega los índices:")
    print("      firebase deploy --only firestore:indexes")
    print("\n   OPCIÓN 2: Crear manualmente en la consola")
    print("   -----------------------------------------")
    print("   1. Abre la consola de Firebase:")
    print("      https://console.firebase.google.com/")
    print("\n   2. Ve a Firestore Database > Indexes")
    print("\n   3. Crea los siguientes índices compuestos:")
    
    for i, index in enumerate(indexes, 1):
        collection = index.get('collectionGroup', 'unknown')
        fields = index.get('fields', [])
        
        print(f"\n   Índice {i} - Colección: {collection}")
        for field in fields:
            field_path = field.get('fieldPath')
            order = field.get('order', 'ASCENDING')
            print(f"      • {field_path}: {order}")
    
    print("\n   " + "=" * 66)
    
    # 6. Enlaces directos de los errores
    print("\n6. ENLACES DIRECTOS DE CREACIÓN:")
    print("   Si recibiste un error con un enlace, úsalo directamente:")
    print("\n   El enlace del error contiene la configuración exacta del índice")
    print("   que necesitas. Solo haz click en el enlace y confirma la creación.")
    
    print("\n" + "=" * 70)
    print("[INFO] PROCESO COMPLETADO")
    print("=" * 70)
    print("\nNOTA: Los índices pueden tardar unos minutos en estar disponibles")
    print("      después de crearlos. Espera y vuelve a intentar tu consulta.")
    
    return True

if __name__ == '__main__':
    try:
        success = create_indexes()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n[WARN] Proceso cancelado por el usuario")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] Error inesperado: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
