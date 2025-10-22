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
            datos_manifiesto['archivo'] = archivo
            datos_manifiesto['fecha_procesamiento'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            manifiestos.append(datos_manifiesto)
            facturas_electronicas.append(datos_factura_electronica)
        else:
            print(f"No se encontró texto en el archivo {archivo}")
    return manifiestos, facturas_electronicas


def generar_nombre_pdf_nuevo(datos_manifiesto, archivo_original, todos_los_campos=None):
    """
    Genera un nuevo nombre para el PDF basado en los datos extraídos y campos seleccionados.
    
    Args:
        datos_manifiesto (dict): Datos extraídos del manifiesto
        archivo_original (str): Nombre original del archivo
        todos_los_campos (list): Lista de campos con tipo y valor
    
    Returns:
        str: Nuevo nombre del archivo PDF
    """
    try:
        if todos_los_campos is None:
            todos_los_campos = [
                {'tipo': 'normal', 'valor': 'fecha inicio'},
                {'tipo': 'normal', 'valor': 'load_id'},
                {'tipo': 'normal', 'valor': 'conductor'},
                {'tipo': 'normal', 'valor': 'placa'},
                {'tipo': 'normal', 'valor': 'destino'}
            ]
        
        mapeo_campos = {
            'fecha inicio': datos_manifiesto.get('fecha inicio', 'FECHA_DESCONOCIDA'),
            'load_id': datos_manifiesto.get('load_id', 'LOAD_DESCONOCIDO'),
            'conductor': datos_manifiesto.get('conductor', 'CONDUCTOR_DESCONOCIDO'),
            'placa': datos_manifiesto.get('placa', 'PLACA_DESCONOCIDA'),
            'destino': datos_manifiesto.get('destino', 'DESTINO_DESCONOCIDO'),
            'origen': datos_manifiesto.get('origen', 'ORIGEN_DESCONOCIDO'),
            'kof': datos_manifiesto.get('kof', 'KOF_DESCONOCIDO'),
            'remesa': datos_manifiesto.get('remesa', 'REMESA_DESCONOCIDA'),
            'mes': datos_manifiesto.get('mes', 'MES_DESCONOCIDO'),
            'empresa': datos_manifiesto.get('empresa', 'EMPRESA_DESCONOCIDA'),
            'fecha Generacion': datos_manifiesto.get('fecha Generacion', 'FECHA_GEN_DESCONOCIDA'),
            'valormanifiesto': datos_manifiesto.get('valormanifiesto', 'VALOR_DESCONOCIDO'),
            'estado': datos_manifiesto.get('estado', 'ESTADO_DESCONOCIDO')
        }
        
        partes_nombre = []
        
        print(f"Procesando campos en orden: {todos_los_campos}")
        for campo_info in todos_los_campos:
            if campo_info['tipo'] == 'personalizado':
                # Campo personalizado - usar el valor directamente
                valor_limpio = limpiar_valor_para_nombre(campo_info['valor'], 'personalizado')
                partes_nombre.append(valor_limpio)
                print(f"Agregado campo personalizado: {valor_limpio}")
            elif campo_info['tipo'] == 'normal':
                # Campo normal - buscar en mapeo
                campo = campo_info['valor']
                if campo in mapeo_campos:
                    valor = mapeo_campos[campo]
                    valor_limpio = limpiar_valor_para_nombre(valor, campo)
                    partes_nombre.append(valor_limpio)
                    print(f"Agregado campo '{campo}': {valor_limpio}")
                else:
                    print(f"Campo '{campo}' no encontrado en mapeo")
        
        # Unir partes con guión bajo (sin extensión todavía)
        nombre_base = '_'.join(partes_nombre)
        print(f"Nombre base generado: {nombre_base}")
        
        # Limpiar caracteres problemáticos SIN tocar la extensión
        caracteres_problematicos = ['<', '>', ':', '"', '|', '?', '*', '\\', '/', ' ', ',', '(', ')', '[', ']', '{', '}']
        for char in caracteres_problematicos:
            nombre_base = nombre_base.replace(char, '_')
        
        # Limpiar múltiples guiones bajos consecutivos
        while '__' in nombre_base:
            nombre_base = nombre_base.replace('__', '_')
        
        # Eliminar guiones bajos al inicio y final
        nombre_base = nombre_base.strip('_')
        
        # Agregar extensión PDF asegurando que exista
        nuevo_nombre = f"{nombre_base}.pdf" if not nombre_base.lower().endswith('.pdf') else nombre_base
        
        print(f"Nombre final después de limpieza: {nuevo_nombre}")
        return nuevo_nombre
        
    except Exception as e:
        print(f"Error al generar nombre para PDF: {e}")
        # Si hay error, mantener nombre original con timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        return f"{timestamp}_{archivo_original}"

        


def limpiar_valor_para_nombre(valor, campo):
    """
    Limpia y formatea un valor para usar en el nombre del archivo.
    
    Args:
        valor: Valor a limpiar
        campo (str): Nombre del campo
    
    Returns:
        str: Valor limpio
    """
    if not valor or valor == 'No encontrado' or valor == 'No encontrada':
        return f"{campo.upper()}_DESCONOCIDO"
    
    # Convertir a string si no lo es
    valor_str = str(valor).strip()
    
    # Formateo especial para fecha: convertir 01.09.2025 -> 01-09-2025 y conservar guiones
    if campo == 'fecha inicio':
        # Reemplazar separadores comunes por guion
        valor_tmp = valor_str.replace('/', '-').replace('.', '-')
        # Mantener solo dígitos y guiones
        valor_limpio = ''.join(ch for ch in valor_tmp if ch.isdigit() or ch == '-')
        # Evitar guiones consecutivos
        while '--' in valor_limpio:
            valor_limpio = valor_limpio.replace('--', '-')
        # Quitar guiones al inicio/fin
        valor_limpio = valor_limpio.strip('-')
    else:
        # Limpieza general para otros campos
        valor_limpio = valor_str.replace(' ', '_').replace(',', '').replace('.', '').replace('-', '_')
    
    # Limitar longitud según el campo
    limites = {
        'fecha inicio': 15,
        'load_id': 20,
        'conductor': 20,
        'placa': 15,
        'destino': 15,
        'origen': 15,
        'kof': 15,
        'remesa': 15,
        'mes': 10,
        'empresa': 25,
        'fecha Generacion': 15,
        'valormanifiesto': 10,
        'estado': 15,
        'personalizado': 30  # Límite para campo personalizado
    }
    
    limite = limites.get(campo, 20)
    if len(valor_limpio) > limite:
        valor_limpio = valor_limpio[:limite]
    
    return valor_limpio


def renombrar_pdf(ruta_original, nuevo_nombre, carpeta_destino=None):
    """
    Renombra un archivo PDF.
    
    Args:
        ruta_original (str): Ruta completa del archivo original
        nuevo_nombre (str): Nuevo nombre del archivo
        carpeta_destino (str): Carpeta destino (opcional, por defecto la misma carpeta)
    
    Returns:
        str: Ruta del archivo renombrado, o None si hay error
    """
    try:
        # Determinar carpeta destino
        if carpeta_destino is None:
            carpeta_destino = os.path.dirname(ruta_original)
        
        # Crear carpeta destino si no existe
        if not os.path.exists(carpeta_destino):
            os.makedirs(carpeta_destino)
        
        # Asegurar extensión .pdf en el nombre nuevo
        if not nuevo_nombre.lower().endswith('.pdf'):
            nuevo_nombre = f"{nuevo_nombre}.pdf"
        
        # Ruta completa del archivo renombrado
        ruta_nueva = os.path.join(carpeta_destino, nuevo_nombre)
        
        # Verificar si el archivo destino ya existe
        contador = 1
        ruta_base = ruta_nueva
        while os.path.exists(ruta_nueva):
            nombre_base, extension = os.path.splitext(ruta_base)
            ruta_nueva = f"{nombre_base}_{contador}{extension}"
            contador += 1
        
        # Renombrar archivo
        os.rename(ruta_original, ruta_nueva)
        print(f"✓ Archivo renombrado: {os.path.basename(ruta_original)} → {os.path.basename(ruta_nueva)}")
        
        return ruta_nueva
        
    except Exception as e:
        print(f"✗ Error al renombrar archivo {ruta_original}: {e}")
        return None


def procesar_carpeta_pdfs_con_renombrado(carpeta, renombrar_archivos=False, carpeta_destino=None, todos_los_campos=None):
    """
    Procesa todos los PDFs en una carpeta y extrae su texto y datos estructurados.
    Opcionalmente renombra los archivos según los datos extraídos.
    
    Args:
        carpeta (str): Ruta de la carpeta con PDFs
        renombrar_archivos (bool): Si renombrar archivos según datos extraídos
        carpeta_destino (str): Carpeta destino para archivos renombrados (opcional)
        campos_seleccionados (list): Lista de campos a incluir en el nombre del archivo
        campo_personalizado (str): Texto personalizado a agregar al nombre del archivo
        campo_personalizado_posicion (str): Posición del campo personalizado ('start' o 'end')
    
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
            
            # Renombrar archivo si se solicita
            archivo_final = archivo
            if renombrar_archivos:
                nuevo_nombre = generar_nombre_pdf_nuevo(datos_manifiesto, archivo, todos_los_campos)
                ruta_renombrada = renombrar_pdf(ruta_completa, nuevo_nombre, carpeta_destino)
                if ruta_renombrada:
                    archivo_final = os.path.basename(ruta_renombrada)
                    # Actualizar ruta completa para futuras referencias
                    ruta_completa = ruta_renombrada
            
            datos_manifiesto['archivo'] = archivo_final
            datos_manifiesto['fecha_procesamiento'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            manifiestos.append(datos_manifiesto)
            facturas_electronicas.append(datos_factura_electronica)
        else:
            print(f"No se encontró texto en el archivo {archivo}")
    return manifiestos, facturas_electronicas