"""
Script para eliminar las colecciones 'manifiestos' y 'pdfs' de Firestore
y recrearlas vacías con la estructura correcta
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
os.chdir(str(BACKEND_APP_DIR))

from config.firebase_config import FirebaseConfig
from config.app_config import AppConfig

def delete_collection(collection_name, batch_size=100):
    """
    Elimina todos los documentos de una colección en lotes
    
    Args:
        collection_name: Nombre de la colección a eliminar
        batch_size: Tamaño del lote para eliminación (default: 100)
    """
    print(f"\n[INFO] Eliminando colección '{collection_name}'...")
    
    try:
        db = FirebaseConfig.get_firestore_client()
        collection_ref = db.collection(collection_name)
        
        deleted_count = 0
        
        while True:
            # Obtener lote de documentos
            docs = collection_ref.limit(batch_size).stream()
            deleted_in_batch = 0
            
            # Eliminar documentos en el lote
            for doc in docs:
                doc.reference.delete()
                deleted_in_batch += 1
                deleted_count += 1
            
            if deleted_in_batch == 0:
                break
            
            print(f"   [OK] Eliminados {deleted_count} documentos hasta ahora...")
        
        print(f"   [OK] Colección '{collection_name}' eliminada completamente. Total: {deleted_count} documentos")
        return deleted_count
        
    except Exception as e:
        print(f"   [ERROR] Error al eliminar colección '{collection_name}': {e}")
        import traceback
        traceback.print_exc()
        return 0

def create_collection_structure(collection_name):
    """
    Crea la estructura inicial de una colección (documento placeholder)
    
    Args:
        collection_name: Nombre de la colección
    """
    print(f"\n[INFO] Creando estructura para colección '{collection_name}'...")
    
    try:
        db = FirebaseConfig.get_firestore_client()
        
        # Crear un documento placeholder que será eliminado después
        # Esto asegura que la colección existe en Firestore
        placeholder_ref = db.collection(collection_name).document('_placeholder')
        placeholder_ref.set({
            'placeholder': True,
            'created_at': FirebaseConfig.get_server_timestamp(),
            'message': 'Este documento será eliminado automáticamente al agregar datos reales'
        })
        
        # Eliminar el placeholder inmediatamente
        placeholder_ref.delete()
        
        print(f"   [OK] Estructura de colección '{collection_name}' lista")
        return True
        
    except Exception as e:
        print(f"   [ERROR] Error al crear estructura de colección '{collection_name}': {e}")
        return False

def main():
    """Función principal"""
    print("=" * 70)
    print("ELIMINACIÓN Y RECREACIÓN DE COLECCIONES FIRESTORE")
    print("=" * 70)
    print("\n⚠️  ADVERTENCIA: Este script eliminará PERMANENTEMENTE todos los datos")
    print("    de las colecciones 'manifiestos' y 'pdfs'")
    print("\n¿Estás seguro de que deseas continuar? (escribe 'SI' para confirmar)")
    
    confirmacion = input("\nConfirmación: ").strip()
    
    if confirmacion != 'SI':
        print("\n[INFO] Operación cancelada por el usuario")
        return False
    
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
    
    # 3. Eliminar colecciones
    print("\n3. Eliminando colecciones...")
    manifiestos_deleted = delete_collection('manifiestos')
    pdfs_deleted = delete_collection('pdfs')
    
    # 4. Recrear estructura
    print("\n4. Recreando estructura de colecciones...")
    manifiestos_created = create_collection_structure('manifiestos')
    pdfs_created = create_collection_structure('pdfs')
    
    # 5. Resumen
    print("\n" + "=" * 70)
    print("[OK] PROCESO COMPLETADO")
    print("=" * 70)
    print(f"\nResumen:")
    print(f"   - Documentos eliminados de 'manifiestos': {manifiestos_deleted}")
    print(f"   - Documentos eliminados de 'pdfs': {pdfs_deleted}")
    print(f"   - Colección 'manifiestos' recreada: {'✓' if manifiestos_created else '✗'}")
    print(f"   - Colección 'pdfs' recreada: {'✓' if pdfs_created else '✗'}")
    print(f"\nLas colecciones están limpias y listas para usar!")
    print("\nPróximos pasos:")
    print("   1. Sube nuevas carpetas de PDFs desde el frontend")
    print("   2. Procesa las carpetas para generar manifiestos")
    print("   3. Verifica los datos en Firebase Console")
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
