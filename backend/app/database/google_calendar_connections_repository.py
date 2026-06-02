"""Conexiones OAuth Google Calendar por usuario."""
from datetime import datetime
from typing import Dict, Optional

from .firebase_repository import FirebaseRepository
from app.modules.productivity.token_crypto import encrypt_token, decrypt_token


class GoogleCalendarConnectionsRepository(FirebaseRepository):
    def __init__(self):
        super().__init__('google_calendar_connections')

    def _doc_id(self, username: str) -> str:
        return username.lower().replace('/', '_')

    def save_connection(
        self,
        username: str,
        refresh_token: str,
        scopes: list,
        calendar_id: str = 'primary',
    ) -> bool:
        doc_id = self._doc_id(username)
        data = {
            'username': username.lower(),
            'refresh_token_encrypted': encrypt_token(refresh_token),
            'scopes': scopes,
            'calendar_id': calendar_id,
            'connected_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat(),
        }
        self.collection.document(doc_id).set(data, merge=True)
        return True

    def get_connection(self, username: str) -> Optional[Dict]:
        doc_id = self._doc_id(username)
        doc = self.collection.document(doc_id).get()
        if not doc.exists:
            return None
        data = doc.to_dict()
        data['id'] = doc.id
        data['refresh_token'] = decrypt_token(data.get('refresh_token_encrypted', ''))
        return data

    def is_connected(self, username: str) -> bool:
        conn = self.get_connection(username)
        return bool(conn and conn.get('refresh_token'))

    def delete_connection(self, username: str) -> bool:
        doc_id = self._doc_id(username)
        try:
            self.collection.document(doc_id).delete()
            return True
        except Exception:
            return False
