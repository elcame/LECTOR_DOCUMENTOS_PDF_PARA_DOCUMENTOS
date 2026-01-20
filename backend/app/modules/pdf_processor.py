"""
Módulo para procesamiento de archivos PDF
"""
import fitz
import os
from datetime import datetime
from .data_extractor import extraer_datos_manifiesto, extraer_datos_factura_electronica, limpiar_datos
from .qr_extractor import extraer_info_qr_manifiesto

# Verificar si OCR está disponible
OCR_AVAILABLE = False
get_textpage_ocr = None

def verificar_ocr_disponible():
    """
    Verifica si Tesseract OCR está disponible y configurado correctamente.
    """
    global OCR_AVAILABLE, get_textpage_ocr
    
    try:
        # Intentar importar la función de OCR de PyMuPDF
        try:
            from fitz.utils import get_textpage_ocr
            OCR_AVAILABLE = True
        except ImportError:
            # Intentar importar desde fitz directamente
            if hasattr(fitz, 'utils') and hasattr(fitz.utils, 'get_textpage_ocr'):
                get_textpage_ocr = fitz.utils.get_textpage_ocr
                OCR_AVAILABLE = True
        
        # Verificar si TESSDATA_PREFIX está configurado
        tessdata_prefix = os.getenv("TESSDATA_PREFIX")
        
        # Si no está configurado, intentar detectar ubicaciones comunes en Windows
        if not tessdata_prefix:
            ubicaciones_comunes = [
                r"E:\LECTOR OCR\tessdata",  # Ubicación personalizada del usuario
                r"E:\LECTOR OCR",  # Si tessdata está en la raíz
                r"C:\Program Files\Tesseract-OCR\tessdata",
                r"C:\Program Files (x86)\Tesseract-OCR\tessdata",
                r"C:\Tesseract-OCR\tessdata",
            ]
            
            for ubicacion in ubicaciones_comunes:
                # Verificar si existe la carpeta tessdata directamente
                if os.path.exists(ubicacion):
                    # Verificar si contiene archivos .traineddata
                    archivos_trained = [f for f in os.listdir(ubicacion) if f.endswith('.traineddata')]
                    if archivos_trained:
                        os.environ["TESSDATA_PREFIX"] = ubicacion
                        tessdata_prefix = ubicacion
                        print(f"[OK] TESSDATA_PREFIX configurado automaticamente: {ubicacion}")
                        print(f"  Idiomas encontrados: {', '.join([f.replace('.traineddata', '') for f in archivos_trained[:5]])}")
                        break
                    # Si no hay .traineddata aquí, buscar en subcarpetas
                    elif os.path.isdir(ubicacion):
                        # Buscar tessdata en subcarpetas
                        for root, dirs, files in os.walk(ubicacion):
                            if 'tessdata' in root.lower() or any(f.endswith('.traineddata') for f in files):
                                archivos_trained = [f for f in files if f.endswith('.traineddata')]
                                if archivos_trained:
                                    os.environ["TESSDATA_PREFIX"] = root
                                    tessdata_prefix = root
                                    print(f"[OK] TESSDATA_PREFIX configurado automaticamente: {root}")
                                    print(f"  Idiomas encontrados: {', '.join([f.replace('.traineddata', '') for f in archivos_trained[:5]])}")
                                    break
                        if tessdata_prefix:
                            break
        
        # Verificar si hay soporte OCR en PyMuPDF
        if OCR_AVAILABLE:
            # Verificar si pdfocr_tobytes está disponible
            if hasattr(fitz.Pixmap, 'pdfocr_tobytes'):
                OCR_AVAILABLE = True
            elif tessdata_prefix:
                OCR_AVAILABLE = True
            else:
                OCR_AVAILABLE = False
                print("[WARN] Tesseract instalado pero TESSDATA_PREFIX no configurado")
                print("   Configura la variable de entorno TESSDATA_PREFIX o reinstala Tesseract")
        
        if OCR_AVAILABLE:
            print("[OK] OCR (Tesseract) esta disponible y configurado")
        else:
            print("[WARN] OCR no esta disponible. El texto de imagenes no se extraera.")
            
    except Exception as e:
        OCR_AVAILABLE = False
        get_textpage_ocr = None
        print(f"[WARN] Error al verificar OCR: {e}")

# Verificar OCR al importar el módulo
verificar_ocr_disponible()


def procesar_carpeta_qr(carpeta: str):
    """
    Procesa solo los códigos QR de todos los PDFs en una carpeta.
    No extrae texto del PDF, solo información del QR.
    
    Args:
        carpeta (str): Ruta de la carpeta con PDFs
    
    Returns:
        list: Lista de diccionarios con información del QR de cada archivo
    """
    resultados_qr = []
    
    if not os.path.exists(carpeta):
        print(f"La carpeta {carpeta} no existe.")
        return resultados_qr
    
    # Obtener lista de archivos PDF
    archivos_pdf = [archivo for archivo in os.listdir(carpeta) 
                   if archivo.lower().endswith('.pdf')]
    
    if not archivos_pdf:
        print("No se encontraron archivos PDF en la carpeta.")
        return resultados_qr
    
    # Procesar cada PDF solo para extraer QR
    for archivo in archivos_pdf:
        ruta_completa = os.path.join(carpeta, archivo)
        print(f"Extrayendo QR de: {archivo}")
        
        try:
            datos_qr = extraer_info_qr_manifiesto(ruta_completa)
            
            if datos_qr and datos_qr.get('qr_raw'):
                resultado = {
                    'archivo': archivo,
                    'ruta_completa': ruta_completa,
                    'placa': datos_qr.get('placa', 'No encontrada'),
                    'numero_manifiesto': datos_qr.get('numero_manifiesto', 'No encontrado'),
                    'fecha': datos_qr.get('fecha', 'No encontrada'),
                    'hora': datos_qr.get('hora', 'No encontrada'),
                    'origen': datos_qr.get('origen', 'No encontrado'),
                    'destino': datos_qr.get('destino', 'No encontrado'),
                    'qr_raw': datos_qr.get('qr_raw', None)
                }
                resultados_qr.append(resultado)
                print(f"[OK] QR extraido correctamente de: {archivo}")
            else:
                print(f"[WARN] No se encontro QR en: {archivo}")
                
        except Exception as e:
            print(f"❌ Error al extraer QR de {archivo}: {e}")
            continue
    
    return resultados_qr


def procesar_qr_manifiesto(datos_manifiesto: dict, ruta_completa: str, archivo: str):
    """
    Procesa la información del código QR de un manifiesto y la combina con los datos extraídos.
    
    Args:
        datos_manifiesto (dict): Diccionario con los datos del manifiesto extraídos del texto
        ruta_completa (str): Ruta completa del archivo PDF
        archivo (str): Nombre del archivo PDF
    
    Returns:
        None: Modifica el diccionario datos_manifiesto in-place
    """
    try:
        datos_qr = extraer_info_qr_manifiesto(ruta_completa)
        
        # Combinar datos del QR con los datos del manifiesto
        # El QR tiene prioridad si los datos del texto no se encontraron
        if datos_qr:
            # Actualizar placa si no se encontró en el texto o si el QR tiene una
            if (datos_manifiesto.get('placa') == 'No encontrada' and 
                datos_qr.get('placa') != 'No encontrada'):
                datos_manifiesto['placa'] = datos_qr['placa']
            
            # Añadir información adicional del QR
            datos_manifiesto['qr_placa'] = datos_qr.get('placa', 'No encontrada')
            datos_manifiesto['qr_numero_manifiesto'] = datos_qr.get('numero_manifiesto', 'No encontrado')
            datos_manifiesto['qr_fecha'] = datos_qr.get('fecha', 'No encontrada')
            datos_manifiesto['qr_hora'] = datos_qr.get('hora', 'No encontrada')
            datos_manifiesto['qr_origen'] = datos_qr.get('origen', 'No encontrado')
            datos_manifiesto['qr_destino'] = datos_qr.get('destino', 'No encontrado')
            datos_manifiesto['qr_raw'] = datos_qr.get('qr_raw', None)
    except Exception as e:
        print(f"Advertencia: No se pudo extraer información del QR de {archivo}: {e}")
        # Continuar sin datos del QR
        datos_manifiesto['qr_placa'] = 'No encontrada'
        datos_manifiesto['qr_numero_manifiesto'] = 'No encontrado'
        datos_manifiesto['qr_fecha'] = 'No encontrada'
        datos_manifiesto['qr_hora'] = 'No encontrada'
        datos_manifiesto['qr_origen'] = 'No encontrado'
        datos_manifiesto['qr_destino'] = 'No encontrado'
        datos_manifiesto['qr_raw'] = None


def extraer_texto_pdf(ruta_pdf):
    """
    Extrae todo el texto de un archivo PDF usando múltiples métodos para asegurar máxima extracción.
    
    Args:
        ruta_pdf (str): Ruta del archivo PDF
    
    Returns:
        str: Texto extraído del PDF, o None si hay error
    """
    try:
        # Abrir el documento PDF
        doc = fitz.open(ruta_pdf)
        texto_completo = ""
        
        # Extraer texto de todas las páginas usando múltiples métodos
        for numero_pagina in range(len(doc)):
            pagina = doc.load_page(numero_pagina)
            
            # Método 1: Extracción básica de texto con flags mejorados
            # Usar flags para preservar espacios y ligaduras
            try:
                texto_pagina = pagina.get_text(flags=11)  # TEXT_PRESERVE_WHITESPACE | TEXT_PRESERVE_LIGATURES
            except:
                # Si falla con flags, usar método básico
                texto_pagina = pagina.get_text()
            
    
            
            # Agregar el texto de la página al texto completo
            if texto_pagina:
                texto_completo += f"\n--- PÁGINA {numero_pagina + 1} ---\n"
                texto_completo += texto_pagina
        
        # Cerrar el documento
        doc.close()
        return texto_completo
        
    except Exception as e:
        print(f"Error al extraer texto del PDF {ruta_pdf}: {e}")
        import traceback
        traceback.print_exc()
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
            # Extraer datos estructurados del texto
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
                print(f"[WARN] Archivo duplicado omitido: {archivo} (ya procesado con {identificador_usado})")
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
            print(f"[OK] Archivo procesado correctamente: {archivo}")
    
    return manifiestos, facturas_electronicas, archivos_duplicados

