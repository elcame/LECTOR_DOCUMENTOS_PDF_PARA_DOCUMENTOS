"""
Módulo para generación de archivos Excel
"""
import os
import pandas as pd
from datetime import datetime
from io import BytesIO


def _pick(d: dict, *keys, default=''):
    for k in keys:
        if k in d and d.get(k) not in (None, ''):
            return d.get(k)
    return default


def _normalize_excel_row(m: dict) -> dict:
    """
    Normaliza distintas variantes de campos del manifiesto a un schema estable
    para exportación en Excel.
    """
    if not m:
        m = {}

    placa = _pick(m, 'placa', 'PLACA', default='No encontrada')
    conductor = _pick(m, 'conductor', 'CONDUCTOR', default='No encontrado')
    origen = _pick(m, 'origen', 'ORIGEN', default='No encontrado')
    destino = _pick(m, 'destino', 'DESTINO', default='No encontrado')

    fecha_viaje = _pick(
        m,
        'fecha inicio', 'fecha_inicio', 'fecha_viaje', 'FECHA VIAJE',
        'fecha', 'fecha_inicio_viaje',
        default=''
    )
    mes = _pick(m, 'mes', 'MES', default='')
    load_id = _pick(m, 'load_id', 'loadId', 'ID', 'id', default='No encontrado')
    kof = _pick(m, 'kof', 'KOF', default='No encontrado')
    remesa = _pick(m, 'remesa', 'REMESA', default='No encontrada')
    empresa = _pick(m, 'empresa', 'EMPRESA', default='')
    valor_flete = _pick(m, 'valormanifiesto', 'valorManifiesto', 'VALOR FLETE', 'valor_flete', default='')
    archivo = _pick(m, 'archivo', 'ARCHIVO PDF', 'filename', 'file_name', 'ruta', default='')

    return {
        'placa': str(placa),
        'conductor': str(conductor),
        'origen': str(origen),
        'destino': str(destino),
        'fecha inicio': str(fecha_viaje),
        'mes': str(mes),
        'load_id': str(load_id),
        'kof': str(kof),
        'remesa': str(remesa),
        'empresa': str(empresa),
        'valormanifiesto': str(valor_flete),
        'archivo': str(archivo),
    }


def crear_excel(lista_archivos_excel, carpeta_original="", username=None):
    """
    Crea un archivo Excel con los datos de manifiestos procesados.
    Si ya existe un Excel para esta carpeta, lo elimina antes de crear uno nuevo.
    
    Args:
        lista_archivos_excel (list): Lista de diccionarios con datos de manifiestos
        carpeta_original (str): Nombre de la carpeta original (opcional)
        username (str): Nombre de usuario para organizar por carpetas (opcional)
    
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

        # Normalizar filas para tolerar variantes de campos
        rows = [_normalize_excel_row(m) for m in lista_archivos_excel]
        df = pd.DataFrame(rows)
        df_filtrado = df[campos_requeridos]
        
        # Renombrar columnas para que coincidan con los nombres deseados
        df_filtrado = df_filtrado.rename(columns={
            'fecha inicio': 'FECHA VIAJE',
            'load_id': 'ID',
            'valormanifiesto': 'VALOR FLETE',
            'archivo': 'ARCHIVO PDF'
        })
        
        # Crear carpeta 'EXCEL' del usuario si no existe
        if username:
            carpeta_reportes = os.path.join('EXCEL', username)
        else:
            carpeta_reportes = 'EXCEL'
        
        if not os.path.exists(carpeta_reportes):
            os.makedirs(carpeta_reportes)
        
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
        print(f"\n[OK] Datos exportados exitosamente a: {ruta_excel}")
        
        return ruta_excel
        
    except Exception as e:
        print(f"\n[ERROR] Error al exportar datos a Excel: {e}")
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


def crear_excel_en_memoria(lista_archivos_excel, carpeta_original=""):
    """
    Crea un archivo Excel en memoria (BytesIO) con los datos de manifiestos procesados.
    No guarda en disco, retorna bytes para subir a Firebase Storage.
    
    Args:
        lista_archivos_excel (list): Lista de diccionarios con datos de manifiestos
        carpeta_original (str): Nombre de la carpeta original (opcional)
    
    Returns:
        tuple: (bytes_io, filename) - Buffer de bytes del Excel y nombre del archivo
               o (None, None) si hay error
    """
    if not lista_archivos_excel:
        print("No hay datos para exportar a Excel")
        return None, None
        
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

        # Normalizar filas para tolerar variantes de campos
        rows = [_normalize_excel_row(m) for m in lista_archivos_excel]
        df = pd.DataFrame(rows)
        df_filtrado = df[campos_requeridos]
        
        # Renombrar columnas para que coincidan con los nombres deseados
        df_filtrado = df_filtrado.rename(columns={
            'fecha inicio': 'FECHA VIAJE',
            'load_id': 'ID',
            'valormanifiesto': 'VALOR FLETE',
            'archivo': 'ARCHIVO PDF'
        })
        
        # Definir nombre del archivo Excel basado en la carpeta
        if carpeta_original:
            nombre_excel = f'manifiestos_{carpeta_original}.xlsx'
        else:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            nombre_excel = f'manifiestos_{timestamp}.xlsx'
        
        # Crear buffer en memoria
        output = BytesIO()
        
        # Guardar DataFrame a Excel en memoria
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df_filtrado.to_excel(writer, index=False, sheet_name='Manifiestos')
        
        # Obtener bytes
        output.seek(0)
        excel_bytes = output.getvalue()
        
        print(f"\n[OK] Excel generado en memoria: {nombre_excel} ({len(excel_bytes)} bytes)")
        
        return output, nombre_excel
        
    except Exception as e:
        print(f"\n[ERROR] Error al generar Excel en memoria: {e}")
        import traceback
        traceback.print_exc()
        return None, None


def obtener_ultimo_excel(carpeta_original="", username=None):
    """
    Obtiene la ruta del archivo Excel para una carpeta específica del usuario.
    
    Args:
        carpeta_original (str): Nombre de la carpeta original (opcional)
        username (str): Nombre de usuario para buscar en su carpeta (opcional)
    
    Returns:
        str: Ruta del archivo Excel de la carpeta, o None si no existe
    """
    if username:
        excel_folder = os.path.join('EXCEL', username)
    else:
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
