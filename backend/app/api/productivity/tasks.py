"""Endpoints de tareas GTD."""
from flask import request, jsonify

from . import bp
from app.api.manifiestos_utils import login_required_api, get_current_user
from app.modules.productivity.gtd_service import GTDService


@bp.route('/tasks', methods=['GET'])
@login_required_api
def list_tasks():
    username = get_current_user()
    if not username:
        return jsonify({'success': False, 'error': 'No autenticado'}), 401
    task_list = request.args.get('list')
    service = GTDService()
    tasks = service.list_tasks(username, task_list)
    return jsonify({'success': True, 'tasks': tasks})


@bp.route('/tasks', methods=['POST'])
@login_required_api
def create_task():
    username = get_current_user()
    if not username:
        return jsonify({'success': False, 'error': 'No autenticado'}), 401
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    if not title:
        return jsonify({'success': False, 'error': 'El título es requerido'}), 400
    service = GTDService()
    task = service.capture_task(
        username,
        title,
        notes=data.get('notes', ''),
        priority=data.get('priority', 'medium'),
    )
    if not task:
        return jsonify({'success': False, 'error': 'No se pudo crear la tarea'}), 400
    return jsonify({'success': True, 'task': task}), 201


@bp.route('/tasks/<task_id>', methods=['PATCH'])
@login_required_api
def update_task(task_id):
    username = get_current_user()
    if not username:
        return jsonify({'success': False, 'error': 'No autenticado'}), 401
    data = request.get_json() or {}
    allowed = (
        'title', 'notes', 'list', 'priority',
        'scheduled_start', 'scheduled_end',
    )
    updates = {k: data[k] for k in allowed if k in data}
    if not updates:
        return jsonify({'success': False, 'error': 'Sin campos para actualizar'}), 400
    service = GTDService()
    task = service.update_task(username, task_id, updates)
    if not task:
        return jsonify({'success': False, 'error': 'Tarea no encontrada'}), 404
    return jsonify({'success': True, 'task': task})


@bp.route('/tasks/<task_id>/complete', methods=['POST'])
@login_required_api
def complete_task(task_id):
    username = get_current_user()
    if not username:
        return jsonify({'success': False, 'error': 'No autenticado'}), 401
    service = GTDService()
    task = service.complete_task(username, task_id)
    if not task:
        return jsonify({'success': False, 'error': 'Tarea no encontrada'}), 404
    return jsonify({'success': True, 'task': task})


@bp.route('/tasks/<task_id>', methods=['DELETE'])
@login_required_api
def delete_task(task_id):
    username = get_current_user()
    if not username:
        return jsonify({'success': False, 'error': 'No autenticado'}), 401
    service = GTDService()
    if not service.delete_task(username, task_id):
        return jsonify({'success': False, 'error': 'Tarea no encontrada'}), 404
    return jsonify({'success': True})


@bp.route('/stats/daily', methods=['GET'])
@login_required_api
def daily_stats():
    username = get_current_user()
    if not username:
        return jsonify({'success': False, 'error': 'No autenticado'}), 401
    date_str = request.args.get('date')
    service = GTDService()
    stats = service.daily_stats(username, date_str)
    return jsonify({'success': True, 'stats': stats})
