"""
Repositorio para gestionar tipos de gastos en Firestore
"""
from typing import List, Dict, Optional
from datetime import datetime
from .firebase_repository import FirebaseRepository

class ExpenseTypesRepository(FirebaseRepository):
    """Repositorio para tipos de gastos"""
    
    def __init__(self):
        super().__init__('expense_types')
    
    def get_all_types(self, username: str = None) -> List[Dict]:
        """
        Obtiene todos los tipos de gastos
        
        Args:
            username: Usuario (opcional, para tipos personalizados)
        
        Returns:
            Lista de tipos de gastos
        """
        try:
            filters = [('active', '==', True)]
            
            if username:
                # Obtener tipos del sistema y del usuario
                system_types = self.get_all(filters=[('active', '==', True), ('is_system', '==', True)])
                user_types = self.get_all(filters=[('active', '==', True), ('username', '==', username)])
                return system_types + user_types
            else:
                # Solo tipos del sistema
                filters.append(('is_system', '==', True))
            
            return self.get_all(filters=filters, order_by='order')
        except Exception as e:
            print(f"Error al obtener tipos de gastos: {e}")
            return []
    
    def create_type(self, name: str, username: str = None, is_system: bool = False, order: int = 999) -> Optional[str]:
        """
        Crea un nuevo tipo de gasto
        
        Args:
            name: Nombre del tipo de gasto
            username: Usuario propietario (None para tipos del sistema)
            is_system: Si es un tipo del sistema
            order: Orden de visualización
        
        Returns:
            ID del tipo creado o None si hay error
        """
        try:
            # Verificar si ya existe
            filters = [('name', '==', name), ('active', '==', True)]
            if username and not is_system:
                filters.append(('username', '==', username))
            
            existing = self.get_all(filters=filters)
            if existing:
                print(f"El tipo de gasto '{name}' ya existe")
                return existing[0]['id']
            
            data = {
                'name': name,
                'is_system': is_system,
                'order': order,
                'active': True
            }
            
            if username and not is_system:
                data['username'] = username
            
            doc_id = self.create(data)
            return doc_id
        except Exception as e:
            print(f"Error al crear tipo de gasto: {e}")
            return None
    
    def update_type(self, type_id: str, name: str) -> bool:
        """
        Actualiza un tipo de gasto
        
        Args:
            type_id: ID del tipo
            name: Nuevo nombre
        
        Returns:
            True si se actualizó correctamente
        """
        try:
            return self.update(type_id, {'name': name})
        except Exception as e:
            print(f"Error al actualizar tipo de gasto: {e}")
            return False
    
    def delete_type(self, type_id: str) -> bool:
        """
        Elimina un tipo de gasto (soft delete)
        
        Args:
            type_id: ID del tipo
        
        Returns:
            True si se eliminó correctamente
        """
        try:
            return self.update(type_id, {'active': False})
        except Exception as e:
            print(f"Error al eliminar tipo de gasto: {e}")
            return False
    
    def initialize_system_types(self) -> bool:
        """
        Inicializa los tipos de gastos del sistema
        
        Returns:
            True si se inicializaron correctamente
        """
        system_types = [
            {'name': 'Parqueo', 'order': 1},
            {'name': 'Sueldo', 'order': 2},
            {'name': 'Tanqueo', 'order': 3},
            {'name': 'Cargue', 'order': 4},
            {'name': 'Descargue', 'order': 5},
            {'name': 'Otros', 'order': 6}
        ]
        
        try:
            for expense_type in system_types:
                self.create_type(
                    name=expense_type['name'],
                    is_system=True,
                    order=expense_type['order']
                )
            print(f"[OK] Tipos de gastos del sistema inicializados")
            return True
        except Exception as e:
            print(f"Error al inicializar tipos de gastos: {e}")
            return False
