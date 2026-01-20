"""
Script para limpieza de caché de miniaturas
Ejecutar: python scripts/clean_cache.py
"""
import sys
from pathlib import Path

# Agregar directorio raíz al path
ROOT_DIR = Path(__file__).parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))

from backend.app.utils.cache_cleaner import CacheCleaner

if __name__ == '__main__':
    print("=" * 50)
    print("LIMPIEZA DE CACHÉ DE MINIATURAS")
    print("=" * 50)
    
    cleaner = CacheCleaner()
    
    print("\n📊 Estadísticas antes de limpieza:")
    stats_before = cleaner.get_cache_stats()
    print(f"  Archivos: {stats_before.get('total_files', 0)}")
    print(f"  Tamaño total: {stats_before.get('total_size_mb', 0)} MB")
    print(f"  Usuarios: {stats_before.get('users', 0)}")
    print(f"  Archivo más antiguo: {stats_before.get('oldest_file', 'N/A')}")
    
    print("\n🧹 Ejecutando limpieza...")
    results = cleaner.clean_all()
    
    print("\n✅ Resultados:")
    print(f"  Archivos antiguos eliminados: {results['old_files'].get('deleted', 0)}")
    print(f"  Espacio liberado (antiguos): {results['old_files'].get('size_freed_mb', 0)} MB")
    print(f"  Archivos eliminados por tamaño: {results['by_size'].get('deleted', 0)}")
    print(f"  Espacio liberado (tamaño): {results['by_size'].get('size_freed_mb', 0)} MB")
    
    print("\n📊 Estadísticas después de limpieza:")
    stats_after = results['stats_after']
    print(f"  Archivos: {stats_after.get('total_files', 0)}")
    print(f"  Tamaño total: {stats_after.get('total_size_mb', 0)} MB")
    
    print("\n✨ Limpieza completada")
