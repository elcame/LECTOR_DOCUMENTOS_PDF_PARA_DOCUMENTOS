"""OAuth Google Calendar."""
from flask import request, jsonify, redirect

from . import bp
from app.api.manifiestos_utils import login_required_api, get_current_user
from app.modules.productivity.google_oauth_service import GoogleOAuthService


@bp.route('/google/status', methods=['GET'])
@login_required_api
def google_status():
    username = get_current_user()
    if not username:
        return jsonify({'success': False, 'error': 'No autenticado'}), 401
    from app.google_oauth_env import oauth_configured, DEFAULT_REDIRECT
    from flask import current_app

    oauth = GoogleOAuthService()
    return jsonify({
        'success': True,
        'connected': oauth.is_connected(username),
        'oauth_configured': oauth_configured(),
        'redirect_uri': current_app.config.get('GOOGLE_OAUTH_REDIRECT_URI', DEFAULT_REDIRECT),
    })


@bp.route('/google/auth-url', methods=['GET'])
@login_required_api
def google_auth_url():
    username = get_current_user()
    if not username:
        return jsonify({'success': False, 'error': 'No autenticado'}), 401
    oauth = GoogleOAuthService()
    url, err = oauth.get_auth_url(username)
    if err:
        return jsonify({'success': False, 'error': err}), 503
    return jsonify({'success': True, 'auth_url': url})


@bp.route('/google/callback', methods=['GET'])
def google_callback():
    """Callback público de Google OAuth (sin JWT)."""
    code = request.args.get('code')
    state = request.args.get('state')
    error = request.args.get('error')
    oauth = GoogleOAuthService()

    if error:
        return redirect(oauth.frontend_redirect_url(error=error))

    if not code or not state:
        return redirect(oauth.frontend_redirect_url(error='missing_code'))

    ok, username, err = oauth.handle_callback(code, state)
    if not ok:
        return redirect(oauth.frontend_redirect_url(error=err or 'oauth_failed'))
    return redirect(oauth.frontend_redirect_url(connected=True))


@bp.route('/google/disconnect', methods=['DELETE'])
@login_required_api
def google_disconnect():
    username = get_current_user()
    if not username:
        return jsonify({'success': False, 'error': 'No autenticado'}), 401
    oauth = GoogleOAuthService()
    oauth.disconnect(username)
    return jsonify({'success': True})
