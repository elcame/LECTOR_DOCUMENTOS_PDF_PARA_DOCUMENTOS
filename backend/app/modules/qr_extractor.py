"""
Módulo para extracción de información de códigos QR de manifiestos PDF
"""
import fitz
import re
import os
from typing import Optional, Dict
from PIL import Image, ImageEnhance
import io
try:
    from pyzbar.pyzbar import decode
    PYZBAR_AVAILABLE = True
except ImportError:
    PYZBAR_AVAILABLE = False
    # Solo mostrar advertencia si se intenta usar la funcionalidad de QR
    # No mostrar al importar el módulo para evitar ruido innecesario

# Variable para habilitar modo debug (guardar imágenes procesadas)
DEBUG_QR = os.getenv('DEBUG_QR', 'False').lower() == 'true'

def extraer_qr_pdf(ruta_pdf: str) -> Optional[str]:
    """
    Extrae el contenido del código QR de un archivo PDF.
    
    Args:
        ruta_pdf (str): Ruta del archivo PDF
    
    Returns:
        str: Contenido del QR decodificado, o None si no se encuentra o hay error
    """
    if not PYZBAR_AVAILABLE:
        print("Advertencia: pyzbar no está instalado. La extracción de QR no funcionará.")
        print("  Instala con: pip install pyzbar")
        print("  En Windows: pip install pyzbar-bin (incluye dependencias)")
        return None
    
    try:
        # Abrir el documento PDF
        doc = fitz.open(ruta_pdf)
        qr_data = None
        
        # Buscar QR en todas las páginas
        for numero_pagina in range(len(doc)):
            pagina = doc.load_page(numero_pagina)
            
            # Intentar diferentes escalas para mejorar la detección
            escalas = [3.0, 4.0, 2.5, 2.0]  # Empezar con mayor resolución
            
            for escala in escalas:
                try:
                    # Convertir página a imagen con alta resolución para mejor detección de QR
                    mat = fitz.Matrix(escala, escala)
                    pix = pagina.get_pixmap(matrix=mat, alpha=False)
                    
                    # Convertir a PIL Image
                    img_data = pix.tobytes("png")
                    img = Image.open(io.BytesIO(img_data))
                    
                    # Convertir a RGB si es necesario (pyzbar requiere RGB)
                    if img.mode != 'RGB':
                        img = img.convert('RGB')
                    
                    # También intentar con escala de grises (a veces funciona mejor)
                    img_gray = img.convert('L')
                    
                    # Mejorar contraste y nitidez para mejor detección
                    enhancer = ImageEnhance.Contrast(img)
                    img_enhanced = enhancer.enhance(1.5)
                    
                    # Detectar y decodificar códigos QR en RGB mejorado
                    qr_codes = decode(img_enhanced)
                    
                    # Si no se encuentra, intentar con la imagen original RGB
                    if not qr_codes:
                        qr_codes = decode(img)
                    
                    # Si no se encuentra en RGB, intentar en escala de grises
                    if not qr_codes:
                        qr_codes = decode(img_gray)
                    
                    # Si aún no se encuentra, intentar con escala de grises mejorada
                    if not qr_codes:
                        enhancer_gray = ImageEnhance.Contrast(img_gray)
                        img_gray_enhanced = enhancer_gray.enhance(2.0)
                        qr_codes = decode(img_gray_enhanced)
                    
                    # Guardar imágenes para debugging si está habilitado
                    if DEBUG_QR and not qr_codes:
                        debug_dir = 'debug_qr'
                        if not os.path.exists(debug_dir):
                            os.makedirs(debug_dir)
                        nombre_archivo = os.path.basename(ruta_pdf).replace('.pdf', '')
                        img_enhanced.save(f'{debug_dir}/{nombre_archivo}_p{numero_pagina}_s{escala}.png')
                    
                    if qr_codes:
                        # Tomar el primer QR encontrado
                        try:
                            qr_data = qr_codes[0].data.decode('utf-8')
                        except UnicodeDecodeError:
                            # Intentar con diferentes codificaciones
                            try:
                                qr_data = qr_codes[0].data.decode('latin-1')
                            except:
                                qr_data = str(qr_codes[0].data)
                        
                        if qr_data:
                            print(f"QR encontrado en página {numero_pagina + 1} (escala {escala}x): {qr_data}")
                            break
                    
                    # Limpiar memoria
                    pix = None
                    
                except Exception as e_escala:
                    print(f"Error al procesar con escala {escala}x: {e_escala}")
                    continue
            
            if qr_data:
                break
        
        # Cerrar el documento
        doc.close()
        return qr_data
        
    except Exception as e:
        print(f"Error al extraer QR del PDF {ruta_pdf}: {e}")
        import traceback
        traceback.print_exc()
        return None


def parsear_info_qr(qr_data: str) -> Dict[str, str]:
    """
    Parsea la información del código QR y extrae datos estructurados.
    
    Soporta múltiples formatos:
    1. Formato con campos etiquetados: MEC:111495507 Fecha:2025/11/24 Placa:SPV632 ...
    2. Formato antiguo: SPV632-MANIFIESTO_251126_180122
    
    Args:
        qr_data (str): Contenido del QR decodificado
    
    Returns:
        dict: Diccionario con los datos extraídos del QR
    """
    if not qr_data:
        return {
            'placa': 'No encontrada',
            'numero_manifiesto': 'No encontrado',
            'fecha': 'No encontrada',
            'hora': 'No encontrada',
            'qr_raw': None
        }
    
    datos = {
        'placa': 'No encontrada',
        'numero_manifiesto': 'No encontrado',
        'fecha': 'No encontrada',
        'hora': 'No encontrada',
        'origen': 'No encontrado',
        'destino': 'No encontrado',
        'qr_raw': qr_data
    }
    
    try:
        # FORMATO 1: Campos etiquetados (nuevo formato)
        # Ejemplo: MEC:111495507 Fecha:2025/11/24 Placa:SPV632 Remolque:R61797 Orig:PURIFICACION TOLIMA Dest:YUMBO VALLE DEL CAUC ...
        if ':' in qr_data and ('Placa:' in qr_data or 'Fecha:' in qr_data or 'MEC:' in qr_data):
            # Extraer MEC (número de manifiesto)
            match_mec = re.search(r'MEC\s*:\s*(\d+)', qr_data, re.IGNORECASE)
            if match_mec:
                datos['numero_manifiesto'] = match_mec.group(1)
            
            # Extraer Fecha
            match_fecha = re.search(r'Fecha\s*:\s*([^\s]+)', qr_data, re.IGNORECASE)
            if match_fecha:
                fecha_str = match_fecha.group(1).strip()
                # Convertir formato YYYY/MM/DD a YYYY-MM-DD
                if '/' in fecha_str:
                    fecha_str = fecha_str.replace('/', '-')
                datos['fecha'] = fecha_str
            
            # Extraer Placa
            match_placa = re.search(r'Placa\s*:\s*([A-Za-z0-9]+)', qr_data, re.IGNORECASE)
            if match_placa:
                datos['placa'] = match_placa.group(1).upper()
            
            # Extraer Hora si está presente
            match_hora = re.search(r'Hora\s*:\s*([^\s]+)', qr_data, re.IGNORECASE)
            if match_hora:
                hora_str = match_hora.group(1).strip()
                datos['hora'] = hora_str
            
            # Extraer Origen (Orig) - capturar hasta encontrar "Dest:" o el siguiente campo
            match_origen = re.search(r'Orig\s*:\s*([^D]+?)(?=\s+Dest\s*:|\s+Mercancia\s*:|\s+Conductor\s*:|\s+Empresa\s*:|\s+Seguro\s*:|$)', qr_data, re.IGNORECASE | re.DOTALL)
            if match_origen:
                origen_text = match_origen.group(1).strip()
                # Limpiar espacios múltiples
                datos['origen'] = ' '.join(origen_text.split())
            
            # Extraer Destino (Dest) - capturar hasta encontrar el siguiente campo
            # Usar lookahead positivo para capturar todo hasta el siguiente campo, sin restricción de caracteres
            match_destino = re.search(r'Dest\s*:\s*(.+?)(?=\s+Mercancia\s*:|\s+Conductor\s*:|\s+Empresa\s*:|\s+Seguro\s*:|$)', qr_data, re.IGNORECASE | re.DOTALL)
            if match_destino:
                destino_text = match_destino.group(1).strip()
                # Limpiar espacios múltiples
                datos['destino'] = ' '.join(destino_text.split())
        
        # FORMATO 2: Formato antiguo PLACA-MANIFIESTO_FECHA_HORA
        # Ejemplo: SPV632-MANIFIESTO_251126_180122
        elif '-' in qr_data and 'MANIFIESTO' in qr_data.upper():
            patron_completo = r'([A-Z0-9]+)-MANIFIESTO[_-]?(\d{6})[_-]?(\d{6})'
            match = re.search(patron_completo, qr_data, re.IGNORECASE)
            
            if match:
                placa = match.group(1).upper()
                fecha_str = match.group(2)
                hora_str = match.group(3)
                
                datos['placa'] = placa
                datos['fecha'] = formatear_fecha_qr(fecha_str)
                datos['hora'] = formatear_hora_qr(hora_str)
                
                # Intentar extraer número de manifiesto si está presente
                patron_manifiesto = r'MANIFIESTO[:\s]*(\d+)'
                match_manifiesto = re.search(patron_manifiesto, qr_data, re.IGNORECASE)
                if match_manifiesto:
                    datos['numero_manifiesto'] = match_manifiesto.group(1)
        
        # FORMATO 3: Intentar extraer solo la placa si no coincide con ningún patrón
        else:
            # Buscar patrón de placa al inicio (formato: ABC123)
            patron_placa = r'^([A-Z]{3}\d{3})'
            match_placa = re.search(patron_placa, qr_data)
            if match_placa:
                datos['placa'] = match_placa.group(1).upper()
            
            # Buscar número de manifiesto en cualquier parte del QR
            patron_manifiesto_general = r'(\d{6,})'
            matches_manifiesto = re.findall(patron_manifiesto_general, qr_data)
            if matches_manifiesto:
                # El número más largo probablemente sea el manifiesto
                numero_manifiesto = max(matches_manifiesto, key=len)
                if len(numero_manifiesto) >= 6:
                    datos['numero_manifiesto'] = numero_manifiesto
    
    except Exception as e:
        print(f"Error al parsear información del QR: {e}")
        import traceback
        traceback.print_exc()
    
    return datos


def formatear_fecha_qr(fecha_str: str) -> str:
    """
    Formatea la fecha del QR al formato estándar.
    
    Args:
        fecha_str (str): Fecha en formato YYMMDD o DDMMYY
    
    Returns:
        str: Fecha formateada como YYYY-MM-DD
    """
    if not fecha_str or len(fecha_str) != 6:
        return 'No encontrada'
    
    try:
        # Intentar formato YYMMDD (ej: 251126 = 25/11/26)
        año = int(fecha_str[:2])
        mes = int(fecha_str[2:4])
        dia = int(fecha_str[4:6])
        
        # Asumir años 2000-2099
        if año < 50:  # Años 2000-2049
            año_completo = 2000 + año
        else:  # Años 1950-1999
            año_completo = 1900 + año
        
        # Validar fecha
        if 1 <= mes <= 12 and 1 <= dia <= 31:
            return f"{año_completo}-{mes:02d}-{dia:02d}"
        else:
            # Intentar formato DDMMYY
            dia = int(fecha_str[:2])
            mes = int(fecha_str[2:4])
            año = int(fecha_str[4:6])
            
            if año < 50:
                año_completo = 2000 + año
            else:
                año_completo = 1900 + año
            
            if 1 <= mes <= 12 and 1 <= dia <= 31:
                return f"{año_completo}-{mes:02d}-{dia:02d}"
    
    except (ValueError, IndexError) as e:
        print(f"Error al formatear fecha {fecha_str}: {e}")
    
    return fecha_str


def formatear_hora_qr(hora_str: str) -> str:
    """
    Formatea la hora del QR al formato estándar.
    
    Args:
        hora_str (str): Hora en formato HHMMSS
    
    Returns:
        str: Hora formateada como HH:MM:SS
    """
    if not hora_str or len(hora_str) != 6:
        return 'No encontrada'
    
    try:
        hora = int(hora_str[:2])
        minuto = int(hora_str[2:4])
        segundo = int(hora_str[4:6])
        
        # Validar hora
        if 0 <= hora <= 23 and 0 <= minuto <= 59 and 0 <= segundo <= 59:
            return f"{hora:02d}:{minuto:02d}:{segundo:02d}"
    
    except (ValueError, IndexError) as e:
        print(f"Error al formatear hora {hora_str}: {e}")
    
    return hora_str


def extraer_qr_de_imagenes_embebidas(ruta_pdf: str) -> Optional[str]:
    """
    Extrae QR de imágenes embebidas directamente en el PDF.
    Útil cuando el QR está como imagen separada en lugar de parte del renderizado.
    
    Args:
        ruta_pdf (str): Ruta del archivo PDF
    
    Returns:
        str: Contenido del QR decodificado, o None si no se encuentra
    """
    if not PYZBAR_AVAILABLE:
        return None
    
    try:
        doc = fitz.open(ruta_pdf)
        qr_data = None
        
        # Buscar en todas las páginas
        for numero_pagina in range(len(doc)):
            pagina = doc.load_page(numero_pagina)
            
            # Obtener lista de imágenes en la página
            lista_imagenes = pagina.get_images(full=True)
            
            for img_index, img in enumerate(lista_imagenes):
                try:
                    # Obtener la imagen embebida
                    xref = img[0]
                    base_image = doc.extract_image(xref)
                    image_bytes = base_image["image"]
                    image_ext = base_image["ext"]
                    
                    # Convertir a PIL Image
                    img_pil = Image.open(io.BytesIO(image_bytes))
                    
                    # Convertir a RGB si es necesario
                    if img_pil.mode != 'RGB':
                        img_pil = img_pil.convert('RGB')
                    
                    # Intentar detectar QR
                    qr_codes = decode(img_pil)
                    
                    # Si no funciona, intentar con escala de grises
                    if not qr_codes:
                        img_gray = img_pil.convert('L')
                        qr_codes = decode(img_gray)
                    
                    if qr_codes:
                        try:
                            qr_data = qr_codes[0].data.decode('utf-8')
                        except UnicodeDecodeError:
                            try:
                                qr_data = qr_codes[0].data.decode('latin-1')
                            except:
                                qr_data = str(qr_codes[0].data)
                        
                        if qr_data:
                            print(f"QR encontrado en imagen embebida (página {numero_pagina + 1}, imagen {img_index}): {qr_data}")
                            break
                            
                except Exception as e_img:
                    # Continuar con la siguiente imagen
                    continue
            
            if qr_data:
                break
        
        doc.close()
        return qr_data
        
    except Exception as e:
        print(f"Error al extraer QR de imágenes embebidas: {e}")
        return None


def extraer_info_qr_manifiesto(ruta_pdf: str) -> Dict[str, str]:
    """
    Función principal para extraer información del QR de un manifiesto.
    Intenta múltiples métodos: renderizado de página e imágenes embebidas.
    
    Args:
        ruta_pdf (str): Ruta del archivo PDF
    
    Returns:
        dict: Diccionario con los datos extraídos del QR
    """
    # Primero intentar extraer del renderizado de la página
    qr_data = extraer_qr_pdf(ruta_pdf)
    
    # Si no se encuentra, intentar extraer de imágenes embebidas
    if not qr_data:
        print("No se encontró QR en renderizado, intentando con imágenes embebidas...")
        qr_data = extraer_qr_de_imagenes_embebidas(ruta_pdf)
    
    # Parsear información
    if qr_data:
        return parsear_info_qr(qr_data)
    else:
        print(f"No se pudo extraer QR del archivo: {ruta_pdf}")
        return {
            'placa': 'No encontrada',
            'numero_manifiesto': 'No encontrado',
            'fecha': 'No encontrada',
            'hora': 'No encontrada',
            'qr_raw': None
        }

