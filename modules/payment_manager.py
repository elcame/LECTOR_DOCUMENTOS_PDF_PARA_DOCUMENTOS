"""
Módulo para gestión de pagos a conductores
"""
import os
import pandas as pd
from datetime import datetime
from modules.excel_generator import obtener_ultimo_excel

# Tarifas por destino (se cargarán dinámicamente desde archivo)
TARIFAS_DESTINO_DEFAULT = {
    'BARRANQUILLA': 75000,
    'CARTAGENA': 180000,
    'BOGOTA': 200000,
    'MEDELLIN': 150000,
}

def guardar_tarifas_destino(tarifas_data, carpeta_original=""):
    """
    Guardar tarifas personalizadas por destino
    
    Args:
        tarifas_data (dict): Diccionario con destino: tarifa
        carpeta_original (str): Nombre de la carpeta original
        
    Returns:
        bool: True si se guardó correctamente
    """
    try:
        import json
        
        # Crear carpeta de datos si no existe
        data_folder = 'data'
        if not os.path.exists(data_folder):
            os.makedirs(data_folder)
        
        # Archivo para tarifas por destino
        tarifas_file = os.path.join(data_folder, f'tarifas_destino_{carpeta_original}.json')
        
        # Guardar datos
        with open(tarifas_file, 'w', encoding='utf-8') as f:
            json.dump(tarifas_data, f, ensure_ascii=False, indent=2)
        
        print(f"Tarifas por destino guardadas en: {tarifas_file}")
        return True
        
    except Exception as e:
        print(f"[ERROR] Error al guardar tarifas por destino: {e}")
        return False

def cargar_tarifas_destino(carpeta_original=""):
    """
    Cargar tarifas por destino guardadas
    
    Args:
        carpeta_original (str): Nombre de la carpeta original
        
    Returns:
        dict: Tarifas por destino cargadas
    """
    try:
        import json
        
        data_folder = 'data'
        tarifas_file = os.path.join(data_folder, f'tarifas_destino_{carpeta_original}.json')
        
        if os.path.exists(tarifas_file):
            with open(tarifas_file, 'r', encoding='utf-8') as f:
                tarifas = json.load(f)
            print(f"Tarifas por destino cargadas desde: {tarifas_file}")
            return tarifas
        else:
            print("No se encontraron tarifas por destino guardadas, usando valores por defecto")
            return TARIFAS_DESTINO_DEFAULT.copy()
            
    except Exception as e:
        print(f"[ERROR] Error al cargar tarifas por destino: {e}")
        return TARIFAS_DESTINO_DEFAULT.copy()

def obtener_destinos_unicos(carpeta_original=""):
    """
    Obtener lista de destinos únicos de los manifiestos
    
    Args:
        carpeta_original (str): Nombre de la carpeta original
        
    Returns:
        list: Lista de destinos únicos
    """
    try:
        # Obtener datos de manifiestos
        latest_file = obtener_ultimo_excel(carpeta_original)
        if not latest_file or not os.path.exists(latest_file):
            return []
        
        df = pd.read_excel(latest_file)
        manifiestos = df.to_dict('records')
        
        if not manifiestos:
            return []
        
        # Extraer destinos únicos
        destinos = set()
        for manifiesto in manifiestos:
            destino = manifiesto.get('destino', '').strip()
            if destino and destino.upper() not in ['', 'N/A', 'NO ENCONTRADO']:
                destinos.add(destino.upper())
        
        return sorted(list(destinos))
        
    except Exception as e:
        print(f"[ERROR] Error al obtener destinos únicos: {e}")
        return []

# Configuración de gastos adicionales (pueden ser modificados según necesidades)
GASTOS_ADICIONALES_DEFAULT = {
    'parqueaderos': 0,  # Se ingresará manualmente
    'repuestos': 0,     # Se ingresará manualmente
    'mano_obra': 0,      # Se ingresará manualmente
}

def guardar_gastos_adicionales(gastos_data, carpeta_original=""):
    """
    Guardar gastos adicionales ingresados manualmente
    
    Args:
        gastos_data (dict): Datos de gastos adicionales
        carpeta_original (str): Nombre de la carpeta original
        
    Returns:
        bool: True si se guardó correctamente
    """
    try:
        import json
        
        # Crear carpeta de datos si no existe
        data_folder = 'data'
        if not os.path.exists(data_folder):
            os.makedirs(data_folder)
        
        # Archivo para gastos adicionales
        gastos_file = os.path.join(data_folder, f'gastos_adicionales_{carpeta_original}.json')
        
        # Guardar datos
        with open(gastos_file, 'w', encoding='utf-8') as f:
            json.dump(gastos_data, f, ensure_ascii=False, indent=2)
        
        print(f"Gastos adicionales guardados en: {gastos_file}")
        return True
        
    except Exception as e:
        print(f"[ERROR] Error al guardar gastos adicionales: {e}")
        return False

def cargar_gastos_adicionales(carpeta_original=""):
    """
    Cargar gastos adicionales guardados
    
    Args:
        carpeta_original (str): Nombre de la carpeta original
        
    Returns:
        dict: Gastos adicionales cargados
    """
    try:
        import json
        
        data_folder = 'data'
        gastos_file = os.path.join(data_folder, f'gastos_adicionales_{carpeta_original}.json')
        
        if os.path.exists(gastos_file):
            with open(gastos_file, 'r', encoding='utf-8') as f:
                gastos = json.load(f)
            print(f"Gastos adicionales cargados desde: {gastos_file}")
            # Retornar lista o dict según el formato cargado
            return gastos
        else:
            print("No se encontraron gastos adicionales guardados")
            # Retornar lista vacía para el nuevo formato
            return []
            
    except Exception as e:
        print(f"[ERROR] Error al cargar gastos adicionales: {e}")
        return []

def calcular_tarifa_conductor(destino, carpeta_original=""):
    """
    Calcular la tarifa que se debe pagar al conductor según el destino
    
    Args:
        destino (str): Ciudad de destino
        carpeta_original (str): Nombre de la carpeta original
        
    Returns:
        int: Tarifa a pagar al conductor
    """
    destino_upper = destino.upper().strip()
    
    # Cargar tarifas personalizadas
    tarifas = cargar_tarifas_destino(carpeta_original)
    
    # Buscar coincidencia exacta primero
    if destino_upper in tarifas:
        return tarifas[destino_upper]
    
    # Buscar coincidencias parciales
    for ciudad, tarifa in tarifas.items():
        if ciudad in destino_upper or destino_upper in ciudad:
            return tarifa
    
    # Tarifa por defecto si no se encuentra coincidencia
    return 100000

def crear_excel_pagos_conductores(carpeta_original=""):
    """
    Crear Excel de pagos a conductores basado en los manifiestos existentes
    
    Args:
        carpeta_original (str): Nombre de la carpeta original
        
    Returns:
        str: Ruta del archivo Excel creado, o None si hay error
    """
    try:
        # Obtener datos de manifiestos
        latest_file = obtener_ultimo_excel(carpeta_original)
        if not latest_file or not os.path.exists(latest_file):
            print("No se encontró archivo de manifiestos")
            return None
        
        df = pd.read_excel(latest_file)
        print(f"[DEBUG] Columnas disponibles en el Excel: {list(df.columns)}")
        print(f"[DEBUG] Primer registro de manifiesto: {df.iloc[0].to_dict() if len(df) > 0 else 'NO HAY DATOS'}")
        
        manifiestos = df.to_dict('records')
        if not manifiestos:
            print("No hay datos de manifiestos para procesar")
            return None
        
        # Procesar pagos
        pagos_data = []
        for manifiesto in manifiestos:
            # Limpiar valores NaN antes de obtenerlos
            def limpiar_valor(valor):
                if pd.isna(valor) or valor is None:
                    return ''
                return str(valor)
            
            destino = limpiar_valor(manifiesto.get('destino', ''))
            conductor = limpiar_valor(manifiesto.get('conductor', ''))
            
            # Intentar diferentes nombres de columna para fecha y load_id (las columnas en Excel son FECHA VIAJE e ID)
            fecha_viaje = limpiar_valor(
                manifiesto.get('FECHA VIAJE', '') or 
                manifiesto.get('fecha inicio', '') or 
                manifiesto.get('fecha_inicio', '')
            )
            load_id = limpiar_valor(
                manifiesto.get('ID', '') or 
                manifiesto.get('load_id', '') or
                manifiesto.get('loadid', '')
            )
            placa = limpiar_valor(manifiesto.get('placa', ''))
            archivo = limpiar_valor(manifiesto.get('ARCHIVO PDF', '') or manifiesto.get('archivo', ''))
            
            # Limpiar valores de conductor (NaN, None, vacío)
            if conductor == '' or conductor.strip() == '':
                conductor = 'Sin Conductor'
            
            # Solo procesar si hay destino y load_id válido
            if destino and load_id and load_id != '0.0' and load_id != '0':
                tarifa = calcular_tarifa_conductor(destino, carpeta_original)
                
                pago = {
                    'load_id': load_id,
                    'fecha_viaje': fecha_viaje,
                    'conductor': conductor,
                    'placa': placa,
                    'destino': destino,
                    'tarifa_conductor': tarifa,
                    'estado_pago': 'PENDIENTE',  # Estado de pago al conductor
                    'fecha_pago': '',  # Fecha de pago al conductor
                    'manifiesto_pagado': 'PENDIENTE',  # Estado de pago del manifiesto (cliente)
                    'fecha_manifiesto_pagado': '',  # Fecha de pago del manifiesto
                    'observaciones': '',
                    'archivo_origen': archivo
                }
                pagos_data.append(pago)
                print(f"[DEBUG] Pago agregado: Load ID={load_id}, Conductor={conductor}, Destino={destino}")
        
        if not pagos_data:
            print("No se generaron datos de pagos")
            return None
        
        # Crear DataFrame
        df = pd.DataFrame(pagos_data)
        
        # Crear carpeta 'EXCEL' si no existe
        carpeta_reportes = 'EXCEL'
        if not os.path.exists(carpeta_reportes):
            os.makedirs(carpeta_reportes)
        
        # Definir nombre del archivo Excel
        if carpeta_original:
            nombre_excel = f'pagos_conductores_{carpeta_original}.xlsx'
        else:
            nombre_excel = 'pagos_conductores_actual.xlsx'
        
        ruta_excel = os.path.join(carpeta_reportes, nombre_excel)
        
        # Eliminar archivo anterior si existe
        if os.path.exists(ruta_excel):
            os.remove(ruta_excel)
            print(f"Archivo Excel de pagos anterior eliminado: {nombre_excel}")
        
        # Guardar DataFrame a Excel
        df.to_excel(ruta_excel, index=False)
        print(f"[OK] Excel de pagos creado: {ruta_excel}")
        
        return ruta_excel
        
    except Exception as e:
        print(f"[ERROR] Error al crear Excel de pagos: {e}")
        return None

def leer_pagos_conductores(carpeta_original=""):
    """
    Leer datos de pagos a conductores
    
    Args:
        carpeta_original (str): Nombre de la carpeta original
        
    Returns:
        list: Lista de diccionarios con datos de pagos
    """
    try:
        carpeta_reportes = 'EXCEL'
        if carpeta_original:
            nombre_excel = f'pagos_conductores_{carpeta_original}.xlsx'
        else:
            nombre_excel = 'pagos_conductores_actual.xlsx'
        
        ruta_excel = os.path.join(carpeta_reportes, nombre_excel)
        
        if not os.path.exists(ruta_excel):
            print(f"No se encontró archivo de pagos: {nombre_excel}")
            return []
        
        # Leer Excel
        df = pd.read_excel(ruta_excel)
        
        # Asegurar que existan las columnas nuevas (compatibilidad con archivos antiguos)
        if 'manifiesto_pagado' not in df.columns:
            df['manifiesto_pagado'] = 'PENDIENTE'
        if 'fecha_manifiesto_pagado' not in df.columns:
            df['fecha_manifiesto_pagado'] = ''
        
        # Limpiar valores NaN antes de convertir a diccionario
        # Mantener valores numéricos como números, solo limpiar NaN
        for col in df.columns:
            if df[col].dtype == 'object':
                df[col] = df[col].fillna('')
            else:
                df[col] = df[col].fillna(0)
        
        # Convertir a diccionario
        pagos = df.to_dict('records')
        
        # Limpiar manualmente cualquier NaN restante y asegurar valores por defecto
        for pago in pagos:
            for key, value in pago.items():
                if pd.isna(value):
                    pago[key] = '' if isinstance(value, str) else 0
            
            # Asegurar valores por defecto para campos nuevos si no existen
            if 'manifiesto_pagado' not in pago or not pago.get('manifiesto_pagado'):
                pago['manifiesto_pagado'] = 'PENDIENTE'
            if 'fecha_manifiesto_pagado' not in pago:
                pago['fecha_manifiesto_pagado'] = ''
        
        return pagos
        
    except Exception as e:
        print(f"[ERROR] Error al leer pagos: {e}")
        return []

def actualizar_estado_pago(load_id, estado_pago, fecha_pago=None, observaciones="", carpeta_original=""):
    """
    Actualizar el estado de pago de un conductor
    
    Args:
        load_id (str): ID del viaje
        estado_pago (str): Nuevo estado ('PAGADO' o 'PENDIENTE')
        fecha_pago (str): Fecha de pago (opcional)
        observaciones (str): Observaciones adicionales
        carpeta_original (str): Nombre de la carpeta original
        
    Returns:
        bool: True si se actualizó correctamente
    """
    try:
        carpeta_reportes = 'EXCEL'
        if carpeta_original:
            nombre_excel = f'pagos_conductores_{carpeta_original}.xlsx'
        else:
            # Buscar archivo de pagos más reciente
            if os.path.exists(carpeta_reportes):
                archivos_pagos = [f for f in os.listdir(carpeta_reportes) if f.startswith('pagos_conductores_') and f.endswith('.xlsx')]
                if not archivos_pagos:
                    print("[ERROR] No se encontraron archivos de pagos")
                    return False
                archivos_pagos.sort(key=lambda x: os.path.getmtime(os.path.join(carpeta_reportes, x)), reverse=True)
                nombre_excel = archivos_pagos[0]
            else:
                print("[ERROR] Carpeta EXCEL no existe")
                return False
        
        ruta_excel = os.path.join(carpeta_reportes, nombre_excel)
        
        if not os.path.exists(ruta_excel):
            print(f"[ERROR] Archivo de pagos no encontrado: {nombre_excel}")
            return False
        
        # Leer datos
        df = pd.read_excel(ruta_excel)
        
        # Actualizar registro
        mask = df['load_id'] == load_id
        if mask.any():
            df.loc[mask, 'estado_pago'] = estado_pago
            if fecha_pago:
                df.loc[mask, 'fecha_pago'] = str(fecha_pago)
            if observaciones:
                df.loc[mask, 'observaciones'] = str(observaciones)
            
            # Guardar cambios
            df.to_excel(ruta_excel, index=False)
            print(f"[OK] Estado de pago actualizado para Load ID: {load_id}")
            return True
        else:
            print(f"[ERROR] No se encontró Load ID: {load_id}")
            return False
            
    except Exception as e:
        print(f"[ERROR] Error al actualizar estado de pago: {e}")
        return False

def actualizar_multiple_pagos(load_ids, estado_pago, fecha_pago, carpeta_original="", tipo_pago="conductor"):
    """
    Actualizar el estado de pago de múltiples viajes
    
    Args:
        load_ids (list): Lista de IDs de viajes
        estado_pago (str): Nuevo estado ('PAGADO' o 'PENDIENTE')
        fecha_pago (str): Fecha de pago
        carpeta_original (str): Nombre de la carpeta original
        tipo_pago (str): Tipo de pago a actualizar - 'conductor' (pago al conductor) o 'manifiesto' (pago del manifiesto)
        
    Returns:
        bool: True si se actualizaron correctamente
    """
    try:
        print(f"[DEBUG] actualizar_multiple_pagos llamado con:")
        print(f"  - load_ids: {load_ids}")
        print(f"  - estado_pago: {estado_pago}")
        print(f"  - fecha_pago: {fecha_pago}")
        print(f"  - carpeta_original: {carpeta_original}")
        
        carpeta_reportes = 'EXCEL'
        if carpeta_original:
            nombre_excel = f'pagos_conductores_{carpeta_original}.xlsx'
        else:
            if os.path.exists(carpeta_reportes):
                archivos_pagos = [f for f in os.listdir(carpeta_reportes) if f.startswith('pagos_conductores_') and f.endswith('.xlsx')]
                if not archivos_pagos:
                    print("[ERROR] No se encontraron archivos de pagos")
                    return False
                archivos_pagos.sort(key=lambda x: os.path.getmtime(os.path.join(carpeta_reportes, x)), reverse=True)
                nombre_excel = archivos_pagos[0]
            else:
                print("[ERROR] Carpeta EXCEL no existe")
                return False
        
        ruta_excel = os.path.join(carpeta_reportes, nombre_excel)
        print(f"[DEBUG] Ruta del archivo Excel: {ruta_excel}")
        
        if not os.path.exists(ruta_excel):
            print(f"[ERROR] Archivo de pagos no encontrado: {nombre_excel}")
            return False
        
        # Leer datos
        df = pd.read_excel(ruta_excel)
        print(f"[DEBUG] Excel leído. Total de registros: {len(df)}")
        print(f"[DEBUG] Columnas disponibles: {list(df.columns)}")
        
        # Normalizar load_ids a string para comparación
        load_ids_normalizados = [str(load_id).strip() for load_id in load_ids]
        print(f"[DEBUG] Load IDs normalizados: {load_ids_normalizados}")
        
        # Convertir load_id del DataFrame a string para comparación segura
        df['load_id'] = df['load_id'].astype(str).str.strip()
        
        # Contador de actualizaciones
        actualizados = 0
        no_encontrados = []
        
        # Asegurar que las columnas existan (para compatibilidad con archivos antiguos)
        if 'manifiesto_pagado' not in df.columns:
            df['manifiesto_pagado'] = 'PENDIENTE'
        if 'fecha_manifiesto_pagado' not in df.columns:
            df['fecha_manifiesto_pagado'] = ''
        
        # Actualizar múltiples registros
        for load_id in load_ids_normalizados:
            # Buscar coincidencia exacta
            mask = df['load_id'] == load_id
            
            if mask.any():
                # Actualizar el registro según el tipo de pago
                if tipo_pago == 'manifiesto':
                    # Actualizar estado del manifiesto (pago del cliente)
                    df.loc[mask, 'manifiesto_pagado'] = estado_pago
                    if fecha_pago:
                        df.loc[mask, 'fecha_manifiesto_pagado'] = str(fecha_pago)
                    print(f"[OK] Estado de manifiesto actualizado para Load ID: {load_id} (encontrado {mask.sum()} registro(s))")
                else:
                    # Actualizar estado de pago al conductor (por defecto)
                    df.loc[mask, 'estado_pago'] = estado_pago
                    if fecha_pago:
                        df.loc[mask, 'fecha_pago'] = str(fecha_pago)
                    print(f"[OK] Estado de pago al conductor actualizado para Load ID: {load_id} (encontrado {mask.sum()} registro(s))")
                actualizados += mask.sum()
            else:
                no_encontrados.append(load_id)
                print(f"[WARNING] Load ID no encontrado en Excel: {load_id}")
        
        if actualizados == 0:
            print(f"[ERROR] No se encontró ningún registro para actualizar. Load IDs buscados: {load_ids_normalizados}")
            print(f"[DEBUG] Load IDs disponibles en Excel (primeros 10): {df['load_id'].head(10).tolist()}")
            return False
        
        if no_encontrados:
            print(f"[WARNING] Los siguientes Load IDs no se encontraron: {no_encontrados}")
        
        # Guardar cambios
        df.to_excel(ruta_excel, index=False)
        print(f"[OK] Archivo guardado. Se actualizaron {actualizados} registro(s) de {len(load_ids)} solicitados")
        return True
        
    except Exception as e:
        print(f"[ERROR] Error al actualizar múltiples pagos: {e}")
        import traceback
        traceback.print_exc()
        return False

def obtener_pagos_realizados_con_detalles(carpeta_original=""):
    """
    Obtener lista de pagos realizados con detalles para mostrar en el desglose
    
    Args:
        carpeta_original (str): Nombre de la carpeta original
        
    Returns:
        list: Lista de diccionarios con detalles de pagos realizados
    """
    try:
        pagos = leer_pagos_conductores(carpeta_original)
        if not pagos:
            return []
        
        pagos_realizados = []
        for pago in pagos:
            # Limpiar valores NaN
            def limpiar(val):
                if pd.isna(val) or val is None:
                    return ''
                return str(val)
            
            fecha_pago = limpiar(pago.get('fecha_pago', ''))
            estado = limpiar(pago.get('estado_pago', ''))
            
            if estado == 'PAGADO' and fecha_pago and fecha_pago.strip():
                pagos_realizados.append({
                    'fecha_pago': fecha_pago,
                    'conductor': limpiar(pago.get('conductor', '')),
                    'monto': float(pago.get('tarifa_conductor', 0)),
                    'destino': limpiar(pago.get('destino', '')),
                    'load_id': limpiar(pago.get('load_id', ''))
                })
        
        # Ordenar por fecha de pago más reciente
        pagos_realizados.sort(key=lambda x: x['fecha_pago'], reverse=True)
        
        return pagos_realizados
        
    except Exception as e:
        print(f"[ERROR] Error al obtener pagos realizados: {e}")
        return []

def calcular_gastos_totales(carpeta_original=""):
    """
    Calcular gastos totales incluyendo conductores, parqueaderos, repuestos y mano de obra
    
    Args:
        carpeta_original (str): Nombre de la carpeta original
        
    Returns:
        dict: Resumen de gastos totales
    """
    try:
        # Obtener datos de manifiestos para contar viajes
        latest_file = obtener_ultimo_excel(carpeta_original)
        if not latest_file or not os.path.exists(latest_file):
            return {
                'total_gastos': 0,
                'gastos_conductores': 0,
                'gastos_parqueaderos': 0,
                'gastos_repuestos': 0,
                'gastos_mano_obra': 0,
                'total_viajes': 0
            }
        
        df = pd.read_excel(latest_file)
        manifiestos = df.to_dict('records')
        if not manifiestos:
            return {
                'total_gastos': 0,
                'gastos_conductores': 0,
                'gastos_parqueaderos': 0,
                'gastos_repuestos': 0,
                'gastos_mano_obra': 0,
                'total_viajes': 0
            }
        
        total_viajes = len(manifiestos)
        
        # Calcular gastos de conductores
        gastos_conductores = 0
        for manifiesto in manifiestos:
            destino = manifiesto.get('destino', '')
            if destino:
                gastos_conductores += calcular_tarifa_conductor(destino, carpeta_original)
        
        # Cargar gastos adicionales ingresados manualmente
        gastos_adicionales = cargar_gastos_adicionales(carpeta_original)
        
        # Detectar si es el nuevo formato (lista) o el antiguo (dict)
        if isinstance(gastos_adicionales, list):
            # Nuevo formato: lista de objetos
            gastos_parqueaderos = 0
            gastos_repuestos = 0
            gastos_mano_obra = 0
            
            for g in gastos_adicionales:
                valor = g.get('valor', 0)
                # Intentar obtener tipo, si no existe usar descripcion (formato intermedio)
                tipo_categoria = g.get('tipo') or g.get('descripcion', '')
                
                if tipo_categoria == 'Parqueaderos':
                    gastos_parqueaderos += valor
                elif tipo_categoria == 'Repuestos':
                    gastos_repuestos += valor
                elif tipo_categoria == 'Mano de Obra':
                    gastos_mano_obra += valor
        else:
            # Formato antiguo: dict con parqueaderos, repuestos, mano_obra
            gastos_parqueaderos = gastos_adicionales.get('parqueaderos', 0)
            gastos_repuestos = gastos_adicionales.get('repuestos', 0)
            gastos_mano_obra = gastos_adicionales.get('mano_obra', 0)
        
        # Total general
        total_gastos = gastos_conductores + gastos_parqueaderos + gastos_repuestos + gastos_mano_obra
        
        # Obtener lista de pagos realizados
        pagos_realizados = obtener_pagos_realizados_con_detalles(carpeta_original)
        
        return {
            'total_gastos': total_gastos,
            'gastos_conductores': gastos_conductores,
            'gastos_parqueaderos': gastos_parqueaderos,
            'gastos_repuestos': gastos_repuestos,
            'gastos_mano_obra': gastos_mano_obra,
            'total_viajes': total_viajes,
            'pagos_realizados': pagos_realizados
        }
        
    except Exception as e:
        print(f"[ERROR] Error al calcular gastos totales: {e}")
        return {
            'total_gastos': 0,
            'gastos_conductores': 0,
            'gastos_parqueaderos': 0,
            'gastos_repuestos': 0,
            'gastos_mano_obra': 0,
            'total_viajes': 0,
            'pagos_realizados': []
        }

def limpiar_valores_nan(valor):
    """
    Limpiar valores NaN, None o pandas.NA
    
    Args:
        valor: Valor a limpiar
        
    Returns:
        Valor limpio (str, int, o float válido)
    """
    if pd.isna(valor) or valor is None:
        return ''
    elif isinstance(valor, float):
        # Si es NaN, devolver string vacío
        if pd.isna(valor):
            return ''
        return valor
    return valor

def obtener_resumen_pagos(carpeta_original=""):
    """
    Obtener resumen de pagos por conductor
    
    Args:
        carpeta_original (str): Nombre de la carpeta original
        
    Returns:
        dict: Resumen de pagos por conductor
    """
    try:
        pagos = leer_pagos_conductores(carpeta_original)
        if not pagos:
            return {}
        
        resumen = {}
        for pago in pagos:
            conductor = limpiar_valores_nan(pago.get('conductor', ''))
            estado = limpiar_valores_nan(pago.get('estado_pago', ''))
            tarifa = pago.get('tarifa_conductor', 0)
            
            # Limpiar tarifa
            if pd.isna(tarifa) or tarifa is None:
                tarifa = 0
            tarifa = float(tarifa)
            
            if conductor not in resumen:
                resumen[conductor] = {
                    'total_viajes': 0,
                    'viajes_pagados': 0,
                    'viajes_pendientes': 0,
                    'total_pagado': 0,
                    'total_pendiente': 0,
                    'viajes_detalle': []
                }
            
            resumen[conductor]['total_viajes'] += 1
            
            # Agregar detalle del viaje con valores limpios
            fecha_pago = limpiar_valores_nan(pago.get('fecha_pago', ''))
            
            # Convertir a string si es datetime
            if hasattr(fecha_pago, 'strftime'):
                fecha_pago = str(fecha_pago)
            
            # Obtener estado del manifiesto (si existe, sino usar PENDIENTE por defecto)
            manifiesto_pagado = limpiar_valores_nan(pago.get('manifiesto_pagado', 'PENDIENTE'))
            fecha_manifiesto_pagado = limpiar_valores_nan(pago.get('fecha_manifiesto_pagado', ''))
            if hasattr(fecha_manifiesto_pagado, 'strftime'):
                fecha_manifiesto_pagado = str(fecha_manifiesto_pagado)
            
            viaje_detalle = {
                'load_id': str(limpiar_valores_nan(pago.get('load_id', ''))),
                'fecha_viaje': str(limpiar_valores_nan(pago.get('fecha_viaje', ''))),
                'destino': str(limpiar_valores_nan(pago.get('destino', ''))),
                'tarifa': tarifa,
                'estado': str(estado),  # Estado de pago al conductor
                'fecha_pago': str(fecha_pago) if fecha_pago else '',
                'manifiesto_pagado': str(manifiesto_pagado) if manifiesto_pagado else 'PENDIENTE',
                'fecha_manifiesto_pagado': str(fecha_manifiesto_pagado) if fecha_manifiesto_pagado else ''
            }
            resumen[conductor]['viajes_detalle'].append(viaje_detalle)
            
            if estado == 'PAGADO':
                resumen[conductor]['viajes_pagados'] += 1
                resumen[conductor]['total_pagado'] += tarifa
            else:
                resumen[conductor]['viajes_pendientes'] += 1
                resumen[conductor]['total_pendiente'] += tarifa
        
        return resumen
        
    except Exception as e:
        print(f"[ERROR] Error al obtener resumen de pagos: {e}")
        import traceback
        traceback.print_exc()
        return {}

def generar_datos_modal_deuda(conductor, datos_conductor, fecha_carta=None):
    """
    Generar datos para modal de deuda de un conductor específico
    
    Args:
        conductor (str): Nombre del conductor
        datos_conductor (dict): Datos del conductor del resumen
        fecha_carta (str): Fecha de la carta (opcional)
        
    Returns:
        dict: Datos estructurados para el modal
    """
    if not fecha_carta:
        fecha_carta = datetime.now().strftime("%d de %B de %Y")
    
    # Convertir fecha a español
    meses_es = {
        'January': 'enero', 'February': 'febrero', 'March': 'marzo',
        'April': 'abril', 'May': 'mayo', 'June': 'junio',
        'July': 'julio', 'August': 'agosto', 'September': 'septiembre',
        'October': 'octubre', 'November': 'noviembre', 'December': 'diciembre'
    }
    
    for eng, esp in meses_es.items():
        fecha_carta = fecha_carta.replace(eng, esp)
    
    return {
        'conductor': conductor,
        'fecha_carta': fecha_carta,
        'resumen': {
            'total_viajes': datos_conductor.get('total_viajes', 0),
            'viajes_pagados': datos_conductor.get('viajes_pagados', 0),
            'viajes_pendientes': datos_conductor.get('viajes_pendientes', 0),
            'total_pagado': datos_conductor.get('total_pagado', 0),
            'total_pendiente': datos_conductor.get('total_pendiente', 0)
        },
        'viajes': datos_conductor.get('viajes_detalle', [])
    }

