"""
API de operaciones QR (legacy - aún usa disco)
NOTA: Estos endpoints requieren migración a Firebase Storage
"""
import os
from flask import Blueprint, request, jsonify
from .manifiestos_utils import login_required_api, get_current_user, get_user_base_folder, get_user_manifiesto_qr_folder
from modules.pdf_processor import procesar_carpeta_pdfs, procesar_carpeta_qr
from modules.database import update_qr_field, save_qr_data

bp = Blueprint('manifiestos_qr', __name__)


@bp.route('/archivos_qr', methods=['GET'])
@login_required_api
def get_archivos_qr():
    """API para obtener información del QR de una carpeta específica o todas las carpetas"""
    try:
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        folder_name = request.args.get('folder_name', None)
        user_base = get_user_base_folder()
        
        qr_data_list = []
        
        if folder_name:
            folder_path = os.path.join(user_base, folder_name)
            if not os.path.exists(folder_path):
                return jsonify({'success': False, 'error': 'Carpeta no encontrada'}), 404
            
            manifiestos, _, _ = procesar_carpeta_pdfs(folder_path)
            
            for manifiesto in manifiestos:
                hora_final = manifiesto.get('qr_hora') or manifiesto.get('hora inicio', 'No encontrada')
                placa_final = manifiesto.get('qr_placa') or manifiesto.get('placa', 'No encontrada')
                fecha_qr = manifiesto.get('qr_fecha', '')
                
                fecha_liquidacion_final = manifiesto.get('fecha_liquidacion', '')
                if (fecha_liquidacion_final == 'No encontrada' or fecha_liquidacion_final == '') and fecha_qr:
                    fecha_liquidacion_final = fecha_qr
                elif not fecha_liquidacion_final or fecha_liquidacion_final == '':
                    fecha_liquidacion_final = 'No encontrada'
                
                qr_data_list.append({
                    'archivo': manifiesto.get('archivo', 'N/A'),
                    'carpeta': folder_name,
                    'hora': hora_final,
                    'placa': placa_final,
                    'origen': manifiesto.get('origen', 'No encontrado'),
                    'destino': manifiesto.get('destino', 'No encontrado'),
                    'empresa': manifiesto.get('empresa', 'No encontrada'),
                    'anticipo': manifiesto.get('anticipo', 'No encontrado'),
                    'valor_total': manifiesto.get('valor_total', 'No encontrado'),
                    'saldo': manifiesto.get('saldo', 'No encontrado'),
                    'fecha_liquidacion': fecha_liquidacion_final,
                    'fecha_pago': manifiesto.get('fecha_pago', 'No encontrada'),
                    'qr_fecha': fecha_qr,
                    'qr_numero_manifiesto': manifiesto.get('qr_numero_manifiesto', 'No encontrado'),
                    'qr_raw': manifiesto.get('qr_raw', 'N/A'),
                    'load_id': manifiesto.get('load_id', 'No encontrado'),
                    'row_id': f"{folder_name}_{manifiesto.get('archivo', '')}"
                })
        else:
            if os.path.exists(user_base):
                carpetas = [f for f in os.listdir(user_base) 
                           if os.path.isdir(os.path.join(user_base, f)) and not f.startswith('.')]
                
                for carpeta in carpetas:
                    folder_path = os.path.join(user_base, carpeta)
                    manifiestos, _, _ = procesar_carpeta_pdfs(folder_path)
                    
                    for manifiesto in manifiestos:
                        hora_final = manifiesto.get('qr_hora') or manifiesto.get('hora inicio', 'No encontrada')
                        placa_final = manifiesto.get('qr_placa') or manifiesto.get('placa', 'No encontrada')
                        fecha_qr = manifiesto.get('qr_fecha', '')
                        
                        fecha_liquidacion_final = manifiesto.get('fecha_liquidacion', '')
                        if (fecha_liquidacion_final == 'No encontrada' or fecha_liquidacion_final == '') and fecha_qr:
                            fecha_liquidacion_final = fecha_qr
                        elif not fecha_liquidacion_final or fecha_liquidacion_final == '':
                            fecha_liquidacion_final = 'No encontrada'
                        
                        qr_data_list.append({
                            'archivo': manifiesto.get('archivo', 'N/A'),
                            'carpeta': carpeta,
                            'hora': hora_final,
                            'placa': placa_final,
                            'origen': manifiesto.get('origen', 'No encontrado'),
                            'destino': manifiesto.get('destino', 'No encontrado'),
                            'empresa': manifiesto.get('empresa', 'No encontrada'),
                            'anticipo': manifiesto.get('anticipo', 'No encontrado'),
                            'valor_total': manifiesto.get('valor_total', 'No encontrado'),
                            'saldo': manifiesto.get('saldo', 'No encontrado'),
                            'fecha_liquidacion': fecha_liquidacion_final,
                            'fecha_pago': manifiesto.get('fecha_pago', 'No encontrada'),
                            'qr_fecha': fecha_qr,
                            'qr_numero_manifiesto': manifiesto.get('qr_numero_manifiesto', 'No encontrado'),
                            'qr_raw': manifiesto.get('qr_raw', 'N/A'),
                            'load_id': manifiesto.get('load_id', 'No encontrado'),
                            'row_id': f"{carpeta}_{manifiesto.get('archivo', '')}"
                        })
        
        return jsonify({
            'success': True,
            'data': qr_data_list
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/update_qr_field', methods=['POST'])
@login_required_api
def update_qr_field_api():
    """API para actualizar un campo de QR"""
    try:
        data = request.get_json()
        qr_id = data.get('qr_id')
        field = data.get('field')
        value = data.get('value')
        
        if not all([qr_id, field]):
            return jsonify({
                'success': False,
                'error': 'Datos incompletos'
            }), 400
        
        success = update_qr_field(qr_id, field, value)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Campo actualizado correctamente'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Error al actualizar el campo'
            }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/process_folder_qr', methods=['POST'])
@login_required_api
def process_folder_qr():
    """API para procesar una carpeta específica y extraer solo códigos QR"""
    try:
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        data = request.get_json()
        folder_name = data.get('folder_name')
        
        if not folder_name:
            return jsonify({
                'success': False,
                'error': 'Nombre de carpeta requerido'
            }), 400
        
        manifiesto_qr_folder = get_user_manifiesto_qr_folder()
        if not manifiesto_qr_folder:
            return jsonify({
                'success': False,
                'error': 'No se pudo determinar la carpeta del usuario'
            }), 500
        
        if not os.path.exists(manifiesto_qr_folder):
            os.makedirs(manifiesto_qr_folder)
        
        folder_path = os.path.join(manifiesto_qr_folder, folder_name)
        if not os.path.exists(folder_path):
            return jsonify({
                'success': False,
                'error': f'Carpeta "{folder_name}" no encontrada en ManifiestoQRinfo'
            }), 404
        
        resultados_qr = procesar_carpeta_qr(folder_path)
        
        qr_data_list = []
        for resultado in resultados_qr:
            archivo = resultado.get('archivo', '')
            qr_data = {
                'username': username,
                'carpeta': folder_name,
                'archivo': archivo,
                'ruta_completa': resultado.get('ruta_completa', ''),
                'placa': resultado.get('placa', ''),
                'numero_manifiesto': resultado.get('numero_manifiesto', ''),
                'fecha': resultado.get('fecha', ''),
                'hora': resultado.get('hora', ''),
                'origen': resultado.get('origen', ''),
                'destino': resultado.get('destino', ''),
            }
            save_qr_data(qr_data)
            qr_data_list.append(qr_data)
        
        return jsonify({
            'success': True,
            'data': {
                'qr_data': qr_data_list,
                'total': len(qr_data_list)
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
