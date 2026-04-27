"""
Repositorio para productos/servicios de proveedores en Firestore
"""
from typing import Dict, List, Optional
from datetime import datetime

from .firebase_repository import FirebaseRepository


class ProviderItemsRepository(FirebaseRepository):
    def __init__(self):
        super().__init__('provider_items')

    def list_by_provider(self, owner_username: str, provider_id: str) -> List[Dict]:
        filters = [
            ('owner_username', '==', owner_username),
            ('provider_id', '==', provider_id),
            ('active', '==', True),
        ]
        results = self.get_all(filters=filters)
        try:
            results.sort(key=lambda x: x.get('created_at') or '', reverse=True)
        except Exception:
            pass
        return results

    def create_item(self, owner_username: str, provider_id: str, item_type: str, name: str, price: float = 0.0) -> Optional[str]:
        try:
            data = {
                'owner_username': owner_username,
                'provider_id': provider_id,
                'item_type': item_type,  # 'product' | 'service'
                'name': (name or '').strip(),
                'price': float(price or 0),
                'created_at': datetime.now().isoformat(),
                'active': True,
            }
            return self.create(data)
        except Exception as e:
            print(f"Error al crear item de proveedor: {e}")
            return None

    def delete_item(self, item_id: str) -> bool:
        return self.update(item_id, {'active': False, 'updated_at': datetime.now().isoformat()})

