from flask import Flask, render_template, request, jsonify, send_file
import os
import tempfile
import shutil
import subprocess
import platform
from werkzeug.utils import secure_filename

# Importar módulos organizados
from modules.pdf_processor import procesar_carpeta_pdfs
from modules.excel_generator import crear_excel, obtener_ultimo_excel
from modules.analytics import build_operaciones_payload
from modules.payment_manager import guardar_gastos_adicionales, cargar_gastos_adicionales, guardar_tarifas_destino, cargar_tarifas_destino, obtener_destinos_unicos, leer_pagos_conductores, actualizar_multiple_pagos, obtener_resumen_pagos

app = Flask(__name__)

# Importar módulo de almacenamiento
from modules.storage import get_storage_path, get_excel_path, get_data_path

# Configuración para archivos
BASE_FOLDER = os.environ.get('BASE_FOLDER', 'MANIFIESTOS')
ALLOWED_EXTENSIONS = {'pdf'}

# Inicializar almacenamiento persistente
try:
    storage_path = get_storage_path()
    excel_path = get_excel_path()
    data_path = get_data_path()
    print(f"✓ Almacenamiento persistente inicializado en: {storage_path}")
except Exception as e:
    print(f"⚠️ Advertencia al inicializar almacenamiento: {e}")

app.config['BASE_FOLDER'] = BASE_FOLDER

# Variables globales para mantener los datos actualizados
current_manifiestos = []
current_facturas_electronicas = []
current_folder_name = None  # Nombre de la carpeta actual
current_archivos_duplicados = []  # Lista de archivos duplicados encontrados

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
        manifiestos_path = get_storage_path()
        
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
                    excel_path = os.path.join(get_excel_path(), f'manifiestos_{item}.xlsx')
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
        folder_path = get_storage_path(folder_name)
        if not os.path.exists(folder_path):
            return jsonify({
                'success': False,
                'error': f'Carpeta "{folder_name}" no encontrada en MANIFIESTOS'
            }), 404
        
        # Procesar PDFs en la carpeta
        manifiestos, facturas_electronicas, archivos_duplicados = procesar_carpeta_pdfs(folder_path)
        
        if not manifiestos:
            return jsonify({
                'success': False,
                'error': 'No se encontraron PDFs válidos en la carpeta'
            }), 400
        
        # Guardar datos globalmente
        global current_manifiestos, current_facturas_electronicas, current_folder_name, current_archivos_duplicados
        current_manifiestos = manifiestos
        current_facturas_electronicas = facturas_electronicas
        current_folder_name = folder_name
        current_archivos_duplicados = archivos_duplicados
        
        # Generar Excel
        excel_path = crear_excel(manifiestos, folder_name)
        
        return jsonify({
            'success': True,
            'data': {
                'manifiestos': manifiestos,
                'facturas_electronicas': facturas_electronicas,
                'excel_path': excel_path,
                'total_manifiestos': len(manifiestos),
                'archivos_duplicados': archivos_duplicados,
                'total_duplicados': len(archivos_duplicados)
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
        folder_path = get_storage_path(folder_name)
        if not os.path.exists(folder_path):
            return jsonify({
                'success': False,
                'error': f'Carpeta "{folder_name}" no encontrada en MANIFIESTOS'
            }), 404
        
        # Procesar PDFs para obtener datos
        manifiestos, facturas_electronicas, archivos_duplicados = procesar_carpeta_pdfs(folder_path)
        
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
        folder_path = get_storage_path(folder_name)
        
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

@app.route('/api/open_folder', methods=['POST'])
def api_open_folder():
    """API para abrir el explorador de archivos en la ubicación de una carpeta"""
    try:
        data = request.get_json()
        folder_name = data.get('folder_name')
        
        if not folder_name:
            return jsonify({
                'success': False,
                'error': 'Nombre de carpeta requerido'
            }), 400
        
        # Construir la ruta completa de la carpeta usando almacenamiento persistente
        folder_path = get_storage_path(folder_name)
        
        # Verificar que la carpeta existe
        if not os.path.exists(folder_path):
            return jsonify({
                'success': False,
                'error': f'La carpeta "{folder_name}" no existe'
            }), 404
        
        # Abrir el explorador de archivos según el sistema operativo
        try:
            system = platform.system()
            if system == 'Windows':
                # Windows: usar explorer
                os.startfile(folder_path)
            elif system == 'Darwin':
                # macOS: usar open
                subprocess.Popen(['open', folder_path])
            else:
                # Linux y otros: usar xdg-open
                subprocess.Popen(['xdg-open', folder_path])
            
            return jsonify({
                'success': True,
                'message': f'Explorador de archivos abierto para la carpeta "{folder_name}"'
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Error al abrir el explorador: {str(e)}'
            }), 500
            
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
        }), 500

@app.route('/api/operaciones/<mes>')
def api_operaciones_mes(mes):
    """API endpoint para obtener datos de operaciones de un mes específico"""
    try:
        # Construir payload usando el módulo de analytics con el mes específico
        payload = build_operaciones_payload(
            query=None,
            debug=False,
            include_all_data=True
        )
        
        # Filtrar datos por el mes específico si es necesario
        # El payload ya incluye gastos_totales calculados para el mes actual
        
        return jsonify({
            'success': True,
            'data': payload,
            'gastos_totales': payload.get('gastos_totales', {})
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
        
        # Crear la estructura de carpetas usando almacenamiento persistente
        target_folder = get_storage_path(folder_name)
        
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
            manifiestos, facturas_electronicas, archivos_duplicados = procesar_carpeta_pdfs(temp_dir)
            
            # Guardar datos globalmente para actualizaciones posteriores
            global current_manifiestos, current_facturas_electronicas, current_folder_name, current_archivos_duplicados
            current_manifiestos = manifiestos
            current_facturas_electronicas = facturas_electronicas
            current_folder_name = folder_name
            current_archivos_duplicados = archivos_duplicados
            
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
                    'folder_name': folder_name,
                    'archivos_duplicados': archivos_duplicados,
                    'total_duplicados': len(archivos_duplicados)
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
            pdf_path = get_storage_path(current_folder_name)
            pdf_path = os.path.join(pdf_path, filename)
        else:
            # Fallback: buscar en todas las subcarpetas de MANIFIESTOS
            pdf_path = None
            base_storage = get_storage_path()
            for root, dirs, files in os.walk(base_storage):
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
        base_storage = get_storage_path()
        for root, dirs, files in os.walk(base_storage):
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
        base_storage = get_storage_path()
        if os.path.exists(base_storage):
            for item in os.listdir(base_storage):
                item_path = os.path.join(base_storage, item)
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
        excel_folder = get_excel_path()
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
        global current_manifiestos, current_facturas_electronicas, current_folder_name, current_archivos_duplicados
        current_manifiestos = []
        current_facturas_electronicas = []
        current_folder_name = None
        current_archivos_duplicados = []
        
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
                folder_storage = get_storage_path(current_folder_name)
                pdf_path = os.path.join(folder_storage, filename)
            else:
                # Fallback: buscar en todas las subcarpetas de MANIFIESTOS
                pdf_path = None
                base_storage = get_storage_path()
                for root, dirs, files in os.walk(base_storage):
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

@app.route('/api/archivos-duplicados', methods=['GET'])
def api_get_archivos_duplicados():
    """Obtener lista de archivos duplicados encontrados"""
    try:
        global current_archivos_duplicados, current_folder_name
        return jsonify({
            'success': True,
            'data': {
                'archivos_duplicados': current_archivos_duplicados,
                'total_duplicados': len(current_archivos_duplicados),
                'folder_name': current_folder_name
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/eliminar-duplicados', methods=['POST'])
def api_eliminar_duplicados():
    """Eliminar archivos duplicados seleccionados"""
    try:
        data = request.get_json()
        archivos_a_eliminar = data.get('archivos', [])  # Lista de rutas completas o nombres de archivo
        
        if not archivos_a_eliminar:
            return jsonify({
                'success': False,
                'error': 'No se especificaron archivos para eliminar'
            }), 400
        
        global current_folder_name, current_archivos_duplicados
        
        if not current_folder_name:
            return jsonify({
                'success': False,
                'error': 'No hay carpeta activa'
            }), 400
        
        folder_path = os.path.join(os.getcwd(), 'MANIFIESTOS', current_folder_name)
        archivos_eliminados = []
        errores = []
        
        for archivo_info in archivos_a_eliminar:
            try:
                # Si es un diccionario, obtener la ruta o el nombre del archivo
                if isinstance(archivo_info, dict):
                    ruta_archivo = archivo_info.get('ruta_completa')
                    nombre_archivo = archivo_info.get('archivo')
                    
                    if ruta_archivo and os.path.exists(ruta_archivo):
                        archivo_path = ruta_archivo
                    elif nombre_archivo:
                        archivo_path = os.path.join(folder_path, nombre_archivo)
                    else:
                        errores.append(f"No se pudo determinar la ruta del archivo: {archivo_info}")
                        continue
                elif isinstance(archivo_info, str):
                    # Si es solo un string, asumir que es la ruta completa o el nombre
                    if os.path.exists(archivo_info):
                        archivo_path = archivo_info
                    else:
                        archivo_path = os.path.join(folder_path, archivo_info)
                else:
                    errores.append(f"Formato de archivo inválido: {archivo_info}")
                    continue
                
                # Verificar que el archivo existe y está en la carpeta correcta
                if os.path.exists(archivo_path):
                    # Verificar que está dentro de la carpeta de manifiestos por seguridad
                    if folder_path in os.path.abspath(archivo_path):
                        os.remove(archivo_path)
                        archivos_eliminados.append(os.path.basename(archivo_path))
                        print(f"Archivo duplicado eliminado: {archivo_path}")
                    else:
                        errores.append(f"El archivo no está en la carpeta permitida: {archivo_path}")
                else:
                    errores.append(f"El archivo no existe: {archivo_path}")
                    
            except Exception as e:
                error_msg = f"Error eliminando archivo {archivo_info}: {str(e)}"
                errores.append(error_msg)
                print(error_msg)
        
        # Actualizar la lista de duplicados removiendo los eliminados
        current_archivos_duplicados = [
            dup for dup in current_archivos_duplicados 
            if dup.get('archivo') not in [os.path.basename(a) for a in archivos_eliminados]
        ]
        
        return jsonify({
            'success': True,
            'message': f'Se eliminaron {len(archivos_eliminados)} archivo(s) duplicado(s)',
            'archivos_eliminados': archivos_eliminados,
            'errores': errores if errores else [],
            'archivos_duplicados_restantes': current_archivos_duplicados
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/gastos-adicionales', methods=['GET'])
def api_get_gastos_adicionales():
    """Obtener gastos adicionales guardados"""
    try:
        # Obtener el nombre de la carpeta más reciente
        carpeta_reciente = None
        manifiestos_path = get_storage_path()
        
        if os.path.exists(manifiestos_path):
            carpetas = [f for f in os.listdir(manifiestos_path) if os.path.isdir(os.path.join(manifiestos_path, f))]
            if carpetas:
                carpeta_reciente = carpetas[-1]  # Última carpeta
        
        gastos = cargar_gastos_adicionales(carpeta_reciente)
        
        # Retornar en el nuevo formato (lista)
        return jsonify({'success': True, 'gastos': gastos})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/gastos-adicionales', methods=['POST'])
def api_save_gastos_adicionales():
    """Guardar gastos adicionales ingresados manualmente"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'No se recibieron datos'})
        
        # El nuevo formato es una lista de gastos con {fecha, descripcion, valor}
        gastos_lista = data.get('gastos', [])
        
        # Obtener el nombre de la carpeta más reciente
        carpeta_reciente = None
        manifiestos_path = get_storage_path()
        
        if os.path.exists(manifiestos_path):
            carpetas = [f for f in os.listdir(manifiestos_path) if os.path.isdir(os.path.join(manifiestos_path, f))]
            if carpetas:
                carpeta_reciente = carpetas[-1]  # Última carpeta
        
        # Guardar gastos (ahora acepta lista de gastos)
        success = guardar_gastos_adicionales(gastos_lista, carpeta_reciente)
        
        if success:
            return jsonify({'success': True, 'message': f'Se guardaron {len(gastos_lista)} gasto(s) correctamente'})
        else:
            return jsonify({'success': False, 'error': 'Error al guardar gastos'})
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/vehiculos', methods=['GET'])
def api_get_vehiculos():
    """Obtener vehículos guardados"""
    try:
        import json
        
        # Obtener el nombre de la carpeta más reciente
        carpeta_reciente = None
        manifiestos_path = get_storage_path()
        
        if os.path.exists(manifiestos_path):
            carpetas = [f for f in os.listdir(manifiestos_path) if os.path.isdir(os.path.join(manifiestos_path, f))]
            if carpetas:
                carpeta_reciente = carpetas[-1]  # Última carpeta
        
        # Cargar vehículos
        data_folder = 'data'
        vehiculos_file = os.path.join(data_folder, f'vehiculos_{carpeta_reciente}.json')
        
        if os.path.exists(vehiculos_file):
            with open(vehiculos_file, 'r', encoding='utf-8') as f:
                vehiculos = json.load(f)
            return jsonify({'success': True, 'vehiculos': vehiculos})
        else:
            return jsonify({'success': True, 'vehiculos': {}})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/vehiculos', methods=['POST'])
def api_save_vehiculos():
    """Guardar vehículos"""
    try:
        import json
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'No se recibieron datos'})
        
        vehiculos = data.get('vehiculos', {})
        
        # Obtener el nombre de la carpeta más reciente
        carpeta_reciente = None
        manifiestos_path = get_storage_path()
        
        if os.path.exists(manifiestos_path):
            carpetas = [f for f in os.listdir(manifiestos_path) if os.path.isdir(os.path.join(manifiestos_path, f))]
            if carpetas:
                carpeta_reciente = carpetas[-1]  # Última carpeta
        
        # Crear carpeta de datos si no existe
        data_folder = 'data'
        if not os.path.exists(data_folder):
            os.makedirs(data_folder)
        
        # Guardar vehículos
        vehiculos_file = os.path.join(data_folder, f'vehiculos_{carpeta_reciente}.json')
        with open(vehiculos_file, 'w', encoding='utf-8') as f:
            json.dump(vehiculos, f, ensure_ascii=False, indent=2)
        
        return jsonify({'success': True, 'message': f'Se guardaron {len(vehiculos)} vehículo(s) correctamente'})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/destinos-tarifas', methods=['GET'])
def api_get_destinos_tarifas():
    """Obtener destinos únicos y sus tarifas"""
    try:
        # Obtener el nombre de la carpeta más reciente
        carpeta_reciente = None
        manifiestos_path = get_storage_path()
        
        if os.path.exists(manifiestos_path):
            carpetas = [f for f in os.listdir(manifiestos_path) if os.path.isdir(os.path.join(manifiestos_path, f))]
            if carpetas:
                carpeta_reciente = carpetas[-1]  # Última carpeta
        
        # Obtener destinos únicos
        destinos = obtener_destinos_unicos(carpeta_reciente)
        
        # Cargar tarifas existentes
        tarifas = cargar_tarifas_destino(carpeta_reciente)
        
        # Crear lista de destinos con sus tarifas
        destinos_con_tarifas = []
        for destino in destinos:
            destinos_con_tarifas.append({
                'destino': destino,
                'tarifa': tarifas.get(destino, 0)
            })
        
        return jsonify({
            'success': True, 
            'destinos': destinos_con_tarifas,
            'carpeta': carpeta_reciente
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/destinos-tarifas', methods=['POST'])
def api_save_destinos_tarifas():
    """Guardar tarifas por destino"""
    try:
        data = request.get_json()
        
        if not data or 'tarifas' not in data:
            return jsonify({'success': False, 'error': 'No se recibieron datos de tarifas'})
        
        # Validar datos
        tarifas_data = {}
        for item in data['tarifas']:
            destino = item.get('destino', '').strip().upper()
            tarifa = float(item.get('tarifa', 0))
            if destino and tarifa >= 0:
                tarifas_data[destino] = tarifa
        
        # Obtener el nombre de la carpeta más reciente
        carpeta_reciente = None
        manifiestos_path = get_storage_path()
        
        if os.path.exists(manifiestos_path):
            carpetas = [f for f in os.listdir(manifiestos_path) if os.path.isdir(os.path.join(manifiestos_path, f))]
            if carpetas:
                carpeta_reciente = carpetas[-1]  # Última carpeta
        
        # Guardar tarifas
        success = guardar_tarifas_destino(tarifas_data, carpeta_reciente)
        
        if success:
            return jsonify({'success': True, 'message': 'Tarifas por destino guardadas correctamente'})
        else:
            return jsonify({'success': False, 'error': 'Error al guardar tarifas'})
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/resumen-pagos', methods=['GET'])
def api_get_resumen_pagos():
    """Obtener resumen completo de pagos de todos los conductores"""
    try:
        # Obtener el nombre de la carpeta más reciente
        carpeta_reciente = None
        manifiestos_path = get_storage_path()
        
        if os.path.exists(manifiestos_path):
            carpetas = [f for f in os.listdir(manifiestos_path) if os.path.isdir(os.path.join(manifiestos_path, f))]
            if carpetas:
                carpeta_reciente = carpetas[-1]  # Última carpeta
        
        # Importar y verificar si existe el archivo de pagos
        from modules.payment_manager import crear_excel_pagos_conductores
        
        # Verificar si existe el archivo de pagos
        archivo_pagos = f'EXCEL/pagos_conductores_{carpeta_reciente}.xlsx'
        if not os.path.exists(archivo_pagos):
            # Crear el archivo de pagos
            print(f"[INFO] Creando archivo de pagos para la carpeta: {carpeta_reciente}")
            crear_excel_pagos_conductores(carpeta_reciente)
        
        # Obtener resumen de pagos
        resumen = obtener_resumen_pagos(carpeta_reciente)
        
        return jsonify({
            'success': True,
            'resumen': resumen
        })
        
    except Exception as e:
        print(f"[ERROR] Error en api_get_resumen_pagos: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/pagos-conductor/<conductor>', methods=['GET'])
def api_get_pagos_conductor(conductor):
    """Obtener pagos pendientes de un conductor específico"""
    try:
        # Obtener el nombre de la carpeta más reciente
        carpeta_reciente = None
        manifiestos_path = get_storage_path()
        
        if os.path.exists(manifiestos_path):
            carpetas = [f for f in os.listdir(manifiestos_path) if os.path.isdir(os.path.join(manifiestos_path, f))]
            if carpetas:
                carpeta_reciente = carpetas[-1]  # Última carpeta
        
        # Importar y verificar si existe el archivo de pagos
        from modules.payment_manager import crear_excel_pagos_conductores, leer_pagos_conductores
        
        # Verificar si existe el archivo de pagos
        archivo_pagos = f'EXCEL/pagos_conductores_{carpeta_reciente}.xlsx'
        if not os.path.exists(archivo_pagos):
            # Crear el archivo de pagos
            print(f"[INFO] Creando archivo de pagos para la carpeta: {carpeta_reciente}")
            crear_excel_pagos_conductores(carpeta_reciente)
        
        # Obtener resumen de pagos
        resumen = obtener_resumen_pagos(carpeta_reciente)
        
        if conductor not in resumen:
            return jsonify({
                'success': False,
                'error': f'No se encontró información del conductor "{conductor}"'
            })
        
        conductor_data = resumen[conductor]
        
        # Filtrar viajes pendientes y pagados
        viajes_pendientes = [v for v in conductor_data['viajes_detalle'] if v['estado'] == 'PENDIENTE']
        viajes_pagados = [v for v in conductor_data['viajes_detalle'] if v['estado'] == 'PAGADO']
        
        return jsonify({
            'success': True,
            'conductor': conductor,
            'viajes_pendientes': viajes_pendientes,
            'viajes_pagados': viajes_pagados,
            'total_pendiente': conductor_data['total_pendiente'],
            'total_pagado': conductor_data['total_pagado'],
            'total_viajes': conductor_data['total_viajes']
        })
        
    except Exception as e:
        print(f"[ERROR] Error en api_get_pagos_conductor: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/pagos-actualizar', methods=['POST'])
def api_actualizar_pagos():
    """Actualizar estado de pagos"""
    try:
        data = request.get_json()
        print(f"[DEBUG] api_actualizar_pagos recibió: {data}")
        
        if not data or 'load_ids' not in data:
            print("[ERROR] No se recibieron datos de pagos o falta 'load_ids'")
            return jsonify({'success': False, 'error': 'No se recibieron datos de pagos'})
        
        load_ids = data.get('load_ids', [])
        estado_pago = data.get('estado_pago', 'PAGADO')  # Usar el estado que viene del frontend
        fecha_pago = data.get('fecha_pago', '')
        tipo_pago = data.get('tipo_pago', 'conductor')  # 'conductor' o 'manifiesto'
        
        print(f"[DEBUG] load_ids recibidos: {load_ids}, tipo: {type(load_ids)}")
        print(f"[DEBUG] estado_pago: {estado_pago}, fecha_pago: {fecha_pago}, tipo_pago: {tipo_pago}")
        
        if not load_ids:
            print("[ERROR] Lista de load_ids vacía")
            return jsonify({'success': False, 'error': 'No se seleccionaron viajes para pagar'})
        
        # Asegurar que load_ids sea una lista
        if not isinstance(load_ids, list):
            load_ids = [load_ids]
        
        # Normalizar load_ids a strings
        load_ids = [str(load_id).strip() for load_id in load_ids]
        
        # Obtener el nombre de la carpeta más reciente
        carpeta_reciente = None
        manifiestos_path = get_storage_path()
        
        if os.path.exists(manifiestos_path):
            carpetas = [f for f in os.listdir(manifiestos_path) if os.path.isdir(os.path.join(manifiestos_path, f))]
            if carpetas:
                carpetas.sort()  # Ordenar alfabéticamente
                carpeta_reciente = carpetas[-1]  # Última carpeta
                print(f"[DEBUG] Carpeta reciente encontrada: {carpeta_reciente}")
        
        if not carpeta_reciente:
            print("[ERROR] No se encontró carpeta de manifiestos")
            return jsonify({'success': False, 'error': 'No se encontró carpeta de manifiestos'})
        
        # Importar y verificar si existe el archivo de pagos
        from modules.payment_manager import crear_excel_pagos_conductores
        
        # Verificar si existe el archivo de pagos
        archivo_pagos = f'EXCEL/pagos_conductores_{carpeta_reciente}.xlsx'
        if not os.path.exists(archivo_pagos):
            # Crear el archivo de pagos
            print(f"[INFO] Creando archivo de pagos para la carpeta: {carpeta_reciente}")
            resultado = crear_excel_pagos_conductores(carpeta_reciente)
            if not resultado:
                return jsonify({'success': False, 'error': 'No se pudo crear el archivo de pagos'})
        
        # Actualizar pagos
        print(f"[DEBUG] Llamando a actualizar_multiple_pagos con:")
        print(f"  - load_ids: {load_ids}")
        print(f"  - estado_pago: {estado_pago}")
        print(f"  - fecha_pago: {fecha_pago}")
        print(f"  - tipo_pago: {tipo_pago}")
        print(f"  - carpeta_reciente: {carpeta_reciente}")
        
        success = actualizar_multiple_pagos(load_ids, estado_pago, fecha_pago, carpeta_reciente, tipo_pago)
        
        if success:
            return jsonify({'success': True, 'message': f'Se actualizaron {len(load_ids)} pagos correctamente'})
        else:
            return jsonify({'success': False, 'error': 'Error al actualizar pagos. Revisa los logs del servidor.'})
            
    except Exception as e:
        print(f"[ERROR] Error en api_actualizar_pagos: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    # Obtener puerto de variable de entorno o usar 5000 por defecto
    port = int(os.environ.get('PORT', 5000))
    # En producción, usar host 0.0.0.0 para aceptar conexiones externas
    # En desarrollo local, usar 127.0.0.1
    host = os.environ.get('HOST', '0.0.0.0')
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    app.run(host=host, port=port, debug=debug)
