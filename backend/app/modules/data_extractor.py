"""
Módulo para extracción de datos específicos de manifiestos
"""
import re
import logging
import json
from difflib import SequenceMatcher
import unicodedata
from datetime import datetime
from pathlib import Path
from .qr_extractor import extraer_info_qr_manifiesto

# Configurar logging
logger = logging.getLogger(__name__)


_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
_CACHE_DIR = _BACKEND_DIR / 'cache'
_CONDUCTORES_CATALOGO_PATH = _CACHE_DIR / 'conductores_catalogo.json'


def _quitar_acentos(texto: str) -> str:
    return ''.join(
        c for c in unicodedata.normalize('NFD', texto)
        if unicodedata.category(c) != 'Mn'
    )


def _simplificar_nombre_conductor(nombre: str) -> str:
    if not isinstance(nombre, str):
        return ''
    nombre = _quitar_acentos(nombre)
    nombre = re.sub(r"[^a-zA-Z\s]", " ", nombre)
    nombre = ' '.join(nombre.split()).lower()
    return re.sub(r"[^a-z]", "", nombre)


def _cargar_catalogo_conductores() -> list[str]:
    try:
        if not _CONDUCTORES_CATALOGO_PATH.exists():
            return []
        with _CONDUCTORES_CATALOGO_PATH.open('r', encoding='utf-8') as f:
            data = json.load(f)
        if isinstance(data, list):
            return [x for x in data if isinstance(x, str) and x.strip()]
        return []
    except Exception as e:
        logger.warning(f"No se pudo cargar catálogo de conductores: {e}")
        return []


def _guardar_catalogo_conductores(nombres: list[str]) -> None:
    try:
        _CACHE_DIR.mkdir(parents=True, exist_ok=True)
        nombres_limpios: list[str] = []
        vistos: set[str] = set()
        for n in nombres:
            if not isinstance(n, str):
                continue
            n2 = ' '.join(n.split()).strip()
            if not n2:
                continue
            key = _simplificar_nombre_conductor(n2)
            if key and key in vistos:
                continue
            if key:
                vistos.add(key)
            nombres_limpios.append(n2)
        with _CONDUCTORES_CATALOGO_PATH.open('w', encoding='utf-8') as f:
            json.dump(nombres_limpios, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logger.warning(f"No se pudo guardar catálogo de conductores: {e}")


def corregir_conductor_con_catalogo(nombre_extraido: str, *, auto_agregar: bool = True, umbral: float = 0.88) -> str:
    if not isinstance(nombre_extraido, str):
        return nombre_extraido
    nombre_extraido = ' '.join(nombre_extraido.split()).strip()
    if not nombre_extraido or nombre_extraido.lower() in {'no encontrado', 'n/a', 'na', 'vacio'}:
        return nombre_extraido

    catalogo = _cargar_catalogo_conductores()
    if not catalogo:
        if auto_agregar:
            _guardar_catalogo_conductores([nombre_extraido])
        return nombre_extraido

    base = _simplificar_nombre_conductor(nombre_extraido)
    if not base:
        return nombre_extraido

    mejor = None
    mejor_score = 0.0
    for canon in catalogo:
        canon_base = _simplificar_nombre_conductor(canon)
        if not canon_base:
            continue
        score = SequenceMatcher(None, base, canon_base).ratio()
        if score > mejor_score:
            mejor_score = score
            mejor = canon

    if mejor and mejor_score >= umbral:
        return mejor

    if auto_agregar:
        catalogo.append(nombre_extraido)
        _guardar_catalogo_conductores(catalogo)
    return nombre_extraido


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
    palabraclave6 = r'\s*60(?!1747000|1252548\d)\d{7}'
    palabraclave7 = r'(?i)\s*REMESA No\.\s*(KBQ[0-9]+)'
    # Expresión regular mejorada: paréntesis opcional y captura más flexible
    palabraclave8 = r'P?\s*[E-e]xp\.\s*(.*?)(?:\s*\(|\s*Dirección|\s*$|\n)'
    
    # Expresiones regulares para valores monetarios
    palabraclave_valor_total = r'(?i)VALOR\s+TOTAL\s+(?:DEL\s+)?VIAJE[:\s]*\$?\s*([\d.,]+)'
    palabraclave_anticipo = r'(?i)VALOR\s+ANTICIPO[:\s]*\$?\s*([\d.,]+)'
    palabraclave_saldo = r'(?i)SALDO\s+(?:POR\s+)?PAGAR[:\s]*\$?\s*([\d.,]+)'
    palabraclave_fecha_liquidacion = r'(?i)FECHA\s+LIQUIDACI[ÓO]N[:\s]*([^\n]+)'
    palabraclave_fecha_pago = r'(?i)FECHA\s+(?:DE\s+)?PAGO[:\s]*([^\n]+)'

    # Buscar la información en el texto
    fecha = re.findall(palabraclave1, texto_extraido)
    hora = re.findall(palabraclave2, texto_extraido)
    referencia = re.findall(palabraclave3, texto_extraido)
    conductor = re.findall(palabraclave4, texto_extraido)
    placa_raw = re.findall(palabraclave5, texto_extraido)
    KOF = re.findall(palabraclave6, texto_extraido)
    KBQ = re.findall(palabraclave7, texto_extraido)
    destino = re.findall(palabraclave8, texto_extraido)
    
    
    
    # Mostrar contexto de cada coincidencia
    if destino:
        for i, dest in enumerate(destino):
            
            # Buscar el contexto alrededor de la coincidencia
            matches = list(re.finditer(palabraclave8, texto_extraido))
            if i < len(matches):
                match = matches[i]
                start = max(0, match.start() - 50)
                end = min(len(texto_extraido), match.end() + 50)
                contexto = texto_extraido[start:end]
              
    else:
       
        # Buscar variaciones posibles en el texto
        posibles_variaciones = [
            r'Exp\.',
            r'exp\.',
            r'PExp\.',
            r'Pexp\.',
            r'EXP\.',
            r'PEXP\.'
        ]
        
        for var in posibles_variaciones:
            matches = re.findall(var, texto_extraido)
            if matches:
               
                # Mostrar contexto de las primeras 3
                matches_iter = list(re.finditer(var, texto_extraido))
                for j, match in enumerate(matches_iter[:3]):
                    start = max(0, match.start() - 30)
                    end = min(len(texto_extraido), match.end() + 30)
                    contexto = texto_extraido[start:end]
                    
    
    
    # También usar logger para archivos de log
    logger.info(f"palabraclave8 - Expresión: {palabraclave8}, Resultados: {destino}, Cantidad: {len(destino)}")
    
    # Procesar y normalizar destinos encontrados
    # Lista de frases completas a omitir (no son destinos válidos)
    frases_omitir = [
        'bod ext 2 aeropto',
        'bodega ext',
        'aeropuerto',
        'virtual',
        'dirección',
        'direccion',
        'dir',
        'cfat c180',
        'cargo',
        'carga'
    ]
    
    destino_procesado = []
    for dest in destino:
        dest_limpio = dest.strip()
        dest_lower = dest_limpio.lower()
        
        # Omitir si coincide exactamente o contiene alguna frase completa a omitir
        debe_omitir = False
        for frase_omitir in frases_omitir:
            # Verificar si la frase completa está contenida en el destino
            if frase_omitir in dest_lower:
                debe_omitir = True
                break
        
        if debe_omitir:
            continue
        
        # Normalizar "monte" a "Montería"
        if dest_limpio and ('monte' in dest_limpio.lower() or 'montería' in dest_limpio.lower() or 'monteria' in dest_limpio.lower()):
            # Si contiene "monte" o "montería", establecer como "Montería"
            destino_procesado.append('Montería')
            print(f"  [OK] Normalizado '{dest_limpio}' a 'Monteria'")
        elif dest_limpio:
            destino_procesado.append(dest_limpio)
    
    # Si no se encontró destino con la expresión regular, buscar "monte" o "montería" en el texto completo
    if not destino_procesado:
        # Buscar patrones como "Exp. ... Monte" o "Exp. ... Montería" sin paréntesis
        patron_monte = r'(?i)(?:P?\s*[E-e]xp\.\s*.*?)?(?:Virtual\s+)?(Monte|Montería|Monteria)(?:\s|$|Dirección|\(|\.)'
        matches_monte = re.findall(patron_monte, texto_extraido)
        if matches_monte:
            destino_procesado.append('Montería')
            logger.info(f"Destino 'Monte/Montería' encontrado mediante búsqueda alternativa: {matches_monte}")
    
    # Reemplazar la lista original con la procesada
    destino = destino_procesado
    
    # Buscar valores monetarios y fechas
    valor_total_match = re.search(palabraclave_valor_total, texto_extraido)
    anticipo_match = re.search(palabraclave_anticipo, texto_extraido)
    saldo_match = re.search(palabraclave_saldo, texto_extraido)
    fecha_liquidacion_match = re.search(palabraclave_fecha_liquidacion, texto_extraido)
    fecha_pago_match = re.search(palabraclave_fecha_pago, texto_extraido)
    
    # Extraer y limpiar valores monetarios
    valor_total = 'No encontrado'
    if valor_total_match:
        valor_str = valor_total_match.group(1).replace('.', '').replace(',', '.')
        try:
            valor_total = float(valor_str)
        except:
            valor_total = valor_total_match.group(1)
    
    anticipo = 'No encontrado'
    if anticipo_match:
        anticipo_str = anticipo_match.group(1).replace('.', '').replace(',', '.')
        try:
            anticipo = float(anticipo_str)
        except:
            anticipo = anticipo_match.group(1)
    
    saldo = 'No encontrado'
    if saldo_match:
        saldo_str = saldo_match.group(1).replace('.', '').replace(',', '.')
        try:
            saldo = float(saldo_str)
        except:
            saldo = saldo_match.group(1)
    
    fecha_liquidacion = 'No encontrada'
    if fecha_liquidacion_match:
        fecha_liquidacion = fecha_liquidacion_match.group(1).strip()
        if fecha_liquidacion.upper() in ['SIN LIQUIDAR', 'SIN LIQUIDACIÓN', 'N/A', '']:
            fecha_liquidacion = 'Sin liquidar'
    
    fecha_pago = 'No encontrada'
    if fecha_pago_match:
        fecha_pago = fecha_pago_match.group(1).strip()
        if fecha_pago.upper() in ['SIN PAGAR', 'N/A', '']:
            fecha_pago = 'Sin pagar'
    
    # Normalizar conductor: solo palabras (letras, espacios y acentos)
    conductor_normalizado = []
    for cond in conductor:
        if cond:
            # Mantener solo letras, espacios y caracteres con acentos
            cond_limpio = re.sub(r'[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]', '', cond)
            # Limpiar espacios múltiples
            cond_limpio = ' '.join(cond_limpio.split())
            # Capitalizar apropiadamente (primera letra de cada palabra en mayúscula)
            if cond_limpio:
                cond_limpio = cond_limpio.title()
                conductor_normalizado.append(cond_limpio)
    
    conductor = conductor_normalizado if conductor_normalizado else conductor
    
    # Normalizar conductor: solo palabras (letras, espacios y acentos)
    conductor_normalizado = []
    for cond in conductor:
        if cond:
            # Mantener solo letras, espacios y caracteres con acentos
            cond_limpio = re.sub(r'[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]', '', cond)
            # Limpiar espacios múltiples
            cond_limpio = ' '.join(cond_limpio.split())
            # Capitalizar apropiadamente (primera letra de cada palabra en mayúscula)
            if cond_limpio:
                cond_limpio = cond_limpio.title()
                conductor_normalizado.append(cond_limpio)
    
    conductor = conductor_normalizado if conductor_normalizado else conductor
    
    # Filtrar placas válidas (excluir palabras como "FECHA", "No", etc.)
    placa = []
    palabras_invalidas = ['FECHA', 'No', 'encontrado', 'encontrada', 'vacio', 'N/A', 'NA']
    for p in placa_raw:
        if p and p.upper() not in palabras_invalidas and len(p) >= 3:
            placa.append(p)

    # Corregir nombre de conductor usando catálogo persistente (para tolerar errores OCR)
    if conductor and conductor[0] and conductor[0] != 'No encontrado':
        conductor[0] = corregir_conductor_con_catalogo(conductor[0])
    
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
        'estado': factura_data['estado'],
        # Agregar valores monetarios y fechas
        'valor_total': valor_total,
        'anticipo': anticipo,
        'saldo': saldo,
        'fecha_liquidacion': fecha_liquidacion,
        'fecha_pago': fecha_pago
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
    # Usar la misma expresión mejorada que en extraer_datos_manifiesto
    BUSCADEDESTINO = r'P?\s*[E-e]xp\.\s*(.*?)(?:\s*\(|\s*Dirección|\s*$|\n)'
    palabraclave3 = r'LOAD\s+ID\s*#\s*(\d+)'
    
     
    KOF = re.findall(BUSCARKOF, texto_extraido)
    destino_raw = re.findall(BUSCADEDESTINO, texto_extraido)
    referencia = re.findall(palabraclave3, texto_extraido)
    
    # Procesar y normalizar destinos (misma lógica que en extraer_datos_manifiesto)
    # Lista de frases completas a omitir (no son destinos válidos)
    frases_omitir = [
        'bod ext 2 aeropto',
        'bodega ext',
        'aeropuerto',
        'virtual',
        'dirección',
        'direccion',
        'dir',
        'cfat c180',
        'cargo',
        'carga'
    ]
    
    destino = []
    for dest in destino_raw:
        dest_limpio = dest.strip()
        dest_lower = dest_limpio.lower()
        
        # Omitir si coincide exactamente o contiene alguna frase completa a omitir
        debe_omitir = False
        for frase_omitir in frases_omitir:
            # Verificar si la frase completa está contenida en el destino
            if frase_omitir in dest_lower:
                debe_omitir = True
                break
        
        if debe_omitir:
            continue
        
        # Normalizar "monte" a "Montería"
        if dest_limpio and ('monte' in dest_limpio.lower() or 'montería' in dest_limpio.lower() or 'monteria' in dest_limpio.lower()):
            destino.append('Montería')
        elif dest_limpio:
            destino.append(dest_limpio)
    
    # Si no se encontró destino, buscar "monte" o "montería" en el texto completo
    if not destino:
        patron_monte = r'(?i)(?:P?\s*[E-e]xp\.\s*.*?)?(?:Virtual\s+)?(Monte|Montería|Monteria)(?:\s|$|Dirección|\(|\.)'
        matches_monte = re.findall(patron_monte, texto_extraido)
        if matches_monte:
            destino.append('Montería')
    
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
 
    datos_limpios = {}

    def reemplazar_barranquilla_profesional(texto: str) -> str:
        """Reemplaza variaciones de 'Barranquilla' en un texto usando coincidencia difusa.

        - Detecta errores comunes, puntos intermedios (ej. "B.Arranquilla") y typos.
        - Umbral de similitud 0.8 sobre tokens alfanuméricos.
        """
        if not isinstance(texto, str) or not texto:
            return texto

        objetivo = 'barranquilla'

        def limpiar_token(token: str) -> str:
            # Mantener solo letras para comparar, en minúsculas
            return re.sub(r"[^a-z]", "", token.lower())

        # Analizar por tokens separados por espacios
        tokens = re.findall(r"\S+", texto)
        for token in tokens:
            base = limpiar_token(token)
            if not base:
                continue
            # Reglas rápidas por prefijo para rendimiento
            if base.startswith("barranq") or base.startswith("barranquil"):
                texto = texto.replace(token, "Barranquilla")
                continue
            # Coincidencia difusa
            similitud = SequenceMatcher(None, base, objetivo).ratio()
            if similitud >= 0.8:
                texto = texto.replace(token, "Barranquilla")
        return texto

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
                
                # Normalizar fechas en campos conocidos
                if campo in ['fecha inicio', 'fecha retorno', 'fecha Generacion', 'fecha Vencimiento', 'fecha pago']:
                    valor_limpio = normalizar_fecha(valor_limpio)
                elif campo == 'destino':
                    valor_limpio = normalizar_destino(valor_limpio)
                elif campo == 'conductor':
                    # Normalizar conductor: solo palabras (letras, espacios y acentos)
                    valor_limpio = re.sub(r'[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]', '', valor_limpio)
                    valor_limpio = ' '.join(valor_limpio.split())
                    if valor_limpio:
                        valor_limpio = valor_limpio.title()
                        valor_limpio = corregir_conductor_con_catalogo(valor_limpio)
                else:
                    # Normalización profesional de variaciones de "Barranquilla" fuera de 'destino'
                    valor_limpio = reemplazar_barranquilla_profesional(valor_limpio)
                datos_limpios[campo] = valor_limpio
                
               
            else:
                # Para valores no-string (como números), mantenerlos tal como están
                datos_limpios[campo] = valor
              
        else:
            datos_limpios[campo] = valor
           
    

    return datos_limpios


def normalizar_destino(destino: str) -> str:
    """
    Normaliza nombres de destinos para evitar duplicados por variaciones de escritura.
    
    Args:
        destino (str): Nombre del destino a normalizar
    
    Returns:
        str: Destino normalizado
    """
    if not destino or destino.lower() in ['no encontrado', 'n/a', 'na', 'vacio']:
        return destino
    
    destino_limpio = destino.strip()
    
    # Normalización especial: si contiene "monte" o "montería", convertir a "Montería"
    destino_lower = destino_limpio.lower()
    if 'monte' in destino_lower or 'montería' in destino_lower or 'monteria' in destino_lower:
        return 'Montería'
    
    destino_limpio = destino_limpio.upper()

    def quitar_acentos(texto: str) -> str:
        # Normaliza a NFD y elimina marcas diacríticas
        return ''.join(
            c for c in unicodedata.normalize('NFD', texto)
            if unicodedata.category(c) != 'Mn'
        )

    def simplificar(texto: str) -> str:
        # Sin acentos y solo letras, minúsculas
        sin_acentos = quitar_acentos(texto)
        return re.sub(r"[^a-z]", "", sin_acentos.lower())
    
    # Diccionario de normalizaciones comunes
    normalizaciones = {
        # Barranquilla
        'B.ARRANQUILLA': 'BARRANQUILLA',
        'BARRANQUILIA': 'BARRANQUILLA',
        'BARRANQUILLA': 'BARRANQUILLA',
        'BARANQUILLA': 'BARRANQUILLA',
        'BARRANQUILA': 'BARRANQUILLA',
        'BARRANQUEA': 'BARRANQUILLA',
        
        # Cartagena
        'CARTAGENA': 'CARTAGENA',
        'CARTAGENA DE INDIAS': 'CARTAGENA',
        
        # Santa Marta
        'SANTA MARTA': 'SANTA MARTA',
        'SANTAMARTA': 'SANTA MARTA',
        'SANTA MARTA D.T.': 'SANTA MARTA',
        
        # Bogotá
        'BOGOTA': 'BOGOTÁ',
        'BOGOTÁ': 'BOGOTÁ',
        'BOGOTA D.C.': 'BOGOTÁ',
        'BOGOTÁ D.C.': 'BOGOTÁ',
        
        # Medellín
        'MEDELLIN': 'MEDELLÍN',
        'MEDELLÍN': 'MEDELLÍN',
        'MEDELLIN D.T.': 'MEDELLÍN',
        'MEDELLÍN D.T.': 'MEDELLÍN',
        
        # Cali
        'CALI': 'CALI',
        'SANTIAGO DE CALI': 'CALI',
        
        # Bucaramanga
        'BUCARAMANGA': 'BUCARAMANGA',
        'BUCARAMANGA D.T.': 'BUCARAMANGA',
        
        # Pereira
        'PEREIRA': 'PEREIRA',
        'PEREIRA D.T.': 'PEREIRA',
        
        # Manizales
        'MANIZALES': 'MANIZALES',
        'MANIZALES D.T.': 'MANIZALES',
        
        # Armenia
        'ARMENIA': 'ARMENIA',
        'ARMENIA D.T.': 'ARMENIA',
        
        # Villavicencio
        'VILLAVICENCIO': 'VILLAVICENCIO',
        'VILLAVICENCIO D.T.': 'VILLAVICENCIO',
        
        # Montería
        'MONTE': 'MONTERÍA',
        'MONTERIA': 'MONTERÍA',
        'MONTERÍA': 'MONTERÍA',
        'MONTERIA D.T.': 'MONTERÍA',
        'MONTERÍA D.T.': 'MONTERÍA',
        'VIRTUAL MONTE': 'MONTERÍA',
        'VIRTUAL MONTERIA': 'MONTERÍA',
        'VIRTUAL MONTERÍA': 'MONTERÍA',
        
        # Valledupar
        'VALLEDUPAR': 'VALLEDUPAR',
        'VALLEDUPAR D.T.': 'VALLEDUPAR',
        
        # Sincelejo
        'SINCELEJO': 'SINCELEJO',
        'SINCELEJO D.T.': 'SINCELEJO',
        
        # Riohacha
        'RIOHACHA': 'RIOHACHA',
        'RIOHACHA D.T.': 'RIOHACHA',
        
        # Quibdó
        'QUIBDO': 'QUIBDÓ',
        'QUIBDÓ': 'QUIBDÓ',
        'QUIBDO D.T.': 'QUIBDÓ',
        'QUIBDÓ D.T.': 'QUIBDÓ',
        
        # Florencia
        'FLORENCIA': 'FLORENCIA',
        'FLORENCIA D.T.': 'FLORENCIA',
        
        # Popayán
        'POPAYAN': 'POPAYÁN',
        'POPAYÁN': 'POPAYÁN',
        'POPAYAN D.T.': 'POPAYÁN',
        'POPAYÁN D.T.': 'POPAYÁN',
        
        # Pasto
        'PASTO': 'PASTO',
        'SAN JUAN DE PASTO': 'PASTO',
        
        # Tunja
        'TUNJA': 'TUNJA',
        'TUNJA D.T.': 'TUNJA',
        
        # Ibagué
        'IBAGUE': 'IBAGUÉ',
        'IBAGUÉ': 'IBAGUÉ',
        'IBAGUE D.T.': 'IBAGUÉ',
        'IBAGUÉ D.T.': 'IBAGUÉ',
        
        # Neiva
        'NEIVA': 'NEIVA',
        'NEIVA D.T.': 'NEIVA',
        
        # Yopal
        'YOPAL': 'YOPAL',
        'YOPAL D.T.': 'YOPAL',
        
        # Arauca
        'ARAUCA': 'ARAUCA',
        'ARAUCA D.T.': 'ARAUCA',
        
        # Mocoa
        'MOCOA': 'MOCOA',
        'MOCOA D.T.': 'MOCOA',
        
        # Leticia
        'LETICIA': 'LETICIA',
        'LETICIA D.T.': 'LETICIA',
        
        # San José del Guaviare
        'SAN JOSE DEL GUAVIARE': 'SAN JOSÉ DEL GUAVIARE',
        'SAN JOSÉ DEL GUAVIARE': 'SAN JOSÉ DEL GUAVIARE',
        'SAN JOSE DEL GUAVIARE D.T.': 'SAN JOSÉ DEL GUAVIARE',
        'SAN JOSÉ DEL GUAVIARE D.T.': 'SAN JOSÉ DEL GUAVIARE',
        
        # Puerto Carreño
        'PUERTO CARRENO': 'PUERTO CARREÑO',
        'PUERTO CARREÑO': 'PUERTO CARREÑO',
        'PUERTO CARRENO D.T.': 'PUERTO CARREÑO',
        'PUERTO CARREÑO D.T.': 'PUERTO CARREÑO',
        
        # Inírida
        'INIRIDA': 'INÍRIDA',
        'INÍRIDA': 'INÍRIDA',
        'INIRIDA D.T.': 'INÍRIDA',
        'INÍRIDA D.T.': 'INÍRIDA',
        
        # Mitú
        'MITU': 'MITÚ',
        'MITÚ': 'MITÚ',
        'MITU D.T.': 'MITÚ',
        'MITÚ D.T.': 'MITÚ',
        
        # Puerto Inírida
        'PUERTO INIRIDA': 'PUERTO INÍRIDA',
        'PUERTO INÍRIDA': 'PUERTO INÍRIDA',
        'PUERTO INIRIDA D.T.': 'PUERTO INÍRIDA',
        'PUERTO INÍRIDA D.T.': 'PUERTO INÍRIDA',
        
        # San Andrés
        'SAN ANDRES': 'SAN ANDRÉS',
        'SAN ANDRÉS': 'SAN ANDRÉS',
        'SAN ANDRES D.T.': 'SAN ANDRÉS',
        'SAN ANDRÉS D.T.': 'SAN ANDRÉS',
        
        # Providencia
        'PROVIDENCIA': 'PROVIDENCIA',
        'PROVIDENCIA D.T.': 'PROVIDENCIA',
    }
    
    # Buscar normalización exacta
    if destino_limpio in normalizaciones:
        return normalizaciones[destino_limpio]
    
    # Buscar normalización parcial (para casos con espacios extra o caracteres adicionales)
    for variacion, normalizado in normalizaciones.items():
        if variacion in destino_limpio or destino_limpio in variacion:
            return normalizado

    # Coincidencia difusa como respaldo
    base = simplificar(destino_limpio)
    if base:
        # Construir catálogo canónico único
        canonicos = sorted(set(normalizaciones.values()))
        mejor = None
        mejor_score = 0.0
        for canon in canonicos:
            score = SequenceMatcher(None, base, simplificar(canon)).ratio()
            if score > mejor_score:
                mejor_score = score
                mejor = canon
        # Umbral conservador para evitar falsos positivos
        if mejor and mejor_score >= 0.8:
            return mejor

    # Si no se encuentra normalización, devolver el destino original en mayúsculas
    return destino_limpio
