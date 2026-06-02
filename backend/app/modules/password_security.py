"""
Hashing seguro de contraseñas con bcrypt.

Mantiene compatibilidad con el formato legacy SHA-256 (sin salt) para que los
usuarios existentes puedan seguir entrando; al iniciar sesión correctamente con
un hash legacy, el caller debe re-hashear con bcrypt y actualizar la base de
datos llamando a `hash_password(password)`.
"""
from __future__ import annotations

import hashlib
import re
import bcrypt

_BCRYPT_PREFIX_RE = re.compile(r'^\$2[aby]\$')
_BCRYPT_ROUNDS = 12


def hash_password(password: str) -> str:
    """Hashea una contraseña con bcrypt (12 rounds)."""
    if not isinstance(password, str):
        raise TypeError('password debe ser str')
    salt = bcrypt.gensalt(rounds=_BCRYPT_ROUNDS)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def _is_bcrypt(stored_hash: str) -> bool:
    return bool(stored_hash) and bool(_BCRYPT_PREFIX_RE.match(stored_hash))


def _legacy_sha256(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()


def verify_password(password: str, stored_hash: str) -> bool:
    """
    Verifica una contraseña contra el hash almacenado.

    Soporta:
    - bcrypt ($2a$, $2b$, $2y$)
    - SHA-256 hex de 64 caracteres (formato legacy)
    """
    if not password or not stored_hash:
        return False
    try:
        if _is_bcrypt(stored_hash):
            return bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8'))
        # Legacy SHA-256
        if len(stored_hash) == 64 and all(c in '0123456789abcdef' for c in stored_hash.lower()):
            return _legacy_sha256(password) == stored_hash.lower()
    except (ValueError, TypeError):
        return False
    return False


def needs_rehash(stored_hash: str) -> bool:
    """True si el hash almacenado debería migrarse a bcrypt."""
    return bool(stored_hash) and not _is_bcrypt(stored_hash)
