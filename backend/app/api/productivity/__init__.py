"""API REST módulo Productividad GTD + Google Calendar."""
from flask import Blueprint

bp = Blueprint('productivity', __name__)

from . import tasks, google_oauth, calendar  # noqa: E402, F401
