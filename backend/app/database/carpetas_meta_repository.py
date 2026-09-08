"""Metadatos de carpeta (tipo de manifiesto asignado)."""
from typing import Dict, List, Optional
from .firebase_repository import FirebaseRepository


def folder_meta_id(username: str, folder_name: str) -> str:
    return f"{username.lower()}_{folder_name}".replace('/', '_').replace('\\', '_')


class CarpetasMetaRepository(FirebaseRepository):
    def __init__(self):
        super().__init__('carpetas_meta')

    def get_for_folder(self, username: str, folder_name: str) -> Optional[Dict]:
        return self.get_by_id(folder_meta_id(username, folder_name))

    def upsert_tipo(self, username: str, folder_name: str, tipo_id: str, tipo_nombre: str) -> bool:
        doc_id = folder_meta_id(username, folder_name)
        existing = self.get_by_id(doc_id)
        payload = {
            'username': username.lower(),
            'folder_name': folder_name,
            'tipo_id': tipo_id or '',
            'tipo_nombre': tipo_nombre or '',
        }
        if existing:
            return self.update(doc_id, payload)
        self.create(payload, doc_id=doc_id)
        return True

    def list_by_username(self, username: str) -> List[Dict]:
        return self.get_all(filters=[('username', '==', username.lower())], allow_unbounded=True)

    def delete_for_folder(self, username: str, folder_name: str) -> bool:
        return self.delete(folder_meta_id(username, folder_name))
