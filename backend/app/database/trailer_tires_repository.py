"""
Repositorio para llantas del trailer (posiciones) en Firestore.
"""
from typing import Dict, List, Optional
from datetime import datetime

from .firebase_repository import FirebaseRepository


class TrailerTiresRepository(FirebaseRepository):
    def __init__(self):
        super().__init__('trailer_tires')

    def list_by_trailer(self, owner_username: str, trailer_id: str) -> List[Dict]:
        filters = [
            ('owner_username', '==', owner_username),
            ('trailer_id', '==', trailer_id),
            ('active', '==', True),
        ]
        results = self.get_all(filters=filters)
        try:
            results.sort(key=lambda x: (x.get('position_id') or ''))
        except Exception:
            pass
        return results

    def get_by_position(self, owner_username: str, trailer_id: str, position_id: str) -> Optional[Dict]:
        return self.find_one([
            ('owner_username', '==', owner_username),
            ('trailer_id', '==', trailer_id),
            ('active', '==', True),
            ('position_id', '==', position_id),
        ])

    def get_by_tire_id(self, owner_username: str, trailer_id: str, tire_id: str) -> Optional[Dict]:
        return self.find_one([
            ('owner_username', '==', owner_username),
            ('trailer_id', '==', trailer_id),
            ('active', '==', True),
            ('tire_id', '==', tire_id),
        ])

    def upsert_position(self, owner_username: str, trailer_id: str, position_id: str, data: Dict) -> str:
        existing = self.get_by_position(owner_username, trailer_id, position_id)
        payload = {
            'owner_username': owner_username,
            'trailer_id': trailer_id,
            'position_id': position_id,
            'meta': data.get('meta') or {},
            'active': True,
        }
        # Actualizar solo si viene en el payload (evita pisar valores existentes)
        if 'installed_at' in data:
            payload['installed_at'] = data.get('installed_at') or None
        if 'tire_id' in data:
            payload['tire_id'] = data.get('tire_id') or None
        if 'rendimiento' in data and data.get('rendimiento') is not None:
            try:
                payload['rendimiento'] = float(data.get('rendimiento') or 0)
            except Exception:
                payload['rendimiento'] = 0.0
        if existing:
            self.update(existing['id'], {**payload, 'updated_at': datetime.now().isoformat()})
            return existing['id']
        payload['created_at'] = datetime.now().isoformat()
        return self.create(payload)

