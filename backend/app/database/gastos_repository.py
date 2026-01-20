"""
Repositorio para operaciones con gastos de viajes en Firebase
"""
from typing import Optional, Dict, List
from datetime import datetime
from .firebase_repository import FirebaseRepository

class GastosRepository(FirebaseRepository):
    """Repositorio para gestión de gastos de viajes"""
    
    def __init__(self):
        super().__init__('gastos_viajes')
    
    def save_gasto_viaje(self, username: str, numero_manifiesto: str, 
                        concepto: str, valor: float, fecha: str, 
                        placa: str = '') -> bool:
        """
        Guarda un nuevo gasto de viaje
        
        Args:
            username: Nombre de usuario
            numero_manifiesto: Número del manifiesto
            concepto: Concepto del gasto
            valor: Valor del gasto
            fecha: Fecha del gasto
            placa: Placa del vehículo (opcional)
        
        Returns:
            bool: True si se guardó correctamente
        """
        try:
            data = {
                'username': username,
                'numero_manifiesto': numero_manifiesto,
                'concepto': concepto,
                'valor': valor,
                'fecha': fecha,
                'placa': placa
            }
            
            self.create(data)
            return True
        except Exception as e:
            print(f"Error al guardar gasto: {e}")
            return False
    
    def get_gastos_viajes(self, username: str = '', 
                         numero_manifiesto: Optional[str] = None) -> List[Dict]:
        """
        Obtiene gastos de viajes con filtros opcionales
        
        Args:
            username: Nombre de usuario (opcional, si está vacío obtiene todos)
            numero_manifiesto: Número de manifiesto para filtrar (opcional)
        
        Returns:
            Lista de gastos
        """
        try:
            filters = []
            
            if username:
                filters.append(('username', '==', username))
            if numero_manifiesto:
                filters.append(('numero_manifiesto', '==', numero_manifiesto))
            
            results = self.get_all(filters=filters if filters else None, order_by='fecha')
            return results
        except Exception as e:
            print(f"Error al obtener gastos: {e}")
            return []
    
    def update_gasto_viaje(self, gasto_id: str, concepto: Optional[str] = None,
                          valor: Optional[float] = None, 
                          fecha: Optional[str] = None) -> bool:
        """
        Actualiza un gasto de viaje
        
        Args:
            gasto_id: ID del gasto
            concepto: Nuevo concepto (opcional)
            valor: Nuevo valor (opcional)
            fecha: Nueva fecha (opcional)
        
        Returns:
            bool: True si se actualizó correctamente
        """
        try:
            data = {}
            if concepto is not None:
                data['concepto'] = concepto
            if valor is not None:
                data['valor'] = valor
            if fecha is not None:
                data['fecha'] = fecha
            
            if data:
                return self.update(gasto_id, data)
            return False
        except Exception as e:
            print(f"Error al actualizar gasto: {e}")
            return False
    
    def delete_gasto_viaje(self, gasto_id: str) -> bool:
        """
        Elimina un gasto de viaje
        
        Args:
            gasto_id: ID del gasto
        
        Returns:
            bool: True si se eliminó correctamente
        """
        return self.delete(gasto_id)
