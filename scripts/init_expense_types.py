"""
Script para inicializar tipos de gastos en Firestore
"""
import sys
import os
from pathlib import Path
from datetime import datetime

# Agregar ruta raíz al path
ROOT_DIR = Path(__file__).parent.parent
BACKEND_APP_DIR = ROOT_DIR / 'backend' / 'app'
sys.path.insert(0, str(ROOT_DIR))
sys.path.insert(0, str(BACKEND_APP_DIR))

# Cambiar al directorio de la app
os.chdir(str(BACKEND_APP_DIR))

from config.firebase_config import FirebaseConfig
from config.app_config import AppConfig

def initialize_expense_types():
    """
    Inicializa los tipos de gastos del sistema en Firestore
    """
    print("=" * 70)
    print("INICIALIZACIÓN DE TIPOS DE GASTOS EN FIRESTORE")
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
    
    # 3. Crear tipos de gastos directamente en Firestore
    print("\n3. Creando tipos de gastos del sistema...")
    try:
        db = FirebaseConfig.get_db()
        
        system_types = [
            {'name': 'Parqueo', 'order': 1},
            {'name': 'Sueldo', 'order': 2},
            {'name': 'Tanqueo', 'order': 3},
            {'name': 'Cargue', 'order': 4},
            {'name': 'Descargue', 'order': 5},
            {'name': 'Otros', 'order': 6}
        ]
        
        created_count = 0
        for expense_type in system_types:
            # Verificar si ya existe
            existing = db.collection('expense_types').where('name', '==', expense_type['name']).where('active', '==', True).limit(1).get()
            
            if existing:
                print(f"   [INFO] Tipo '{expense_type['name']}' ya existe, omitiendo...")
                continue
            
            # Crear el tipo
            data = {
                'name': expense_type['name'],
                'is_system': True,
                'order': expense_type['order'],
                'active': True,
                'created_at': datetime.now().isoformat()
            }
            
            db.collection('expense_types').add(data)
            created_count += 1
            print(f"   [OK] Creado: {expense_type['name']}")
        
        print(f"\n   [OK] {created_count} tipos de gastos creados")
        
        # Mostrar todos los tipos
        print("\n4. Tipos de gastos en el sistema:")
        all_types = db.collection('expense_types').where('active', '==', True).order_by('order').get()
        for i, doc in enumerate(all_types, 1):
            type_data = doc.to_dict()
            type_label = "Sistema" if type_data.get('is_system') else "Personalizado"
            print(f"   {i}. {type_data.get('name')} ({type_label})")
        
        return True
            
    except Exception as e:
        print(f"   [ERROR] Error al crear tipos de gastos: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    print("\n" + "=" * 70)
    print("[INFO] PROCESO COMPLETADO")
    print("=" * 70)
    
    return True

if __name__ == '__main__':
    try:
        success = initialize_expense_types()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n[WARN] Proceso cancelado por el usuario")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] Error inesperado: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
