"""
Repositorio para proveedores en Firestore
"""
from typing import Dict, List, Optional
from datetime import datetime

from .firebase_repository import FirebaseRepository


class ProvidersRepository(FirebaseRepository):
    def __init__(self):
        super().__init__('providers')

    def list_by_owner(self, owner_username: str) -> List[Dict]:
        filters = [('owner_username', '==', owner_username), ('active', '==', True)]
        results = self.get_all(filters=filters)
        try:
            results.sort(key=lambda x: x.get('created_at') or '', reverse=True)
        except Exception:
            pass
        return results

    def create_provider(self, owner_username: str, name: str, phone: str = None, notes: str = None) -> Optional[str]:
        try:
            data = {
                'owner_username': owner_username,
                'name': (name or '').strip(),
                'phone': (phone or '').strip(),
                'notes': (notes or '').strip(),
                'created_at': datetime.now().isoformat(),
                'active': True,
            }
            return self.create(data)
        except Exception as e:
            print(f"Error al crear proveedor: {e}")
            return None

    def delete_provider(self, provider_id: str) -> bool:
        return self.update(provider_id, {'active': False, 'updated_at': datetime.now().isoformat()})

