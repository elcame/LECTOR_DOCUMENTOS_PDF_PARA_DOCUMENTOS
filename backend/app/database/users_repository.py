"""
Repositorio para operaciones con usuarios en Firebase
"""
from typing import Optional, Dict, List
from google.cloud.firestore import Query
from .firebase_repository import FirebaseRepository

class UsersRepository(FirebaseRepository):
    """Repositorio para gestión de usuarios"""
    
    def __init__(self):
        super().__init__('users')
    
    def create_user(self, username: str, password_hash: str, email: str = '', 
                   full_name: str = '', role: str = 'conductor') -> bool:
        """
        Crea un nuevo usuario
        
        Args:
            username: Nombre de usuario
            password_hash: Hash de la contraseña
            email: Email del usuario
            full_name: Nombre completo
            role: Rol del usuario (admin o conductor)
        
        Returns:
            bool: True si se creó correctamente
        """
        try:
            # Verificar si el usuario ya existe
            existing = self.get_user_by_username(username)
            if existing:
                return False
            
            data = {
                'username': username.lower(),
                'password_hash': password_hash,
                'email': email,
                'full_name': full_name,
                'role': role,
                'placa_asignada': None
            }
            
            self.create(data, doc_id=username.lower())
            return True
        except Exception as e:
            print(f"Error al crear usuario: {e}")
            return False
    
    def get_user_by_username(self, username: str) -> Optional[Dict]:
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
    
    def update_user_last_login(self, username: str) -> bool:
        """
        Actualiza la fecha de último login
        
        Args:
            username: Nombre de usuario
        
        Returns:
            bool: True si se actualizó correctamente
        """
        return self.update(username.lower(), {'last_login': self._get_timestamp()})
    
    def get_all_users(self) -> List[Dict]:
        """
        Obtiene todos los usuarios
        
        Returns:
            Lista de usuarios
        """
        return self.get_all(order_by='username')
    
    def update_user_role(self, username: str, role: str) -> bool:
        """
        Actualiza el rol de un usuario
        
        Args:
            username: Nombre de usuario
            role: Nuevo rol
        
        Returns:
            bool: True si se actualizó correctamente
        """
        return self.update(username.lower(), {'role': role})
    
    def get_user_role(self, username: str) -> Optional[str]:
        """
        Obtiene el rol de un usuario
        
        Args:
            username: Nombre de usuario
        
        Returns:
            Rol del usuario o None si no existe
        """
        user = self.get_user_by_username(username)
        return user.get('role', 'conductor') if user else None
    
    def update_user_placa_asignada(self, username: str, placa: Optional[str]) -> bool:
        """
        Actualiza la placa asignada a un usuario
        
        Args:
            username: Nombre de usuario
            placa: Placa asignada (None para quitar asignación)
        
        Returns:
            bool: True si se actualizó correctamente
        """
        return self.update(username.lower(), {'placa_asignada': placa})
    
    def get_user_placa_asignada(self, username: str) -> Optional[str]:
        """
        Obtiene la placa asignada a un usuario
        
        Args:
            username: Nombre de usuario
        
        Returns:
            Placa asignada o None
        """
        user = self.get_user_by_username(username)
        return user.get('placa_asignada') if user else None
    
    def _get_timestamp(self) -> str:
        """Obtiene timestamp actual en formato ISO"""
        from datetime import datetime
        return datetime.now().isoformat()
