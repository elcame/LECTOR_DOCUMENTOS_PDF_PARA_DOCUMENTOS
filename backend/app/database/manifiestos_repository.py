"""
Repositorio para operaciones con manifiestos en Firebase
"""
from typing import Optional, Dict, List, Tuple
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
