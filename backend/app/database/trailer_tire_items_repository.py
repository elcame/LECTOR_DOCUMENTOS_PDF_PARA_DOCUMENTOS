"""
Repositorio para inventario de llantas (items) por trailer en Firestore.
"""
from typing import Dict, List, Optional
from datetime import datetime

from .firebase_repository import FirebaseRepository


class TrailerTireItemsRepository(FirebaseRepository):
    def __init__(self):
        super().__init__('trailer_tire_items')

    def list_by_trailer(self, owner_username: str, trailer_id: str) -> List[Dict]:
        filters = [
            ('owner_username', '==', owner_username),
            ('trailer_id', '==', trailer_id),
            ('active', '==', True),
        ]
        results = self.get_all(filters=filters)
        try:
            results.sort(key=lambda x: x.get('created_at') or '', reverse=True)
        except Exception:
            pass
        return results

    def create_item(self, owner_username: str, trailer_id: str, label: str = None) -> Optional[str]:
        try:
            data = {
                'owner_username': owner_username,
                'trailer_id': trailer_id,
                'label': (label or '').strip(),
                'created_at': datetime.now().isoformat(),
                'active': True,
            }
            return self.create(data)
        except Exception as e:
            print(f"Error al crear item de llanta: {e}")
            return None

