"""
Módulo de analítica para operaciones de manifiestos.

Lee todos los Excel en la carpeta `EXCEL` y agrega métricas
mensuales por `placa`. Expone funciones para:
- cargar todos los registros
- agregar por mes y placa
- buscar manifiestos por `load_id`
"""

import os
import sys
import pandas as pd
from typing import List, Dict, Optional, Tuple


def _get_excel_folder() -> str:
    """Obtiene la ruta de la carpeta EXCEL considerando PyInstaller."""
    if getattr(sys, 'frozen', False):
        base_path = os.path.dirname(sys.executable)
        excel_folder = os.path.join(base_path, '_internal', 'EXCEL')
        if not os.path.exists(excel_folder):
            excel_folder = os.path.join(base_path, 'EXCEL')
    else:
        excel_folder = 'EXCEL'
    return excel_folder


def _save_totales_excel(df: pd.DataFrame) -> Optional[str]:
    """
    Guarda el DataFrame combinado en `EXCEL/DATOS TOTALES.xlsx`.
    Intenta mantener un orden de columnas coherente si están presentes.
    """
    try:
        excel_folder = _get_excel_folder()
        os.makedirs(excel_folder, exist_ok=True)

        # Orden sugerido de columnas si existen
        suggested_order = [
            'placa', 'conductor', 'origen', 'destino', 'fecha inicio', 'mes',
            'load_id', 'kof', 'remesa', 'empresa', 'fecha Generacion',
            'fecha Vencimiento', 'valormanifiesto', 'estado', 'fecha pago', 'archivo'
        ]
        existing_cols = [c for c in suggested_order if c in df.columns]
        # Añadir columnas que no estén en el orden sugerido
        rest_cols = [c for c in df.columns if c not in existing_cols]
        ordered_cols = existing_cols + rest_cols
        df_to_save = df[ordered_cols]

        output_path = os.path.join(excel_folder, 'DATOS TOTALES.xlsx')
        if os.path.exists(output_path):
            try:
                os.remove(output_path)
            except Exception:
                # Si no se puede eliminar (abierto), sobrescribe con nombre alterno timestamp
                from datetime import datetime
                ts = datetime.now().strftime('%Y%m%d_%H%M%S')
                output_path = os.path.join(excel_folder, f'DATOS TOTALES_{ts}.xlsx')

        df_to_save.to_excel(output_path, index=False)
        return output_path
    except Exception:
        return None


def load_all_manifiestos_from_excel(include_debug: bool = False) -> Tuple[List[Dict], Dict]:
    """
    Lee todos los archivos .xlsx en `EXCEL` y retorna una lista de dicts.
    Si alguna columna no existe en un archivo, pandas la rellenará con NaN.
    """
    excel_folder = _get_excel_folder()
    debug: Dict = {
        'excel_folder': excel_folder,
        'files_found': [],
        'read_success': [],
        'read_errors': [],
        'combined_rows': 0,
    }
    if not os.path.exists(excel_folder):
        return [], debug if include_debug else ({},)  # graceful when folder missing

    excel_files = [
        os.path.join(excel_folder, f)
        for f in os.listdir(excel_folder)
        if f.lower().endswith('.xlsx') and f != 'DATOS TOTALES.xlsx' and f.startswith('manifiestos_')
    ]

    debug['files_found'] = [os.path.basename(p) for p in excel_files]
    if not excel_files:
        return [], debug if include_debug else ({},)

    frames: List[pd.DataFrame] = []
    for file_path in excel_files:
        try:
            df = pd.read_excel(file_path)
            frames.append(df)
            debug['read_success'].append({
                'file': os.path.basename(file_path),
                'rows': int(df.shape[0]),
                'cols': list(map(str, df.columns.tolist()))
            })
        except Exception:
            # Ignorar archivos corruptos o bloqueados
            debug['read_errors'].append({'file': os.path.basename(file_path)})
            continue

    if not frames:
        return [], debug if include_debug else ({},)

    combined = pd.concat(frames, ignore_index=True)
    debug['combined_rows'] = int(combined.shape[0])
    
    # Limpiar valores NaN y convertir a tipos válidos para JSON
    combined = combined.fillna('')  # Reemplazar NaN con string vacío
    
    # Convertir columnas numéricas que puedan tener NaN
    numeric_columns = ['valormanifiesto']
    for col in numeric_columns:
        if col in combined.columns:
            combined[col] = pd.to_numeric(combined[col], errors='coerce').fillna(0)
    
    # Guardar Excel de totales combinados
    saved_path = _save_totales_excel(combined)
    if include_debug:
        debug['totales_excel_path'] = saved_path
    
    # Convertir a dict y limpiar valores problemáticos
    records = combined.to_dict('records')
    
    # Limpiar valores NaN restantes en los registros
    for record in records:
        for key, value in record.items():
            if pd.isna(value):
                record[key] = ''
            elif isinstance(value, (int, float)) and pd.isna(value):
                record[key] = 0
    
    return records, (debug if include_debug else {})


def aggregate_monthly_by_placa(
    manifiestos: List[Dict]
) -> List[Dict]:
    """
    Agrega la suma de `valormanifiesto` y el conteo por `mes` y `placa`.
    Devuelve una lista de dicts con: mes, placa, total_ganancia, cantidad.
    """
    if not manifiestos:
        return []

    df = pd.DataFrame(manifiestos)

    # Normalizar columnas esperadas - mapear nombres de columnas
    column_mapping = {
        'VALOR FLETE': 'valormanifiesto',
        'FECHA VIAJE': 'fecha_inicio',
        'ID': 'load_id',
        'ARCHIVO PDF': 'archivo'
    }
    
    # Renombrar columnas si existen
    for old_name, new_name in column_mapping.items():
        if old_name in df.columns:
            df[new_name] = df[old_name]
    
    # Normalizar columnas esperadas
    for col in ['mes', 'placa', 'valormanifiesto']:
        if col not in df.columns:
            df[col] = None if col != 'valormanifiesto' else 0

    # Agregar conductor si no existe
    if 'conductor' not in df.columns:
        df['conductor'] = None

    # Asegurar tipo numérico para valormanifiesto
    df['valormanifiesto'] = pd.to_numeric(df['valormanifiesto'], errors='coerce').fillna(0)

    # Estandarizar texto
    if 'mes' in df.columns:
        df['mes'] = df['mes'].astype(str).str.upper().str.strip()
    if 'placa' in df.columns:
        df['placa'] = df['placa'].astype(str).str.upper().str.strip()
    if 'conductor' in df.columns:
        df['conductor'] = df['conductor'].astype(str).str.strip()

    # Filtrar registros con mes vacío o inválido antes de agrupar
    df_filtered = df[
        (df['mes'].notna()) & 
        (df['mes'] != '') & 
        (df['mes'] != 'NO_ENCONTRADO') &
        (df['placa'].notna()) & 
        (df['placa'] != '') &
        (df['placa'] != 'NO ENCONTRADA')
    ]
    
    if df_filtered.empty:
        return []
    
    # Agrupar por mes, placa y conductor (tomar el primer conductor para cada placa)
    grouped = (
        df_filtered.groupby(['mes', 'placa'])
          .agg(
              total_ganancia=('valormanifiesto', 'sum'), 
              cantidad=('placa', 'count'),
              conductor=('conductor', 'first')
          )
          .reset_index()
    )

    # Orden sugerido: por mes (alfabético) y placa
    grouped = grouped.sort_values(['mes', 'placa'])
    return grouped.to_dict('records')


def search_by_load_id(
    manifiestos: List[Dict], query: Optional[str]
) -> List[Dict]:
    """
    Busca manifiestos por `load_id` (contiene, case-insensitive).
    Retorna registros coincidentes con columnas clave.
    """
    if not query:
        return []

    q = str(query).strip().lower()
    if not q:
        return []

    results = []
    for m in manifiestos:
        # Buscar load_id en diferentes campos posibles
        load_id_value = str(m.get('load_id', m.get('ID', ''))).lower()
        if q in load_id_value:
            results.append({
                'load_id': m.get('load_id', m.get('ID')),
                'placa': m.get('placa'),
                'mes': m.get('mes'),
                'valormanifiesto': m.get('valormanifiesto', m.get('VALOR FLETE')),
                'conductor': m.get('conductor'),
                'destino': m.get('destino'),
                'fecha_inicio': m.get('fecha inicio', m.get('FECHA VIAJE')),
                'archivo': m.get('archivo', m.get('ARCHIVO PDF')),
            })
    return results


def build_operaciones_payload(query: Optional[str] = None, debug: bool = False, include_all_data: bool = False) -> Dict:
    """
    Construye el payload para la API de operaciones:
    - aggregates: agregación por mes y placa
    - matches: resultados de búsqueda por load_id (opcional)
    - all_data: todos los registros del Excel (opcional)
    - gastos_totales: resumen de gastos totales (opcional)
    """
    manifiestos, diag = load_all_manifiestos_from_excel(include_debug=debug)
    aggregates = aggregate_monthly_by_placa(manifiestos)
    matches = search_by_load_id(manifiestos, query)

    payload = {
        'aggregates': aggregates,
        'matches': matches,
        'total_archivos_excel': len(diag.get('files_found', [])) if debug else len(aggregates),
    }
    
    if include_all_data:
        payload['all_data'] = manifiestos
        
        # Calcular gastos totales si se incluyen todos los datos
        try:
            from modules.payment_manager import calcular_gastos_totales
            # Obtener el nombre de la carpeta más reciente
            carpeta_reciente = None
            if diag.get('files_found'):
                # Extraer nombre de carpeta del primer archivo
                primer_archivo = diag['files_found'][0]
                if primer_archivo.startswith('manifiestos_'):
                    carpeta_reciente = primer_archivo.replace('manifiestos_', '').replace('.xlsx', '')
            
            # Si no se encontró carpeta, intentar obtenerla de otra manera
            if not carpeta_reciente:
                import os
                manifiestos_path = os.path.join(os.getcwd(), 'MANIFIESTOS')
                if os.path.exists(manifiestos_path):
                    carpetas = [f for f in os.listdir(manifiestos_path) if os.path.isdir(os.path.join(manifiestos_path, f))]
                    if carpetas:
                        carpeta_reciente = carpetas[-1]  # Última carpeta
            
            print(f"[DEBUG] Carpeta detectada para gastos: {carpeta_reciente}")
            gastos = calcular_gastos_totales(carpeta_reciente)
            payload['gastos_totales'] = gastos
        except Exception as e:
            print(f"[WARNING] No se pudieron calcular gastos totales: {e}")
            payload['gastos_totales'] = {
                'total_gastos': 0,
                'gastos_conductores': 0,
                'gastos_parqueaderos': 0,
                'gastos_repuestos': 0,
                'gastos_mano_obra': 0,
                'total_viajes': 0
            }
    
    if debug:
        payload['debug'] = diag
    return payload


