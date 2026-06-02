"""Resuelve credenciales OAuth de Google desde .env o archivo JSON de consola."""
import json
import os
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
DEFAULT_JSON = BACKEND_DIR / 'app' / 'config' / 'google-oauth-client.json'
DEFAULT_REDIRECT = 'http://localhost:5000/api/productividad/google/callback'


def _load_dotenv():
    try:
        from dotenv import load_dotenv
        load_dotenv(BACKEND_DIR / '.env')
    except ImportError:
        pass


def resolve_google_oauth():
    """
    Returns (client_id, client_secret, redirect_uri).
    Orden: variables de entorno → archivo JSON (GOOGLE_OAUTH_CREDENTIALS_FILE o google-oauth-client.json).
    """
    _load_dotenv()

    client_id = (os.environ.get('GOOGLE_OAUTH_CLIENT_ID') or '').strip()
    client_secret = (os.environ.get('GOOGLE_OAUTH_CLIENT_SECRET') or '').strip()
    redirect_uri = (os.environ.get('GOOGLE_OAUTH_REDIRECT_URI') or DEFAULT_REDIRECT).strip()

    if client_id and client_secret:
        return client_id, client_secret, redirect_uri

    cred_path = os.environ.get('GOOGLE_OAUTH_CREDENTIALS_FILE', '').strip()
    if cred_path:
        path = Path(cred_path)
        if not path.is_absolute():
            path = BACKEND_DIR / cred_path
    else:
        path = DEFAULT_JSON

    if not path.is_file():
        return '', '', redirect_uri

    try:
        with open(path, encoding='utf-8') as f:
            data = json.load(f)
        web = data.get('web') or data.get('installed') or {}
        client_id = (web.get('client_id') or '').strip()
        client_secret = (web.get('client_secret') or '').strip()
        uris = web.get('redirect_uris') or []
        if uris and not os.environ.get('GOOGLE_OAUTH_REDIRECT_URI'):
            redirect_uri = uris[0]
        return client_id, client_secret, redirect_uri
    except (json.JSONDecodeError, OSError) as e:
        print(f'[WARN] No se pudo leer OAuth JSON ({path}): {e}')
        return '', '', redirect_uri


def oauth_configured() -> bool:
    cid, secret, _ = resolve_google_oauth()
    return bool(cid and secret)
