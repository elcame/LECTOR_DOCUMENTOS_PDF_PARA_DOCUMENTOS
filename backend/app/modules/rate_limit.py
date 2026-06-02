"""
Rate limiting global con Flask-Limiter.

Importa `limiter` y aplica `@limiter.limit(...)` en endpoints sensibles.
Usa almacenamiento en memoria por defecto; para Cloud Run con varias instancias
se puede cambiar a Redis configurando `RATELIMIT_STORAGE_URI`.
"""
from __future__ import annotations

import os
from flask import request

try:
    from flask_limiter import Limiter
    from flask_limiter.util import get_remote_address
    _AVAILABLE = True
except ImportError:  # pragma: no cover
    Limiter = None  # type: ignore
    get_remote_address = None  # type: ignore
    _AVAILABLE = False


def _key_func():
    """Clave por IP con soporte a X-Forwarded-For (Cloud Run / proxy)."""
    forwarded = request.headers.get('X-Forwarded-For', '')
    if forwarded:
        return forwarded.split(',')[0].strip()
    if get_remote_address:
        return get_remote_address()
    return request.remote_addr or 'unknown'


if _AVAILABLE:
    limiter = Limiter(
        key_func=_key_func,
        default_limits=[],
        storage_uri=os.environ.get('RATELIMIT_STORAGE_URI', 'memory://'),
        strategy='fixed-window',
        headers_enabled=True,
    )
else:  # Fallback no-op para no romper si la dependencia no está instalada

    class _NoopLimiter:
        def init_app(self, app):
            pass

        def limit(self, *_args, **_kwargs):
            def decorator(fn):
                return fn

            return decorator

    limiter = _NoopLimiter()  # type: ignore


def init_rate_limiter(app):
    """Inicializa el limiter con la app Flask."""
    if hasattr(limiter, 'init_app'):
        try:
            limiter.init_app(app)
        except Exception as e:  # pragma: no cover
            app.logger.warning(f'No se pudo inicializar rate limiter: {e}')

    # Handler de 429 con JSON consistente
    @app.errorhandler(429)
    def _ratelimit_handler(e):  # noqa: ANN001
        from flask import jsonify
        retry_after = getattr(e, 'retry_after', None) or 60
        return (
            jsonify({
                'success': False,
                'error': 'Demasiados intentos. Inténtalo de nuevo más tarde.',
                'code': 'RATE_LIMIT_EXCEEDED',
                'retry_after_seconds': retry_after,
            }),
            429,
        )
