"""
Repositorio para operaciones con roles en Firebase
"""
from typing import Optional, Dict, List
from .firebase_repository import FirebaseRepository

DEFAULT_ROLES = {
    'super_admin': {
        'role_name': 'super_admin',
        'description': 'Super Administrador con acceso total al sistema',
        'permissions': [
            'users.create', 'users.read', 'users.update', 'users.delete',
            'roles.create', 'roles.read', 'roles.update', 'roles.delete',
            'manifiestos.read', 'manifiestos.write', 'manifiestos.delete',
            'operaciones.read', 'operaciones.write',
            'carros.read', 'carros.write', 'carros.delete',
            'gastos.read', 'gastos.write',
            'gps.read', 'gps.write',
            'admin.panel',
        ],
        'active': True,
    },
    'empresarial': {
        'role_name': 'empresarial',
        'description': 'Usuario empresarial con permisos administrativos operativos',
        'permissions': [
            'users.read', 'users.create_conductor', 'users.update_conductor',
            'roles.read',
            'manifiestos.read', 'manifiestos.write', 'manifiestos.delete',
            'operaciones.read', 'operaciones.write',
            'carros.read', 'carros.write', 'carros.delete',
            'gastos.read', 'gastos.write',
            'gps.read', 'gps.write',
            'admin.panel',
        ],
        'active': True,
    },
    'conductor': {
        'role_name': 'conductor',
        'description': 'Conductor asociado a un vehículo',
        'permissions': [
            'manifiestos.read',
            'carros.read',
            'gastos.read',
            'gps.read',
        ],
        'active': True,
    },
}

ADMIN_ROLES = ('super_admin', 'empresarial')


class RolesRepository(FirebaseRepository):
    """Repositorio para gestión de roles"""
    
    def __init__(self):
        super().__init__('roles')

    def seed_default_roles(self) -> None:
        """Crea los roles predeterminados en Firestore si no existen."""
        for role_key, role_data in DEFAULT_ROLES.items():
            existing = self.get_role_by_name(role_key)
            if not existing:
                try:
                    self.create(dict(role_data), doc_id=role_key)
                    print(f"[SEED] Rol '{role_key}' creado")
                except Exception as e:
                    print(f"[SEED] Error al crear rol '{role_key}': {e}")
    
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
