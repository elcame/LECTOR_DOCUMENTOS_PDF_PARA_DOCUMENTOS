"""
Módulo para generación de archivos Excel
"""
import os
import pandas as pd
from datetime import datetime
from .storage import get_excel_path, get_excel_file_path


def crear_excel(lista_archivos_excel, carpeta_original=""):
    """
    Crea un archivo Excel con los datos de manifiestos procesados.
    Si ya existe un Excel para esta carpeta, lo elimina antes de crear uno nuevo.
    
    Args:
        lista_archivos_excel (list): Lista de diccionarios con datos de manifiestos
        carpeta_original (str): Nombre de la carpeta original (opcional)
    
    Returns:
        str: Ruta del archivo Excel creado, o None si hay error
    """
    if not lista_archivos_excel:
        print("No hay datos para exportar a Excel")
        return None
        
    try:
        # Definir campos específicos en el orden requerido
        campos_requeridos = [
            'placa',
            'conductor', 
            'origen',
            'destino',
            'fecha inicio',  # FECHA VIAJE
            'mes',
            'load_id',  # ID
            'kof',
            'remesa',
            'empresa',
            'valormanifiesto',  # VALOR FLETE
            'archivo'  # RUTA DEL ARCHIVO PDF
        ]
        
        # Crear DataFrame con los datos
        df = pd.DataFrame(lista_archivos_excel)
        
        # Filtrar solo los campos requeridos y mantener el orden
        df_filtrado = df[campos_requeridos]
        
        # Renombrar columnas para que coincidan con los nombres deseados
        df_filtrado = df_filtrado.rename(columns={
            'fecha inicio': 'FECHA VIAJE',
            'load_id': 'ID',
            'valormanifiesto': 'VALOR FLETE',
            'archivo': 'ARCHIVO PDF'
        })
        
        # Usar almacenamiento persistente
        carpeta_reportes = get_excel_path()
        
        # Definir nombre del archivo Excel basado en la carpeta
        if carpeta_original:
            nombre_excel = f'manifiestos_{carpeta_original}.xlsx'
        else:
            nombre_excel = 'manifiestos_actual.xlsx'
        
        # Ruta completa del archivo Excel
        ruta_excel = os.path.join(carpeta_reportes, nombre_excel)
        
        # Eliminar solo el Excel de esta carpeta específica si existe
        if os.path.exists(ruta_excel):
            os.remove(ruta_excel)
            print(f"Archivo Excel anterior eliminado: {nombre_excel}")
       
        # Guardar DataFrame filtrado a Excel
        df_filtrado.to_excel(ruta_excel, index=False)
        print(f"\n✓ Datos exportados exitosamente a: {ruta_excel}")
        
        return ruta_excel
        
    except Exception as e:
        print(f"\n✗ Error al exportar datos a Excel: {e}")
        return None


def limpiar_excels_anteriores(carpeta_excel):
    """
    Elimina todos los archivos Excel existentes en la carpeta.
    
    Args:
        carpeta_excel (str): Ruta de la carpeta donde están los archivos Excel
    """
    try:
        if os.path.exists(carpeta_excel):
            archivos_excel = [f for f in os.listdir(carpeta_excel) if f.endswith('.xlsx')]
            for archivo in archivos_excel:
                ruta_archivo = os.path.join(carpeta_excel, archivo)
                os.remove(ruta_archivo)
                print(f"Archivo Excel eliminado: {archivo}")
    except Exception as e:
        print(f"Error al limpiar archivos Excel: {e}")


def obtener_ultimo_excel(carpeta_original=""):
    """
    Obtiene la ruta del archivo Excel para una carpeta específica.
    
    Args:
        carpeta_original (str): Nombre de la carpeta original (opcional)
    
    Returns:
        str: Ruta del archivo Excel de la carpeta, o None si no existe
    """
    excel_folder = get_excel_path()
    
    # Buscar Excel específico de la carpeta
    if carpeta_original:
        archivo_carpeta = os.path.join(excel_folder, f'manifiestos_{carpeta_original}.xlsx')
        if os.path.exists(archivo_carpeta):
            return archivo_carpeta
    
    # Fallback: buscar el más reciente si no existe el archivo específico
    if os.path.exists(excel_folder):
        excel_files = [f for f in os.listdir(excel_folder) if f.endswith('.xlsx')]
        if excel_files:
            # Ordenar por fecha de modificación (más reciente primero)
            excel_files.sort(key=lambda x: os.path.getmtime(os.path.join(excel_folder, x)), reverse=True)
            return os.path.join(excel_folder, excel_files[0])
    return None
