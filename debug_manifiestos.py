"""
Script para depurar directamente el procesamiento de manifiestos
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Importar después de agregar al path
try:
    from app.database.firebase_repository import FirebaseConfig
    from app.database.manifiestos_repository import ManifiestosRepository
    
    # Inicializar Firebase
    FirebaseConfig.initialize()
    
    # Crear repositorio
    repo = ManifiestosRepository()
    
    print("=== DEPURACIÓN DE MANIFIESTOS ===")
    
    # Obtener todos los manifiestos activos
    filters = [('active', '==', True)]
    manifiestos = repo.get_all(filters=filters, order_by='fecha_procesamiento')
    
    print(f"Total manifiestos activos: {len(manifiestos)}")
    
    if manifiestos:
        print("\n=== PRIMER MANIFIESTO (EJEMPLO) ===")
        ejemplo = manifiestos[0]
        for key, value in ejemplo.items():
            print(f"{key}: {value}")
        
        print("\n=== CAMPOS IMPORTANTES ===")
        print(f"valor_manifiesto: {ejemplo.get('valor_manifiesto')}")
        print(f"fecha_procesamiento: {ejemplo.get('fecha_procesamiento')}")
        print(f"fecha_inicio: {ejemplo.get('fecha_inicio')}")
        print(f"created_at: {ejemplo.get('created_at')}")
        print(f"destino: {ejemplo.get('destino')}")
        print(f"conductor: {ejemplo.get('conductor')}")
        
        print("\n=== PROBANDO ESTADÍSTICAS ===")
        try:
            stats, dia_semana_stats = repo.get_stats_by_period('admin', 'daily', 30)
            print(f"Estadísticas por fecha: {len(stats)} registros")
            print(f"Estadísticas por día semana: {len(dia_semana_stats)} registros")
            
            if stats:
                print(f"Primera estadística: {stats[0]}")
            
            if dia_semana_stats:
                print(f"Estadísticas por día: {dia_semana_stats}")
                
        except Exception as e:
            print(f"Error en estadísticas: {e}")
            import traceback
            traceback.print_exc()
    
except Exception as e:
    print(f"Error general: {e}")
    import traceback
    traceback.print_exc()
