"""
Módulo para generación de archivos Excel
"""
import os
import sys
import pandas as pd
from datetime import datetime


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
        # Crear DataFrame con los datos
        df = pd.DataFrame(lista_archivos_excel)
        
        # Determinar la ruta correcta para la carpeta EXCEL
        if getattr(sys, 'frozen', False):
            # Ejecutándose desde PyInstaller - usar directorio del ejecutable
            base_path = os.path.dirname(sys.executable)
            # Intentar primero en _internal, luego en el directorio base
            carpeta_reportes = os.path.join(base_path, '_internal', 'EXCEL')
            if not os.path.exists(carpeta_reportes):
                carpeta_reportes = os.path.join(base_path, 'EXCEL')
        else:
            # Ejecutándose desde código fuente
            carpeta_reportes = 'EXCEL'
        
        # Crear carpeta 'EXCEL' de forma segura
        try:
            if not os.path.exists(carpeta_reportes):
                os.makedirs(carpeta_reportes)
        except PermissionError:
            # Si no se puede crear en la ubicación original, usar Documents del usuario
            user_docs = os.path.join(os.path.expanduser("~"), "Documents", "LectorManifiestos", "EXCEL")
            carpeta_reportes = user_docs
            os.makedirs(carpeta_reportes, exist_ok=True)
            print(f"⚠️ Carpeta EXCEL creada en: {carpeta_reportes}")
        
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
       
        # Guardar DataFrame a Excel
        df.to_excel(ruta_excel, index=False)
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
    # Determinar la ruta correcta para la carpeta EXCEL
    if getattr(sys, 'frozen', False):
        # Ejecutándose desde PyInstaller - usar directorio del ejecutable
        base_path = os.path.dirname(sys.executable)
        # Intentar primero en _internal, luego en el directorio base
        excel_folder = os.path.join(base_path, '_internal', 'EXCEL')
        if not os.path.exists(excel_folder):
            excel_folder = os.path.join(base_path, 'EXCEL')
    else:
        # Ejecutándose desde código fuente
        excel_folder = 'EXCEL'
    
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


def leer_datos_excel(carpeta_original=""):
    """
    Lee los datos de un archivo Excel existente y los convierte al formato esperado.
    
    Args:
        carpeta_original (str): Nombre de la carpeta original
    
    Returns:
        tuple: (manifiestos, facturas_electronicas) o (None, None) si hay error
    """
    try:
        # Obtener la ruta del archivo Excel
        ruta_excel = obtener_ultimo_excel(carpeta_original)
        if not ruta_excel or not os.path.exists(ruta_excel):
            print(f"No se encontró archivo Excel para la carpeta: {carpeta_original}")
            return None, None
        
        print(f"Leyendo datos del Excel: {ruta_excel}")
        
        # Leer el archivo Excel
        df = pd.read_excel(ruta_excel)
        
        # Convertir DataFrame a lista de diccionarios
        manifiestos = df.to_dict('records')
        
        # Crear facturas electrónicas separadas para compatibilidad
        facturas_electronicas = []
        
        for manifiesto in manifiestos:
            # Crear factura electrónica separada (para compatibilidad con el frontend)
            factura = {
                'fecha Generacion': manifiesto.get('fecha Generacion', 'vacio'),
                'fecha Vencimiento': manifiesto.get('fecha Vencimiento', 'vacio'),
                'valormanifiesto': manifiesto.get('valormanifiesto', 0),
                'estado': manifiesto.get('estado', 'pendiente'),
                'fecha pago': manifiesto.get('fecha pago', 'vacio'),
                'archivo': manifiesto.get('archivo', 'N/A')
            }
            facturas_electronicas.append(factura)
            
            # NO eliminar campos de facturación del manifiesto
            # Ahora todos los datos están integrados en el manifiesto
        
        print(f"✓ Datos leídos exitosamente: {len(manifiestos)} manifiestos")
        return manifiestos, facturas_electronicas
        
    except Exception as e:
        print(f"✗ Error al leer archivo Excel: {e}")
        return None, None
