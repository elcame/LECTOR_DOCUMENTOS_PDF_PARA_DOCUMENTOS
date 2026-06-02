"""Lectura de eventos Google Calendar."""
from datetime import datetime, timedelta

from flask import request, jsonify

from . import bp
from app.api.manifiestos_utils import login_required_api, get_current_user
from app.modules.productivity.google_calendar_service import GoogleCalendarService
from app.modules.productivity.google_oauth_service import GoogleOAuthService


@bp.route('/calendar/events', methods=['GET'])
@login_required_api
def list_calendar_events():
    username = get_current_user()
    if not username:
        return jsonify({'success': False, 'error': 'No autenticado'}), 401

    oauth = GoogleOAuthService()
    if not oauth.is_connected(username):
        return jsonify({
            'success': True,
            'connected': False,
            'events': [],
        })

    date_str = request.args.get('date')
    if date_str:
        time_min = f'{date_str}T00:00:00'
        time_max = f'{date_str}T23:59:59'
    else:
        now = datetime.utcnow()
        time_min = now.isoformat() + 'Z'
        time_max = (now + timedelta(days=7)).isoformat() + 'Z'

    cal = GoogleCalendarService()
    events = cal.list_events(username, time_min, time_max)
    return jsonify({
        'success': True,
        'connected': True,
        'events': events,
    })
