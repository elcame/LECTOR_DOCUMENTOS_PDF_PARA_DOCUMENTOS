"""
Repositorio para gestionar hojas de gasto reutilizables en Firestore
"""
from typing import Dict, List, Optional
from datetime import datetime
from .firebase_repository import FirebaseRepository


class ExpenseSheetsRepository(FirebaseRepository):
    """Repositorio para hojas de gasto (plantillas)"""

    def __init__(self):
        super().__init__('expense_sheets')

    def get_by_owner(self, owner_username: str) -> List[Dict]:
        filters = [
            ('owner_username', '==', owner_username),
            ('active', '==', True),
        ]
        return self.get_all(filters=filters, order_by='created_at')

    def create_sheet(self, owner_username: str, name: str, items: List[Dict]) -> Optional[str]:
        try:
            data = {
                'owner_username': owner_username,
                'name': name,
                'items': items,
                'created_at': datetime.now().isoformat(),
                'active': True,
            }
            return self.create(data)
        except Exception as e:
            print(f"Error al crear hoja de gasto: {e}")
            return None

    def update_sheet(self, sheet_id: str, data: Dict) -> bool:
        data['updated_at'] = datetime.now().isoformat()
        return self.update(sheet_id, data)

    def delete_sheet(self, sheet_id: str) -> bool:
        return self.update(sheet_id, {'active': False, 'updated_at': datetime.now().isoformat()})

