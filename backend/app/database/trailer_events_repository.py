"""
Repositorio para eventos del trailer (mantenimientos, ingresos, repuestos) en Firestore.
"""
from typing import Dict, List, Optional
from datetime import datetime

from .firebase_repository import FirebaseRepository


class TrailerEventsRepository(FirebaseRepository):
    def __init__(self):
        super().__init__('trailer_events')

    def list_by_trailer(self, owner_username: str, trailer_id: str, event_type: Optional[str] = None) -> List[Dict]:
        filters = [
            ('owner_username', '==', owner_username),
            ('trailer_id', '==', trailer_id),
            ('active', '==', True),
        ]
        if event_type:
            filters.append(('event_type', '==', event_type))
        results = self.get_all(filters=filters)
        # Ordenar en memoria por date/created_at
        try:
            results.sort(key=lambda x: x.get('date') or x.get('created_at') or '', reverse=True)
        except Exception:
            pass
        return results

    def create_event(self, owner_username: str, trailer_id: str, event_type: str, data: Dict) -> Optional[str]:
        try:
            payload = {
                'owner_username': owner_username,
                'trailer_id': trailer_id,
                'event_type': event_type,
                'date': data.get('date') or datetime.now().date().isoformat(),
                'amount': float(data.get('amount') or 0) if data.get('amount') is not None else 0.0,
                'title': (data.get('title') or '').strip(),
                'note': (data.get('note') or '').strip(),
                'meta': data.get('meta') or {},
                'created_at': datetime.now().isoformat(),
                'active': True,
            }
            return self.create(payload)
        except Exception as e:
            print(f"Error al crear evento de trailer: {e}")
            return None

    def update_event(self, event_id: str, data: Dict) -> bool:
        data['updated_at'] = datetime.now().isoformat()
        return self.update(event_id, data)

    def delete_event(self, event_id: str) -> bool:
        return self.update(event_id, {'active': False, 'updated_at': datetime.now().isoformat()})

    def totals_by_type(self, owner_username: str, trailer_id: str) -> Dict[str, float]:
        events = self.list_by_trailer(owner_username, trailer_id)
        totals = {'income': 0.0, 'expense': 0.0}
        for ev in events:
            t = (ev.get('event_type') or '').strip()
            amt = ev.get('amount') or 0
            try:
                amt = float(amt)
            except Exception:
                amt = 0.0
            if t == 'income':
                totals['income'] += amt
            elif t in ('maintenance', 'part', 'expense'):
                totals['expense'] += amt
        return totals

