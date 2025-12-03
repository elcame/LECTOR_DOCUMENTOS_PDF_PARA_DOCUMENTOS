"""
Módulo para manejo de almacenamiento persistente
Soporta almacenamiento local y en la nube (Google Cloud Storage, AWS S3)
"""
import os
import json
from typing import Optional, List, BinaryIO
from pathlib import Path

# Configuración de almacenamiento
STORAGE_TYPE = os.environ.get('STORAGE_TYPE', 'local')  # 'local', 'gcs', 's3'
BASE_FOLDER = os.environ.get('BASE_FOLDER', 'MANIFIESTOS')
EXCEL_FOLDER = os.environ.get('EXCEL_FOLDER', 'EXCEL')
DATA_FOLDER = os.environ.get('DATA_FOLDER', 'data')

# Para Railway y otras plataformas con almacenamiento persistente
# Usar /data si existe, sino usar el directorio actual
if os.path.exists('/data'):
    PERSISTENT_STORAGE = '/data'
elif os.path.exists('/app/data'):
    PERSISTENT_STORAGE = '/app/data'
else:
    PERSISTENT_STORAGE = os.getcwd()

def get_storage_path(folder_name: str = None) -> str:
    """
    Obtiene la ruta de almacenamiento persistente
    
    Args:
        folder_name: Nombre de la carpeta dentro del almacenamiento
    
    Returns:
        str: Ruta completa de almacenamiento
    """
    if folder_name:
        storage_path = os.path.join(PERSISTENT_STORAGE, BASE_FOLDER, folder_name)
    else:
        storage_path = os.path.join(PERSISTENT_STORAGE, BASE_FOLDER)
    
    # Crear directorio si no existe
    os.makedirs(storage_path, exist_ok=True)
    return storage_path

def get_excel_path() -> str:
    """Obtiene la ruta para archivos Excel"""
    excel_path = os.path.join(PERSISTENT_STORAGE, EXCEL_FOLDER)
    os.makedirs(excel_path, exist_ok=True)
    return excel_path

def get_data_path() -> str:
    """Obtiene la ruta para archivos de datos JSON"""
    data_path = os.path.join(PERSISTENT_STORAGE, DATA_FOLDER)
    os.makedirs(data_path, exist_ok=True)
    return data_path

def save_file(file_content: BinaryIO, folder_name: str, filename: str) -> str:
    """
    Guarda un archivo en el almacenamiento persistente
    
    Args:
        file_content: Contenido del archivo (file-like object)
        folder_name: Nombre de la carpeta
        filename: Nombre del archivo
    
    Returns:
        str: Ruta completa del archivo guardado
    """
    storage_path = get_storage_path(folder_name)
    file_path = os.path.join(storage_path, filename)
    
    # Guardar archivo
    file_content.seek(0)
    with open(file_path, 'wb') as f:
        f.write(file_content.read())
    
    return file_path

def get_file_path(folder_name: str, filename: str) -> Optional[str]:
    """
    Obtiene la ruta de un archivo
    
    Args:
        folder_name: Nombre de la carpeta
        filename: Nombre del archivo
    
    Returns:
        str: Ruta del archivo o None si no existe
    """
    storage_path = get_storage_path(folder_name)
    file_path = os.path.join(storage_path, filename)
    
    if os.path.exists(file_path):
        return file_path
    return None

def list_files(folder_name: str = None, extension: str = None) -> List[str]:
    """
    Lista archivos en el almacenamiento
    
    Args:
        folder_name: Nombre de la carpeta (None para listar todas)
        extension: Extensión de archivo a filtrar (ej: '.pdf')
    
    Returns:
        List[str]: Lista de nombres de archivos
    """
    if folder_name:
        storage_path = get_storage_path(folder_name)
        if not os.path.exists(storage_path):
            return []
        
        files = [f for f in os.listdir(storage_path) 
                if os.path.isfile(os.path.join(storage_path, f))]
        
        if extension:
            files = [f for f in files if f.lower().endswith(extension.lower())]
        
        return files
    else:
        # Listar todas las carpetas
        base_path = get_storage_path()
        if not os.path.exists(base_path):
            return []
        
        folders = [f for f in os.listdir(base_path) 
                  if os.path.isdir(os.path.join(base_path, f))]
        return folders

def delete_file(folder_name: str, filename: str) -> bool:
    """
    Elimina un archivo
    
    Args:
        folder_name: Nombre de la carpeta
        filename: Nombre del archivo
    
    Returns:
        bool: True si se eliminó correctamente
    """
    file_path = get_file_path(folder_name, filename)
    if file_path and os.path.exists(file_path):
        try:
            os.remove(file_path)
            return True
        except Exception as e:
            print(f"Error eliminando archivo {file_path}: {e}")
            return False
    return False

def save_json(data: dict, filename: str, folder_name: str = None) -> bool:
    """
    Guarda datos en formato JSON
    
    Args:
        data: Diccionario con datos a guardar
        filename: Nombre del archivo JSON
        folder_name: Nombre de la carpeta (opcional, usa DATA_FOLDER por defecto)
    
    Returns:
        bool: True si se guardó correctamente
    """
    try:
        if folder_name:
            json_path = get_data_path()
            json_path = os.path.join(json_path, folder_name)
            os.makedirs(json_path, exist_ok=True)
        else:
            json_path = get_data_path()
        
        file_path = os.path.join(json_path, filename)
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"Error guardando JSON {filename}: {e}")
        return False

def load_json(filename: str, folder_name: str = None) -> Optional[dict]:
    """
    Carga datos desde un archivo JSON
    
    Args:
        filename: Nombre del archivo JSON
        folder_name: Nombre de la carpeta (opcional)
    
    Returns:
        dict: Datos cargados o None si hay error
    """
    try:
        if folder_name:
            json_path = get_data_path()
            json_path = os.path.join(json_path, folder_name)
        else:
            json_path = get_data_path()
        
        file_path = os.path.join(json_path, filename)
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return None
    except Exception as e:
        print(f"Error cargando JSON {filename}: {e}")
        return None

def get_excel_file_path(folder_name: str) -> str:
    """
    Obtiene la ruta completa de un archivo Excel
    
    Args:
        folder_name: Nombre de la carpeta
    
    Returns:
        str: Ruta completa del archivo Excel
    """
    excel_path = get_excel_path()
    return os.path.join(excel_path, f'manifiestos_{folder_name}.xlsx')

