// Esperar a que el DOM esté cargado antes de obtener los elementos
let folderInput, selectedFiles, processBtn, loading, resultsSection, resultsContent, uploadSection;

function initializeElements() {
    folderInput = document.getElementById('folderInput');
    selectedFiles = document.getElementById('selectedFiles');
    processBtn = document.getElementById('processBtn');
    loading = document.getElementById('loading');
    resultsSection = document.getElementById('resultsSection');
    resultsContent = document.getElementById('resultsContent');
    uploadSection = document.getElementById('uploadSection');
    
    console.log('Elementos inicializados:', {
        folderInput: !!folderInput,
        selectedFiles: !!selectedFiles,
        processBtn: !!processBtn,
        loading: !!loading,
        resultsSection: !!resultsSection,
        resultsContent: !!resultsContent,
        uploadSection: !!uploadSection
    });
}

let selectedFilesList = [];
let currentData = null; // Almacenar datos actuales para regenerar Excel

// Configurar event listeners después de inicializar elementos
function setupEventListeners() {
    if (folderInput) {
        folderInput.addEventListener('change', function(e) {
            selectedFilesList = Array.from(e.target.files);
            console.log('Archivos seleccionados:', selectedFilesList.length);
            displaySelectedFiles();
        });
    }
    
    if (uploadSection) {
        uploadSection.addEventListener('dragover', function(e) {
            e.preventDefault();
            uploadSection.classList.add('dragover');
        });

        uploadSection.addEventListener('dragleave', function(e) {
            e.preventDefault();
            uploadSection.classList.remove('dragover');
        });

        uploadSection.addEventListener('drop', function(e) {
            e.preventDefault();
            uploadSection.classList.remove('dragover');
            
            const files = Array.from(e.dataTransfer.files);
            selectedFilesList = files;
            console.log('Archivos por drag & drop:', selectedFilesList.length);
            displaySelectedFiles();
        });
    }
    
    if (processBtn) {
        processBtn.addEventListener('click', async function() {
            if (selectedFilesList.length === 0) return;

            // Mostrar loading
            if (loading) loading.style.display = 'block';
            if (resultsSection) resultsSection.style.display = 'none';
            processBtn.disabled = true;

            try {
                const formData = new FormData();
                selectedFilesList.forEach(file => {
                    formData.append('files', file);
                });

                const response = await fetch('/process', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (result.success) {
                    displayResults(result.data);
                    showMessage('Archivos procesados exitosamente', 'success');
                } else {
                    showMessage('Error al procesar archivos: ' + result.error, 'error');
                }
            } catch (error) {
                showMessage('Error de conexión: ' + error.message, 'error');
            } finally {
                if (loading) loading.style.display = 'none';
                processBtn.disabled = false;
            }
        });
    }
}

// Mostrar archivos seleccionados
function displaySelectedFiles() {
    if (!selectedFiles) {
        console.error('Elemento selectedFiles no encontrado');
        return;
    }
    
    selectedFiles.innerHTML = '';
    if (selectedFilesList.length > 0) {
        const filesDiv = document.createElement('div');
        filesDiv.innerHTML = `<h4>Archivos seleccionados (${selectedFilesList.length}):</h4>`;
        
        selectedFilesList.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `📄 ${file.name}`;
            filesDiv.appendChild(fileItem);
        });
        
        selectedFiles.appendChild(filesDiv);
    } else {
        // Mostrar mensaje cuando no hay archivos
        const noFilesDiv = document.createElement('div');
        noFilesDiv.innerHTML = '<p style="color: #666; font-style: italic;">No hay archivos seleccionados</p>';
        selectedFiles.appendChild(noFilesDiv);
    }
    
    // Actualizar contador de archivos
    updateFileCount();
    
    // Actualizar estado del botón
    updateProcessButton();
}

// Actualizar estado del botón de procesar
function updateProcessButton() {
    if (!processBtn) {
        console.error('Elemento processBtn no encontrado');
        return;
    }
    
    if (selectedFilesList.length > 0) {
        processBtn.disabled = false;
        processBtn.innerHTML = `🔄 Procesar ${selectedFilesList.length} PDFs`;
    } else {
        processBtn.disabled = true;
        processBtn.innerHTML = '🔄 Procesar PDFs';
    }
}

// Actualizar contador de archivos
function updateFileCount() {
    const fileCountSpan = document.querySelector('#fileCount span');
    console.log('Actualizando contador:', selectedFilesList.length, 'Elemento encontrado:', fileCountSpan);
    if (fileCountSpan) {
        fileCountSpan.textContent = selectedFilesList.length;
        console.log('Contador actualizado a:', fileCountSpan.textContent);
    } else {
        console.error('No se encontró el elemento #fileCount span');
    }
}


// Función para contar campos faltantes en un registro
function countMissingFields(item) {
    const criticalFields = ['placa', 'fecha inicio', 'load_id', 'mes', 'destino', 'kof'];
    let missingCount = 0;
    
    criticalFields.forEach(field => {
        const value = item[field];
        if (!value || value === 'No encontrado' || value === 'No encontrada' || value === 'N/A') {
            missingCount++;
        }
    });
    
    return missingCount;
}

// Mostrar resultados
function displayResults(data) {
    if (!resultsSection) {
        console.error('Elemento resultsSection no encontrado');
        return;
    }
    
    resultsSection.style.display = 'block';
    
    // Guardar datos actuales para regenerar Excel
    currentData = data;
    
    // Obtener contenedores de tabla
    const manifiestosTable = document.getElementById('manifiestosTable');
    const facturasTable = document.getElementById('facturasTable');

    if (!manifiestosTable || !facturasTable) {
        console.error('Contenedores de tabla no encontrados');
        return;
    }

    // Mensaje de éxito
    let successHtml = '';
    if (data && data.manifiestos && data.manifiestos.length > 0) {
        successHtml = `
            <div class="success-message">
                ✅ Se procesaron ${data.manifiestos.length} manifiestos exitosamente
            </div>
        `;
    }

    // Generar tabla de Manifiestos
    let manifiestosHtml = `
        <table class="dynamic-table">
            <thead>
                <tr>
                    <th style="width: 60px;">PDF</th>
                    <th style="width: 80px;">ID</th>
                    <th style="width: 120px;">FECHA INICIO</th>
                    <th style="width: 120px;">FECHA RETORNO</th>
                    <th style="width: 100px;">HORA INICIO</th>
                    <th style="width: 100px;">HORA RETORNO</th>
                    <th style="width: 120px;">LOAD ID</th>
                    <th style="width: 150px;">CONDUCTOR</th>
                    <th style="width: 100px;">PLACA</th>
                    <th style="width: 150px;">DESTINO</th>
                    <th style="width: 150px;">ORIGEN</th>
                    <th style="width: 100px;">KOF</th>
                    <th style="width: 120px;">REMESA</th>
                    <th style="width: 100px;">MES</th>
                    <th style="width: 120px;">EMPRESA</th>
                    <th style="width: 120px;">VALOR</th>
                    <th style="width: 100px;">ESTADO</th>
                    <th style="width: 140px;">ACCIONES</th>
                </tr>
            </thead>
            <tbody>
    `;

    if (data.manifiestos && data.manifiestos.length > 0) {
        // Ordenar registros: primero los que tienen campos faltantes, luego los completos
        const sortedManifiestos = data.manifiestos.map((item, originalIndex) => ({
            ...item,
            originalIndex: originalIndex,
            missingFieldsCount: countMissingFields(item)
        })).sort((a, b) => {
            // Primero por cantidad de campos faltantes (descendente)
            if (a.missingFieldsCount !== b.missingFieldsCount) {
                return b.missingFieldsCount - a.missingFieldsCount;
            }
            // Luego por índice original (ascendente)
            return a.originalIndex - b.originalIndex;
        });

        sortedManifiestos.forEach((item, displayIndex) => {
            const originalIndex = item.originalIndex;
            
            // Función para determinar si una celda debe tener color rojo
            const getCellClass = (value, fieldName) => {
                const criticalFields = ['placa', 'fecha inicio', 'load_id', 'mes', 'destino', 'kof'];
                const isMissing = !value || value === 'No encontrado' || value === 'No encontrada' || value === 'N/A';
                const isCriticalField = criticalFields.includes(fieldName);
                return isMissing && isCriticalField ? 'missing-data-cell' : '';
            };

            manifiestosHtml += `
                <tr data-index="${originalIndex}" class="${item.missingFieldsCount > 0 ? 'row-with-missing-data' : ''}">
                    <td>
                        <button class="btn-action view-btn" onclick="openPDF('${item.archivo}')" title="Ver PDF">
                            👁️
                        </button>
                    </td>
                    <td><span class="id-cell">${displayIndex + 1}</span></td>
                    <td><span class="editable-cell ${getCellClass(item['fecha inicio'], 'fecha inicio')}" contenteditable="true" data-field="fecha inicio" data-index="${originalIndex}">${item['fecha inicio'] || 'No encontrada'}</span></td>
                    <td><span class="editable-cell" contenteditable="true" data-field="fecha retorno" data-index="${originalIndex}">${item['fecha retorno'] || 'No encontrada'}</span></td>
                    <td><span class="editable-cell" contenteditable="true" data-field="hora inicio" data-index="${originalIndex}">${item['hora inicio'] || 'No encontrada'}</span></td>
                    <td><span class="editable-cell" contenteditable="true" data-field="hora retorno" data-index="${originalIndex}">${item['hora retorno'] || 'No encontrada'}</span></td>
                    <td><span class="editable-cell ${getCellClass(item.load_id, 'load_id')}" contenteditable="true" data-field="load_id" data-index="${originalIndex}">${item.load_id || 'No encontrado'}</span></td>
                    <td><span class="editable-cell" contenteditable="true" data-field="conductor" data-index="${originalIndex}">${item.conductor || 'No encontrado'}</span></td>
                    <td><span class="editable-cell ${getCellClass(item.placa, 'placa')}" contenteditable="true" data-field="placa" data-index="${originalIndex}">${item.placa || 'No encontrada'}</span></td>
                    <td><span class="editable-cell ${getCellClass(item.destino, 'destino')}" contenteditable="true" data-field="destino" data-index="${originalIndex}">${item.destino || 'No encontrado'}</span></td>
                    <td><span class="editable-cell" contenteditable="true" data-field="origen" data-index="${originalIndex}">${item.origen || 'No encontrado'}</span></td>
                    <td><span class="editable-cell ${getCellClass(item.kof, 'kof')}" contenteditable="true" data-field="kof" data-index="${originalIndex}">${item.kof || 'No encontrado'}</span></td>
                    <td><span class="editable-cell" contenteditable="true" data-field="remesa" data-index="${originalIndex}">${item.remesa || 'No encontrada'}</span></td>
                    <td><span class="editable-cell ${getCellClass(item.mes, 'mes')}" contenteditable="true" data-field="mes" data-index="${originalIndex}">${item.mes || 'No encontrado'}</span></td>
                    <td><span class="editable-cell" contenteditable="true" data-field="empresa" data-index="${originalIndex}">${item.empresa || 'No encontrado'}</span></td>
                    <td><span class="editable-cell" contenteditable="true" data-field="valormanifiesto" data-index="${originalIndex}">$${Number(item.valormanifiesto || 0).toLocaleString('es-CO')}</span></td>
                    <td><span class="editable-cell" contenteditable="true" data-field="estado" data-index="${originalIndex}">${item.estado || 'No encontrado'}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-action edit-btn" onclick="saveRow(${originalIndex})" title="Guardar cambios">
                                💾
                            </button>
                            <button class="btn-action delete-btn" onclick="deleteRow(${originalIndex})" title="Eliminar registro">
                                🗑️
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
    } else {
        manifiestosHtml += `
            <tr>
                <td colspan="18" class="table-empty">
                    No hay datos de manifiestos disponibles
                </td>
            </tr>
        `;
    }

    manifiestosHtml += `
            </tbody>
        </table>
    `;

    // Generar tabla de Facturas Electrónicas
    let facturasHtml = `
        <table class="dynamic-table">
            <thead>
                <tr>
                    <th style="width: 60px;">PDF</th>
                    <th style="width: 80px;">ID</th>
                    <th style="width: 140px;">FECHA GENERACIÓN</th>
                    <th style="width: 140px;">FECHA VENCIMIENTO</th>
                    <th style="width: 140px;">VALOR MANIFIESTO</th>
                    <th style="width: 120px;">ESTADO</th>
                    <th style="width: 140px;">NÚMERO FACTURA</th>
                    <th style="width: 140px;">TIPO DOCUMENTO</th>
                    <th style="width: 120px;">ACCIONES</th>
                </tr>
            </thead>
            <tbody>
    `;

    if (data.facturas_electronicas && data.facturas_electronicas.length > 0) {
        data.facturas_electronicas.forEach((item, index) => {
            facturasHtml += `
                <tr data-index="${index}">
                    <td>
                        <button class="btn-action view-btn" onclick="openPDF('${item.archivo}')" title="Ver PDF">
                            👁️
                        </button>
                    </td>
                    <td><span class="id-cell">${item['ID Manifiesto'] || (index + 1)}</span></td>
                    <td><span class="editable-cell" contenteditable="true" data-field="fecha Generacion" data-index="${index}">${item['fecha Generacion'] || 'N/A'}</span></td>
                    <td><span class="editable-cell" contenteditable="true" data-field="fecha Vencimiento" data-index="${index}">${item['fecha Vencimiento'] || 'N/A'}</span></td>
                    <td><span class="editable-cell" contenteditable="true" data-field="valormanifiesto" data-index="${index}">$${item.valormanifiesto ? item.valormanifiesto.toLocaleString() : 'N/A'}</span></td>
                    <td><span class="editable-cell" contenteditable="true" data-field="estado" data-index="${index}">${item.estado || 'N/A'}</span></td>
                    <td><span class="editable-cell" contenteditable="true" data-field="numero_factura" data-index="${index}">${item.numero_factura || 'N/A'}</span></td>
                    <td><span class="editable-cell" contenteditable="true" data-field="tipo_documento" data-index="${index}">${item.tipo_documento || 'N/A'}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-action edit-btn" onclick="saveRow(${index})" title="Guardar cambios">
                                💾
                            </button>
                            <button class="btn-action delete-btn" onclick="deleteRow(${index})" title="Eliminar registro">
                                🗑️
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
    } else {
        facturasHtml += `
            <tr>
                <td colspan="9" class="table-empty">
                    No hay datos de facturas electrónicas disponibles
                </td>
            </tr>
        `;
    }

    facturasHtml += `
            </tbody>
        </table>
    `;

    // Actualizar contenedores de tabla
    manifiestosTable.innerHTML = manifiestosHtml;
    facturasTable.innerHTML = facturasHtml;

    // Mostrar archivos duplicados si existen
    displayDuplicados(data.archivos_duplicados || []);

    // Botones de descarga en el contenedor principal
    resultsContent.innerHTML = successHtml + `
        <div style="margin-top: 30px; text-align: center;">
            <button class="download-btn" onclick="downloadExcel()">📥 Descargar Excel</button>
            <button class="download-btn" onclick="abrirExcel()" style="background: linear-gradient(45deg, #28a745, #20c997);">📂 Abrir Excel</button>
        </div>
    `;
}

// Mostrar archivos duplicados
function displayDuplicados(archivosDuplicados) {
    const duplicadosSection = document.getElementById('duplicadosSection');
    const duplicadosTable = document.getElementById('duplicadosTable');
    
    if (!duplicadosSection || !duplicadosTable) {
        console.error('Elementos de duplicados no encontrados');
        return;
    }
    
    if (!archivosDuplicados || archivosDuplicados.length === 0) {
        duplicadosSection.style.display = 'none';
        return;
    }
    
    duplicadosSection.style.display = 'block';
    
    let duplicadosHtml = `
        <table class="dynamic-table">
            <thead>
                <tr>
                    <th style="width: 40px;">
                        <input type="checkbox" id="selectAllCheckbox" onchange="toggleAllDuplicados(this.checked)">
                    </th>
                    <th style="width: 60px;">ID</th>
                    <th style="width: 250px;">ARCHIVO</th>
                    <th style="width: 150px;">IDENTIFICADOR</th>
                    <th style="width: 120px;">LOAD ID</th>
                    <th style="width: 120px;">REMESA (KBQ)</th>
                    <th style="width: 200px;">ARCHIVO ORIGINAL</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    archivosDuplicados.forEach((dup, index) => {
        duplicadosHtml += `
            <tr>
                <td>
                    <input type="checkbox" class="duplicado-checkbox" data-archivo='${JSON.stringify(dup)}'>
                </td>
                <td>${index + 1}</td>
                <td class="archivo-duplicado">${dup.archivo || 'N/A'}</td>
                <td>${dup.identificador || 'N/A'}</td>
                <td>${dup.load_id || 'N/A'}</td>
                <td>${dup.remesa || 'N/A'}</td>
                <td class="archivo-original">${dup.archivo_original || 'N/A'}</td>
            </tr>
        `;
    });
    
    duplicadosHtml += `
            </tbody>
        </table>
    `;
    
    duplicadosTable.innerHTML = duplicadosHtml;
}

// Seleccionar todos los duplicados
function selectAllDuplicados() {
    const checkboxes = document.querySelectorAll('.duplicado-checkbox');
    checkboxes.forEach(cb => cb.checked = true);
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    if (selectAllCheckbox) selectAllCheckbox.checked = true;
}

// Deseleccionar todos los duplicados
function deseleccionarTodosDuplicados() {
    const checkboxes = document.querySelectorAll('.duplicado-checkbox');
    checkboxes.forEach(cb => cb.checked = false);
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    if (selectAllCheckbox) selectAllCheckbox.checked = false;
}

// Función corregida para deseleccionar
function deselectAllDuplicados() {
    deseleccionarTodosDuplicados();
}

// Toggle todos los duplicados
function toggleAllDuplicados(checked) {
    const checkboxes = document.querySelectorAll('.duplicado-checkbox');
    checkboxes.forEach(cb => cb.checked = checked);
}

// Eliminar duplicados seleccionados
async function eliminarDuplicadosSeleccionados() {
    const checkboxes = document.querySelectorAll('.duplicado-checkbox:checked');
    
    if (checkboxes.length === 0) {
        showMessage('Por favor selecciona al menos un archivo duplicado para eliminar', 'error');
        return;
    }
    
    const archivosAEliminar = Array.from(checkboxes).map(cb => {
        return JSON.parse(cb.getAttribute('data-archivo'));
    });
    
    if (!confirm(`¿Estás seguro de que deseas eliminar ${archivosAEliminar.length} archivo(s) duplicado(s)?`)) {
        return;
    }
    
    try {
        const response = await fetch('/api/eliminar-duplicados', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                archivos: archivosAEliminar
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage(result.message, 'success');
            // Recargar la lista de duplicados
            await cargarDuplicados();
        } else {
            showMessage('Error al eliminar archivos: ' + result.error, 'error');
        }
    } catch (error) {
        showMessage('Error de conexión: ' + error.message, 'error');
    }
}

// Cargar duplicados desde el servidor
async function cargarDuplicados() {
    try {
        const response = await fetch('/api/archivos-duplicados');
        const result = await response.json();
        
        if (result.success) {
            displayDuplicados(result.data.archivos_duplicados || []);
        }
    } catch (error) {
        console.error('Error al cargar duplicados:', error);
    }
}

// Mostrar mensajes
function showMessage(message, type) {
    if (!resultsContent) {
        console.error('Elemento resultsContent no encontrado');
        return;
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'success' ? 'success-message' : 'error-message';
    messageDiv.textContent = message;
    
    resultsContent.insertBefore(messageDiv, resultsContent.firstChild);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Descargar Excel
function downloadExcel() {
    window.location.href = '/download';
}

// Abrir Excel
function abrirExcel() {
    // Crear un enlace temporal para abrir el Excel
    const link = document.createElement('a');
    link.href = '/download';
    link.download = '';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Abrir PDF
function openPDF(filename) {
    if (filename && filename !== 'N/A') {
        window.open(`/open_pdf/${filename}`, '_blank');
    } else {
        showMessage('No hay archivo PDF disponible', 'error');
    }
}

// Guardar cambios de una fila
async function saveRow(index) {
    const row = document.querySelector(`tr[data-index="${index}"]`);
    const cells = row.querySelectorAll('[contenteditable="true"]');
    
    const updates = [];
    cells.forEach(cell => {
        const field = cell.getAttribute('data-field');
        const value = cell.textContent.trim();
        updates.push({ field, value });
    });
    
    try {
        for (const update of updates) {
            const response = await fetch('/update_data', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    index: index,
                    field: update.field,
                    value: update.value
                })
            });
            
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error);
            }
        }
        
        showMessage('Datos guardados correctamente', 'success');
        
        // Regenerar Excel con datos actualizados
        await regenerateExcel();
        
        // Cambiar el botón de guardar a un checkmark temporal
        const saveBtn = row.querySelector('.edit-btn');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '✅';
        saveBtn.style.background = '#28a745';
        
        setTimeout(() => {
            saveBtn.innerHTML = originalText;
            saveBtn.style.background = '';
        }, 2000);
        
    } catch (error) {
        showMessage('Error al guardar: ' + error.message, 'error');
    }
}

// Eliminar una fila
async function deleteRow(index) {
    if (!confirm('¿Estás seguro de que quieres eliminar este registro y su archivo PDF?')) {
        return;
    }
    
    try {
        // Obtener el nombre del archivo de la fila
        const row = document.querySelector(`tr[data-index="${index}"]`);
        const filenameCell = row.querySelector('.pdf-link');
        const filename = filenameCell ? filenameCell.textContent.replace('📄 ', '').trim() : null;
        
        const response = await fetch('/delete_record', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                index: index,
                filename: filename
            })
        });
        
        const result = await response.json();
        if (result.success) {
            // Remover la fila de la tabla
            if (row) {
                row.remove();
                showMessage('Registro y archivo eliminados correctamente', 'success');
            }
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        showMessage('Error al eliminar: ' + error.message, 'error');
    }
}

// Agregar estilos para elementos editables
function addEditableStyles() {
    const style = document.createElement('style');
    style.textContent = `
        [contenteditable="true"] {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            padding: 4px;
            border-radius: 3px;
            transition: background-color 0.2s;
        }
        
        [contenteditable="true"]:focus {
            background-color: #fff;
            border-color: #007bff;
            outline: none;
        }
        
        .action-btn {
            background: none;
            border: none;
            padding: 8px 12px;
            margin: 0 2px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 36px;
            height: 36px;
        }
        
        .view-btn {
            background: linear-gradient(45deg, #17a2b8, #138496);
            color: white;
            box-shadow: 0 2px 4px rgba(23, 162, 184, 0.3);
        }
        
        .view-btn:hover {
            background: linear-gradient(45deg, #138496, #0f6674);
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(23, 162, 184, 0.4);
        }
        
        .view-btn:active {
            transform: translateY(0);
        }
        
        .edit-btn {
            background: linear-gradient(45deg, #28a745, #20c997);
            color: white;
            box-shadow: 0 2px 4px rgba(40, 167, 69, 0.3);
        }
        
        .edit-btn:hover {
            background: linear-gradient(45deg, #20c997, #1e7e34);
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(40, 167, 69, 0.4);
        }
        
        .delete-btn {
            background: linear-gradient(45deg, #dc3545, #c82333);
            color: white;
            box-shadow: 0 2px 4px rgba(220, 53, 69, 0.3);
        }
        
        .delete-btn:hover {
            background: linear-gradient(45deg, #c82333, #bd2130);
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(220, 53, 69, 0.4);
        }
        
        /* Estilos para celdas con datos faltantes */
        .missing-data-cell {
            background-color: #ffebee !important;
            color: #c62828 !important;
            font-weight: bold !important;
            border: 2px solid #f44336 !important;
        }
        
        .missing-data-cell:focus {
            background-color: #ffcdd2 !important;
            border-color: #d32f2f !important;
        }
        
        /* Estilos para filas con datos faltantes */
        .row-with-missing-data {
            background-color: #fff3e0 !important;
            border-left: 4px solid #ff9800 !important;
        }
        
        .row-with-missing-data:hover {
            background-color: #ffe0b2 !important;
        }
        
        /* Estilos para la tabla */
        .dynamic-table {
            border-collapse: collapse;
            width: 100%;
        }
        
        .dynamic-table th,
        .dynamic-table td {
            border: 1px solid #dee2e6;
            padding: 8px;
            text-align: left;
        }
        
        .dynamic-table th {
            background-color: #f8f9fa;
            font-weight: bold;
            position: sticky;
            top: 0;
            z-index: 10;
        }
        
        .dynamic-table tbody tr:hover {
            background-color: #f5f5f5;
        }
    `;
    document.head.appendChild(style);
}

// Regenerar Excel con datos actualizados
async function regenerateExcel() {
    try {
        if (currentData && currentData.manifiestos) {
            const response = await fetch('/regenerate_excel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    manifiestos: currentData.manifiestos,
                    facturas_electronicas: currentData.facturas_electronicas
                })
            });
            
            const result = await response.json();
            if (result.success) {
                console.log('Excel regenerado correctamente');
            } else {
                console.error('Error al regenerar Excel:', result.error);
            }
        }
    } catch (error) {
        console.error('Error al regenerar Excel:', error);
    }
}

// ===== FUNCIONALIDAD DE CARPETAS =====

// Variables globales para el modal de renombrado
let currentRenameFolder = null;
let selectedFields = [];
let customSeparator = '_';
let availableFields = [
    { id: 'fecha_inicio', label: 'Fecha Inicio', icon: '📅' },
    { id: 'fecha_retorno', label: 'Fecha Retorno', icon: '📅' },
    { id: 'hora_inicio', label: 'Hora Inicio', icon: '🕐' },
    { id: 'hora_retorno', label: 'Hora Retorno', icon: '🕐' },
    { id: 'load_id', label: 'Load ID', icon: '🆔' },
    { id: 'conductor', label: 'Conductor', icon: '👤' },
    { id: 'placa', label: 'Placa', icon: '🚛' },
    { id: 'destino', label: 'Destino', icon: '📍' },
    { id: 'origen', label: 'Origen', icon: '🏠' },
    { id: 'kof', label: 'KOF', icon: '🔢' },
    { id: 'remesa', label: 'Remesa', icon: '📋' },
    { id: 'mes', label: 'Mes', icon: '📆' },
    { id: 'empresa', label: 'Empresa', icon: '🏢' },
    { id: 'valormanifiesto', label: 'Valor', icon: '💰' },
    { id: 'estado', label: 'Estado', icon: '📊' }
];

// Cargar carpetas disponibles
async function loadFolders() {
    const foldersGrid = document.getElementById('foldersGrid');
    if (!foldersGrid) {
        console.error('Elemento foldersGrid no encontrado');
        return;
    }
    
    try {
        // Mostrar estado de carga
        foldersGrid.innerHTML = '<div class="loading-folders">Cargando carpetas...</div>';
        
        // Buscar carpetas en el directorio MANIFIESTOS
        const response = await fetch('/api/folders');
        const result = await response.json();
        
        if (result.success && result.folders && result.folders.length > 0) {
            renderFolders(result.folders);
        } else {
            foldersGrid.innerHTML = '<div class="loading-folders">No se encontraron carpetas de manifiestos</div>';
        }
    } catch (error) {
        console.error('Error al cargar carpetas:', error);
        foldersGrid.innerHTML = '<div class="loading-folders">Error al cargar carpetas: ' + error.message + '</div>';
    }
}

// Renderizar las carpetas en el grid
function renderFolders(folders) {
    const foldersGrid = document.getElementById('foldersGrid');
    if (!foldersGrid) return;
    
    if (folders.length === 0) {
        foldersGrid.innerHTML = '<div class="loading-folders">No hay carpetas disponibles</div>';
        return;
    }
    
    let html = '';
    folders.forEach(folder => {
        // Obtener estadísticas reales
        const totalFiles = folder.pdf_count || 0;
        const processedFiles = folder.processed_count || 0;
        
        html += `
            <div class="folder-card" onclick="processFolder('${folder.name}')">
                <div class="folder-header">
                    <div class="folder-icon">📁</div>
                    <div class="folder-name">${folder.name}</div>
                    <div class="folder-status ${processedFiles === totalFiles ? 'status-complete' : 'status-partial'}">
                        ${processedFiles === totalFiles ? '✅ Completo' : '⚠️ Parcial'}
                    </div>
                </div>
                <div class="folder-stats">
                    <div class="stat-item">
                        <div class="stat-label">Archivos PDF</div>
                        <div class="stat-value">${totalFiles}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Procesados</div>
                        <div class="stat-value ${processedFiles === totalFiles ? 'processed-complete' : 'processed-partial'}">${processedFiles}</div>
                    </div>
                </div>
                <div class="folder-actions">
                    <button class="folder-btn process" onclick="event.stopPropagation(); processFolder('${folder.name}')">
                        🔄 Procesar
                    </button>
                    <button class="folder-btn rename" onclick="event.stopPropagation(); openRenameModal('${folder.name}')">
                        📝 Renombrar
                    </button>
                    <button class="folder-btn view" onclick="event.stopPropagation(); viewFolder('${folder.name}')">
                        👁️ Ver
                    </button>
                    <button class="folder-btn open" onclick="event.stopPropagation(); openFolder('${folder.name}')">
                        📂 Abrir Carpeta
                    </button>
                </div>
            </div>
        `;
    });
    
    foldersGrid.innerHTML = html;
}

// Procesar una carpeta específica
async function processFolder(folderName) {
    try {
        // Mostrar loading
        const loading = document.getElementById('loading');
        const resultsSection = document.getElementById('resultsSection');
        
        if (loading) loading.style.display = 'block';
        if (resultsSection) resultsSection.style.display = 'none';
        
        const response = await fetch('/api/process_folder', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ folder_name: folderName })
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayResults(result.data);
            showMessage(`Carpeta "${folderName}" procesada exitosamente`, 'success');
        } else {
            showMessage('Error al procesar carpeta: ' + result.error, 'error');
        }
    } catch (error) {
        showMessage('Error de conexión: ' + error.message, 'error');
    } finally {
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'none';
    }
}

// Ver contenido de una carpeta
function viewFolder(folderName) {
    // Esta función puede abrir una ventana modal o navegar a otra página
    // Por ahora, simplemente procesamos la carpeta
    processFolder(folderName);
}

// Abrir carpeta en el explorador de archivos
async function openFolder(folderName) {
    try {
        const response = await fetch('/api/open_folder', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ folder_name: folderName })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage(`Explorador de archivos abierto para "${folderName}"`, 'success');
        } else {
            showMessage('Error al abrir carpeta: ' + result.error, 'error');
        }
    } catch (error) {
        showMessage('Error de conexión: ' + error.message, 'error');
    }
}

// ===== FUNCIONALIDAD DE RENOMBRADO =====

// Abrir modal de renombrado
function openRenameModal(folderName) {
    currentRenameFolder = folderName;
    selectedFields = [];
    
    // Actualizar nombre de carpeta en el modal
    const modalFolderName = document.getElementById('modalFolderName');
    if (modalFolderName) {
        modalFolderName.textContent = `Carpeta: ${folderName}`;
    }
    
    // Renderizar campos disponibles
    renderAvailableFields();
    
    // Limpiar campos seleccionados
    const selectedFieldsContainer = document.getElementById('selectedFieldsContainer');
    if (selectedFieldsContainer) {
        selectedFieldsContainer.innerHTML = '';
    }
    
    // Ocultar sección de campos seleccionados
    const selectedFieldsSection = document.getElementById('selectedFieldsSection');
    if (selectedFieldsSection) {
        selectedFieldsSection.style.display = 'none';
    }
    
    // Actualizar vista previa
    updatePreview();
    
    // Mostrar modal
    const modal = document.getElementById('renameModal');
    if (modal) {
        modal.style.display = 'block';
    }
    
    // Configurar event listeners del modal
    setupRenameModalListeners();
}

// Cerrar modal de renombrado
function closeRenameModal() {
    const modal = document.getElementById('renameModal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentRenameFolder = null;
    selectedFields = [];
}

// Renderizar campos disponibles
function renderAvailableFields() {
    const availableFieldsContainer = document.getElementById('availableFields');
    if (!availableFieldsContainer) return;
    
    let html = '';
    availableFields.forEach(field => {
        html += `
            <div class="field-item" draggable="true" data-field-id="${field.id}">
                <div class="field-icon">${field.icon}</div>
                <div class="field-label">${field.label}</div>
            </div>
        `;
    });
    
    availableFieldsContainer.innerHTML = html;
    
    // Configurar drag and drop
    setupDragAndDrop();
}

// Configurar drag and drop
function setupDragAndDrop() {
    const fieldItems = document.querySelectorAll('.field-item');
    const selectedContainer = document.getElementById('selectedFieldsContainer');
    
    fieldItems.forEach(item => {
        item.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('text/plain', this.dataset.fieldId);
            this.classList.add('dragging');
        });
        
        item.addEventListener('dragend', function(e) {
            this.classList.remove('dragging');
        });
    });
    
    if (selectedContainer) {
        selectedContainer.addEventListener('dragover', function(e) {
            e.preventDefault();
        });
        
        selectedContainer.addEventListener('drop', function(e) {
            e.preventDefault();
            const fieldId = e.dataTransfer.getData('text/plain');
            addFieldToSelected(fieldId);
        });
    }
}

// Agregar campo a los seleccionados
function addFieldToSelected(fieldId) {
    const field = availableFields.find(f => f.id === fieldId);
    if (!field || selectedFields.find(f => f.id === fieldId)) return;
    
    selectedFields.push(field);
    renderSelectedFields();
    updatePreview();
}

// Renderizar campos seleccionados
function renderSelectedFields() {
    const selectedContainer = document.getElementById('selectedFieldsContainer');
    const selectedSection = document.getElementById('selectedFieldsSection');
    
    if (!selectedContainer) return;
    
    if (selectedFields.length === 0) {
        selectedSection.style.display = 'none';
        return;
    }
    
    selectedSection.style.display = 'block';
    
    let html = '';
    selectedFields.forEach((field, index) => {
        html += `
            <div class="selected-field-item" draggable="true" data-index="${index}">
                <span class="field-icon">${field.icon}</span>
                <span class="field-label">${field.label}</span>
                <button class="remove-field" onclick="removeField(${index})">×</button>
            </div>
        `;
    });
    
    selectedContainer.innerHTML = html;
    
    // Configurar drag and drop para reordenar
    setupReorderDragAndDrop();
}

// Configurar drag and drop para reordenar
function setupReorderDragAndDrop() {
    const selectedItems = document.querySelectorAll('.selected-field-item');
    
    selectedItems.forEach(item => {
        item.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('text/plain', this.dataset.index);
        });
        
        item.addEventListener('dragover', function(e) {
            e.preventDefault();
        });
        
        item.addEventListener('drop', function(e) {
            e.preventDefault();
            const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
            const toIndex = parseInt(this.dataset.index);
            
            if (fromIndex !== toIndex) {
                // Reordenar array
                const field = selectedFields.splice(fromIndex, 1)[0];
                selectedFields.splice(toIndex, 0, field);
                
                renderSelectedFields();
                updatePreview();
            }
        });
    });
}

// Remover campo de los seleccionados
function removeField(index) {
    selectedFields.splice(index, 1);
    renderSelectedFields();
    updatePreview();
}

// Configurar event listeners del modal
function setupRenameModalListeners() {
    // Contador de caracteres para texto personalizado
    const customTextInput = document.getElementById('customText');
    const charCount = document.getElementById('charCount');
    
    if (customTextInput && charCount) {
        customTextInput.addEventListener('input', function() {
            charCount.textContent = `${this.value.length}/50`;
        });
    }
    
    // Agregar texto personalizado
    const addCustomTextBtn = document.getElementById('addCustomText');
    if (addCustomTextBtn) {
        addCustomTextBtn.addEventListener('click', addCustomText);
    }
    
    // Cambiar separador
    const changeSeparatorBtn = document.getElementById('changeSeparator');
    if (changeSeparatorBtn) {
        changeSeparatorBtn.addEventListener('click', changeSeparator);
    }
    
    // Cerrar modal al hacer clic fuera
    const modal = document.getElementById('renameModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeRenameModal();
            }
        });
    }
}

// Agregar texto personalizado
function addCustomText() {
    const customTextInput = document.getElementById('customText');
    if (!customTextInput || !customTextInput.value.trim()) return;
    
    const customText = customTextInput.value.trim();
    const customField = {
        id: `custom_${Date.now()}`,
        label: customText,
        icon: '✏️',
        isCustom: true
    };
    
    selectedFields.push(customField);
    renderSelectedFields();
    updatePreview();
    
    // Limpiar input
    customTextInput.value = '';
    const charCount = document.getElementById('charCount');
    if (charCount) {
        charCount.textContent = '0/50';
    }
}

// Cambiar separador
function changeSeparator() {
    const separators = ['_', '-', '.', ' ', ''];
    const currentIndex = separators.indexOf(customSeparator);
    const nextIndex = (currentIndex + 1) % separators.length;
    customSeparator = separators[nextIndex];
    
    const separatorDisplay = document.getElementById('separatorDisplay');
    if (separatorDisplay) {
        separatorDisplay.textContent = customSeparator || '(sin separador)';
    }
    
    updatePreview();
}

// Actualizar vista previa
function updatePreview() {
    const previewName = document.getElementById('previewName');
    const confirmBtn = document.getElementById('confirmRenameBtn');
    
    if (!previewName) return;
    
    if (selectedFields.length === 0) {
        previewName.textContent = 'archivo.pdf';
        if (confirmBtn) confirmBtn.disabled = true;
        return;
    }
    
    // Generar nombre de ejemplo
    let fileName = '';
    selectedFields.forEach((field, index) => {
        if (index > 0 && customSeparator) {
            fileName += customSeparator;
        }
        
        if (field.isCustom) {
            fileName += field.label;
        } else {
            // Usar valores de ejemplo para campos de datos
            const exampleValues = {
                'fecha_inicio': '2025-10-06',
                'fecha_retorno': '2025-10-06',
                'hora_inicio': '08:30',
                'hora_retorno': '16:45',
                'load_id': '1234567',
                'conductor': 'JUAN PEREZ',
                'placa': 'ABC123',
                'destino': 'BOGOTA',
                'origen': 'MEDELLIN',
                'kof': '987654321',
                'remesa': 'KBQ12345',
                'mes': 'OCTUBRE',
                'empresa': 'EMPRESA ABC',
                'valormanifiesto': '150000',
                'estado': 'PAGADO'
            };
            fileName += exampleValues[field.id] || field.label;
        }
    });
    
    previewName.textContent = fileName + '.pdf';
    
    if (confirmBtn) {
        confirmBtn.disabled = false;
    }
}

// Confirmar renombrado
async function confirmRename() {
    if (!currentRenameFolder || selectedFields.length === 0) return;
    
    try {
        const response = await fetch('/api/rename_folder', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                folder_name: currentRenameFolder,
                fields: selectedFields,
                separator: customSeparator
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage(`Archivos de la carpeta "${currentRenameFolder}" renombrados exitosamente`, 'success');
            closeRenameModal();
            // Recargar carpetas para mostrar cambios
            loadFolders();
        } else {
            showMessage('Error al renombrar archivos: ' + result.error, 'error');
        }
    } catch (error) {
        showMessage('Error de conexión: ' + error.message, 'error');
    }
}

// ===== FUNCIONALIDAD DE ELIMINACIÓN MASIVA =====

// Función para confirmar eliminación masiva
function confirmDeleteAll() {
    // Crear modal de confirmación personalizado
    const modal = document.createElement('div');
    modal.className = 'delete-confirmation-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 15px;
        max-width: 500px;
        width: 90%;
        text-align: center;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    `;
    
    modalContent.innerHTML = `
        <div style="font-size: 4em; margin-bottom: 20px;">⚠️</div>
        <h2 style="color: #dc3545; margin-bottom: 15px;">¡ADVERTENCIA!</h2>
        <p style="margin-bottom: 20px; line-height: 1.5;">
            Esta acción eliminará <strong>TODOS</strong> los datos del sistema:
        </p>
        <ul style="text-align: left; margin: 20px 0; padding-left: 20px;">
            <li>🗂️ Todas las carpetas de MANIFIESTOS</li>
            <li>📄 Todos los archivos PDF</li>
            <li>📊 Todos los archivos Excel</li>
            <li>💾 Todos los datos procesados</li>
        </ul>
        <p style="color: #dc3545; font-weight: bold; margin: 20px 0;">
            Esta acción NO se puede deshacer.
        </p>
        <div style="display: flex; gap: 15px; justify-content: center; margin-top: 25px;">
            <button id="cancelDelete" style="
                background: #6c757d;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 1em;
                font-weight: 600;
            ">Cancelar</button>
            <button id="confirmDelete" style="
                background: #dc3545;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 1em;
                font-weight: 600;
            ">Sí, Eliminar Todo</button>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Event listeners para los botones
    document.getElementById('cancelDelete').onclick = () => {
        document.body.removeChild(modal);
    };
    
    document.getElementById('confirmDelete').onclick = () => {
        document.body.removeChild(modal);
        executeDeleteAll();
    };
    
    // Cerrar modal al hacer clic fuera
    modal.onclick = (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    };
}

// Función para ejecutar la eliminación masiva
async function executeDeleteAll() {
    try {
        // Mostrar loading
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'deleteLoading';
        loadingDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 10001;
            color: white;
        `;
        loadingDiv.innerHTML = `
            <div style="font-size: 3em; margin-bottom: 20px;">🗑️</div>
            <div style="font-size: 1.5em; margin-bottom: 10px;">Eliminando datos...</div>
            <div style="font-size: 1em; opacity: 0.8;">Por favor espera</div>
        `;
        document.body.appendChild(loadingDiv);
        
        // Realizar petición de eliminación
        const response = await fetch('/delete_all_data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const result = await response.json();
        
        // Remover loading
        document.body.removeChild(loadingDiv);
        
        if (result.success) {
            // Mostrar mensaje de éxito
            showDeleteSuccess(result);
            
            // Recargar carpetas disponibles
            setTimeout(() => {
                loadFolders();
            }, 2000);
        } else {
            showMessage('Error al eliminar datos: ' + result.error, 'error');
        }
        
    } catch (error) {
        // Remover loading si existe
        const loadingDiv = document.getElementById('deleteLoading');
        if (loadingDiv) {
            document.body.removeChild(loadingDiv);
        }
        showMessage('Error de conexión: ' + error.message, 'error');
    }
}

// Función para mostrar resultado de eliminación
function showDeleteSuccess(result) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 15px;
        max-width: 600px;
        width: 90%;
        text-align: center;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    `;
    
    let deletedItemsHtml = '';
    if (result.deleted_items && result.deleted_items.length > 0) {
        deletedItemsHtml = `
            <div style="margin: 20px 0;">
                <h4 style="color: #28a745; margin-bottom: 15px;">Elementos eliminados:</h4>
                <div style="max-height: 200px; overflow-y: auto; text-align: left; background: #f8f9fa; padding: 15px; border-radius: 8px;">
        `;
        result.deleted_items.forEach(item => {
            deletedItemsHtml += `<div style="margin: 5px 0;">✅ ${item}</div>`;
        });
        deletedItemsHtml += `</div></div>`;
    }
    
    let errorsHtml = '';
    if (result.errors && result.errors.length > 0) {
        errorsHtml = `
            <div style="margin: 20px 0;">
                <h4 style="color: #dc3545; margin-bottom: 15px;">Errores encontrados:</h4>
                <div style="max-height: 150px; overflow-y: auto; text-align: left; background: #f8f9fa; padding: 15px; border-radius: 8px;">
        `;
        result.errors.forEach(error => {
            errorsHtml += `<div style="margin: 5px 0; color: #dc3545;">❌ ${error}</div>`;
        });
        errorsHtml += `</div></div>`;
    }
    
    modalContent.innerHTML = `
        <div style="font-size: 4em; margin-bottom: 20px;">✅</div>
        <h2 style="color: #28a745; margin-bottom: 15px;">Eliminación Completada</h2>
        <p style="margin-bottom: 20px; font-size: 1.1em;">
            ${result.message}
        </p>
        ${deletedItemsHtml}
        ${errorsHtml}
        <button onclick="document.body.removeChild(this.closest('div').parentNode)" style="
            background: #28a745;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1em;
            font-weight: 600;
            margin-top: 20px;
        ">Cerrar</button>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
}

// Inicializar estilos cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    initializeElements(); // Inicializar elementos del DOM
    setupEventListeners(); // Configurar event listeners
    addEditableStyles();
    updateFileCount(); // Inicializar contador
    loadFolders(); // Cargar carpetas disponibles
    console.log('Página cargada, contador inicializado');
});
