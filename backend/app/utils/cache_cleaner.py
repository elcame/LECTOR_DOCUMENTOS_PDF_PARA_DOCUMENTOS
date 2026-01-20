"""
Utilidad para limpieza de caché de miniaturas
"""
import os
import time
from pathlib import Path

class CacheCleaner:
    """Clase para gestionar limpieza de caché"""
    
    def __init__(self, cache_dir='cache/thumbnails'):
        self.cache_dir = cache_dir
        self.max_age_days = 7  # Días máximos de antigüedad
        self.max_size_mb = 500  # Tamaño máximo de caché en MB
    
    def clean_old_files(self):
        """Elimina archivos más antiguos que max_age_days"""
        if not os.path.exists(self.cache_dir):
            return {
                'deleted': 0,
                'size_freed': 0,
                'message': 'Directorio de caché no existe'
            }
        
        max_age_seconds = self.max_age_days * 24 * 60 * 60
        current_time = time.time()
        deleted_count = 0
        size_freed = 0
        
        try:
            for root, dirs, files in os.walk(self.cache_dir):
                for file in files:
                    if not file.endswith('.png'):
                        continue
                    
                    file_path = os.path.join(root, file)
                    try:
                        file_age = current_time - os.path.getmtime(file_path)
                        
                        if file_age > max_age_seconds:
                            file_size = os.path.getsize(file_path)
                            os.remove(file_path)
                            deleted_count += 1
                            size_freed += file_size
                    except Exception as e:
                        print(f"Error al eliminar {file_path}: {e}")
                        continue
            
            return {
                'deleted': deleted_count,
                'size_freed': size_freed,
                'size_freed_mb': round(size_freed / (1024 * 1024), 2),
                'message': f'Eliminados {deleted_count} archivos ({round(size_freed / (1024 * 1024), 2)} MB)'
            }
        except Exception as e:
            return {
                'deleted': 0,
                'size_freed': 0,
                'error': str(e)
            }
    
    def clean_by_size(self):
        """Elimina archivos más antiguos si el caché excede max_size_mb"""
        if not os.path.exists(self.cache_dir):
            return {
                'deleted': 0,
                'size_freed': 0,
                'message': 'Directorio de caché no existe'
            }
        
        # Recopilar información de todos los archivos
        files_info = []
        total_size = 0
        
        try:
            for root, dirs, files in os.walk(self.cache_dir):
                for file in files:
                    if not file.endswith('.png'):
                        continue
                    
                    file_path = os.path.join(root, file)
                    try:
                        file_stat = os.stat(file_path)
                        files_info.append({
                            'path': file_path,
                            'size': file_stat.st_size,
                            'mtime': file_stat.st_mtime
                        })
                        total_size += file_stat.st_size
                    except Exception:
                        continue
            
            max_size_bytes = self.max_size_mb * 1024 * 1024
            
            # Si no excede el límite, no hacer nada
            if total_size <= max_size_bytes:
                return {
                    'deleted': 0,
                    'size_freed': 0,
                    'current_size_mb': round(total_size / (1024 * 1024), 2),
                    'message': f'Caché OK ({round(total_size / (1024 * 1024), 2)} MB)'
                }
            
            # Ordenar por antigüedad (más antiguos primero)
            files_info.sort(key=lambda x: x['mtime'])
            
            # Eliminar hasta que estemos por debajo del límite
            deleted_count = 0
            size_freed = 0
            size_to_free = total_size - max_size_bytes
            
            for file_info in files_info:
                if size_freed >= size_to_free:
                    break
                
                try:
                    os.remove(file_info['path'])
                    deleted_count += 1
                    size_freed += file_info['size']
                except Exception as e:
                    print(f"Error al eliminar {file_info['path']}: {e}")
                    continue
            
            return {
                'deleted': deleted_count,
                'size_freed': size_freed,
                'size_freed_mb': round(size_freed / (1024 * 1024), 2),
                'current_size_mb': round((total_size - size_freed) / (1024 * 1024), 2),
                'message': f'Eliminados {deleted_count} archivos para liberar espacio'
            }
        except Exception as e:
            return {
                'deleted': 0,
                'size_freed': 0,
                'error': str(e)
            }
    
    def get_cache_stats(self):
        """Obtiene estadísticas del caché"""
        if not os.path.exists(self.cache_dir):
            return {
                'total_files': 0,
                'total_size': 0,
                'total_size_mb': 0,
                'users': 0,
                'oldest_file': None,
                'newest_file': None
            }
        
        total_files = 0
        total_size = 0
        users = set()
        oldest_mtime = None
        newest_mtime = None
        
        try:
            for root, dirs, files in os.walk(self.cache_dir):
                # Contar usuarios (subdirectorios directos)
                if root == self.cache_dir:
                    users = set(dirs)
                
                for file in files:
                    if not file.endswith('.png'):
                        continue
                    
                    file_path = os.path.join(root, file)
                    try:
                        file_stat = os.stat(file_path)
                        total_files += 1
                        total_size += file_stat.st_size
                        
                        if oldest_mtime is None or file_stat.st_mtime < oldest_mtime:
                            oldest_mtime = file_stat.st_mtime
                        
                        if newest_mtime is None or file_stat.st_mtime > newest_mtime:
                            newest_mtime = file_stat.st_mtime
                    except Exception:
                        continue
            
            from datetime import datetime
            
            return {
                'total_files': total_files,
                'total_size': total_size,
                'total_size_mb': round(total_size / (1024 * 1024), 2),
                'users': len(users),
                'oldest_file': datetime.fromtimestamp(oldest_mtime).isoformat() if oldest_mtime else None,
                'newest_file': datetime.fromtimestamp(newest_mtime).isoformat() if newest_mtime else None
            }
        except Exception as e:
            return {
                'error': str(e)
            }
    
    def clean_all(self):
        """Ejecuta limpieza completa (por antigüedad y por tamaño)"""
        results = {
            'old_files': self.clean_old_files(),
            'by_size': self.clean_by_size(),
            'stats_after': self.get_cache_stats()
        }
        return results


def clean_cache():
    """Función de conveniencia para limpiar caché"""
    cleaner = CacheCleaner()
    return cleaner.clean_all()


if __name__ == '__main__':
    """Script ejecutable para limpieza manual"""
    cleaner = CacheCleaner()
    
    print("=== ESTADÍSTICAS ANTES DE LIMPIEZA ===")
    stats_before = cleaner.get_cache_stats()
    for key, value in stats_before.items():
        print(f"{key}: {value}")
    
    print("\n=== EJECUTANDO LIMPIEZA ===")
    results = cleaner.clean_all()
    
    print("\nArchivos antiguos:")
    print(f"  Eliminados: {results['old_files']['deleted']}")
    print(f"  Espacio liberado: {results['old_files'].get('size_freed_mb', 0)} MB")
    
    print("\nLimpieza por tamaño:")
    print(f"  Eliminados: {results['by_size']['deleted']}")
    print(f"  Espacio liberado: {results['by_size'].get('size_freed_mb', 0)} MB")
    
    print("\n=== ESTADÍSTICAS DESPUÉS DE LIMPIEZA ===")
    stats_after = results['stats_after']
    for key, value in stats_after.items():
        print(f"{key}: {value}")
