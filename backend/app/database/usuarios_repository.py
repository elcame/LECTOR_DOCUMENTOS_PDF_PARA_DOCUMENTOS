"""
Repositorio para operaciones con usuarios en Firebase
"""
from typing import Optional, Dict, List
from google.cloud.firestore import Query
from .firebase_repository import FirebaseRepository

class UsuariosRepository(FirebaseRepository):
    """Repositorio para gestión de usuarios"""
    
    def __init__(self):
        super().__init__('usuarios')
    
    def create_usuario(self, username: str, email: str, password_hash: str, 
                      full_name: str = '', role_id: str = None, active: bool = True) -> bool:
        """
        Crea un nuevo usuario
        
        Args:
            username: Nombre de usuario
            email: Email del usuario
            password_hash: Hash de la contraseña
            full_name: Nombre completo
            role_id: ID del rol asignado
            active: Si el usuario está activo
        
        Returns:
            bool: True si se creó correctamente
        """
        try:
            # Verificar si el usuario ya existe
            existing = self.get_usuario_by_username(username)
            if existing:
                return False
            
            data = {
                'username': username.lower(),
                'email': (email or '').lower() if isinstance(email, str) else '',
                'password_hash': password_hash,
                'full_name': full_name,
                'role_id': role_id,
                'active': active,
                'created_at': self._get_timestamp(),
                'last_login': None
            }
            
            self.create(data, doc_id=username.lower())
            return True
        except Exception as e:
            print(f"Error al crear usuario: {e}")
            return False
    
    def get_usuario_by_username(self, username: str) -> Optional[Dict]:
        """
        Obtiene un usuario por su nombre de usuario
        
        Args:
            username: Nombre de usuario
        
        Returns:
            Dict con los datos del usuario o None si no existe
        """
        try:
            doc = self.collection.document(username.lower()).get()
            if doc.exists:
                data = doc.to_dict()
                data['id'] = doc.id
                return data
            return None
        except Exception as e:
            print(f"Error al obtener usuario: {e}")
            return None
    
    def get_usuario_by_email(self, email: str) -> Optional[Dict]:
        """
        Obtiene un usuario por su email
        
        Args:
            email: Email del usuario
        
        Returns:
            Dict con los datos del usuario o None si no existe
        """
        try:
            query = self.collection.where('email', '==', email.lower()).limit(1)
            docs = list(query.stream())
            if docs:
                data = docs[0].to_dict()
                data['id'] = docs[0].id
                return data
            return None
        except Exception as e:
            print(f"Error al obtener usuario por email: {e}")
            return None
    
    def get_all_usuarios(self) -> List[Dict]:
        """
        Obtiene todos los usuarios
        
        Returns:
            Lista de usuarios
        """
        return self.get_all(order_by='username')
    
    def get_active_usuarios(self) -> List[Dict]:
        """
        Obtiene solo los usuarios activos
        
        Returns:
            Lista de usuarios activos
        """
        try:
            query = self.collection.where('active', '==', True).order_by('username')
            docs = query.stream()
            return [{'id': doc.id, **doc.to_dict()} for doc in docs]
        except Exception as e:
            print(f"Error al obtener usuarios activos: {e}")
            return []
    
    def update_usuario(self, username: str, data: Dict) -> bool:
        """
        Actualiza un usuario
        
        Args:
            username: Nombre de usuario
            data: Datos a actualizar
        
        Returns:
            bool: True si se actualizó correctamente
        """
        data['updated_at'] = self._get_timestamp()
        return self.update(username.lower(), data)
    
    def delete_usuario(self, username: str) -> bool:
        """
        Elimina un usuario (soft delete)
        
        Args:
            username: Nombre de usuario
        
        Returns:
            bool: True si se eliminó correctamente
        """
        return self.update(username.lower(), {'active': False})
    
    def assign_role(self, username: str, role_id: str) -> bool:
        """
        Asigna un rol a un usuario
        
        Args:
            username: Nombre de usuario
            role_id: ID del rol
        
        Returns:
            bool: True si se asignó correctamente
        """
        return self.update_usuario(username, {'role_id': role_id})
    
    def update_last_login(self, username: str) -> bool:
        """
        Actualiza la fecha de último login
        
        Args:
            username: Nombre de usuario
        
        Returns:
            bool: True si se actualizó correctamente
        """
        return self.update_usuario(username, {'last_login': self._get_timestamp()})
    
    def get_usuarios_by_role(self, role_id: str) -> List[Dict]:
        """
        Obtiene todos los usuarios con un rol específico
        
        Args:
            role_id: ID del rol
        
        Returns:
            Lista de usuarios
        """
        try:
            query = self.collection.where('role_id', '==', role_id).where('active', '==', True)
            docs = query.stream()
            return [{'id': doc.id, **doc.to_dict()} for doc in docs]
        except Exception as e:
            print(f"Error al obtener usuarios por rol: {e}")
            return []
    
    def _get_timestamp(self) -> str:
        """Obtiene timestamp actual en formato ISO"""
        from datetime import datetime
        return datetime.now().isoformat()
