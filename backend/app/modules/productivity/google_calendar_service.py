"""Google Calendar API v3."""
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from flask import current_app
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.auth.transport.requests import Request

from app.database.google_calendar_connections_repository import GoogleCalendarConnectionsRepository
from app.google_oauth_env import resolve_google_oauth


class GoogleCalendarService:
    def __init__(self):
        self.connections = GoogleCalendarConnectionsRepository()

    def is_connected(self, username: str) -> bool:
        return self.connections.is_connected(username)

    def _credentials(self, username: str) -> Optional[Credentials]:
        conn = self.connections.get_connection(username)
        if not conn or not conn.get('refresh_token'):
            return None
        client_id, client_secret, _ = resolve_google_oauth()
        creds = Credentials(
            token=None,
            refresh_token=conn['refresh_token'],
            token_uri='https://oauth2.googleapis.com/token',
            client_id=client_id,
            client_secret=client_secret,
            scopes=conn.get('scopes') or current_app.config.get('GOOGLE_CALENDAR_SCOPES', []),
        )
        creds.refresh(Request())
        return creds

    def _service(self, username: str):
        creds = self._credentials(username)
        if not creds:
            return None
        return build('calendar', 'v3', credentials=creds, cache_discovery=False)

    def upsert_event(
        self,
        username: str,
        calendar_id: str,
        event_id: Optional[str],
        title: str,
        description: str,
        start_iso: str,
        end_iso: str,
    ) -> Optional[str]:
        service = self._service(username)
        if not service:
            return None

        body = {
            'summary': title,
            'description': description or '',
            'start': {'dateTime': _to_rfc3339(start_iso), 'timeZone': 'America/Bogota'},
            'end': {'dateTime': _to_rfc3339(end_iso), 'timeZone': 'America/Bogota'},
        }
        try:
            if event_id:
                updated = (
                    service.events()
                    .update(calendarId=calendar_id, eventId=event_id, body=body)
                    .execute()
                )
                return updated.get('id')
            created = service.events().insert(calendarId=calendar_id, body=body).execute()
            return created.get('id')
        except Exception as e:
            print(f'[Calendar] upsert_event error: {e}')
            return None

    def delete_event(self, username: str, calendar_id: str, event_id: str) -> bool:
        service = self._service(username)
        if not service or not event_id:
            return False
        try:
            service.events().delete(calendarId=calendar_id, eventId=event_id).execute()
            return True
        except Exception as e:
            print(f'[Calendar] delete_event error: {e}')
            return False

    def list_events(
        self,
        username: str,
        time_min: str,
        time_max: str,
        calendar_id: str = 'primary',
    ) -> List[Dict]:
        service = self._service(username)
        if not service:
            return []
        try:
            result = (
                service.events()
                .list(
                    calendarId=calendar_id,
                    timeMin=_to_rfc3339(time_min),
                    timeMax=_to_rfc3339(time_max),
                    singleEvents=True,
                    orderBy='startTime',
                )
                .execute()
            )
            events = []
            for item in result.get('items', []):
                start = item.get('start', {})
                end = item.get('end', {})
                events.append({
                    'id': item.get('id'),
                    'title': item.get('summary', '(Sin título)'),
                    'start': start.get('dateTime') or start.get('date'),
                    'end': end.get('dateTime') or end.get('date'),
                    'html_link': item.get('htmlLink'),
                })
            return events
        except Exception as e:
            print(f'[Calendar] list_events error: {e}')
            return []


def _to_rfc3339(iso_str: str) -> str:
    if not iso_str:
        return datetime.utcnow().isoformat() + 'Z'
    s = iso_str.strip()
    if s.endswith('Z') or '+' in s[10:]:
        return s
    if 'T' in s:
        return s + 'Z' if len(s) <= 19 else s
    return s + 'T00:00:00Z'
