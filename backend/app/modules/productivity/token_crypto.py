"""Cifrado de refresh tokens OAuth con SECRET_KEY de Flask."""
import base64
import hashlib
from flask import current_app
from cryptography.fernet import Fernet, InvalidToken


def _fernet() -> Fernet:
    secret = (current_app.config.get('SECRET_KEY') or 'fallback').encode('utf-8')
    key = base64.urlsafe_b64encode(hashlib.sha256(secret).digest())
    return Fernet(key)


def encrypt_token(plain: str) -> str:
    if not plain:
        return ''
    return _fernet().encrypt(plain.encode('utf-8')).decode('utf-8')


def decrypt_token(encrypted: str) -> str:
    if not encrypted:
        return ''
    try:
        return _fernet().decrypt(encrypted.encode('utf-8')).decode('utf-8')
    except InvalidToken:
        return ''
