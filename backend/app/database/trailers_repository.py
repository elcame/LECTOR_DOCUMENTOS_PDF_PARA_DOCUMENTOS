"""
Repositorio para trailers en Firestore
"""
from typing import Dict, List, Optional
from datetime import datetime

from .firebase_repository import FirebaseRepository


class TrailersRepository(FirebaseRepository):
    def __init__(self):
        super().__init__('trailers')

    def get_by_owner(self, owner_username: str) -> List[Dict]:
        filters = [('owner_username', '==', owner_username), ('active', '==', True)]
        results = self.get_all(filters=filters)
        try:
            results.sort(key=lambda x: x.get('created_at') or '', reverse=True)
        except Exception:
            pass
        return results

    def get_by_plate(self, owner_username: str, plate: str) -> Optional[Dict]:
        return self.find_one([
            ('owner_username', '==', owner_username),
            ('active', '==', True),
            ('plate', '==', plate),
        ])

    def create_trailer(self, owner_username: str, plate: str) -> Optional[str]:
        try:
            data = {
                'owner_username': owner_username,
                'plate': plate,
                'created_at': datetime.now().isoformat(),
                'active': True,
            }
            return self.create(data)
        except Exception as e:
            print(f"Error al crear trailer: {e}")
            return None

    def update_trailer(self, trailer_id: str, data: Dict) -> bool:
        data['updated_at'] = datetime.now().isoformat()
        return self.update(trailer_id, data)

    def delete_trailer(self, trailer_id: str) -> bool:
        return self.update(trailer_id, {'active': False, 'updated_at': datetime.now().isoformat()})

