"""
Módulo para procesamiento de archivos PDF
"""
import fitz
import os
from datetime import datetime
from .data_extractor import extraer_datos_manifiesto, extraer_datos_factura_electronica, limpiar_datos


def extraer_texto_pdf(ruta_pdf):
    """
    Extrae todo el texto de un archivo PDF.
    
    Args:
        ruta_pdf (str): Ruta del archivo PDF
    
    Returns:
        str: Texto extraído del PDF, o None si hay error
    """
    try:
        # Abrir el documento PDF
        doc = fitz.open(ruta_pdf)
        texto_completo = ""
        
        # Extraer texto de todas las páginas
        for numero_pagina in range(len(doc)):
            pagina = doc.load_page(numero_pagina)
            texto_pagina = pagina.get_text()
            texto_completo += f"\n--- PÁGINA {numero_pagina + 1} ---\n"
            texto_completo += texto_pagina
        
        # Cerrar el documento
        doc.close()
        return texto_completo
        
    except Exception as e:
        print(f"Error al extraer texto del PDF {ruta_pdf}: {e}")
        return None


def procesar_carpeta_pdfs(carpeta):
    """
    Procesa todos los PDFs en una carpeta y extrae su texto y datos estructurados.
    Valida duplicados usando load_id o remesa (KBQ) para evitar procesar archivos repetidos.
    
    Args:
        carpeta (str): Ruta de la carpeta con PDFs
    
    Returns:
        tuple: (manifiestos, facturas_electronicas, archivos_duplicados)
            - manifiestos: Lista de manifiestos procesados
            - facturas_electronicas: Lista de facturas electrónicas procesadas
            - archivos_duplicados: Lista de diccionarios con información de archivos duplicados
    """
    manifiestos = []
    facturas_electronicas = []
    archivos_duplicados = []
    # Rastrear identificadores únicos para evitar duplicados
    # Guardamos también el archivo original para mostrar cuál fue el primero
    load_ids_procesados = {}  # {load_id: nombre_archivo_original}
    remesas_procesadas = {}  # {remesa: nombre_archivo_original}
    
    if not os.path.exists(carpeta):
        print(f"La carpeta {carpeta} no existe.")
        return manifiestos, facturas_electronicas, archivos_duplicados
    
    # Obtener lista de archivos PDF
    archivos_pdf = [archivo for archivo in os.listdir(carpeta) 
                   if archivo.lower().endswith('.pdf')]
    
    if not archivos_pdf:
        print("No se encontraron archivos PDF en la carpeta.")
        return manifiestos, facturas_electronicas, archivos_duplicados
    
    # Procesar cada PDF
    for archivo in archivos_pdf:
        ruta_completa = os.path.join(carpeta, archivo)
        print(f"Procesando: {archivo}")
        
        texto = extraer_texto_pdf(ruta_completa)
        if texto:
            # Extraer datos estructurados
            datos_manifiesto = extraer_datos_manifiesto(texto)
            datos_factura_electronica = extraer_datos_factura_electronica(texto)
            datos_manifiesto = limpiar_datos(datos_manifiesto)
            
            # Obtener identificadores únicos
            load_id = datos_manifiesto.get('load_id', 'No encontrado')
            remesa = datos_manifiesto.get('remesa', 'No encontrada')
            
            # Validar duplicados: primero por load_id, luego por remesa (KBQ)
            es_duplicado = False
            identificador_usado = None
            archivo_original = None
            
            if load_id and load_id != 'No encontrado':
                if load_id in load_ids_procesados:
                    es_duplicado = True
                    identificador_usado = f"load_id: {load_id}"
                    archivo_original = load_ids_procesados[load_id]
                else:
                    load_ids_procesados[load_id] = archivo
            elif remesa and remesa != 'No encontrada':
                if remesa in remesas_procesadas:
                    es_duplicado = True
                    identificador_usado = f"remesa (KBQ): {remesa}"
                    archivo_original = remesas_procesadas[remesa]
                else:
                    remesas_procesadas[remesa] = archivo
            else:
                # Si no hay ni load_id ni remesa, procesar de todas formas
                # pero advertir al usuario
                print(f"Advertencia: {archivo} no tiene load_id ni remesa (KBQ) para validar duplicados.")
            
            if es_duplicado:
                print(f"⚠️  Archivo duplicado omitido: {archivo} (ya procesado con {identificador_usado})")
                # Agregar a la lista de duplicados con información detallada
                archivos_duplicados.append({
                    'archivo': archivo,
                    'ruta_completa': ruta_completa,
                    'identificador': identificador_usado,
                    'archivo_original': archivo_original,
                    'load_id': load_id if load_id != 'No encontrado' else None,
                    'remesa': remesa if remesa != 'No encontrada' else None
                })
                continue
            
            # Si no es duplicado, agregar a las listas
            datos_manifiesto['archivo'] = archivo  # Guardar solo el nombre del archivo
            datos_manifiesto['fecha_procesamiento'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            manifiestos.append(datos_manifiesto)
            facturas_electronicas.append(datos_factura_electronica)
            print(f"✓ Archivo procesado correctamente: {archivo}")
    
    return manifiestos, facturas_electronicas, archivos_duplicados

