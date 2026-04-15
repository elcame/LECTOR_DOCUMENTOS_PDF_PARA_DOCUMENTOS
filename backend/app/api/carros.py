"""
API de carros y propietarios
"""
import sys
from pathlib import Path
from flask import Blueprint, request, jsonify
from functools import wraps

# Agregar ruta raíz al path
ROOT_DIR = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))

from modules.auth import is_authenticated, get_current_user  # type: ignore
from app.database.carros_repository import CarrosRepository, PropietariosRepository

bp = Blueprint('carros', __name__)


def login_required_api(f):
  """Decorador para APIs que requieren autenticación."""
  @wraps(f)
  def decorated_function(*args, **kwargs):
    if not is_authenticated():
      return jsonify({'success': False, 'error': 'No autenticado'}), 401
    return f(*args, **kwargs)
  return decorated_function


@bp.route('/carros', methods=['GET'])
@login_required_api
def get_carros():
  """
  Lista carros del usuario autenticado.
  Soporta filtros por placa, ownerId y activo, opción include_owner=true,
  y from_manifestos=true para obtener placas de manifiestos no registradas.
  """
  try:
    username = get_current_user()
    placa = request.args.get('placa')
    owner_id = request.args.get('ownerId')
    include_owner = request.args.get('include_owner', 'false').lower() == 'true'
    solo_activos = request.args.get('activo', 'true').lower() != 'false'
    from_manifestos = request.args.get('from_manifestos', 'false').lower() == 'true'

    carros_repo = CarrosRepository()
    owners_repo = PropietariosRepository() if include_owner else None

    carros = carros_repo.get_carros(
      username=username,
      placa=placa,
      owner_id=owner_id,
      solo_activos=solo_activos,
    )

    # Si se solicita desde manifiestos, agregar placas no registradas
    if from_manifestos:
      try:
        from app.database.manifiestos_repository import ManifiestosRepository
        manifiestos_repo = ManifiestosRepository()
        
        # Obtener placas únicas de manifiestos
        filters = [('username', '==', username), ('active', '==', True)]
        manifiestos = manifiestos_repo.get_all(filters=filters)
        
        # Obtener placas ya registradas
        placas_registradas = {car.get('placa', '').upper() for car in carros}
        
        # Encontrar placas de manifiestos no registradas
        placas_dict = {}  # Usar diccionario para agrupar por placa
        for m in manifiestos:
            placa = m.get('placa')
            if placa and placa != 'No encontrada' and placa.strip():
                placa_normalizada = placa.strip().upper()
                if (len(placa_normalizada) >= 3 and 
                    placa_normalizada.replace('-', '').replace('_', '').isalnum() and
                    placa_normalizada not in placas_registradas):
                    
                    # Si la placa no existe en el diccionario, agregarla
                    if placa_normalizada not in placas_dict:
                        placas_dict[placa_normalizada] = {
                            'placa': placa_normalizada,
                            'from_manifesto': True,
                            'manifiesto_info': {
                                'load_id': m.get('load_id'),
                                'remesa': m.get('remesa'),
                                'conductor': m.get('conductor'),
                                'origen': m.get('origen'),
                                'destino': m.get('destino')
                            },
                            'count': 1  # Contador de manifiestos con esta placa
                        }
                    else:
                        # Si ya existe, actualizar contador y posiblemente información
                        placas_dict[placa_normalizada]['count'] += 1
                        # Preferir información más completa (conductor no nulo, etc.)
                        current_info = placas_dict[placa_normalizada]['manifiesto_info']
                        new_info = {
                            'load_id': m.get('load_id'),
                            'remesa': m.get('remesa'),
                            'conductor': m.get('conductor'),
                            'origen': m.get('origen'),
                            'destino': m.get('destino')
                        }
                        
                        # Actualizar si el nuevo tiene mejor información
                        if (not current_info.get('conductor') or current_info.get('conductor') == 'No encontrado') and \
                           new_info.get('conductor') and new_info.get('conductor') != 'No encontrado':
                            current_info.update(new_info)
        
        # Convertir diccionario a lista y agregar información de conteo
        placas_no_registradas = []
        for placa, data in placas_dict.items():
            result_data = data.copy()
            if data['count'] > 1:
                result_data['manifiesto_info']['multiple_manifestos'] = True
                result_data['manifiesto_info']['total_manifiestos'] = data['count']
            del result_data['count']  # Remover campo temporal
            placas_no_registradas.append(result_data)
        
        # Agregar al response
        return jsonify({
          'success': True, 
          'carros': carros,
          'placas_from_manifestos': sorted(placas_no_registradas, key=lambda x: x['placa'])
        })
      except ImportError:
        # Si falla la importación, continuar con el flujo normal
        pass

    if include_owner and owners_repo:
      # Enriquecer con datos de propietario
      owner_cache = {}
      for car in carros:
        oid = car.get('ownerId')
        if not oid:
          car['owner'] = None
          continue
        if oid not in owner_cache:
          owner_cache[oid] = owners_repo.get_by_id(oid)
        car['owner'] = owner_cache[oid]

    return jsonify({'success': True, 'carros': carros})
  except Exception as e:
    return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/carros', methods=['POST'])
@login_required_api
def create_carro():
  """Crea un nuevo carro para el usuario autenticado."""
  try:
    username = get_current_user()
    data = request.get_json() or {}

    placa = (data.get('placa') or '').strip().upper()
    if not placa:
      return jsonify({'success': False, 'error': 'La placa es requerida'}), 400

    carros_repo = CarrosRepository()

    # Validar unicidad por usuario + placa
    existing = carros_repo.get_car_by_placa(username, placa)
    if existing:
      return jsonify({
        'success': False,
        'error': f'Ya existe un carro con la placa {placa}',
      }), 400

    carro_data = {
      'username': username,
      'placa': placa,
      'soat_vencimiento': data.get('soat_vencimiento') or '',
      'tecnomecanica_vencimiento': data.get('tecnomecanica_vencimiento') or '',
      'modelo': data.get('modelo') or '',
      'ownerId': data.get('ownerId') or None,
      'activo': True,
    }

    doc_id = carros_repo.create(carro_data)
    created = carros_repo.get_by_id(doc_id)

    return jsonify({'success': True, 'data': created}), 201
  except Exception as e:
    return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/carros/<car_id>', methods=['PUT'])
@login_required_api
def update_carro(car_id):
  """Actualiza un carro existente del usuario autenticado."""
  try:
    username = get_current_user()
    data = request.get_json() or {}

    carros_repo = CarrosRepository()
    existing = carros_repo.get_by_id(car_id)
    if not existing or existing.get('username') != username:
      return jsonify({'success': False, 'error': 'Carro no encontrado'}), 404

    update_data = {}
    if 'placa' in data:
      nueva_placa = (data.get('placa') or '').strip().upper()
      if not nueva_placa:
        return jsonify({'success': False, 'error': 'La placa no puede ser vacía'}), 400
      # Verificar unicidad si cambia
      if nueva_placa != existing.get('placa'):
        other = carros_repo.get_car_by_placa(username, nueva_placa)
        if other and other.get('id') != car_id:
          return jsonify({
            'success': False,
            'error': f'Ya existe un carro con la placa {nueva_placa}',
          }), 400
      update_data['placa'] = nueva_placa

    for field in ['soat_vencimiento', 'tecnomecanica_vencimiento', 'modelo', 'ownerId', 'activo']:
      if field in data:
        update_data[field] = data.get(field)

    if not update_data:
      return jsonify({'success': False, 'error': 'No hay cambios para aplicar'}), 400

    success = carros_repo.update(car_id, update_data)
    if not success:
      return jsonify({'success': False, 'error': 'No se pudo actualizar el carro'}), 500

    updated = carros_repo.get_by_id(car_id)
    return jsonify({'success': True, 'data': updated})
  except Exception as e:
    return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/carros/<car_id>', methods=['DELETE'])
@login_required_api
def delete_carro(car_id):
  """Soft delete de un carro (activo = False)."""
  try:
    username = get_current_user()
    carros_repo = CarrosRepository()
    existing = carros_repo.get_by_id(car_id)
    if not existing or existing.get('username') != username:
      return jsonify({'success': False, 'error': 'Carro no encontrado'}), 404

    success = carros_repo.update(car_id, {'activo': False})
    if not success:
      return jsonify({'success': False, 'error': 'No se pudo eliminar el carro'}), 500

    return jsonify({'success': True})
  except Exception as e:
    return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/propietarios', methods=['GET'])
@login_required_api
def get_propietarios():
  """Lista propietarios (por ahora globales, sin filtrar por usuario)."""
  try:
    repo = PropietariosRepository()
    activos_only = request.args.get('activo', 'true').lower() != 'false'
    if activos_only:
      propietarios = repo.get_activos()
    else:
      propietarios = repo.get_all(order_by='nombre')
    return jsonify({'success': True, 'propietarios': propietarios})
  except Exception as e:
    return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/propietarios', methods=['POST'])
@login_required_api
def create_propietario():
  """Crea un nuevo propietario."""
  try:
    data = request.get_json() or {}
    nombre = (data.get('nombre') or '').strip()
    if not nombre:
      return jsonify({'success': False, 'error': 'El nombre es requerido'}), 400

    repo = PropietariosRepository()
    propietario_data = {
      'nombre': nombre,
      'documento': (data.get('documento') or '').strip(),
      'telefono': (data.get('telefono') or '').strip(),
      'email': (data.get('email') or '').strip(),
      'direccion': (data.get('direccion') or '').strip(),
      'activo': True,
    }
    doc_id = repo.create(propietario_data)
    created = repo.get_by_id(doc_id)
    return jsonify({'success': True, 'data': created}), 201
  except Exception as e:
    return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/propietarios/<owner_id>', methods=['PUT'])
@login_required_api
def update_propietario(owner_id):
  """Actualiza un propietario."""
  try:
    data = request.get_json() or {}
    repo = PropietariosRepository()
    existing = repo.get_by_id(owner_id)
    if not existing:
      return jsonify({'success': False, 'error': 'Propietario no encontrado'}), 404

    update_data = {}
    for field in ['nombre', 'documento', 'telefono', 'email', 'direccion', 'activo']:
      if field in data:
        update_data[field] = data.get(field)

    if not update_data:
      return jsonify({'success': False, 'error': 'No hay cambios para aplicar'}), 400

    success = repo.update(owner_id, update_data)
    if not success:
      return jsonify({'success': False, 'error': 'No se pudo actualizar el propietario'}), 500

    updated = repo.get_by_id(owner_id)
    return jsonify({'success': True, 'data': updated})
  except Exception as e:
    return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/propietarios/<owner_id>', methods=['DELETE'])
@login_required_api
def delete_propietario(owner_id):
  """Soft delete de un propietario (activo = False)."""
  try:
    repo = PropietariosRepository()
    existing = repo.get_by_id(owner_id)
    if not existing:
      return jsonify({'success': False, 'error': 'Propietario no encontrado'}), 404

    success = repo.update(owner_id, {'activo': False})
    if not success:
      return jsonify({'success': False, 'error': 'No se pudo eliminar el propietario'}), 500

    return jsonify({'success': True})
  except Exception as e:
    return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/carros/batch', methods=['POST'])
@login_required_api
def create_carros_batch():
  """Crea múltiples carros desde placas de manifiestos."""
  try:
    username = get_current_user()
    data = request.get_json() or {}
    
    placas = data.get('placas', [])
    if not placas:
      return jsonify({'success': False, 'error': 'Se requieren placas para crear carros'}), 400
    
    carros_repo = CarrosRepository()
    resultados = []
    errores = []
    
    for placa_data in placas:
      try:
        placa = placa_data.get('placa', '').strip().upper()
        if not placa:
          errores.append({'placa': placa_data.get('placa', ''), 'error': 'Placa vacía'})
          continue
        
        # Verificar si ya existe
        existing = carros_repo.get_car_by_placa(username, placa)
        if existing:
          errores.append({'placa': placa, 'error': 'Ya existe un carro con esta placa'})
          continue
        
        carro_data = {
          'username': username,
          'placa': placa,
          'soat_vencimiento': placa_data.get('soat_vencimiento') or '',
          'tecnomecanica_vencimiento': placa_data.get('tecnomecanica_vencimiento') or '',
          'modelo': placa_data.get('modelo') or '',
          'ownerId': placa_data.get('ownerId') or None,
          'activo': True,
        }
        
        doc_id = carros_repo.create(carro_data)
        created = carros_repo.get_by_id(doc_id)
        resultados.append(created)
        
      except Exception as e:
        errores.append({'placa': placa_data.get('placa', ''), 'error': str(e)})
    
    return jsonify({
      'success': True,
      'created': resultados,
      'errors': errores,
      'total_created': len(resultados),
      'total_errors': len(errores)
    })
  except Exception as e:
    return jsonify({'success': False, 'error': str(e)}), 500

