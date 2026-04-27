"""
API Blueprint para gestión de gastos de viaje y tipos de gastos
"""
from flask import Blueprint, request, jsonify
from functools import wraps
from modules.auth import get_current_user, is_authenticated

bp = Blueprint('expenses', __name__)

def login_required_api(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not is_authenticated():
            return jsonify({'success': False, 'error': 'No autenticado'}), 401
        return f(*args, **kwargs)
    return decorated_function

# ============================================================================
# TIPOS DE GASTOS
# ============================================================================

@bp.route('/expense-types', methods=['GET'])
@login_required_api
def get_expense_types():
    """Obtiene todos los tipos de gastos"""
    try:
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        from app.database.expense_types_repository import ExpenseTypesRepository
        repo = ExpenseTypesRepository()
        
        types = repo.get_all_types(username=username)
        
        return jsonify({
            'success': True,
            'data': types
        })
    except Exception as e:
        print(f"Error al obtener tipos de gastos: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/expense-types', methods=['POST'])
@login_required_api
def create_expense_type():
    """Crea un nuevo tipo de gasto"""
    try:
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        data = request.get_json()
        name = data.get('name')
        
        if not name:
            return jsonify({
                'success': False,
                'error': 'Nombre del tipo de gasto requerido'
            }), 400
        
        from app.database.expense_types_repository import ExpenseTypesRepository
        repo = ExpenseTypesRepository()
        
        type_id = repo.create_type(name=name, username=username, is_system=False)
        
        if type_id:
            return jsonify({
                'success': True,
                'message': 'Tipo de gasto creado correctamente',
                'data': {'id': type_id}
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Error al crear tipo de gasto'
            }), 500
    except Exception as e:
        print(f"Error al crear tipo de gasto: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/expense-types/<type_id>', methods=['PUT'])
@login_required_api
def update_expense_type(type_id):
    """Actualiza un tipo de gasto"""
    try:
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        data = request.get_json()
        name = data.get('name')
        
        if not name:
            return jsonify({
                'success': False,
                'error': 'Nombre del tipo de gasto requerido'
            }), 400
        
        from app.database.expense_types_repository import ExpenseTypesRepository
        repo = ExpenseTypesRepository()
        
        success = repo.update_type(type_id, name)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Tipo de gasto actualizado correctamente'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Error al actualizar tipo de gasto'
            }), 500
    except Exception as e:
        print(f"Error al actualizar tipo de gasto: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/expense-types/<type_id>', methods=['DELETE'])
@login_required_api
def delete_expense_type(type_id):
    """Elimina un tipo de gasto"""
    try:
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        from app.database.expense_types_repository import ExpenseTypesRepository
        repo = ExpenseTypesRepository()
        
        success = repo.delete_type(type_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Tipo de gasto eliminado correctamente'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Error al eliminar tipo de gasto'
            }), 500
    except Exception as e:
        print(f"Error al eliminar tipo de gasto: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/expense-types/initialize', methods=['POST'])
@login_required_api
def initialize_expense_types():
    """Inicializa los tipos de gastos del sistema"""
    try:
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        from app.database.expense_types_repository import ExpenseTypesRepository
        repo = ExpenseTypesRepository()
        
        success = repo.initialize_system_types()
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Tipos de gastos inicializados correctamente'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Error al inicializar tipos de gastos'
            }), 500
    except Exception as e:
        print(f"Error al inicializar tipos de gastos: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ============================================================================
# GASTOS DE VIAJE
# ============================================================================

@bp.route('/trip-expenses', methods=['GET'])
@login_required_api
def get_trip_expenses():
    """Obtiene gastos de viaje por manifiesto o usuario"""
    try:
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        manifest_id = request.args.get('manifest_id')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        from app.database.trip_expenses_repository import TripExpensesRepository
        repo = TripExpensesRepository()
        
        if manifest_id:
            expenses = repo.get_expenses_by_manifest(manifest_id)
        else:
            expenses = repo.get_expenses_by_user(username, start_date, end_date)
        
        return jsonify({
            'success': True,
            'data': expenses
        })
    except Exception as e:
        print(f"Error al obtener gastos de viaje: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/trip-expenses', methods=['POST'])
@login_required_api
def create_trip_expense():
    """Crea un nuevo gasto de viaje"""
    try:
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        data = request.get_json()
        manifest_id = data.get('manifest_id')
        expense_type = data.get('expense_type')
        amount = data.get('amount')
        description = data.get('description')  # Opcional
        date = data.get('date')  # Opcional
        
        if not all([manifest_id, expense_type, amount]):
            return jsonify({
                'success': False,
                'error': 'Datos incompletos (manifest_id, expense_type, amount requeridos)'
            }), 400
        
        from app.database.trip_expenses_repository import TripExpensesRepository
        repo = TripExpensesRepository()
        
        expense_id = repo.create_expense(
            manifest_id=manifest_id,
            username=username,
            expense_type=expense_type,
            amount=amount,
            description=description,
            date=date
        )
        
        if expense_id:
            return jsonify({
                'success': True,
                'message': 'Gasto creado correctamente',
                'data': {'id': expense_id}
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Error al crear gasto'
            }), 500
    except Exception as e:
        print(f"Error al crear gasto de viaje: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/trip-expenses/<expense_id>', methods=['PUT'])
@login_required_api
def update_trip_expense(expense_id):
    """Actualiza un gasto de viaje"""
    try:
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        data = request.get_json()
        expense_type = data.get('expense_type')
        amount = data.get('amount')
        description = data.get('description')
        date = data.get('date')
        
        from app.database.trip_expenses_repository import TripExpensesRepository
        repo = TripExpensesRepository()
        
        success = repo.update_expense(
            expense_id=expense_id,
            expense_type=expense_type,
            amount=amount,
            description=description,
            date=date
        )
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Gasto actualizado correctamente'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Error al actualizar gasto'
            }), 500
    except Exception as e:
        print(f"Error al actualizar gasto de viaje: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/trip-expenses/<expense_id>', methods=['DELETE'])
@login_required_api
def delete_trip_expense(expense_id):
    """Elimina un gasto de viaje"""
    try:
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        from app.database.trip_expenses_repository import TripExpensesRepository
        repo = TripExpensesRepository()
        
        success = repo.delete_expense(expense_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Gasto eliminado correctamente'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Error al eliminar gasto'
            }), 500
    except Exception as e:
        print(f"Error al eliminar gasto de viaje: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/trip-expenses/total/<manifest_id>', methods=['GET'])
@login_required_api
def get_total_expenses(manifest_id):
    """Obtiene el total de gastos de un manifiesto"""
    try:
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        from app.database.trip_expenses_repository import TripExpensesRepository
        repo = TripExpensesRepository()
        
        total = repo.get_total_expenses(manifest_id)
        by_type = repo.get_expenses_by_type(manifest_id)
        
        return jsonify({
            'success': True,
            'data': {
                'total': total,
                'by_type': by_type
            }
        })
    except Exception as e:
        print(f"Error al obtener total de gastos: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/trip-expenses/total-by-placa', methods=['GET'])
@login_required_api
def get_total_expenses_by_placa():
    """Obtiene el total de gastos para todos los manifiestos de una placa."""
    try:
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401

        placa = (request.args.get('placa') or '').strip().upper()
        if not placa:
            return jsonify({'success': False, 'error': 'Parámetro placa requerido'}), 400

        from app.database.manifiestos_repository import ManifiestosRepository
        from app.database.trip_expenses_repository import TripExpensesRepository

        man_repo = ManifiestosRepository()
        exp_repo = TripExpensesRepository()

        # Manifiestos de esa placa para el usuario actual
        manifests = man_repo.get_all(filters=[
            ('username', '==', username),
            ('active', '==', True),
            ('placa', '==', placa),
        ])

        manifest_ids = {m.get('id') for m in (manifests or []) if m.get('id')}
        if not manifest_ids:
            return jsonify({'success': True, 'data': {'placa': placa, 'total_gastos': 0.0, 'manifiestos': 0}})

        # Cargar gastos del usuario y sumar solo los que pertenezcan a esos manifiestos
        expenses = exp_repo.get_expenses_by_user(username)
        total = 0.0
        for e in (expenses or []):
            if e.get('manifest_id') in manifest_ids:
                try:
                    total += float(e.get('amount') or 0)
                except Exception:
                    pass

        return jsonify({
            'success': True,
            'data': {
                'placa': placa,
                'total_gastos': total,
                'manifiestos': len(manifest_ids),
            }
        })
    except ImportError:
        return jsonify({'success': False, 'error': 'Firebase no está disponible'}), 503
    except Exception as e:
        print(f"Error al obtener total de gastos por placa: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/trip-expenses/by-type-by-placa', methods=['GET'])
@login_required_api
def get_expenses_by_type_by_placa():
    """Obtiene el total de gastos agrupados por tipo para una placa."""
    try:
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401

        placa = (request.args.get('placa') or '').strip().upper()
        if not placa:
            return jsonify({'success': False, 'error': 'Parámetro placa requerido'}), 400

        from app.database.manifiestos_repository import ManifiestosRepository
        from app.database.trip_expenses_repository import TripExpensesRepository

        man_repo = ManifiestosRepository()
        exp_repo = TripExpensesRepository()

        manifests = man_repo.get_all(filters=[
            ('username', '==', username),
            ('active', '==', True),
            ('placa', '==', placa),
        ])
        manifest_ids = {m.get('id') for m in (manifests or []) if m.get('id')}

        if not manifest_ids:
            return jsonify({
                'success': True,
                'data': {
                    'placa': placa,
                    'total': 0.0,
                    'by_type': [],
                }
            })

        expenses = exp_repo.get_expenses_by_user(username)
        totals = {}
        total = 0.0
        for e in (expenses or []):
            if e.get('manifest_id') not in manifest_ids:
                continue
            expense_type = (e.get('expense_type') or 'Otros')
            try:
                amount = float(e.get('amount') or 0)
            except Exception:
                amount = 0.0
            totals[expense_type] = totals.get(expense_type, 0.0) + amount
            total += amount

        by_type = [
            {'expense_type': k, 'total': float(v)}
            for k, v in sorted(totals.items(), key=lambda x: x[1], reverse=True)
        ]

        return jsonify({
            'success': True,
            'data': {
                'placa': placa,
                'total': float(total),
                'by_type': by_type,
            }
        })
    except ImportError:
        return jsonify({'success': False, 'error': 'Firebase no está disponible'}), 503
    except Exception as e:
        print(f"Error al obtener gastos por tipo y placa: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500
