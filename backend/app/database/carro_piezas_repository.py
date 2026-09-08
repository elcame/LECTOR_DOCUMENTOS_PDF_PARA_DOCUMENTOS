"""Piezas instaladas en un carro (activas e historial)."""
from typing import Dict, List, Optional
from .firebase_repository import FirebaseRepository
from .carro_piezas_catalog import POSITIONS


class CarroPiezasRepository(FirebaseRepository):
    def __init__(self):
        super().__init__('carro_piezas')

    def list_by_carro(self, username: str, carro_id: str, active_only: bool = False) -> List[Dict]:
        items = self.get_all(filters=[('username', '==', username)], allow_unbounded=True)
        items = [item for item in items if item.get('carro_id') == carro_id]
        if active_only:
            items = [item for item in items if item.get('active') is True]
        return items

    def list_history(self, username: str, carro_id: str, position_id: str) -> List[Dict]:
        items = [
            item for item in self.list_by_carro(username, carro_id)
            if item.get('position_id') == position_id
        ]
        items.sort(key=lambda i: i.get('installed_at') or '', reverse=True)
        return items

    def get_active(self, username: str, carro_id: str, position_id: str) -> Optional[Dict]:
        for item in self.list_by_carro(username, carro_id, active_only=True):
            if item.get('position_id') == position_id:
                return item
        return None

    def place_pieza(self, username: str, carro_id: str, position_id: str,
                    installed_at: str, km_installed=None, marca='', numeracion='') -> Optional[str]:
        meta = POSITIONS.get(position_id)
        if not meta:
            return None
        km_val = km_installed if km_installed not in (None, '') else ''
        return self.create({
            'username': username,
            'carro_id': carro_id,
            'position_id': position_id,
            'part_kind': meta['part_kind'],
            'installed_at': installed_at,
            'km_installed': km_val,
            'marca': (marca or '').strip(),
            'numeracion': (numeracion or '').strip(),
            'active': True,
            'removed_at': '',
            'km_removed': '',
        })

    def close_pieza(self, doc_id: str, removed_at: str, km_removed=None) -> bool:
        km_val = km_removed if km_removed not in (None, '') else ''
        return self.update(doc_id, {
            'active': False,
            'removed_at': removed_at,
            'km_removed': km_val,
        })
