from flask import Flask, render_template, request, jsonify, send_file
import os
import tempfile
import shutil
from werkzeug.utils import secure_filename

# Importar módulos organizados
from modules.pdf_processor import procesar_carpeta_pdfs
from modules.excel_generator import crear_excel, obtener_ultimo_excel
from modules.analytics import build_operaciones_payload

app = Flask(__name__)

# Configuración para archivos
BASE_FOLDER = 'MANIFIESTOS'
ALLOWED_EXTENSIONS = {'pdf'}

if not os.path.exists(BASE_FOLDER):
    os.makedirs(BASE_FOLDER)

app.config['BASE_FOLDER'] = BASE_FOLDER

# Variables globales para mantener los datos actualizados
current_manifiestos = []
current_facturas_electronicas = []
current_folder_name = None  # Nombre de la carpeta actual

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def extraccion_manifiestos():
    return render_template('index.html')

@app.route('/operacionesmanifiestos')
def operaciones_manifiestos():
    return render_template('operacionesmanifiestos.html')

@app.route('/api/folders')
def api_folders():
    """API para obtener carpetas de manifiestos disponibles"""
    try:
        folders = []
        manifiestos_path = os.path.join(os.getcwd(), 'MANIFIESTOS')
        
        # Verificar si existe la carpeta MANIFIESTOS
        if not os.path.exists(manifiestos_path):
            return jsonify({
                'success': True,
                'folders': [],
                'message': 'No existe la carpeta MANIFIESTOS'
            })
        
        # Buscar carpetas dentro de MANIFIESTOS que contengan PDFs
        for item in os.listdir(manifiestos_path):
            item_path = os.path.join(manifiestos_path, item)
            if os.path.isdir(item_path) and not item.startswith('.'):
                # Verificar si contiene PDFs
                pdf_files = [f for f in os.listdir(item_path) if f.lower().endswith('.pdf')]
                if pdf_files:
                    # Verificar si existe un Excel para esta carpeta (indica que se procesó)
                    excel_path = os.path.join('EXCEL', f'manifiestos_{item}.xlsx')
                    processed_count = 0
                    
                    if os.path.exists(excel_path):
                        try:
                            # Leer el Excel para obtener el número real de registros procesados
                            import pandas as pd
                            df = pd.read_excel(excel_path)
                            processed_count = len(df)
                        except:
                            processed_count = 0
                    
                    folders.append({
                        'name': item,
                        'path': item_path,
                        'pdf_count': len(pdf_files),
                        'processed_count': processed_count
                    })
        
        return jsonify({
            'success': True,
            'folders': folders
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/process_folder', methods=['POST'])
def api_process_folder():
    """API para procesar una carpeta específica"""
    try:
        data = request.get_json()
        folder_name = data.get('folder_name')
        
        if not folder_name:
            return jsonify({
                'success': False,
                'error': 'Nombre de carpeta requerido'
            }), 400
        
        # Buscar la carpeta dentro de MANIFIESTOS
        folder_path = os.path.join(os.getcwd(), 'MANIFIESTOS', folder_name)
        if not os.path.exists(folder_path):
            return jsonify({
                'success': False,
                'error': f'Carpeta "{folder_name}" no encontrada en MANIFIESTOS'
            }), 404
        
        # Procesar PDFs en la carpeta
        manifiestos, facturas_electronicas = procesar_carpeta_pdfs(folder_path)
        
        if not manifiestos:
            return jsonify({
                'success': False,
                'error': 'No se encontraron PDFs válidos en la carpeta'
            }), 400
        
        # Guardar datos globalmente
        global current_manifiestos, current_facturas_electronicas, current_folder_name
        current_manifiestos = manifiestos
        current_facturas_electronicas = facturas_electronicas
        current_folder_name = folder_name
        
        # Generar Excel
        excel_path = crear_excel(manifiestos, folder_name)
        
        return jsonify({
            'success': True,
            'data': {
                'manifiestos': manifiestos,
                'facturas_electronicas': facturas_electronicas,
                'excel_path': excel_path,
                'total_manifiestos': len(manifiestos)
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/rename_folder', methods=['POST'])
def api_rename_folder():
    """API para renombrar archivos PDF de una carpeta"""
    try:
        data = request.get_json()
        folder_name = data.get('folder_name')
        fields = data.get('fields', [])
        separator = data.get('separator', '_')
        
        if not folder_name:
            return jsonify({
                'success': False,
                'error': 'Nombre de carpeta requerido'
            }), 400
        
        if not fields:
            return jsonify({
                'success': False,
                'error': 'Debe seleccionar al menos un campo'
            }), 400
        
        # Buscar la carpeta dentro de MANIFIESTOS
        folder_path = os.path.join(os.getcwd(), 'MANIFIESTOS', folder_name)
        if not os.path.exists(folder_path):
            return jsonify({
                'success': False,
                'error': f'Carpeta "{folder_name}" no encontrada en MANIFIESTOS'
            }), 404
        
        # Procesar PDFs para obtener datos
        manifiestos, facturas_electronicas = procesar_carpeta_pdfs(folder_path)
        
        if not manifiestos:
            return jsonify({
                'success': False,
                'error': 'No se encontraron PDFs válidos en la carpeta'
            }), 400
        
        # Renombrar archivos usando datos reales de cada PDF
        renamed_count = 0
        for manifiesto in manifiestos:
            try:
                # Generar nuevo nombre basado en los campos seleccionados y datos reales
                new_name_parts = []
                for field in fields:
                    if field.get('isCustom'):
                        new_name_parts.append(field['label'])
                    else:
                        field_id = field['id']
                        # Mapear IDs a nombres de campo reales
                        field_mapping = {
                            'fecha_inicio': 'fecha inicio',
                            'fecha_retorno': 'fecha retorno',
                            'hora_inicio': 'hora inicio',
                            'hora_retorno': 'hora retorno',
                            'load_id': 'load_id',
                            'conductor': 'conductor',
                            'placa': 'placa',
                            'destino': 'destino',
                            'origen': 'origen',
                            'kof': 'kof',
                            'remesa': 'remesa',
                            'mes': 'mes',
                            'empresa': 'empresa',
                            'valormanifiesto': 'valormanifiesto',
                            'estado': 'estado'
                        }
                        
                        actual_field = field_mapping.get(field_id, field_id)
                        value = manifiesto.get(actual_field, '')
                        
                        if value and str(value).strip() and str(value) != 'No encontrado' and str(value) != 'vacio':
                            # Limpiar el valor para usar en nombre de archivo
                            clean_value = str(value).replace('/', '-').replace('\\', '-').replace(':', '-').replace(' ', '_').replace('*', '').replace('?', '').replace('<', '').replace('>', '').replace('|', '').replace('"', '').replace("'", '')
                            new_name_parts.append(clean_value)
                
                if new_name_parts:
                    new_name = separator.join(new_name_parts) + '.pdf'
                    old_path = os.path.join(folder_path, manifiesto['archivo'])
                    new_path = os.path.join(folder_path, new_name)
                    
                    # Evitar sobrescribir archivos existentes
                    counter = 1
                    original_new_path = new_path
                    while os.path.exists(new_path):
                        name_part = original_new_path.replace('.pdf', f'_{counter}.pdf')
                        new_path = name_part
                        counter += 1
                    
                    # Renombrar archivo
                    os.rename(old_path, new_path)
                    renamed_count += 1
                    print(f"Renombrado: {manifiesto['archivo']} -> {os.path.basename(new_path)}")
                    
            except Exception as e:
                print(f"Error al renombrar archivo {manifiesto['archivo']}: {e}")
                continue
        
        return jsonify({
            'success': True,
            'message': f'Se renombraron {renamed_count} archivos exitosamente',
            'renamed_count': renamed_count
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/check_folder_exists', methods=['POST'])
def check_folder_exists():
    """API para verificar si una carpeta ya existe"""
    try:
        data = request.get_json()
        folder_name = data.get('folder_name')
        
        if not folder_name:
            return jsonify({
                'success': False,
                'error': 'Nombre de carpeta requerido'
            }), 400
        
        # Verificar si la carpeta existe en MANIFIESTOS
        folder_path = os.path.join(os.getcwd(), 'MANIFIESTOS', folder_name)
        
        if os.path.exists(folder_path):
            # Verificar si contiene PDFs
            pdf_files = [f for f in os.listdir(folder_path) if f.lower().endswith('.pdf')]
            return jsonify({
                'success': True,
                'exists': True,
                'pdf_count': len(pdf_files),
                'message': f'Ya existe una carpeta llamada "{folder_name}" con {len(pdf_files)} archivos PDF'
            })
        else:
            return jsonify({
                'success': True,
                'exists': False,
                'message': f'La carpeta "{folder_name}" no existe y se puede crear'
            })
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/operacionesmanifiestos')
def api_operaciones_manifiestos():
    """API endpoint para operaciones de manifiestos"""
    try:
        # Obtener parámetros de la consulta
        query = request.args.get('q', '').strip()
        debug = request.args.get('debug', 'false').lower() == 'true'
        include_all_data = request.args.get('all_data', 'false').lower() == 'true'
        
        # Construir payload usando el módulo de analytics
        payload = build_operaciones_payload(
            query=query if query else None,
            debug=debug,
            include_all_data=include_all_data
        )
        
        return jsonify({
            'success': True,
            'data': payload
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/process', methods=['POST'])
def process_files():
    try:
        if 'files' not in request.files:
            return jsonify({'success': False, 'error': 'No se seleccionaron archivos'})
        
        files = request.files.getlist('files')
        if not files or files[0].filename == '':
            return jsonify({'success': False, 'error': 'No se seleccionaron archivos'})
        
        # Obtener el nombre de la carpeta original del primer archivo
        # El nombre de la carpeta viene en el path del archivo
        first_file_path = files[0].filename
        folder_name = os.path.dirname(first_file_path) if os.path.dirname(first_file_path) else 'carpeta_sin_nombre'
        
        # Crear la estructura de carpetas: MANIFIESTOS/[nombre_carpeta_original]/
        target_folder = os.path.join(BASE_FOLDER, folder_name)
        
        # Verificar si ya existe una carpeta con el mismo nombre
        if os.path.exists(target_folder):
            # Verificar si la carpeta contiene archivos PDF
            pdf_files = [f for f in os.listdir(target_folder) if f.lower().endswith('.pdf')]
            if pdf_files:
                return jsonify({
                    'success': False, 
                    'error': f'Ya existe una carpeta llamada "{folder_name}" con {len(pdf_files)} archivos PDF. Por favor, elige un nombre diferente o elimina la carpeta existente.'
                })
            else:
                # Si la carpeta existe pero está vacía, usar esa carpeta
                pass
        
        # Crear la carpeta si no existe
        if not os.path.exists(target_folder):
            os.makedirs(target_folder)
        
        # Crear carpeta temporal para procesar
        temp_dir = tempfile.mkdtemp()
        
        try:
            # Guardar archivos PDF en carpeta temporal y también en la estructura organizada
            for file in files:
                if file and allowed_file(file.filename):
                    filename = secure_filename(os.path.basename(file.filename))
                    # Guardar en carpeta temporal para procesamiento
                    file.save(os.path.join(temp_dir, filename))
                    # Guardar también en la estructura organizada para acceso posterior
                    file.seek(0)  # Resetear el puntero del archivo
                    file.save(os.path.join(target_folder, filename))
            
            # Procesar PDFs usando los módulos organizados
            manifiestos, facturas_electronicas = procesar_carpeta_pdfs(temp_dir)
            
            # Guardar datos globalmente para actualizaciones posteriores
            global current_manifiestos, current_facturas_electronicas, current_folder_name
            current_manifiestos = manifiestos
            current_facturas_electronicas = facturas_electronicas
            current_folder_name = folder_name
            
            # Crear Excel si hay datos
            if manifiestos:
                crear_excel(manifiestos, folder_name)
            
            return jsonify({
                'success': True, 
                'data': {
                    'manifiestos': manifiestos,
                    'facturas_electronicas': facturas_electronicas,
                    'excel_path': f'EXCEL\\manifiestos_{folder_name}.xlsx' if manifiestos else None,
                    'total_manifiestos': len(manifiestos),
                    'folder_name': folder_name
                }
            })
            
        finally:
            # Limpiar carpeta temporal
            shutil.rmtree(temp_dir)
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/download')
def download_excel():
    try:
        # Obtener el archivo Excel de la carpeta actual
        global current_folder_name
        latest_file = obtener_ultimo_excel(current_folder_name)
        
        if latest_file and os.path.exists(latest_file):
            return send_file(latest_file, as_attachment=True)
        
        return jsonify({'success': False, 'error': 'No se encontró archivo Excel'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/open_pdf/<filename>')
def open_pdf(filename):
    """Abrir PDF en el navegador"""
    try:
        # Buscar el archivo PDF en la estructura organizada
        global current_folder_name
        if current_folder_name:
            pdf_path = os.path.join(BASE_FOLDER, current_folder_name, filename)
        else:
            # Fallback: buscar en todas las subcarpetas de MANIFIESTOS
            pdf_path = None
            for root, dirs, files in os.walk(BASE_FOLDER):
                if filename in files:
                    pdf_path = os.path.join(root, filename)
                    break
        
        if pdf_path and os.path.exists(pdf_path):
            return send_file(pdf_path, as_attachment=False)
        else:
            return jsonify({'success': False, 'error': 'Archivo PDF no encontrado'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/search_pdf/<load_id>')
def search_pdf_by_load_id(load_id):
    """Buscar PDF por Load ID en todas las carpetas de MANIFIESTOS"""
    try:
        import re
        
        # Buscar en todas las subcarpetas de MANIFIESTOS
        pdf_found = None
        for root, dirs, files in os.walk(BASE_FOLDER):
            for file in files:
                if file.lower().endswith('.pdf'):
                    # Buscar el Load ID en el nombre del archivo
                    if load_id in file:
                        pdf_found = os.path.join(root, file)
                        break
            if pdf_found:
                break
        
        if pdf_found and os.path.exists(pdf_found):
            return send_file(pdf_found, as_attachment=False)
        else:
            return jsonify({'success': False, 'error': f'No se encontró PDF con Load ID: {load_id}'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/delete_all_data', methods=['POST'])
def delete_all_data():
    """Eliminar todas las carpetas de MANIFIESTOS y archivos de EXCEL"""
    try:
        deleted_items = []
        errors = []
        
        # Eliminar todas las subcarpetas de MANIFIESTOS
        if os.path.exists(BASE_FOLDER):
            for item in os.listdir(BASE_FOLDER):
                item_path = os.path.join(BASE_FOLDER, item)
                try:
                    if os.path.isdir(item_path):
                        shutil.rmtree(item_path)
                        deleted_items.append(f"Carpeta: {item}")
                        print(f"Carpeta eliminada: {item}")
                    elif os.path.isfile(item_path):
                        os.remove(item_path)
                        deleted_items.append(f"Archivo: {item}")
                        print(f"Archivo eliminado: {item}")
                except Exception as e:
                    error_msg = f"Error eliminando {item}: {str(e)}"
                    errors.append(error_msg)
                    print(error_msg)
        
        # Eliminar todos los archivos de EXCEL
        excel_folder = 'EXCEL'
        if os.path.exists(excel_folder):
            for item in os.listdir(excel_folder):
                item_path = os.path.join(excel_folder, item)
                try:
                    if os.path.isfile(item_path):
                        os.remove(item_path)
                        deleted_items.append(f"Excel: {item}")
                        print(f"Archivo Excel eliminado: {item}")
                except Exception as e:
                    error_msg = f"Error eliminando Excel {item}: {str(e)}"
                    errors.append(error_msg)
                    print(error_msg)
        
        # Limpiar variables globales
        global current_manifiestos, current_facturas_electronicas, current_folder_name
        current_manifiestos = []
        current_facturas_electronicas = []
        current_folder_name = None
        
        return jsonify({
            'success': True,
            'message': f'Se eliminaron {len(deleted_items)} elementos',
            'deleted_items': deleted_items,
            'errors': errors if errors else []
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/update_data', methods=['PUT'])
def update_data():
    """Actualizar datos de un manifiesto y regenerar Excel"""
    try:
        data = request.get_json()
        index = data.get('index')
        field = data.get('field')
        value = data.get('value')
        
        # Actualizar los datos globales
        global current_manifiestos, current_folder_name
        if 0 <= index < len(current_manifiestos):
            current_manifiestos[index][field] = value
            print(f"Actualizando campo '{field}' a '{value}' para índice {index}")
            
            # Regenerar el mismo Excel con los datos actualizados
            if current_manifiestos:
                crear_excel(current_manifiestos, current_folder_name)
                return jsonify({'success': True, 'message': 'Datos actualizados y Excel regenerado correctamente'})
            else:
                return jsonify({'success': False, 'error': 'No hay datos para actualizar'})
        else:
            return jsonify({'success': False, 'error': 'Índice de registro inválido'})
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/delete_record', methods=['POST'])
def delete_record():
    """Eliminar un registro y su archivo PDF"""
    try:
        data = request.get_json()
        index = data.get('index')
        filename = data.get('filename')
        
        # Declarar variables globales al inicio
        global current_manifiestos, current_folder_name
        
        # Eliminar archivo PDF de la estructura organizada
        if filename:
            if current_folder_name:
                pdf_path = os.path.join(BASE_FOLDER, current_folder_name, filename)
            else:
                # Fallback: buscar en todas las subcarpetas de MANIFIESTOS
                pdf_path = None
                for root, dirs, files in os.walk(BASE_FOLDER):
                    if filename in files:
                        pdf_path = os.path.join(root, filename)
                        break
            
            if pdf_path and os.path.exists(pdf_path):
                try:
                    os.remove(pdf_path)
                    print(f"Archivo PDF eliminado: {pdf_path}")
                except Exception as e:
                    print(f"Error al eliminar archivo PDF: {e}")
                    return jsonify({'success': False, 'error': f'Error al eliminar archivo: {e}'})
            else:
                print(f"Archivo PDF no encontrado: {pdf_path}")
        
        # Eliminar registro de los datos globales
        if 0 <= index < len(current_manifiestos):
            current_manifiestos.pop(index)
            print(f"Registro eliminado del índice {index}")
            
            # Regenerar Excel con los datos actualizados
            if current_manifiestos:
                crear_excel(current_manifiestos, current_folder_name)
            else:
                # Si no hay más registros, eliminar el archivo Excel
                try:
                    latest_file = obtener_ultimo_excel(current_folder_name)
                    if latest_file and os.path.exists(latest_file):
                        os.remove(latest_file)
                        print("Archivo Excel eliminado - no hay más registros")
                except Exception as e:
                    print(f"Error al eliminar Excel: {e}")
        
        return jsonify({'success': True, 'message': 'Registro y archivo eliminados correctamente'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/regenerate_excel', methods=['POST'])
def regenerate_excel():
    """Regenerar Excel con datos actualizados"""
    try:
        # Usar los datos globales actualizados
        global current_manifiestos, current_folder_name
        
        if current_manifiestos:
            # Regenerar el mismo Excel con los datos actualizados
            ruta_excel = crear_excel(current_manifiestos, current_folder_name)
            if ruta_excel:
                return jsonify({'success': True, 'message': 'Excel regenerado correctamente'})
            else:
                return jsonify({'success': False, 'error': 'Error al crear Excel'})
        else:
            return jsonify({'success': False, 'error': 'No hay datos para regenerar'})
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True)
