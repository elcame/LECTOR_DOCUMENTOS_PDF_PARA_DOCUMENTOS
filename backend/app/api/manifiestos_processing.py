"""
API de procesamiento de manifiestos
"""
from datetime import datetime
from flask import Blueprint, request, jsonify
from .manifiestos_utils import login_required_api, get_current_user
from modules.excel_generator import crear_excel_en_memoria

bp = Blueprint('manifiestos_processing', __name__)


@bp.route('/process_folder', methods=['POST'])
@login_required_api
def process_folder():
    """API para procesar una carpeta específica del usuario actual y guardar en Firebase"""
    try:
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        data = request.get_json()
        folder_name = data.get('folder_name')
        tipo_id_body = (data.get('tipo_id') or '').strip()
        
        if not folder_name:
            return jsonify({
                'success': False,
                'error': 'Nombre de carpeta requerido'
            }), 400
        
        folder_name = folder_name.strip().replace('..', '').replace('/', '').replace('\\', '')
        if not folder_name:
            return jsonify({
                'success': False,
                'error': 'Nombre de carpeta inválido'
            }), 400
        
        try:
            from app.database.pdfs_repository import PDFsRepository
            from app.config.firebase_config import FirebaseConfig
            from modules.data_extractor import (
                extraer_datos_manifiesto,
                extraer_datos_factura_electronica,
                limpiar_datos,
            )
        except ImportError as e:
            print(f"[ERROR] Dependencias no disponibles para procesar desde Firebase: {e}")
            return jsonify({
                'success': False,
                'error': 'No se pudo inicializar Firebase/procesador de datos'
            }), 503

        pdfs_repo = PDFsRepository()
        pdf_records = pdfs_repo.get_pdfs_by_folder(username, folder_name)
        if not pdf_records:
            return jsonify({
                'success': False,
                'error': f'No se encontraron PDFs en la carpeta "{folder_name}"'
            }), 404

        bucket = FirebaseConfig.get_storage_bucket()

        def _extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
            try:
                import fitz
            except Exception as e:
                raise RuntimeError(f"PyMuPDF no está disponible: {e}")

            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            try:
                texto_completo = ""
                for numero_pagina in range(len(doc)):
                    pagina = doc.load_page(numero_pagina)
                    try:
                        texto_pagina = pagina.get_text(flags=11)
                    except Exception:
                        texto_pagina = pagina.get_text()
                    if texto_pagina:
                        texto_completo += f"\n--- PÁGINA {numero_pagina + 1} ---\n"
                        texto_completo += texto_pagina
                return texto_completo
            finally:
                doc.close()

        manifiestos = []
        facturas_electronicas = []
        archivos_duplicados = []
        load_ids_procesados = {}
        remesas_procesadas = {}

        for p in pdf_records:
            archivo = p.get('filename') or p.get('archivo') or ''
            storage_path = p.get('file_path') or (p.get('metadata') or {}).get('storage_path')

            if not archivo or not storage_path:
                archivos_duplicados.append({
                    'archivo': archivo or 'No encontrado',
                    'ruta_completa': storage_path or '',
                    'identificador': 'metadata_incompleta',
                    'archivo_original': None,
                    'load_id': None,
                    'remesa': None
                })
                continue

            print(f"Procesando (Firebase Storage): {archivo}")

            try:
                blob = bucket.blob(storage_path)
                pdf_bytes = blob.download_as_bytes()
                texto = _extract_text_from_pdf_bytes(pdf_bytes)
            except Exception as e:
                print(f"[ERROR] Error leyendo/procesando {archivo} desde Storage: {e}")
                continue

            if not texto:
                continue

            datos_manifiesto = extraer_datos_manifiesto(texto)
            datos_factura_electronica = extraer_datos_factura_electronica(texto)
            datos_manifiesto = limpiar_datos(datos_manifiesto)

            load_id = datos_manifiesto.get('load_id', 'No encontrado')
            remesa = datos_manifiesto.get('remesa', 'No encontrada')

            es_duplicado = False
            identificador_usado = None
            archivo_original = None

            if load_id and load_id != 'No encontrado':
                if load_id in load_ids_procesados:
                    es_duplicado = True
                    identificador_usado = f"load_id: {load_id}"
                    archivo_original = load_ids_procesados[load_id]
                else:
                    load_ids_procesados[load_id] = archivo
            elif remesa and remesa != 'No encontrada':
                if remesa in remesas_procesadas:
                    es_duplicado = True
                    identificador_usado = f"remesa (KBQ): {remesa}"
                    archivo_original = remesas_procesadas[remesa]
                else:
                    remesas_procesadas[remesa] = archivo

            if es_duplicado:
                print(f"[WARN] Archivo duplicado omitido: {archivo} (ya procesado con {identificador_usado})")
                archivos_duplicados.append({
                    'archivo': archivo,
                    'ruta_completa': storage_path,
                    'identificador': identificador_usado,
                    'archivo_original': archivo_original,
                    'load_id': load_id if load_id != 'No encontrado' else None,
                    'remesa': remesa if remesa != 'No encontrada' else None
                })
                continue

            datos_manifiesto['archivo'] = archivo
            datos_manifiesto['fecha_procesamiento'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            manifiestos.append(datos_manifiesto)
            facturas_electronicas.append(datos_factura_electronica)
            print(f"[OK] Archivo procesado correctamente: {archivo}")

        if not manifiestos:
            return jsonify({
                'success': False,
                'error': 'No se encontraron PDFs válidos para procesar en la carpeta'
            }), 400
        
        manifiestos_repo = None
        manifiestos_guardados = []
        manifiestos_duplicados_firebase = []
        manifiestos_errores = []
        
        try:
            from app.database.manifiestos_repository import ManifiestosRepository
            manifiestos_repo = ManifiestosRepository()
        except ImportError as e:
            print(f"[WARN] No se pudo importar ManifiestosRepository: {e}")
            return jsonify({
                'success': False,
                'error': 'Error al inicializar repositorio de manifiestos'
            }), 500
        
        archivos_pdf = [p.get('filename') for p in pdf_records if (p.get('filename') or '').lower().endswith('.pdf')]
        
        tipo_id = ''
        tipo_nombre = ''
        try:
            from app.database.carpetas_meta_repository import CarpetasMetaRepository
            from app.database.tipos_manifiesto_repository import TiposManifiestoRepository
            if tipo_id_body:
                tipo = TiposManifiestoRepository().get_by_id(tipo_id_body)
                if tipo and tipo.get('username') == username.lower():
                    tipo_id = tipo.get('id') or tipo_id_body
                    tipo_nombre = tipo.get('nombre') or ''
                    CarpetasMetaRepository().upsert_tipo(username, folder_name, tipo_id, tipo_nombre)
            else:
                meta = CarpetasMetaRepository().get_for_folder(username, folder_name)
                if meta:
                    tipo_id = meta.get('tipo_id') or ''
                    tipo_nombre = meta.get('tipo_nombre') or ''
        except Exception as e:
            print(f"[WARN] No se pudo resolver tipo de manifiesto: {e}")

        indices_guardados = []
        
        for i, manifiesto in enumerate(manifiestos):
            archivo = manifiesto.get('archivo', '')
            if not archivo:
                if i < len(archivos_pdf):
                    archivo = archivos_pdf[i]
                else:
                    archivo = f"archivo_{i+1}.pdf"
            
            factura_data = facturas_electronicas[i] if i < len(facturas_electronicas) else {}
            
            success, message, existing = manifiestos_repo.save_manifiesto(
                username=username,
                folder_name=folder_name,
                archivo=archivo,
                manifiesto_data=manifiesto,
                factura_data=factura_data,
                tipo_id=tipo_id,
                tipo_nombre=tipo_nombre,
            )
            
            if success:
                if existing:
                    manifiestos_duplicados_firebase.append({
                        'archivo': archivo,
                        'load_id': manifiesto.get('load_id', 'No encontrado'),
                        'remesa': manifiesto.get('remesa', 'No encontrada'),
                        'message': message,
                        'existing_id': existing.get('id') if existing else None,
                        'archivo_original': (existing or {}).get('archivo') or (existing or {}).get('filename'),
                        'folder_original': (existing or {}).get('folder_name'),
                    })
                    print(f"[DUPLICADO] {archivo}: {message}")
                else:
                    indices_guardados.append(i)
                    manifiestos_guardados.append({
                        'archivo': archivo,
                        'load_id': manifiesto.get('load_id', 'No encontrado'),
                        'remesa': manifiesto.get('remesa', 'No encontrada')
                    })
                    print(f"[OK] Manifiesto guardado en Firebase: {archivo}")
            else:
                if 'duplicado' in message.lower():
                    manifiestos_duplicados_firebase.append({
                        'archivo': archivo,
                        'load_id': manifiesto.get('load_id', 'No encontrado'),
                        'remesa': manifiesto.get('remesa', 'No encontrada'),
                        'message': message,
                        'existing_id': (existing or {}).get('id'),
                        'archivo_original': (existing or {}).get('archivo') or (existing or {}).get('filename'),
                        'folder_original': (existing or {}).get('folder_name'),
                    })
                else:
                    manifiestos_errores.append({
                        'archivo': archivo,
                        'error': message
                    })
                    print(f"[ERROR] Error al guardar {archivo}: {message}")
        
        manifiestos_para_excel = [manifiestos[i] for i in indices_guardados]
        
        # 🔥 CORRECCIÓN: Enviar todos los datos completos de los manifiestos guardados
        manifiestos_completos_guardados = []
        for i in indices_guardados:
            if i < len(manifiestos):
                manifiestos_completos_guardados.append(manifiestos[i])
        
        excel_url = None
        excel_storage_path = None
        if manifiestos_para_excel:
            try:
                # Generar Excel en memoria
                excel_buffer, excel_filename = crear_excel_en_memoria(manifiestos_para_excel, folder_name)
                
                if excel_buffer and excel_filename:
                    # Subir Excel a Firebase Storage
                    excel_storage_path = f"excels/{username}/{folder_name}/{excel_filename}"
                    excel_blob = bucket.blob(excel_storage_path)
                    
                    excel_buffer.seek(0)
                    excel_blob.upload_from_file(
                        excel_buffer,
                        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    )
                    
                    # Generar URL pública o firmada
                    try:
                        excel_blob.make_public()
                        excel_url = excel_blob.public_url
                    except Exception:
                        excel_url = excel_blob.generate_signed_url(expiration=31536000)  # 1 año
                    
                    print(f"[OK] Excel subido a Firebase Storage: {excel_storage_path}")
            except Exception as e:
                print(f"[WARN] Error al generar/subir Excel: {e}")
                import traceback
                traceback.print_exc()
        
        try:
            for archivo in archivos_pdf:
                try:
                    pdfs_repo.mark_as_processed(username, folder_name, archivo)
                except Exception as e:
                    print(f"Advertencia: No se pudo marcar {archivo} como procesado: {e}")
        except Exception as e:
            print(f"Advertencia: No se pudo actualizar estado de PDFs en Firebase: {e}")
        
        total_guardados = len(manifiestos_guardados)
        total_duplicados = len(archivos_duplicados) + len(manifiestos_duplicados_firebase)
        total_errores = len(manifiestos_errores)
        
        return jsonify({
            'success': True,
            'message': f'Procesados {total_guardados} manifiesto(s). {total_duplicados} duplicado(s) detectado(s).',
            'data': {
                'manifiestos': manifiestos_completos_guardados,  # 🔥 CORRECCIÓN: Datos completos
                'facturas_electronicas': facturas_electronicas,
                'excel_url': excel_url,
                'excel_storage_path': excel_storage_path,
                'total_manifiestos': total_guardados,
                'total_procesados': len(manifiestos),
                'archivos_duplicados': archivos_duplicados,
                'manifiestos_duplicados_firebase': manifiestos_duplicados_firebase,
                'manifiestos_errores': manifiestos_errores,
                'total_duplicados': total_duplicados,
                'total_errores': total_errores,
                'manifiestos_guardados': manifiestos_guardados
            }
        })
    except Exception as e:
        import traceback
        tb = traceback.format_exc().encode('ascii', 'replace').decode('ascii')
        print(tb)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/download_excel', methods=['GET'])
@login_required_api
def download_excel():
    """API para descargar Excel. Regenera desde Firestore para incluir TODO lo de la carpeta."""
    try:
        from flask import send_file
        from io import BytesIO
        
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        folder_name = request.args.get('folder_name')
        if not folder_name:
            return jsonify({'success': False, 'error': 'folder_name requerido'}), 400

        # Para conductor: exportar desde el owner real (parent_username)
        owner_username = username
        try:
            from app.api.manifiestos_data import _get_owner_username_for_manifiestos
            owner_username = _get_owner_username_for_manifiestos(username)
        except Exception:
            owner_username = username

        # 1) Leer manifiestos desde Firestore (fuente de verdad, igual que la tabla)
        try:
            from app.database.manifiestos_repository import ManifiestosRepository
            repo = ManifiestosRepository()
            filters = [('username', '==', owner_username), ('active', '==', True), ('folder_name', '==', folder_name)]
            # Exporta hasta 10k por carpeta (si necesitas más, se puede paginar).
            manifiestos = repo.get_all(filters=filters, limit=10000)
        except ImportError:
            return jsonify({'success': False, 'error': 'Firebase no disponible'}), 503

        if not manifiestos:
            return jsonify({
                'success': False,
                'error': 'No hay manifiestos para exportar en esa carpeta.'
            }), 404

        # 2) Generar Excel en memoria con normalización de campos
        from modules.excel_generator import crear_excel_en_memoria
        excel_buffer, excel_filename = crear_excel_en_memoria(manifiestos, folder_name)
        if not excel_buffer or not excel_filename:
            return jsonify({'success': False, 'error': 'No se pudo generar el Excel'}), 500

        # 3) (Opcional) Subir a Storage como caché para descargas futuras
        try:
            from app.config.firebase_config import FirebaseConfig
            bucket = FirebaseConfig.get_storage_bucket()
            excel_storage_path = f"excels/{owner_username}/{folder_name}/{excel_filename}"
            blob = bucket.blob(excel_storage_path)
            excel_buffer.seek(0)
            blob.upload_from_file(
                excel_buffer,
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            try:
                blob.make_public()
            except Exception:
                pass
        except Exception as e:
            print(f"[WARN] No se pudo cachear el Excel en Storage: {e}")

        # 4) Responder archivo
        excel_buffer.seek(0)
        return send_file(
            excel_buffer,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=excel_filename
        )
    except Exception as e:
        print(f"Error al descargar Excel: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/update_field', methods=['POST'])
@login_required_api
def update_manifiesto_field():
    """API para actualizar un campo de un manifiesto en Firestore"""
    try:
        username = get_current_user()
        if not username:
            return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 401
        
        data = request.get_json()
        manifest_id = data.get('manifest_id')
        field = data.get('field')
        value = data.get('value')
        
        if not all([manifest_id, field is not None]):
            return jsonify({
                'success': False,
                'error': 'manifest_id y field son requeridos'
            }), 400
        
        try:
            from app.database.manifiestos_repository import ManifiestosRepository
            repo = ManifiestosRepository()
            
            if field == 'tipo_id':
                tipo_id = (value or '').strip()
                tipo_nombre = ''
                if tipo_id:
                    from app.database.tipos_manifiesto_repository import TiposManifiestoRepository
                    tipo = TiposManifiestoRepository().get_by_id(tipo_id)
                    if not tipo or tipo.get('username') != username.lower():
                        return jsonify({'success': False, 'error': 'Tipo no válido'}), 400
                    tipo_nombre = tipo.get('nombre') or ''
                success = repo.update(manifest_id, {'tipo_id': tipo_id, 'tipo_nombre': tipo_nombre})
            else:
                success = repo.update(manifest_id, {field: value})
            
            if success:
                return jsonify({
                    'success': True,
                    'message': f'Campo {field} actualizado correctamente'
                })
            else:
                return jsonify({
                    'success': False,
                    'error': 'No se pudo actualizar el campo'
                }), 500
                
        except ImportError:
            return jsonify({
                'success': False,
                'error': 'ManifiestosRepository no está disponible'
            }), 503
            
    except Exception as e:
        print(f"Error al actualizar campo de manifiesto: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
