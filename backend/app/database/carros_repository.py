"""
Repositorios para operaciones con carros y propietarios en Firebase
"""
from typing import Dict, List, Optional
from .firebase_repository import FirebaseRepository


class PropietariosRepository(FirebaseRepository):
    """Repositorio para gestión de propietarios de vehículos."""

    def __init__(self):
        super().__init__('propietarios')

    def get_activos(self) -> List[Dict]:
        """Obtiene todos los propietarios activos."""
        return self.get_all(filters=[('activo', '==', True)], order_by='nombre')


class CarrosRepository(FirebaseRepository):
    """Repositorio para gestión de carros/vehículos."""

    def __init__(self):
        super().__init__('carros')

    def get_car_by_placa(self, username: str, placa: str) -> Optional[Dict]:
        """
        Obtiene un carro filtrando por username y placa.

        Args:
            username: usuario dueño de los datos
            placa: placa del vehículo (normalizada en mayúsculas)
        """
        placa_norm = (placa or '').strip().upper()
        if not placa_norm:
            return None

        filters = [
            ('username', '==', username),
            ('placa', '==', placa_norm),
            ('activo', '==', True),
        ]
        return self.find_one(filters)

    def get_carros(
        self,
        username: str,
        placa: Optional[str] = None,
        owner_id: Optional[str] = None,
        solo_activos: bool = True,
    ) -> List[Dict]:
        """Obtiene carros filtrando por usuario y opcionalmente por placa/owner."""
        filters = [('username', '==', username)]
        if solo_activos:
            filters.append(('activo', '==', True))
        if placa:
            filters.append(('placa', '==', placa.strip().upper()))
        if owner_id:
            filters.append(('ownerId', '==', owner_id))
        return self.get_all(filters=filters, order_by='placa')

