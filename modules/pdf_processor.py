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
    
    Args:
        carpeta (str): Ruta de la carpeta con PDFs
    
    Returns:
        tuple: (manifiestos, facturas_electronicas)
    """
    manifiestos = []
    facturas_electronicas = []
    
    if not os.path.exists(carpeta):
        print(f"La carpeta {carpeta} no existe.")
        return manifiestos, facturas_electronicas
    
    # Obtener lista de archivos PDF
    archivos_pdf = [archivo for archivo in os.listdir(carpeta) 
                   if archivo.lower().endswith('.pdf')]
    
    if not archivos_pdf:
        print("No se encontraron archivos PDF en la carpeta.")
        return manifiestos, facturas_electronicas
    
    print(f"Encontrados {len(archivos_pdf)} archivos PDF.")
    
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
            datos_manifiesto['archivo'] = archivo  # Guardar solo el nombre del archivo
            datos_manifiesto['fecha_procesamiento'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            manifiestos.append(datos_manifiesto)
            facturas_electronicas.append(datos_factura_electronica)
    
    return manifiestos, facturas_electronicas

