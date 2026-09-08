"""Catálogo de tipos de manifiesto por usuario."""
from typing import Dict, List, Optional
from .firebase_repository import FirebaseRepository


class TiposManifiestoRepository(FirebaseRepository):
    def __init__(self):
        super().__init__('tipos_manifiesto')

    def list_by_username(self, username: str, active_only: bool = False) -> List[Dict]:
        items = self.get_all(filters=[('username', '==', username.lower())], allow_unbounded=True)
        if active_only:
            items = [item for item in items if item.get('active', True)]
        return items

    def find_by_nombre(self, username: str, nombre: str) -> Optional[Dict]:
        nombre_norm = (nombre or '').strip().lower()
        for item in self.list_by_username(username):
            if (item.get('nombre') or '').strip().lower() == nombre_norm:
                return item
        return None

    def create_tipo(self, username: str, nombre: str) -> Optional[str]:
        nombre = (nombre or '').strip()
        if not nombre:
            return None
        existing = self.find_by_nombre(username, nombre)
        if existing and existing.get('active', True):
            return None
        if existing and not existing.get('active', True):
            self.update(existing['id'], {'active': True, 'nombre': nombre})
            return existing['id']
        return self.create({
            'username': username.lower(),
            'nombre': nombre,
            'active': True,
        })

    def rename_tipo(self, doc_id: str, nombre: str) -> bool:
        nombre = (nombre or '').strip()
        if not nombre:
            return False
        return self.update(doc_id, {'nombre': nombre})

    def deactivate_tipo(self, doc_id: str) -> bool:
        return self.update(doc_id, {'active': False})
