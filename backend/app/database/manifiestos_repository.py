"""
Repositorios para operaciones con manifiestos en Firebase
"""
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from .firebase_repository import FirebaseRepository

class ManifiestosRepository(FirebaseRepository):
    """Repositorio para gestión de manifiestos"""
    
    def __init__(self):
        super().__init__('manifiestos')
    
    def generate_unique_id(self, load_id: str = None, remesa: str = None, username: str = '', archivo: str = '') -> str:
        """
        Genera un ID único para el manifiesto basado en load_id o remesa
        
        Args:
            load_id: Load ID del manifiesto
            remesa: Remesa (KBQ) del manifiesto
            username: Nombre de usuario
            archivo: Nombre del archivo PDF
        
        Returns:
            str: ID único para el documento
        """
        # Priorizar load_id, luego remesa, luego combinación username_archivo
        if load_id and load_id != 'No encontrado':
            return f"load_id_{load_id}"
        elif remesa and remesa != 'No encontrada':
            return f"remesa_{remesa}"
        else:
            # Si no hay load_id ni remesa, usar username_archivo como fallback
            safe_archivo = archivo.replace('/', '_').replace('\\', '_').replace('.', '_')
            return f"{username}_{safe_archivo}"
    
    def check_duplicate(self, load_id: str = None, remesa: str = None, username: str = None) -> Optional[Dict]:
        """
        Verifica si existe un manifiesto duplicado basado en load_id o remesa
        
        Args:
            load_id: Load ID del manifiesto
            remesa: Remesa (KBQ) del manifiesto
            username: Nombre de usuario (opcional, para filtrar por usuario)
        
        Returns:
            Dict con el manifiesto existente o None si no hay duplicado
        """
        try:
            filters = []
            if username:
                filters.append(('username', '==', username))
            
            # Buscar por load_id primero (más confiable)
            if load_id and load_id != 'No encontrado':
                load_id_filters = filters + [('load_id', '==', load_id), ('active', '==', True)]
                existing = self.find_one(load_id_filters)
                if existing:
                    return existing
            
            # Buscar por remesa si no se encontró por load_id
            if remesa and remesa != 'No encontrada':
                remesa_filters = filters + [('remesa', '==', remesa), ('active', '==', True)]
                existing = self.find_one(remesa_filters)
                if existing:
                    return existing
            
            return None
        except Exception as e:
            print(f"Error al verificar duplicados: {e}")
            import traceback
            print(traceback.format_exc())
            return None
    
    def save_manifiesto(self, username: str, folder_name: str, archivo: str, 
                       manifiesto_data: Dict, factura_data: Dict = None) -> Tuple[bool, str, Optional[Dict]]:
        """
        Guarda un manifiesto en Firebase con validación de duplicados
        
        Args:
            username: Nombre de usuario
            folder_name: Nombre de la carpeta
            archivo: Nombre del archivo PDF
            manifiesto_data: Datos del manifiesto
            factura_data: Datos de factura electrónica (opcional)
        
        Returns:
            tuple: (success, message, existing_manifiesto)
                - success: True si se guardó, False si es duplicado o error
                - message: Mensaje descriptivo
                - existing_manifiesto: Manifiesto existente si es duplicado
        """
        try:
            load_id = manifiesto_data.get('load_id', 'No encontrado')
            remesa = manifiesto_data.get('remesa', 'No encontrada')
            
            # Verificar duplicados (incluyendo username para mayor seguridad)
            existing = self.check_duplicate(load_id, remesa, username)
            if existing:
                identificador = f"load_id: {load_id}" if load_id != 'No encontrado' else f"remesa: {remesa}"
                return (False, f"Manifiesto duplicado detectado ({identificador})", existing)
            
            # Generar ID único
            doc_id = self.generate_unique_id(load_id, remesa, username, archivo)
            
            # Preparar datos para guardar
            data = {
                'username': username,
                'folder_name': folder_name,
                'archivo': archivo,
                'load_id': load_id,
                'remesa': remesa,
                'placa': manifiesto_data.get('placa', 'No encontrada'),
                'conductor': manifiesto_data.get('conductor', 'No encontrado'),
                'fecha_inicio': manifiesto_data.get('fecha inicio', 'No encontrada'),
                'fecha_retorno': manifiesto_data.get('fecha retorno', 'No encontrada'),
                'hora_inicio': manifiesto_data.get('hora inicio', 'No encontrada'),
                'hora_retorno': manifiesto_data.get('hora retorno', 'No encontrada'),
                'destino': manifiesto_data.get('destino', 'No encontrado'),
                'origen': manifiesto_data.get('origen', 'BARRANQUILLA'),
                'mes': manifiesto_data.get('mes', 'NO_ENCONTRADO'),
                'kof': manifiesto_data.get('kof', 'No encontrado'),
                'empresa': manifiesto_data.get('empresa', 'CAMELO ARENAS GUILLERMO ANDRES'),
                'fecha_procesamiento': manifiesto_data.get('fecha_procesamiento', ''),
                # Datos de factura electrónica
                'fecha_generacion': factura_data.get('fecha Generacion', '') if factura_data else '',
                'fecha_vencimiento': factura_data.get('fecha Vencimiento', '') if factura_data else '',
                'valor_manifiesto': manifiesto_data.get('valormanifiesto', ''),
                'estado': manifiesto_data.get('estado', ''),
                # Valores monetarios
                'valor_total': manifiesto_data.get('valor_total', ''),
                'anticipo': manifiesto_data.get('anticipo', ''),
                'saldo': manifiesto_data.get('saldo', ''),
                'fecha_liquidacion': manifiesto_data.get('fecha_liquidacion', ''),
                'fecha_pago': manifiesto_data.get('fecha_pago', ''),
                'active': True  # Soft delete flag
            }
            
            # Verificar si el documento ya existe (por el doc_id generado)
            existing_by_id = self.get_by_id(doc_id)
            if existing_by_id:
                # Si existe, actualizar en lugar de crear
                self.update(doc_id, data)
                return (True, f"Manifiesto actualizado: {doc_id}", None)
            else:
                # Crear nuevo documento
                self.create(data, doc_id=doc_id)
                return (True, f"Manifiesto guardado: {doc_id}", None)
                
        except Exception as e:
            print(f"Error al guardar manifiesto: {e}")
            import traceback
            print(traceback.format_exc())
            return (False, f"Error al guardar manifiesto: {str(e)}", None)
    
    def get_all_manifiestos(self) -> List[Dict]:
        """
        Obtiene todos los manifiestos activos sin filtros
        
        Returns:
            Lista de todos los manifiestos activos
        """
        try:
            filters = [('active', '==', True)]
            results = self.get_all(filters=filters, order_by='fecha_procesamiento')
            return results
        except Exception as e:
            print(f"Error al obtener todos los manifiestos: {e}")
            return []
    
    def get_manifiestos(self, username: str = '', folder_name: str = '', 
                       load_id: Optional[str] = None, remesa: Optional[str] = None) -> List[Dict]:
        """
        Obtiene manifiestos con filtros opcionales
        
        Args:
            username: Nombre de usuario (opcional)
            folder_name: Nombre de carpeta (opcional)
            load_id: Load ID para filtrar (opcional)
            remesa: Remesa para filtrar (opcional)
        
        Returns:
            Lista de manifiestos
        """
        try:
            filters = []
            
            if username:
                filters.append(('username', '==', username))
            if folder_name:
                filters.append(('folder_name', '==', folder_name))
            if load_id:
                filters.append(('load_id', '==', load_id))
            if remesa:
                filters.append(('remesa', '==', remesa))
            
            # Solo obtener manifiestos activos
            filters.append(('active', '==', True))
            
            results = self.get_all(filters=filters if filters else None, order_by='fecha_procesamiento')
            return results
        except Exception as e:
            print(f"Error al obtener manifiestos: {e}")
            return []
    
    def update_manifiesto_field(self, doc_id: str, field: str, value: str) -> bool:
        """
        Actualiza un campo específico de un manifiesto
        
        Args:
            doc_id: ID del manifiesto
            field: Nombre del campo
            value: Nuevo valor
        
        Returns:
            bool: True si se actualizó correctamente
        """
        return self.update(doc_id, {field: value})
    
    def delete_manifiesto(self, doc_id: str) -> bool:
        """
        Elimina un manifiesto (soft delete)
        
        Args:
            doc_id: ID del manifiesto
        
        Returns:
            bool: True si se eliminó correctamente
        """
        return self.update(doc_id, {'active': False})
    
    def hard_delete(self, doc_id: str) -> bool:
        """
        Elimina completamente un manifiesto de Firebase (hard delete)
        
        Args:
            doc_id: ID del manifiesto
        
        Returns:
            bool: True si se eliminó correctamente
        """
        try:
            return super().delete(doc_id)
        except Exception as e:
            print(f"Error al eliminar permanentemente manifiesto {doc_id}: {e}")
            return False
    
    def hard_delete_by_folder(self, username: str, folder_name: str) -> tuple:
        """
        Elimina permanentemente todos los manifiestos de una carpeta
        
        Args:
            username: Nombre de usuario
            folder_name: Nombre de la carpeta
        
        Returns:
            tuple: (deleted_count, errors_list)
        """
        try:
            filters = [('username', '==', username), ('active', '==', True)]
            manifiestos = self.get_all(filters=filters)
            
            deleted_count = 0
            errors = []
            
            for m in manifiestos:
                # Verificar si pertenece a la carpeta
                if (m.get('carpeta') == folder_name or 
                    folder_name in str(m.get('filename', '')) or
                    folder_name in str(m.get('archivo', ''))):
                    
                    doc_id = m.get('id')
                    if doc_id:
                        try:
                            if self.hard_delete(doc_id):
                                deleted_count += 1
                            else:
                                errors.append(f"No se pudo eliminar manifiesto {doc_id}")
                        except Exception as e:
                            errors.append(f"Error eliminando {doc_id}: {str(e)}")
            
            return deleted_count, errors
        except Exception as e:
            print(f"Error en hard_delete_by_folder: {e}")
            return 0, [str(e)]
    
    def _traducir_dia_semana(self, dia_ingles: str) -> str:
        """Traduce el nombre del día de inglés a español"""
        traduccion = {
            'Monday': 'Lunes',
            'Tuesday': 'Martes', 
            'Wednesday': 'Miércoles',
            'Thursday': 'Jueves',
            'Friday': 'Viernes',
            'Saturday': 'Sábado',
            'Sunday': 'Domingo'
        }
        return traduccion.get(dia_ingles, dia_ingles)
    
    # Métodos de estadísticas para gráficos de rendimiento
    def get_stats_by_period(self, username: str, period: str = 'daily', days: int = 30) -> tuple:
        """Obtiene estadísticas agrupadas por período y por día de la semana"""
        try:
            filters = [('username', '==', username), ('active', '==', True)]
            manifiestos = self.get_all(filters=filters, order_by='fecha_procesamiento')
            
            print(f"DEBUG: Total manifiestos encontrados: {len(manifiestos)}")
            
            # Mostrar algunos datos de ejemplo para depuración
            if manifiestos and len(manifiestos) > 0:
                ejemplo = manifiestos[0]
                print(f"DEBUG: Ejemplo de manifiesto:")
                print(f"  - valor_manifiesto: {ejemplo.get('valor_manifiesto')}")
                print(f"  - created_at: {ejemplo.get('created_at')}")
                print(f"  - fecha_procesamiento: {ejemplo.get('fecha_procesamiento')}")
                print(f"  - fecha_inicio: {ejemplo.get('fecha_inicio')}")
                print(f"  - fecha retorno: {ejemplo.get('fecha retorno')}")
                print(f"  - destino: {ejemplo.get('destino')}")
                print(f"  - conductor: {ejemplo.get('conductor')}")
                
                # Mostrar fechas de varios manifiestos para ver patrón
                print(f"DEBUG: Fechas de los primeros 5 manifiestos:")
                for i, m in enumerate(manifiestos[:5]):
                    print(f"  Manifiesto {i+1}:")
                    print(f"    - fecha_inicio: {m.get('fecha_inicio')}")
                    print(f"    - created_at: {m.get('created_at')}")
                    print(f"    - archivo: {m.get('archivo')}")
            
            # Agrupar por período
            stats = {}
            # Agrupar por día de la semana
            dia_semana_stats = {}
            cutoff_date = datetime.now() - timedelta(days=days)
            
            print(f"DEBUG: Cutoff date: {cutoff_date}")
            
            procesados = 0
            for m in manifiestos:
                # Procesar valor del manifiesto - simplificado
                valor = 0
                try:
                    valor_raw = m.get('valor_manifiesto', '0')
                    if valor_raw and valor_raw != 'No encontrado' and valor_raw != '':
                        # Limpiar el valor
                        valor_str = str(valor_raw).replace('$', '').replace(',', '').replace('.', '').strip()
                        # Si es un número válido, usarlo
                        if valor_str.isdigit():
                            valor = float(valor_str)
                        else:
                            # Intentar extraer números
                            import re
                            numeros = re.findall(r'\d+', str(valor_raw))
                            if numeros:
                                valor = float(numeros[0])
                    else:
                        valor = 0
                except:
                    valor = 0
                
                # Obtener fecha - 🔥 CORRECCIÓN: Priorizar fecha del manifiesto sobre created_at
                fecha_str = (m.get('fecha_inicio') or  # 🔥 Priorizar fecha extraída del manifiesto
                           m.get('fecha retorno') or 
                           m.get('fecha_procesamiento') or 
                           m.get('created_at') or  # created_at como último recurso
                           m.get('fecha'))
                
                if not fecha_str or fecha_str == 'No encontrada' or fecha_str == '':
                    continue
                
                # Normalizar fecha - más permisivo
                try:
                    fecha_str = str(fecha_str).strip()
                    
                    # Si es formato ISO (created_at)
                    if 'T' in fecha_str:
                        fecha = datetime.fromisoformat(fecha_str.replace('Z', '+00:00'))
                        fecha = fecha.replace(tzinfo=None)  # Quitar timezone
                    elif '.' in fecha_str and len(fecha_str.split('.')) == 3:
                        # Formato DD.MM.YYYY
                        fecha = datetime.strptime(fecha_str, '%d.%m.%Y')
                    elif '-' in fecha_str and len(fecha_str) >= 8:
                        # Formato YYYY-MM-DD o similar
                        fecha = datetime.strptime(fecha_str[:10], '%Y-%m-%d')
                    else:
                        # Último intento: saltar este manifiesto
                        continue
                except:
                    continue
                
                if fecha < cutoff_date:
                    continue
                
                procesados += 1
                if procesados <= 3:  # Mostrar primeros 3 para depuración
                    print(f"DEBUG: Procesando manifiesto {procesados}:")
                    print(f"  - valor_str original: {m.get('valor_manifiesto')}")
                    print(f"  - valor procesado: {valor}")
                    print(f"  - fecha_str original: {fecha_str}")
                    print(f"  - fecha parseada: {fecha}")
                    print(f"  - dia_semana: {fecha.strftime('%A')}")
                
                # Agrupar por período
                if period == 'daily':
                    key = fecha.strftime('%Y-%m-%d')
                elif period == 'weekly':
                    week_start = fecha - timedelta(days=fecha.weekday())
                    key = week_start.strftime('%Y-%m-%d')
                else:  # monthly
                    key = fecha.strftime('%Y-%m')
                
                if key not in stats:
                    stats[key] = {'total': 0, 'count': 0}
                
                stats[key]['total'] += valor
                stats[key]['count'] += 1
                
                # Agrupar por día de la semana
                dia_semana_ingles = fecha.strftime('%A')
                dia_semana_es = self._traducir_dia_semana(dia_semana_ingles)
                
                if dia_semana_es not in dia_semana_stats:
                    dia_semana_stats[dia_semana_es] = {'total': 0, 'count': 0}
                
                dia_semana_stats[dia_semana_es]['total'] += valor
                dia_semana_stats[dia_semana_es]['count'] += 1
            
            print(f"DEBUG: Total manifiestos procesados: {procesados}")
            print(f"DEBUG: Stats keys: {list(stats.keys())}")
            print(f"DEBUG: Día semana stats: {dia_semana_stats}")
            
            # Convertir a lista ordenada (período)
            result = []
            for key in sorted(stats.keys()):
                total = stats[key]['total']
                count = stats[key]['count']
                avg = total / count if count > 0 else 0
                result.append({
                    'date': key,
                    'total': total,
                    'count': count,
                    'avg': avg
                })
            
            # Convertir a lista ordenada (día de semana)
            orden_dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
            dia_semana_result = []
            for dia in orden_dias:
                if dia in dia_semana_stats:
                    total = dia_semana_stats[dia]['total']
                    count = dia_semana_stats[dia]['count']
                    avg = total / count if count > 0 else 0
                    dia_semana_result.append({
                        'dia_semana': dia,
                        'total': total,
                        'count': count,
                        'avg': avg
                    })
            
            return result, dia_semana_result
        except Exception as e:
            print(f"Error en get_stats_by_period: {e}")
            return [], []
    
    def get_analisis_comparativo(self, username: str, days: int = 30) -> Dict:
        """Obtiene análisis comparativo de días de la semana"""
        try:
            stats, dia_semana_stats = self.get_stats_by_period(username, 'daily', days)
            
            if not dia_semana_stats:
                return {}
            
            # Encontrar mejor y peor día
            mejor_dia = max(dia_semana_stats, key=lambda x: x['total']) if dia_semana_stats else None
            peor_dia = min(dia_semana_stats, key=lambda x: x['total']) if dia_semana_stats else None
            
            # Calcular promedio diario general
            total_general = sum(d['total'] for d in dia_semana_stats)
            total_viajes = sum(d['count'] for d in dia_semana_stats)
            promedio_diario_general = total_general / len(dia_semana_stats) if dia_semana_stats else 0
            
            # Calcular variación semanal (comparar semanas si hay datos suficientes)
            variacion_semanal = "0%"
            if len(stats) >= 2:
                ultima_semana = stats[-1]['total'] if stats else 0
                semana_anterior = stats[-2]['total'] if len(stats) >= 2 else 0
                if semana_anterior > 0:
                    variacion = ((ultima_semana - semana_anterior) / semana_anterior) * 100
                    variacion_semanal = f"+{variacion:.1f}%" if variacion > 0 else f"{variacion:.1f}%"
            
            return {
                'mejor_dia_semana': mejor_dia['dia_semana'] if mejor_dia else 'N/A',
                'peor_dia_semana': peor_dia['dia_semana'] if peor_dia else 'N/A',
                'promedio_diario_general': promedio_diario_general,
                'variacion_semanal': variacion_semanal,
                'total_viajes': total_viajes
            }
        except Exception as e:
            print(f"Error en get_analisis_comparativo: {e}")
            return {}
    
    def get_ingresos_by_destino(self, username: str, period: str = 'daily', days: int = 30) -> List[Dict]:
        """Obtiene ingresos agrupados por destino"""
        try:
            filters = [('username', '==', username), ('active', '==', True)]
            manifiestos = self.get_all(filters=filters)
            
            ingresos_destino = {}
            cutoff_date = datetime.now() - timedelta(days=days)
            
            for m in manifiestos:
                destino = m.get('destino', 'No encontrado')
                if destino == 'No encontrado':
                    continue
                
                # Procesar valor
                valor = 0
                try:
                    valor_str = str(m.get('valor_manifiesto', '0')).replace(',', '').replace('.', '')
                    valor = float(valor_str) if valor_str.isdigit() else 0
                except:
                    valor = 0
                
                # Verificar fecha
                fecha_str = m.get('fecha_procesamiento') or m.get('fecha_inicio')
                if not fecha_str or fecha_str == 'No encontrada':
                    continue
                
                try:
                    if '.' in fecha_str:
                        fecha = datetime.strptime(fecha_str, '%d.%m.%Y')
                    elif '-' in fecha_str:
                        fecha = datetime.strptime(fecha_str, '%Y-%m-%d')
                    else:
                        continue
                except:
                    continue
                
                if fecha < cutoff_date:
                    continue
                
                if destino not in ingresos_destino:
                    ingresos_destino[destino] = {'total': 0, 'count': 0}
                
                ingresos_destino[destino]['total'] += valor
                ingresos_destino[destino]['count'] += 1
            
            result = []
            for destino, data in ingresos_destino.items():
                result.append({
                    'destino': destino,
                    'total': data['total'],
                    'count': data['count']
                })
            
            return sorted(result, key=lambda x: x['total'], reverse=True)
        except Exception as e:
            print(f"Error en get_ingresos_by_destino: {e}")
            return []
    
    def get_ingresos_by_conductor(self, username: str, period: str = 'daily', days: int = 30) -> List[Dict]:
        """Obtiene ingresos agrupados por conductor con fechas específicas"""
        try:
            filters = [('username', '==', username), ('active', '==', True)]
            manifiestos = self.get_all(filters=filters)
            
            ingresos_conductor = {}
            cutoff_date = datetime.now() - timedelta(days=days)
            
            print(f"DEBUG: Analizando {len(manifiestos)} manifiestos para ingresos por conductor")
            
            for m in manifiestos:
                conductor = m.get('conductor', 'No encontrado')
                if conductor == 'No encontrado':
                    continue
                
                # Procesar valor
                valor = 0
                try:
                    valor_raw = m.get('valor_manifiesto', '0')
                    if valor_raw and valor_raw != 'No encontrado' and valor_raw != '':
                        valor_str = str(valor_raw).replace('$', '').replace(',', '').replace('.', '').strip()
                        if valor_str.isdigit():
                            valor = float(valor_str)
                        else:
                            import re
                            numeros = re.findall(r'\d+', str(valor_raw))
                            if numeros:
                                valor = float(numeros[0])
                    else:
                        valor = 0
                except:
                    valor = 0
                
                # 🔥 CORRECCIÓN: Usar fecha_inicio del manifiesto
                fecha_str = (m.get('fecha_inicio') or 
                           m.get('fecha retorno') or 
                           m.get('fecha_procesamiento') or 
                           m.get('created_at'))
                
                if not fecha_str or fecha_str == 'No encontrada' or fecha_str == '':
                    continue
                
                try:
                    fecha_str = str(fecha_str).strip()
                    if 'T' in fecha_str:
                        fecha = datetime.fromisoformat(fecha_str.replace('Z', '+00:00'))
                        fecha = fecha.replace(tzinfo=None)
                    elif '.' in fecha_str and len(fecha_str.split('.')) == 3:
                        fecha = datetime.strptime(fecha_str, '%d.%m.%Y')
                    elif '-' in fecha_str and len(fecha_str) >= 8:
                        fecha = datetime.strptime(fecha_str[:10], '%Y-%m-%d')
                    else:
                        continue
                except:
                    continue
                
                if fecha < cutoff_date:
                    continue
                
                # Inicializar conductor si no existe
                if conductor not in ingresos_conductor:
                    ingresos_conductor[conductor] = {
                        'total': 0, 
                        'count': 0,
                        'viajes': []  # 🔥 NUEVO: Lista de viajes con detalles
                    }
                
                # Agregar detalles del viaje
                viaje_detalle = {
                    'fecha': fecha.strftime('%d.%m.%Y'),
                    'dia_semana': fecha.strftime('%A'),
                    'valor': valor,
                    'archivo': m.get('archivo', 'No encontrado'),
                    'placa': m.get('placa', 'No encontrado'),
                    'load_id': m.get('load_id', 'No encontrado'),
                    'destino': m.get('destino', 'No encontrado')
                }
                
                ingresos_conductor[conductor]['viajes'].append(viaje_detalle)
                ingresos_conductor[conductor]['total'] += valor
                ingresos_conductor[conductor]['count'] += 1
            
            # Convertir a lista para respuesta
            resultado = []
            for conductor, datos in ingresos_conductor.items():
                resultado.append({
                    'conductor': conductor,
                    'total_ingresos': datos['total'],
                    'viajes_count': datos['count'],
                    'promedio_por_viaje': datos['total'] / datos['count'] if datos['count'] > 0 else 0,
                    'viajes': datos['viajes']  # 🔥 NUEVO: Detalles completos
                })
            
            # Ordenar por ingresos totales (descendente)
            resultado.sort(key=lambda x: x['total_ingresos'], reverse=True)
            
            print(f"DEBUG: Se encontraron {len(resultado)} conductores con ingresos")
            return resultado
            
        except Exception as e:
            print(f"Error en get_ingresos_by_conductor: {e}")
            return []
    
    def get_ingresos_by_carro(self, username: str, period: str = 'daily', days: int = 30) -> List[Dict]:
        """Obtiene ingresos agrupados por carro (placa) con fechas específicas"""
        try:
            filters = [('username', '==', username), ('active', '==', True)]
            manifiestos = self.get_all(filters=filters)
            
            ingresos_carro = {}
            cutoff_date = datetime.now() - timedelta(days=days)
            
            print(f"DEBUG: Analizando {len(manifiestos)} manifiestos para ingresos por carro")
            
            for m in manifiestos:
                placa = m.get('placa', 'No encontrado')
                if placa == 'No encontrado' or not placa or len(placa) < 3:
                    continue
                
                # Procesar valor
                valor = 0
                try:
                    valor_raw = m.get('valor_manifiesto', '0')
                    if valor_raw and valor_raw != 'No encontrado' and valor_raw != '':
                        valor_str = str(valor_raw).replace('$', '').replace(',', '').replace('.', '').strip()
                        if valor_str.isdigit():
                            valor = float(valor_str)
                        else:
                            import re
                            numeros = re.findall(r'\d+', str(valor_raw))
                            if numeros:
                                valor = float(numeros[0])
                    else:
                        valor = 0
                except:
                    valor = 0
                
                # 🔥 CORRECCIÓN: Usar fecha_inicio del manifiesto
                fecha_str = (m.get('fecha_inicio') or 
                           m.get('fecha retorno') or 
                           m.get('fecha_procesamiento') or 
                           m.get('created_at'))
                
                if not fecha_str or fecha_str == 'No encontrada' or fecha_str == '':
                    continue
                
                try:
                    fecha_str = str(fecha_str).strip()
                    if 'T' in fecha_str:
                        fecha = datetime.fromisoformat(fecha_str.replace('Z', '+00:00'))
                        fecha = fecha.replace(tzinfo=None)
                    elif '.' in fecha_str and len(fecha_str.split('.')) == 3:
                        fecha = datetime.strptime(fecha_str, '%d.%m.%Y')
                    elif '-' in fecha_str and len(fecha_str) >= 8:
                        fecha = datetime.strptime(fecha_str[:10], '%Y-%m-%d')
                    else:
                        continue
                except:
                    continue
                
                if fecha < cutoff_date:
                    continue
                
                # Inicializar carro si no existe
                if placa not in ingresos_carro:
                    ingresos_carro[placa] = {
                        'total': 0, 
                        'count': 0,
                        'viajes': [],  # 🔥 NUEVO: Lista de viajes con detalles
                        'conductores': set(),  # 🔥 NUEVO: Conductores que usaron este carro
                        'destinos': set()  # 🔥 NUEVO: Destinos visitados
                    }
                
                # Agregar detalles del viaje
                viaje_detalle = {
                    'fecha': fecha.strftime('%d.%m.%Y'),
                    'dia_semana': self._traducir_dia_semana(fecha.strftime('%A')),
                    'valor': valor,
                    'archivo': m.get('archivo', 'No encontrado'),
                    'conductor': m.get('conductor', 'No encontrado'),
                    'load_id': m.get('load_id', 'No encontrado'),
                    'destino': m.get('destino', 'No encontrado')
                }
                
                ingresos_carro[placa]['viajes'].append(viaje_detalle)
                ingresos_carro[placa]['total'] += valor
                ingresos_carro[placa]['count'] += 1
                
                # Agregar conductor y destino a los sets
                if m.get('conductor') and m.get('conductor') != 'No encontrado':
                    ingresos_carro[placa]['conductores'].add(m.get('conductor'))
                if m.get('destino') and m.get('destino') != 'No encontrado':
                    ingresos_carro[placa]['destinos'].add(m.get('destino'))
            
            # Convertir a lista para respuesta
            resultado = []
            for placa, datos in ingresos_carro.items():
                resultado.append({
                    'placa': placa,
                    'total_ingresos': datos['total'],
                    'viajes_count': datos['count'],
                    'promedio_por_viaje': datos['total'] / datos['count'] if datos['count'] > 0 else 0,
                    'viajes': datos['viajes'],  # 🔥 Detalles completos
                    'conductores': list(datos['conductores']),  # Lista de conductores
                    'conductores_count': len(datos['conductores']),
                    'destinos': list(datos['destinos']),  # 🔥 Lista de destinos
                    'destinos_count': len(datos['destinos'])
                })
            
            # Ordenar por ingresos totales (descendente)
            resultado.sort(key=lambda x: x['total_ingresos'], reverse=True)
            
            print(f"DEBUG: Se encontraron {len(resultado)} carros con ingresos")
            return resultado
            
        except Exception as e:
            print(f"Error en get_ingresos_by_carro: {e}")
            return []
    
    def get_distribucion_valores(self, username: str) -> List[Dict]:
        """Obtiene distribución de manifiestos por rangos de valor"""
        try:
            filters = [('username', '==', username), ('active', '==', True)]
            manifiestos = self.get_all(filters=filters)
            
            distribucion = {
                '0-500K': 0,
                '500K-1M': 0,
                '1M-2M': 0,
                '2M+': 0
            }
            
            for m in manifiestos:
                valor = 0
                try:
                    valor_str = str(m.get('valor_manifiesto', '0')).replace(',', '').replace('.', '')
                    valor = float(valor_str) if valor_str.isdigit() else 0
                except:
                    valor = 0
                
                if valor < 500000:
                    distribucion['0-500K'] += 1
                elif valor < 1000000:
                    distribucion['500K-1M'] += 1
                elif valor < 2000000:
                    distribucion['1M-2M'] += 1
                else:
                    distribucion['2M+'] += 1
            
            result = []
            for rango, count in distribucion.items():
                result.append({'rango': rango, 'count': count})
            
            return result
        except Exception as e:
            print(f"Error en get_distribucion_valores: {e}")
            return []
    
    def get_tiempos_entre_viajes(self, username: str, period: str = 'daily', days: int = 30) -> List[Dict]:
        """Calcula tiempos entre manifiestos consecutivos"""
        try:
            filters = [('username', '==', username), ('active', '==', True)]
            manifiestos = self.get_all(filters=filters, order_by='fecha_procesamiento')
            
            tiempos = []
            cutoff_date = datetime.now() - timedelta(days=days)
            
            # Filtrar y ordenar manifiestos por fecha
            manifiestos_validos = []
            for m in manifiestos:
                fecha_str = m.get('fecha_procesamiento') or m.get('fecha_inicio')
                if not fecha_str or fecha_str == 'No encontrada':
                    continue
                
                try:
                    if '.' in fecha_str:
                        fecha = datetime.strptime(fecha_str, '%d.%m.%Y')
                    elif '-' in fecha_str:
                        fecha = datetime.strptime(fecha_str, '%Y-%m-%d')
                    else:
                        continue
                except:
                    continue
                
                if fecha < cutoff_date:
                    continue
                
                hora_str = m.get('hora_inicio', '00:00')
                try:
                    if ':' in hora_str:
                        hora_parts = hora_str.split(':')
                        hora = int(hora_parts[0])
                        minuto = int(hora_parts[1]) if len(hora_parts) > 1 else 0
                        fecha = fecha.replace(hour=hora, minute=minuto)
                except:
                    pass
                
                manifiestos_validos.append((fecha, m))
            
            # Ordenar por fecha
            manifiestos_validos.sort(key=lambda x: x[0])
            
            # Calcular tiempos entre viajes consecutivos
            for i in range(1, len(manifiestos_validos)):
                fecha_actual = manifiestos_validos[i][0]
                fecha_anterior = manifiestos_validos[i-1][0]
                
                diferencia = fecha_actual - fecha_anterior
                horas = diferencia.total_seconds() / 3600
                
                # Agrupar por rangos
                if horas <= 6:
                    rango = '0-6'
                elif horas <= 12:
                    rango = '6-12'
                elif horas <= 24:
                    rango = '12-24'
                else:
                    rango = '24+'
                
                tiempos.append(rango)
            
            # Contar frecuencias
            distribucion = {'0-6': 0, '6-12': 0, '12-24': 0, '24+': 0}
            for rango in tiempos:
                distribucion[rango] += 1
            
            total = len(tiempos)
            result = []
            for rango, count in distribucion.items():
                porcentaje = (count / total * 100) if total > 0 else 0
                result.append({
                    'horas': rango,
                    'count': count,
                    'porcentaje': round(porcentaje, 1)
                })
            
            return result
        except Exception as e:
            print(f"Error en get_tiempos_entre_viajes: {e}")
            return []
    
    def get_tiempos_por_conductor(self, username: str, period: str = 'daily', days: int = 30) -> List[Dict]:
        """Tiempo promedio entre viajes por conductor"""
        try:
            filters = [('username', '==', username), ('active', '==', True)]
            manifiestos = self.get_all(filters=filters, order_by='fecha_procesamiento')
            
            tiempos_conductor = {}
            cutoff_date = datetime.now() - timedelta(days=days)
            
            # Agrupar por conductor y ordenar
            manifiestos_por_conductor = {}
            for m in manifiestos:
                conductor = m.get('conductor', 'No encontrado')
                if conductor == 'No encontrado':
                    continue
                
                fecha_str = m.get('fecha_procesamiento') or m.get('fecha_inicio')
                if not fecha_str or fecha_str == 'No encontrada':
                    continue
                
                try:
                    if '.' in fecha_str:
                        fecha = datetime.strptime(fecha_str, '%d.%m.%Y')
                    elif '-' in fecha_str:
                        fecha = datetime.strptime(fecha_str, '%Y-%m-%d')
                    else:
                        continue
                except:
                    continue
                
                if fecha < cutoff_date:
                    continue
                
                hora_str = m.get('hora_inicio', '00:00')
                try:
                    if ':' in hora_str:
                        hora_parts = hora_str.split(':')
                        hora = int(hora_parts[0])
                        minuto = int(hora_parts[1]) if len(hora_parts) > 1 else 0
                        fecha = fecha.replace(hour=hora, minute=minuto)
                except:
                    pass
                
                if conductor not in manifiestos_por_conductor:
                    manifiestos_por_conductor[conductor] = []
                manifiestos_por_conductor[conductor].append(fecha)
            
            # Calcular tiempos promedio por conductor
            for conductor, fechas in manifiestos_por_conductor.items():
                fechas.sort()
                tiempos = []
                
                for i in range(1, len(fechas)):
                    diferencia = fechas[i] - fechas[i-1]
                    horas = diferencia.total_seconds() / 3600
                    tiempos.append(horas)
                
                if tiempos:
                    tiempo_promedio = sum(tiempos) / len(tiempos)
                    tiempos_conductor[conductor] = {
                        'tiempo_promedio_hs': round(tiempo_promedio, 1),
                        'viajes': len(fechas)
                    }
            
            result = []
            for conductor, data in tiempos_conductor.items():
                result.append({
                    'conductor': conductor,
                    'tiempo_promedio_hs': data['tiempo_promedio_hs'],
                    'viajes': data['viajes']
                })
            
            return sorted(result, key=lambda x: x['tiempo_promedio_hs'])
        except Exception as e:
            print(f"Error en get_tiempos_por_conductor: {e}")
            return []
    
    def get_patrones_temporales(self, username: str, period: str = 'daily', days: int = 30) -> Dict:
        """Patrones de frecuencia por momento del día"""
        try:
            filters = [('username', '==', username), ('active', '==', True)]
            manifiestos = self.get_all(filters=filters)
            
            patrones = {
                'manana': {'count': 0, 'avg_tiempo': 0},
                'tarde': {'count': 0, 'avg_tiempo': 0},
                'noche': {'count': 0, 'avg_tiempo': 0}
            }
            
            cutoff_date = datetime.now() - timedelta(days=days)
            
            for m in manifiestos:
                fecha_str = m.get('fecha_procesamiento') or m.get('fecha_inicio')
                if not fecha_str or fecha_str == 'No encontrada':
                    continue
                
                try:
                    if '.' in fecha_str:
                        fecha = datetime.strptime(fecha_str, '%d.%m.%Y')
                    elif '-' in fecha_str:
                        fecha = datetime.strptime(fecha_str, '%Y-%m-%d')
                    else:
                        continue
                except:
                    continue
                
                if fecha < cutoff_date:
                    continue
                
                hora_str = m.get('hora_inicio', '00:00')
                try:
                    if ':' in hora_str:
                        hora_parts = hora_str.split(':')
                        hora = int(hora_parts[0])
                    else:
                        hora = 0
                except:
                    hora = 0
                
                # Clasificar por momento del día
                if 6 <= hora < 12:
                    momento = 'manana'
                elif 12 <= hora < 18:
                    momento = 'tarde'
                else:
                    momento = 'noche'
                
                patrones[momento]['count'] += 1
            
            return patrones
        except Exception as e:
            print(f"Error en get_patrones_temporales: {e}")
            return {}
