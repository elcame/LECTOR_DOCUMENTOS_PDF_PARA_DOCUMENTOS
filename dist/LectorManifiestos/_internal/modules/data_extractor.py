"""
Módulo para extracción de datos específicos de manifiestos
"""
import re


def extraer_datos_manifiesto(texto_extraido):
    """
    Extrae datos específicos de un manifiesto usando expresiones regulares simples.
    
    Args:
        texto_extraido (str): Texto extraído del PDF
    
    Returns:
        dict: Diccionario con los datos extraídos
    """
    # Expresiones regulares simples y fáciles de entender
    palabraclave1 = r'\s*Fecha\s*: (.*)Hora'
    palabraclave2 = r' Hora\s*: (.*)'
    palabraclave3 = r'LOAD\s+ID\s*#\s*(\d+)'
    palabraclave4 = r'\s*CONDUCTOR\s*: (.*)'
    palabraclave5 = r'\s*PLACA\s*:\s*([A-Za-z0-9]+)'
    palabraclave6 = r'\s*60(?!1747000|1252548\d)\d{7}'
    palabraclave7 = r'(?i)\s*REMESA No\.\s*(KBQ[0-9]+)'
    palabraclave8 = r'P?[E-e]xp\.\s*(.*?)\s*\('

    # Buscar la información en el texto
    fecha = re.findall(palabraclave1, texto_extraido)
    hora = re.findall(palabraclave2, texto_extraido)
    referencia = re.findall(palabraclave3, texto_extraido)
    conductor = re.findall(palabraclave4, texto_extraido)
    placa = re.findall(palabraclave5, texto_extraido)
    KOF = re.findall(palabraclave6, texto_extraido)
    KBQ = re.findall(palabraclave7, texto_extraido)
    destino = re.findall(palabraclave8, texto_extraido)
    
    # Crear diccionario con los datos encontrados
    # Verificar si hay fechas y horas múltiples
    if len(fecha) >= 2:
        fecha_inicio = fecha[0]
        fecha_retorno = fecha[1]
    else:
        fecha_inicio = fecha[0] if fecha else 'No encontrada'
        fecha_retorno = 'No encontrada'
    
    if len(hora) >= 2:
        hora_inicio = hora[0]
        hora_retorno = hora[1]
    else:
        hora_inicio = hora[0] if hora else 'No encontrada'
        hora_retorno = 'No encontrada'
    
    # Extraer y convertir el mes a nombre en español
    if fecha_inicio != 'No encontrada' and '.' in fecha_inicio:
        try:
            # Dividir la fecha y obtener el mes (formato DD.MM.YYYY)
            partes_fecha = fecha_inicio.split('.')
            if len(partes_fecha) >= 2:
                mes_numero = int(partes_fecha[1])  # El mes está en la posición 1
                
                # Convertir número de mes a nombre en español
                meses = {
                    1: 'ENERO', 2: 'FEBRERO', 3: 'MARZO', 4: 'ABRIL',
                    5: 'MAYO', 6: 'JUNIO', 7: 'JULIO', 8: 'AGOSTO',
                    9: 'SEPTIEMBRE', 10: 'OCTUBRE', 11: 'NOVIEMBRE', 12: 'DICIEMBRE'
                }
                mes = meses.get(mes_numero, 'MES_DESCONOCIDO')
            else:
                mes = 'FECHA_INVALIDA'
        except (ValueError, IndexError):
            mes = 'FECHA_INVALIDA'
    else:
        mes = 'NO_ENCONTRADO'
    
    # Extraer datos de factura electrónica
    datos_factura_electronica = extraer_datos_factura_electronica(texto_extraido)
    
    # Crear el manifiesto con datos básicos
    manifiesto = {
        'fecha inicio': fecha_inicio,
        #'fecha retorno': fecha_retorno,
        #'hora inicio': hora_inicio,
        #'hora retorno': hora_retorno,
        'load_id': referencia[0] if referencia else 'No encontrado',
        'conductor': conductor[0] if conductor else 'No encontrado',
        'mes': mes,
        'placa': placa[0] if placa else 'No encontrada',
        'kof': KOF[0] if KOF else 'No encontrado',
        'remesa': KBQ[0] if KBQ else 'No encontrada',
        'destino': destino[0] if destino else 'No encontrado',
        'origen': 'BARRANQUILLA',  # valor por defecto
        'empresa': 'CAMELO ARENAS GUILLERMO ANDRES'  # valor por defecto
    }
    
    # Integrar datos de factura electrónica al manifiesto
    manifiesto.update(datos_factura_electronica)
    
    return manifiesto


def extraer_datos_factura_electronica(texto_extraido):
    """
    Extrae datos para factura electrónica basado en el texto del manifiesto.
    
    Args:
        texto_extraido (str): Texto extraído del PDF
    
    Returns:
        dict: Diccionario con los datos de factura electrónica
    """
    BUSCARKOF = r'\s*6(?!01747000|01252548\d)\d{8}'
    BUSCADEDESTINO = r'P?[E-e]xp\.\s*(.*?)\s*\('

    KOF = re.findall(BUSCARKOF, texto_extraido)
    destino = re.findall(BUSCADEDESTINO, texto_extraido)
    
    # Crear una lista que se llame factura electronica
    if destino and (destino[0] == "Cartagena" or destino[0] == "Santa Marta"):
        valormanifiesto = 1600000
    else:
        if len(KOF) < 2:
            valormanifiesto = 250000
        else:
            valormanifiesto = 280000
    
    factura_electronica = {
        'fecha Generacion': "vacio",
        'fecha Vencimiento': "vacio",
        'valormanifiesto': valormanifiesto,
        'estado': 'pendiente',
        'fecha pago': "vacio"
    }
    return factura_electronica


def limpiar_datos(datos):
    """
    Limpia los datos extraídos de forma simple.
    
    Args:
        datos (dict): Diccionario con datos extraídos
    
    Returns:
        dict: Diccionario con datos limpios
    """
    
    datos_limpios = {}
    
    #REEMPLAZA . EN LAS FECHAS POR -
    for campo, valor in datos.items():
        if campo == 'fecha inicio' or campo == 'fecha retorno':
            valor = valor.replace('.', '-')
            datos_limpios[campo] = valor
    
    # Limpiar cada campo de forma simple
    for campo, valor in datos.items():
        if valor and valor != 'No encontrado' and valor != 'No encontrada':
            # Solo limpiar strings, no números
            if isinstance(valor, str):
                # Limpiar espacios extra
                valor_limpio = ' '.join(valor.split())
                
                # Corregir "Barranquea" a "Barranquilla" en cualquier campo
                if 'Barranquea' in valor_limpio:
                    valor_limpio = valor_limpio.replace('Barranquea', 'BARRANQUILLA')
                datos_limpios[campo] = valor_limpio
            else:
                # Para números y otros tipos, mantener el valor original
                datos_limpios[campo] = valor
        else:
            datos_limpios[campo] = valor
           
    
    
    return datos_limpios
