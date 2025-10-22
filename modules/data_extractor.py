"""
Módulo para extracción de datos específicos de manifiestos
"""
import re
from datetime import datetime


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
    palabraclave5 = r'\s*PLACA\s*:\s*([A-Za-z0-9]+)(?:\s|$)'
    palabraclave6 = r'\s*6(?!01747000|01252548\d)\d{8}'
    palabraclave7 = r'(?i)\s*REMESA No\.\s*(KBQ[0-9]+)'
    palabraclave8 = r'P?[E-e]xp\.\s*(.*?)\s*\('

    # Buscar la información en el texto
    fecha = re.findall(palabraclave1, texto_extraido)
    hora = re.findall(palabraclave2, texto_extraido)
    referencia = re.findall(palabraclave3, texto_extraido)
    conductor = re.findall(palabraclave4, texto_extraido)
    placa_raw = re.findall(palabraclave5, texto_extraido)
    KOF = re.findall(palabraclave6, texto_extraido)
    KBQ = re.findall(palabraclave7, texto_extraido)
    destino = re.findall(palabraclave8, texto_extraido)
    
    # Filtrar placas válidas (excluir palabras como "FECHA", "No", etc.)
    placa = []
    palabras_invalidas = ['FECHA', 'No', 'encontrado', 'encontrada', 'vacio', 'N/A', 'NA']
    for p in placa_raw:
        if p and p.upper() not in palabras_invalidas and len(p) >= 3:
            placa.append(p)
    
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
    
    # Extraer y convertir el mes a nombre en español usando la fecha original
    mes = 'NO_ENCONTRADO'
    
    if fecha_inicio != 'No encontrada':
        try:
            # Normalizar fecha primero (convertir coma a punto y limpiar espacios)
            fecha_normalizada = fecha_inicio.replace(',', '.').strip()
            
            # Manejar formato especial DD.MMYYYY (ej: 02.102025)
            if re.match(r'^\d{2}\.\d{6}$', fecha_normalizada):
                # Formato DD.MMYYYY -> DD.MM.YYYY
                dia = fecha_normalizada[:2]
                mes_ano = fecha_normalizada[3:]
                mes_numero_str = mes_ano[:2]  # Primeros dos dígitos del mes
                ano = mes_ano[2:]
                fecha_normalizada = f"{dia}.{mes_numero_str}.{ano}"
            
            # Manejar formato especial DD.M.0.YYYY (ej: 18.1.0.2025 -> 18.10.2025)
            elif re.match(r'^\d{2}\.\d{1}\.0\.\d{4}$', fecha_normalizada):
                # Formato DD.M.0.YYYY -> DD.MM.YYYY 
                # El formato M.0 representa el mes (ej: 1.0 = octubre = mes 10)
                partes = fecha_normalizada.split('.')
                dia = partes[0]
                mes_digit = int(partes[1])  # Primer dígito del mes
                ano = partes[3]
                
                # Convertir formato M.0 a MM (ej: 1.0 -> 10, 2.0 -> 20, etc.)
                mes_numero = mes_digit * 10
                
                fecha_normalizada = f"{dia}.{mes_numero:02d}.{ano}"
            
            # Manejar formato DD.MM YYYY (ej: 02.10 2025)
            elif re.match(r'^\d{2}\.\d{2}\s+\d{4}$', fecha_normalizada):
                fecha_normalizada = fecha_normalizada.replace(' ', '.')
            
            # Intentar extraer mes de diferentes formatos
            mes_numero = None
            
            # Formato con puntos: DD.MM.YYYY
            if '.' in fecha_normalizada:
                partes_fecha = fecha_normalizada.split('.')
                if len(partes_fecha) >= 2:
                    mes_numero = int(partes_fecha[1].strip())
            
            # Formato ISO: YYYY-MM-DD
            elif '-' in fecha_normalizada:
                partes_fecha = fecha_normalizada.split('-')
                if len(partes_fecha) == 3:
                    mes_numero = int(partes_fecha[1].strip())
            
            # Formato con barras: DD/MM/YYYY
            elif '/' in fecha_normalizada:
                partes_fecha = fecha_normalizada.split('/')
                if len(partes_fecha) >= 2:
                    mes_numero = int(partes_fecha[1].strip())
            
            # Convertir número de mes a nombre en español
            if mes_numero:
                meses = {
                    1: 'ENERO', 2: 'FEBRERO', 3: 'MARZO', 4: 'ABRIL',
                    5: 'MAYO', 6: 'JUNIO', 7: 'JULIO', 8: 'AGOSTO',
                    9: 'SEPTIEMBRE', 10: 'OCTUBRE', 11: 'NOVIEMBRE', 12: 'DICIEMBRE'
                }
                mes = meses.get(mes_numero, 'MES_DESCONOCIDO')
            else:
                mes = 'FECHA_INVALIDA'
                
        except (ValueError, IndexError) as e:
            mes = 'FECHA_INVALIDA'
    
    # Extraer datos de factura electrónica
    factura_data = extraer_datos_factura_electronica(texto_extraido)
    
    manifiesto = {
        'fecha inicio': fecha_inicio,
        'fecha retorno': fecha_retorno,
        'hora inicio': hora_inicio,
        'hora retorno': hora_retorno,
        'load_id': referencia[0] if referencia else 'No encontrado',
        'conductor': conductor[0] if conductor else 'No encontrado',
        'mes': mes,
        'placa': placa[0] if placa else 'No encontrada',
        'kof': KOF[0] if KOF else 'No encontrado',
        'remesa': KBQ[0] if KBQ else 'No encontrada',
        'destino': destino[0] if destino else 'No encontrado',
        'origen': 'BARRANQUILLA',  # valor por defecto
        'empresa': 'CAMELO ARENAS GUILLERMO ANDRES',  # valor por defecto
        # Agregar datos de factura electrónica
        'fecha Generacion': factura_data['fecha Generacion'],
        'fecha Vencimiento': factura_data['fecha Vencimiento'],
        'valormanifiesto': factura_data['valormanifiesto'],
        'estado': factura_data['estado']
    }
    
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
    palabraclave3 = r'LOAD\s+ID\s*#\s*(\d+)'
    
     
    KOF = re.findall(BUSCARKOF, texto_extraido)
    destino = re.findall(BUSCADEDESTINO, texto_extraido)
    referencia = re.findall(palabraclave3, texto_extraido)
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
        'ID Manifiesto': referencia[0] if referencia else 'No encontrado',
        'valormanifiesto': valormanifiesto,
        'estado': 'pendiente'
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
    print("=== LIMPIANDO DATOS ===")
    print(f"Datos antes de limpiar: {datos}")
    
    datos_limpios = {}

    def normalizar_fecha(valor: str) -> str:
        """Convierte fechas a formato ISO YYYY-MM-DD.
        Corrige casos como "02.10 2025" insertando el punto faltante.
        Maneja formato "DD.MM,YYYY" con coma.
        """
        if not isinstance(valor, str):
            return valor

        texto = ' '.join(valor.strip().split())

        # Caso específico: "DD.MM YYYY" -> "DD.MM.YYYY"
        if re.fullmatch(r"\d{2}\.\d{2}\s+\d{4}", texto):
            texto = texto.replace(' ', '.')
        
        # Caso específico: "DD.MM,YYYY" -> "DD.MM.YYYY"
        if re.fullmatch(r"\d{2}\.\d{2},\d{4}", texto):
            texto = texto.replace(',', '.')
        
        # Caso específico: "DD.MMYYYY" -> "DD.MM.YYYY" (ej: 02.102025)
        if re.fullmatch(r"\d{2}\.\d{6}", texto):
            dia = texto[:2]
            mes_ano = texto[3:]
            mes_numero = int(mes_ano[:2])  # Primeros dos dígitos del mes
            ano = mes_ano[2:]
            texto = f"{dia}.{mes_numero:02d}.{ano}"
        
        # Caso específico: "DD.M.0.YYYY" -> "DD.MM.YYYY" (ej: 18.1.0.2025 -> 18.10.2025)
        if re.fullmatch(r"\d{2}\.\d{1}\.0\.\d{4}", texto):
            partes = texto.split('.')
            dia = partes[0]
            mes_digit = int(partes[1])  # Primer dígito del mes
            ano = partes[3]
            # Convertir formato M.0 a MM (ej: 1.0 -> 10, 2.0 -> 20, etc.)
            mes_numero = mes_digit * 10
            texto = f"{dia}.{mes_numero:02d}.{ano}"

        formatos_entrada = [
            "%d.%m.%Y",
            "%d/%m/%Y",
            "%d-%m-%Y",
            "%Y-%m-%d",
            "%Y/%m/%d",
            "%d.%m.%y",
            "%d/%m/%y",
            "%d-%m-%y",
        ]

        for fmt in formatos_entrada:
            try:
                dt = datetime.strptime(texto, fmt)
                return dt.strftime("%Y-%m-%d")
            except Exception:
                continue

        return texto
    
    # Limpiar cada campo de forma simple
    for campo, valor in datos.items():
        if valor and valor != 'No encontrado' and valor != 'No encontrada':
            # Solo limpiar espacios si es string
            if isinstance(valor, str):
                valor_limpio = ' '.join(valor.split())
                
                # Corregir "Barranquea" a "Barranquilla" en cualquier campo
                if 'Barranquea' in valor_limpio:
                    valor_limpio = valor_limpio.replace('Barranquea', 'Barranquilla')

                # Normalizar fechas en campos conocidos
                if campo in ['fecha inicio', 'fecha retorno', 'fecha Generacion', 'fecha Vencimiento', 'fecha pago']:
                    valor_limpio = normalizar_fecha(valor_limpio)
                datos_limpios[campo] = valor_limpio
                print(f"Campo '{campo}': '{valor}' -> '{valor_limpio}'")
            else:
                # Para valores no-string (como números), mantenerlos tal como están
                datos_limpios[campo] = valor
                print(f"Campo '{campo}': '{valor}' (mantenido como {type(valor).__name__})")
        else:
            datos_limpios[campo] = valor
            print(f"Campo '{campo}': '{valor}' (sin cambios)")
    
    print(f"Datos después de limpiar: {datos_limpios}")
    print("=" * 40)
    
    return datos_limpios
