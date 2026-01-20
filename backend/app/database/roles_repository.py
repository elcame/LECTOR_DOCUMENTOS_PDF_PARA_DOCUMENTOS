"""
Repositorio para operaciones con roles en Firebase
"""
from typing import Optional, Dict, List
from .firebase_repository import FirebaseRepository

class RolesRepository(FirebaseRepository):
    """Repositorio para gestión de roles"""
    
    def __init__(self):
        super().__init__('roles')
    
    def create_role(self, role_name: str, description: str = '', permissions: List[str] = None) -> bool:
        """
        Crea un nuevo rol
        
        Args:
            role_name: Nombre del rol
            description: Descripción del rol
            permissions: Lista de permisos
        
        Returns:
            bool: True si se creó correctamente
        """
        try:
            # Verificar si el rol ya existe
            existing = self.get_role_by_name(role_name)
            if existing:
                return False
            
            data = {
                'role_name': role_name.lower(),
                'description': description,
                'permissions': permissions or [],
                'active': True
            }
            
            self.create(data, doc_id=role_name.lower())
            return True
        except Exception as e:
            print(f"Error al crear rol: {e}")
            return False
    
    def get_role_by_name(self, role_name: str) -> Optional[Dict]:
        """
        Obtiene un rol por su nombre
        
        Args:
            role_name: Nombre del rol
        
        Returns:
            Dict con los datos del rol o None si no existe
        """
        try:
            doc = self.collection.document(role_name.lower()).get()
            if doc.exists:
                data = doc.to_dict()
                data['id'] = doc.id
                return data
            return None
        except Exception as e:
            print(f"Error al obtener rol: {e}")
            return None
    
    def get_by_id(self, role_id: str) -> Optional[Dict]:
        """
        Obtiene un rol por su ID
        
        Args:
            role_id: ID del rol
        
        Returns:
            Dict con los datos del rol o None si no existe
        """
        try:
            doc = self.collection.document(role_id).get()
            if doc.exists:
                data = doc.to_dict()
                data['id'] = doc.id
                return data
            return None
        except Exception as e:
            print(f"Error al obtener rol por ID: {e}")
            return None
    
    def get_all_roles(self) -> List[Dict]:
        """
        Obtiene todos los roles
        
        Returns:
            Lista de roles
        """
        return self.get_all(order_by='role_name')
    
    def get_active_roles(self) -> List[Dict]:
        """
        Obtiene solo los roles activos
        
        Returns:
            Lista de roles activos
        """
        try:
            query = self.collection.where('active', '==', True).order_by('role_name')
            docs = query.stream()
            return [{'id': doc.id, **doc.to_dict()} for doc in docs]
        except Exception as e:
            print(f"Error al obtener roles activos: {e}")
            return []
    
    def update_role(self, role_name: str, data: Dict) -> bool:
        """
        Actualiza un rol
        
        Args:
            role_name: Nombre del rol
            data: Datos a actualizar
        
        Returns:
            bool: True si se actualizó correctamente
        """
        return self.update(role_name.lower(), data)
    
    def delete_role(self, role_name: str) -> bool:
        """
        Elimina un rol (soft delete)
        
        Args:
            role_name: Nombre del rol
        
        Returns:
            bool: True si se eliminó correctamente
        """
        return self.update(role_name.lower(), {'active': False})
    
    def add_permission_to_role(self, role_name: str, permission: str) -> bool:
        """
        Agrega un permiso a un rol
        
        Args:
            role_name: Nombre del rol
            permission: Permiso a agregar
        
        Returns:
            bool: True si se agregó correctamente
        """
        try:
            role = self.get_role_by_name(role_name)
            if not role:
                return False
            
            permissions = role.get('permissions', [])
            if permission not in permissions:
                permissions.append(permission)
                return self.update_role(role_name, {'permissions': permissions})
            return True
        except Exception as e:
            print(f"Error al agregar permiso: {e}")
            return False
    
    def remove_permission_from_role(self, role_name: str, permission: str) -> bool:
        """
        Elimina un permiso de un rol
        
        Args:
            role_name: Nombre del rol
            permission: Permiso a eliminar
        
        Returns:
            bool: True si se eliminó correctamente
        """
        try:
            role = self.get_role_by_name(role_name)
            if not role:
                return False
            
            permissions = role.get('permissions', [])
            if permission in permissions:
                permissions.remove(permission)
                return self.update_role(role_name, {'permissions': permissions})
            return True
        except Exception as e:
            print(f"Error al eliminar permiso: {e}")
            return False
