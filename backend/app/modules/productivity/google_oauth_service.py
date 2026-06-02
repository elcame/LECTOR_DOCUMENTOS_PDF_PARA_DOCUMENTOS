"""OAuth 2.0 Google Calendar por usuario."""
import hashlib
import hmac
from typing import Optional, Tuple
from urllib.parse import urlencode

from flask import current_app
from google_auth_oauthlib.flow import Flow

from app.database.google_calendar_connections_repository import GoogleCalendarConnectionsRepository
from app.google_oauth_env import resolve_google_oauth, oauth_configured

# Permitir HTTP en desarrollo local
import os
os.environ.setdefault('OAUTHLIB_INSECURE_TRANSPORT', '1')


class GoogleOAuthService:
    def __init__(self):
        self.connections = GoogleCalendarConnectionsRepository()

    def _sign_state(self, username: str) -> str:
        secret = (current_app.config.get('SECRET_KEY') or 'fallback').encode('utf-8')
        sig = hmac.new(secret, username.lower().encode(), hashlib.sha256).hexdigest()[:20]
        return f'{username.lower()}|{sig}'

    def _verify_state(self, state: str) -> Optional[str]:
        if not state or '|' not in state:
            return None
        username, sig = state.rsplit('|', 1)
        secret = (current_app.config.get('SECRET_KEY') or 'fallback').encode('utf-8')
        expected = hmac.new(secret, username.lower().encode(), hashlib.sha256).hexdigest()[:20]
        if hmac.compare_digest(sig, expected):
            return username.lower()
        return None

    def _oauth_credentials(self):
        """Lee .env en cada petición (evita valores vacíos cacheados al importar)."""
        return resolve_google_oauth()

    def _client_config(self) -> dict:
        client_id, client_secret, redirect_uri = self._oauth_credentials()
        return {
            'web': {
                'client_id': client_id,
                'client_secret': client_secret,
                'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
                'token_uri': 'https://oauth2.googleapis.com/token',
                'redirect_uris': [redirect_uri],
            }
        }

    def _flow(self) -> Flow:
        _, _, redirect_uri = self._oauth_credentials()
        return Flow.from_client_config(
            self._client_config(),
            scopes=current_app.config.get('GOOGLE_CALENDAR_SCOPES', []),
            redirect_uri=redirect_uri,
        )

    def get_auth_url(self, username: str) -> Tuple[Optional[str], Optional[str]]:
        client_id, client_secret, _ = self._oauth_credentials()
        if not client_id or not client_secret:
            return None, (
                'Google OAuth no configurado. Crea backend/.env con '
                'GOOGLE_OAUTH_CLIENT_ID y GOOGLE_OAUTH_CLIENT_SECRET '
                '(ver backend/docs/GOOGLE_CALENDAR_OAUTH.md).'
            )
        state = self._sign_state(username)
        flow = self._flow()
        auth_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent',
            state=state,
        )
        return auth_url, None

    def handle_callback(self, code: str, state: str) -> Tuple[bool, Optional[str], Optional[str]]:
        """Returns (success, username, error_message)."""
        username = self._verify_state(state)
        if not username:
            return False, None, 'Estado OAuth inválido o expirado'

        try:
            flow = self._flow()
            flow.fetch_token(code=code)
            creds = flow.credentials
            if not creds.refresh_token:
                return False, username, 'No se obtuvo refresh token; revoca acceso en Google y vuelve a conectar'

            self.connections.save_connection(
                username=username,
                refresh_token=creds.refresh_token,
                scopes=list(creds.scopes or current_app.config.get('GOOGLE_CALENDAR_SCOPES', [])),
            )
            return True, username, None
        except Exception as e:
            return False, username, str(e)

    def disconnect(self, username: str) -> bool:
        return self.connections.delete_connection(username)

    def is_connected(self, username: str) -> bool:
        return self.connections.is_connected(username)

    def frontend_redirect_url(self, connected: bool = False, error: str = None) -> str:
        base = current_app.config.get('FRONTEND_URL', 'http://localhost:5173').rstrip('/')
        params = {}
        if connected:
            params['google'] = 'connected'
        if error:
            params['google_error'] = error[:200]
        if params:
            return f"{base}/productividad?{urlencode(params)}"
        return f"{base}/productividad"
