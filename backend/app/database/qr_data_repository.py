"""
Repositorio para operaciones con datos QR en Firebase
"""
from typing import Optional, Dict, List
from .firebase_repository import FirebaseRepository

class QRDataRepository(FirebaseRepository):
    """Repositorio para gestión de datos QR"""
    
    def __init__(self):
        super().__init__('qr_data')
    
    def save_qr_data(self, username: str, carpeta: str, archivo: str, 
                    ruta_completa: str = '', placa: str = '', 
                    numero_manifiesto: str = '', fecha: str = '',
                    hora: str = '', origen: str = '', destino: str = '',
                    qr_raw: str = '', conductor_id: Optional[str] = None) -> bool:
        """
        Guarda o actualiza datos de QR
        
        Args:
            username: Nombre de usuario
            carpeta: Nombre de la carpeta
            archivo: Nombre del archivo PDF
            ruta_completa: Ruta completa del archivo
            placa: Placa del vehículo
            numero_manifiesto: Número del manifiesto
            fecha: Fecha
            hora: Hora
            origen: Origen
            destino: Destino
            qr_raw: Datos raw del QR
            conductor_id: ID del conductor (opcional)
        
        Returns:
            bool: True si se guardó correctamente
        """
        try:
            # Crear ID único para el documento
            doc_id = f"{username}_{carpeta}_{archivo}".replace('/', '_').replace('\\', '_')
            
            data = {
                'username': username,
                'carpeta': carpeta,
                'archivo': archivo,
                'ruta_completa': ruta_completa,
                'placa': placa or '',
                'numero_manifiesto': numero_manifiesto or '',
                'fecha': fecha or '',
                'hora': hora or '',
                'origen': origen or '',
                'destino': destino or '',
                'qr_raw': qr_raw or '',
                'conductor_id': conductor_id
            }
            
            # Verificar si existe
            existing = self.get_by_id(doc_id)
            if existing:
                self.update(doc_id, data)
            else:
                self.create(data, doc_id=doc_id)
            
            return True
        except Exception as e:
            print(f"Error al guardar datos QR: {e}")
            return False
    
    def get_qr_data(self, username: str = '', carpeta: str = '', 
                   placa_filtro: Optional[str] = None) -> List[Dict]:
        """
        Obtiene datos de QR con filtros opcionales
        
        Args:
            username: Nombre de usuario (opcional)
            carpeta: Nombre de carpeta (opcional)
            placa_filtro: Placa para filtrar (opcional)
        
        Returns:
            Lista de datos QR
        """
        try:
            filters = []
            
            if username:
                filters.append(('username', '==', username))
            if carpeta:
                filters.append(('carpeta', '==', carpeta))
            if placa_filtro:
                filters.append(('placa', '==', placa_filtro.upper().strip()))
            
            results = self.get_all(filters=filters if filters else None, order_by='archivo')
            return results
        except Exception as e:
            print(f"Error al obtener datos QR: {e}")
            return []
    
    def delete_qr_data_by_carpeta(self, username: str, carpeta: str) -> bool:
        """
        Elimina todos los datos QR de una carpeta
        
        Args:
            username: Nombre de usuario
            carpeta: Nombre de la carpeta
        
        Returns:
            bool: True si se eliminaron correctamente
        """
        try:
            qr_data_list = self.get_qr_data(username=username, carpeta=carpeta)
            for item in qr_data_list:
                self.delete(item['id'])
            return True
        except Exception as e:
            print(f"Error al eliminar datos QR: {e}")
            return False
    
    def update_qr_field(self, qr_id: str, field: str, value: str) -> bool:
        """
        Actualiza un campo específico de un registro QR
        
        Args:
            qr_id: ID del registro QR
            field: Nombre del campo
            value: Nuevo valor
        
        Returns:
            bool: True si se actualizó correctamente
        """
        return self.update(qr_id, {field: value})
