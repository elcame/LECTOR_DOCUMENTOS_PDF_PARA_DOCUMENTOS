// Esperar a que el DOM esté cargado antes de obtener los elementos
let folderInput, selectedFiles, processBtn, loading, resultsSection, resultsContent, uploadSection, foldersGrid;

function initializeElements() {
    folderInput = document.getElementById('folderInput');
    selectedFiles = document.getElementById('selectedFiles');
    processBtn = document.getElementById('processBtn');
    loading = document.getElementById('loading');
    resultsSection = document.getElementById('resultsSection');
    resultsContent = document.getElementById('resultsContent');
    uploadSection = document.getElementById('uploadSection');
    foldersGrid = document.getElementById('foldersGrid');
    
    console.log('Elementos inicializados:', {
        folderInput: !!folderInput,
        selectedFiles: !!selectedFiles,
        processBtn: !!processBtn,
        loading: !!loading,
        resultsSection: !!resultsSection,
        resultsContent: !!resultsContent,
        uploadSection: !!uploadSection,
        foldersGrid: !!foldersGrid
    });
}

let selectedFilesList = [];
let currentData = null; // Almacenar datos actuales para regenerar Excel
let availableFields = [];
let selectedFields = [];
let currentFolderForRename = null;
let customFieldValue = '';
let customFields = []; // Array para múltiples campos personalizados
let draggedElement = null;

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


// Mostrar resultados
function displayResults(data) {
    if (!resultsSection) {
        console.error('Elemento resultsSection no encontrado');
        return;
    }
    
    console.log('Datos recibidos para mostrar:', data);
    console.log('Manifiestos:', data.manifiestos);
    console.log('Facturas:', data.facturas_electronicas);
    
    resultsSection.style.display = 'block';
    
    // Guardar datos actuales para regenerar Excel
    currentData = data;
    
    // Obtener contenedores de tabla
    const manifiestosTable = document.getElementById('manifiestosTable');

    if (!manifiestosTable) {
        console.error('Contenedor de tabla no encontrado');
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
                    <th style="width: 100px;">FECHA INICIO</th>
                    <th style="width: 100px;">LOAD ID</th>
                    <th style="width: 150px;">CONDUCTOR</th>
                    <th style="width: 80px;">PLACA</th>
                    <th style="width: 120px;">DESTINO</th>
                    <th style="width: 100px;">ORIGEN</th>
                    <th style="width: 100px;">KOF</th>
                    <th style="width: 100px;">REMESA</th>
                    <th style="width: 80px;">MES</th>
                    <th style="width: 120px;">EMPRESA</th>
                    <th style="width: 120px;">FECHA GENERACIÓN</th>
                    <th style="width: 120px;">FECHA VENCIMIENTO</th>
                    <th style="width: 120px;">VALOR MANIFIESTO</th>
                    <th style="width: 100px;">ESTADO</th>
                    <th style="width: 100px;">FECHA PAGO</th>
                    <th style="width: 120px;">ACCIONES</th>
                </tr>
            </thead>
            <tbody>
    `;

    if (data.manifiestos && data.manifiestos.length > 0) {
        data.manifiestos.forEach((item, index) => {
            manifiestosHtml += `
                <tr data-index="${index}">
                    <td>
                        <button class="btn-action view-btn" onclick="openPDF('${item.archivo}')" title="Ver PDF">
                            👁️
                        </button>
                    </td>
                    <td><span class="editable-cell" contenteditable="true" data-field="fecha inicio" data-index="${index}">${item['fecha inicio'] || 'N/A'}</span></td>
                    <td><span class="editable-cell" contenteditable="true" data-field="load_id" data-index="${index}">${item.load_id || 'N/A'}</span></td>
                    <td><span class="editable-cell" contenteditable="true" data-field="conductor" data-index="${index}" title="${item.conductor || 'N/A'}">${item.conductor || 'N/A'}</span></td>
                    <td><span class="editable-cell" contenteditable="true" data-field="placa" data-index="${index}" title="${item.placa || 'N/A'}">${item.placa || 'N/A'}</span></td>
                    <td><span class="editable-cell" contenteditable="true" data-field="destino" data-index="${index}" title="${item.destino || 'N/A'}">${item.destino || 'N/A'}</span></td>
                    <td><span class="editable-cell" contenteditable="true" data-field="origen" data-index="${index}" title="${item.origen || 'N/A'}">${item.origen || 'N/A'}</span></td>
                    <td><span class="editable-cell" contenteditable="true" data-field="kof" data-index="${index}" title="${item.kof || 'N/A'}">${item.kof || 'N/A'}</span></td>
                    <td><span class="editable-cell" contenteditable="true" data-field="remesa" data-index="${index}" title="${item.remesa || 'N/A'}">${item.remesa || 'N/A'}</span></td>
                    <td><span class="editable-cell" contenteditable="true" data-field="mes" data-index="${index}" title="${item.mes || 'N/A'}">${item.mes || 'N/A'}</span></td>
                    <td><span class="editable-cell" contenteditable="true" data-field="empresa" data-index="${index}" title="${item.empresa || 'N/A'}">${item.empresa || 'N/A'}</span></td>
                    <td><span class="editable-cell" contenteditable="true" data-field="fecha Generacion" data-index="${index}">${item['fecha Generacion'] || 'N/A'}</span></td>
                    <td><span class="editable-cell" contenteditable="true" data-field="fecha Vencimiento" data-index="${index}">${item['fecha Vencimiento'] || 'N/A'}</span></td>
                    <td><span class="editable-cell" contenteditable="true" data-field="valormanifiesto" data-index="${index}">$${item.valormanifiesto ? item.valormanifiesto.toLocaleString() : 'N/A'}</span></td>
                    <td><span class="editable-cell" contenteditable="true" data-field="estado" data-index="${index}">${item.estado || 'N/A'}</span></td>
                    <td><span class="editable-cell" contenteditable="true" data-field="fecha pago" data-index="${index}">${item['fecha pago'] || 'N/A'}</span></td>
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
        manifiestosHtml += `
            <tr>
                <td colspan="17" class="table-empty">
                    No hay datos de manifiestos disponibles
                </td>
            </tr>
        `;
    }

    manifiestosHtml += `
            </tbody>
        </table>
    `;

    // Actualizar contenedor de tabla
    manifiestosTable.innerHTML = manifiestosHtml;

    // Botones de descarga en el contenedor principal
    resultsContent.innerHTML = successHtml + `
        <div style="margin-top: 30px; text-align: center;">
            <button class="download-btn" onclick="downloadExcel()">📥 Descargar Excel</button>
            <button class="download-btn" onclick="abrirExcel()" style="background: linear-gradient(45deg, #28a745, #20c997);">📂 Abrir Excel</button>
        </div>
    `;
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

// Descargar carpeta como ZIP
function downloadFolder(folderName, event) {
    try {
        if (event) event.stopPropagation();
        const link = document.createElement('a');
        link.href = `/download_folder?folder=${encodeURIComponent(folderName)}`;
        link.download = '';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Error al descargar carpeta:', error);
        showMessage('Error al descargar carpeta: ' + error.message, 'error');
    }
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

// Cargar carpetas existentes
async function loadFolders() {
    try {
        const response = await fetch('/get_folders');
        const result = await response.json();
        
        if (result.success && foldersGrid) {
            displayFolders(result.folders);
        } else {
            console.error('Error al cargar carpetas:', result.error);
        }
    } catch (error) {
        console.error('Error de conexión al cargar carpetas:', error);
    }
}

// Mostrar carpetas en la interfaz
function displayFolders(folders) {
    if (!foldersGrid) return;
    
    if (folders.length === 0) {
        foldersGrid.innerHTML = '<div class="loading-folders">No hay carpetas disponibles</div>';
        return;
    }
    
    foldersGrid.innerHTML = '';
    folders.forEach(folder => {
        const folderCard = document.createElement('div');
        folderCard.className = 'folder-card';
        folderCard.innerHTML = `
            <div class="folder-icon">📁</div>
            <div class="folder-name">${folder.name}</div>
            <div class="folder-count">${folder.pdf_count} PDFs</div>
            <div class="folder-actions">
                <button class="btn-process" onclick="processFolder('${folder.name}', event)" title="Procesar carpeta">
                    🔄 Procesar
                </button>
                <button class="btn-rename" onclick="processFolderWithRename('${folder.name}', event)" title="Procesar y renombrar PDFs">
                    📝 Renombrar
                </button>
                <button class="btn-rename" onclick="downloadFolder('${folder.name}', event)" title="Descargar carpeta (ZIP)">
                    📦 Descargar carpeta
                </button>
            </div>
        `;
        
        foldersGrid.appendChild(folderCard);
    });
}

// Procesar una carpeta específica
async function processFolder(folderName, event) {
    try {
        // Mostrar loading
        if (loading) loading.style.display = 'block';
        if (resultsSection) resultsSection.style.display = 'none';
        
        // Marcar carpeta como seleccionada
        document.querySelectorAll('.folder-card').forEach(card => {
            card.classList.remove('selected');
        });
        if (event && event.currentTarget) {
            event.currentTarget.classList.add('selected');
        }
        
        console.log('Procesando carpeta:', folderName);
        const response = await fetch(`/process_folder/${encodeURIComponent(folderName)}`);
        const result = await response.json();
        
        console.log('Respuesta del servidor:', result);
        
        if (result.success) {
            displayResults(result.data);
            showMessage(`Carpeta "${folderName}" procesada exitosamente`, 'success');
        } else {
            showMessage('Error al procesar carpeta: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Error al procesar carpeta:', error);
        showMessage('Error de conexión: ' + error.message, 'error');
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

// Procesar una carpeta específica con renombrado de archivos
async function processFolderWithRename(folderName, event) {
    try {
        // Prevenir propagación del evento
        if (event) {
            event.stopPropagation();
        }
        
        // Marcar carpeta como seleccionada
        document.querySelectorAll('.folder-card').forEach(card => {
            card.classList.remove('selected');
        });
        if (event && event.currentTarget) {
            event.currentTarget.classList.add('selected');
        }
        
        // Guardar carpeta actual para renombrado
        currentFolderForRename = folderName;
        
        // Cargar campos disponibles y mostrar modal
        await loadAvailableFields();
        openRenameModal();
        
    } catch (error) {
        console.error('Error al preparar renombrado:', error);
        showMessage('Error al preparar renombrado: ' + error.message, 'error');
    }
}

// Cargar campos disponibles
async function loadAvailableFields() {
    try {
        const response = await fetch('/get_available_fields');
        const result = await response.json();
        
        if (result.success) {
            availableFields = result.fields;
            displayFields();
        } else {
            console.error('Error al cargar campos:', result.error);
        }
    } catch (error) {
        console.error('Error al cargar campos disponibles:', error);
    }
}

// Mostrar campos en el modal
function displayFields() {
    const fieldsContainer = document.getElementById('fieldsContainer');
    if (!fieldsContainer) return;
    
    fieldsContainer.innerHTML = '';
    
    availableFields.forEach(field => {
        const fieldItem = document.createElement('div');
        fieldItem.className = 'field-item';
        fieldItem.innerHTML = `
            <input type="checkbox" class="field-checkbox" id="field_${field.id}" value="${field.id}">
            <div class="field-info">
                <div class="field-name">${field.name}</div>
                <div class="field-description">${field.description}</div>
            </div>
        `;
        
        // Agregar evento de cambio
        const checkbox = fieldItem.querySelector('.field-checkbox');
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                addSelectedField(field);
            } else {
                removeSelectedField(field.id);
            }
            updateSelectedFieldsDisplay();
            updatePreview();
        });
        
        // Seleccionar campos por defecto
        const defaultFields = ['fecha inicio', 'load_id', 'conductor', 'placa', 'destino'];
        if (defaultFields.includes(field.id)) {
            checkbox.checked = true;
            addSelectedField(field);
        }
        
        fieldsContainer.appendChild(fieldItem);
    });
    
    // Configurar campo personalizado
    setupCustomField();
    updateSelectedFieldsDisplay();
    updatePreview();
}

// Configurar campo personalizado
function setupCustomField() {
    const customField = document.getElementById('customField');
    const charCount = document.getElementById('charCount');
    const addCustomBtn = document.getElementById('addCustomField');
    
    if (customField && charCount) {
        // Event listener para cambios en el campo
        customField.addEventListener('input', function() {
            customFieldValue = this.value;
            updateCharCount();
            updateAddButton();
        });
        
        // Event listener para tecla Enter
        customField.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addCustomField();
            }
        });
    }
    
    if (addCustomBtn) {
        addCustomBtn.addEventListener('click', addCustomField);
    }
}

// Agregar campo personalizado
function addCustomField() {
    const customField = document.getElementById('customField');
    if (!customField || !customField.value.trim()) return;
    
    const fieldValue = customField.value.trim();
    
    // Crear objeto de campo personalizado
    const customFieldObj = {
        id: `custom_${Date.now()}`,
        name: fieldValue,
        description: 'Campo personalizado',
        isCustom: true,
        value: fieldValue
    };
    
    // Agregar a la lista de campos personalizados
    customFields.push(customFieldObj);
    
    // Agregar a campos seleccionados
    selectedFields.push(customFieldObj);
    
    // Limpiar campo de entrada
    customField.value = '';
    customFieldValue = '';
    updateCharCount();
    updateAddButton();
    
    // Actualizar visualización
    updateSelectedFieldsDisplay();
    updatePreview();
    
    console.log('Campo personalizado agregado:', customFieldObj);
}

// Actualizar botón de agregar
function updateAddButton() {
    const addCustomBtn = document.getElementById('addCustomField');
    if (addCustomBtn) {
        addCustomBtn.disabled = !customFieldValue.trim();
    }
}

// Agregar campo seleccionado
function addSelectedField(field) {
    if (!selectedFields.find(f => f.id === field.id)) {
        selectedFields.push(field);
    }
}

// Remover campo seleccionado
function removeSelectedField(fieldId) {
    const fieldToRemove = selectedFields.find(f => f.id === fieldId);
    
    selectedFields = selectedFields.filter(f => f.id !== fieldId);
    
    // Si es un campo personalizado, removerlo de la lista de campos personalizados
    if (fieldToRemove && fieldToRemove.isCustom) {
        customFields = customFields.filter(f => f.id !== fieldId);
    } else {
        // Desmarcar checkbox correspondiente para campos normales
        const checkbox = document.getElementById(`field_${fieldId}`);
        if (checkbox) {
            checkbox.checked = false;
        }
    }
    
    // Actualizar visualización y vista previa
    updateSelectedFieldsDisplay();
    updatePreview();
}

// Actualizar visualización de campos seleccionados
function updateSelectedFieldsDisplay() {
    const selectedFieldsSection = document.getElementById('selectedFieldsSection');
    const selectedFieldsContainer = document.getElementById('selectedFieldsContainer');
    
    if (!selectedFieldsSection || !selectedFieldsContainer) return;
    
    if (selectedFields.length === 0) {
        selectedFieldsSection.style.display = 'none';
        return;
    }
    
    selectedFieldsSection.style.display = 'block';
    selectedFieldsContainer.innerHTML = '';
    
    selectedFields.forEach((field, index) => {
        const fieldItem = document.createElement('div');
        fieldItem.className = 'selected-field-item';
        if (field.isCustom) {
            fieldItem.classList.add('custom-field');
        }
        fieldItem.draggable = true;
        fieldItem.dataset.fieldId = field.id;
        fieldItem.innerHTML = `
            <div class="field-drag-handle">⋮⋮</div>
            <div class="field-order-number">${index + 1}</div>
            <div class="field-info">
                <div class="field-name">${field.name}</div>
                <div class="field-description">${field.description}</div>
            </div>
            <button class="field-remove" onclick="removeSelectedField('${field.id}')" title="Remover campo">×</button>
        `;
        
        // Configurar drag & drop
        setupDragAndDrop(fieldItem);
        
        selectedFieldsContainer.appendChild(fieldItem);
    });
    
    console.log('Campos seleccionados actualizados:', selectedFields.map(f => f.id));
}

// Configurar drag & drop para un elemento
function setupDragAndDrop(element) {
    element.addEventListener('dragstart', function(e) {
        draggedElement = this;
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', this.dataset.fieldId);
    });
    
    element.addEventListener('dragend', function(e) {
        this.classList.remove('dragging');
        draggedElement = null;
    });
    
    element.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        this.classList.add('drag-over');
    });
    
    element.addEventListener('dragleave', function(e) {
        this.classList.remove('drag-over');
    });
    
    // Limpiar clases al salir del área de drop
    element.addEventListener('dragenter', function(e) {
        e.preventDefault();
    });
    
    element.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('drag-over');
        
        if (draggedElement && draggedElement !== this) {
            const draggedFieldId = draggedElement.dataset.fieldId;
            const targetFieldId = this.dataset.fieldId;
            
            console.log('Reordenando:', draggedFieldId, 'a posición de', targetFieldId);
            
            // Reordenar array
            const draggedIndex = selectedFields.findIndex(f => f.id === draggedFieldId);
            const targetIndex = selectedFields.findIndex(f => f.id === targetFieldId);
            
            if (draggedIndex !== -1 && targetIndex !== -1) {
                const draggedField = selectedFields.splice(draggedIndex, 1)[0];
                selectedFields.splice(targetIndex, 0, draggedField);
                
                console.log('Nuevo orden:', selectedFields.map(f => f.id));
                
                // Actualizar visualización
                updateSelectedFieldsDisplay();
                updatePreview();
            }
        }
    });
}

// Limpiar todas las clases de drag & drop
function clearDragClasses() {
    const selectedFieldsContainer = document.getElementById('selectedFieldsContainer');
    if (selectedFieldsContainer) {
        const items = selectedFieldsContainer.querySelectorAll('.selected-field-item');
        items.forEach(item => {
            item.classList.remove('dragging', 'drag-over');
        });
    }
}

// Actualizar contador de caracteres
function updateCharCount() {
    const customField = document.getElementById('customField');
    const charCount = document.getElementById('charCount');
    
    if (customField && charCount) {
        const length = customField.value.length;
        const maxLength = parseInt(customField.getAttribute('maxlength'));
        
        charCount.textContent = `${length}/${maxLength}`;
        
        // Cambiar color según el uso
        charCount.className = 'char-count';
        if (length > maxLength * 0.8) {
            charCount.classList.add('warning');
        }
        if (length >= maxLength) {
            charCount.classList.add('danger');
        }
    }
}

// Actualizar vista previa del nombre
function updatePreview() {
    const previewName = document.getElementById('previewName');
    const confirmBtn = document.getElementById('confirmRenameBtn');
    
    console.log('Actualizando vista previa...');
    console.log('Campos seleccionados:', selectedFields.map(f => ({id: f.id, name: f.name, isCustom: f.isCustom})));
    console.log('Campos personalizados:', customFields.map(f => f.value));
    
    if (selectedFields.length > 0) {
        let preview = '';

        // Obtener un registro de ejemplo si existe
        const sample = currentData && currentData.manifiestos && currentData.manifiestos.length > 0 
            ? currentData.manifiestos[0] 
            : null;

        // Helper para formatear como el backend
        const formatValueForName = (value, fieldId) => {
            if (value === undefined || value === null || value === '' || value === 'No encontrado' || value === 'No encontrada') {
                return `${(fieldId || 'CAMPO').toUpperCase()}_DESCONOCIDO`;
            }
            let str = String(value).trim();
            if (fieldId === 'fecha inicio') {
                // Reemplazar separadores por '-'
                let tmp = str.replaceAll('/', '-').replaceAll('.', '-');
                // Mantener solo dígitos y '-'
                let clean = Array.from(tmp).filter(ch => (ch >= '0' && ch <= '9') || ch === '-').join('');
                while (clean.includes('--')) clean = clean.replaceAll('--', '-');
                clean = clean.replace(/^[-_]+|[-_]+$/g, '');
                return clean;
            }
            // Limpieza general
            let clean = str.replaceAll(' ', '_').replaceAll(',', '').replaceAll('.', '').replaceAll('-', '_');
            // Reducir dobles guiones bajos
            while (clean.includes('__')) clean = clean.replaceAll('__', '_');
            clean = clean.replace(/^[_]+|[_]+$/g, '');
            return clean;
        };

        // Agregar campos seleccionados en el orden actual (incluyendo campos personalizados)
        preview += selectedFields.map(field => {
            if (field.isCustom) {
                return formatValueForName(field.value, 'personalizado');
            } else {
                const raw = sample ? sample[field.id] : null;
                return formatValueForName(raw, field.id);
            }
        }).join('_');

        // Limpiar caracteres problemáticos del nombre base (sin tocar extensión)
        const problematic = ['<', '>', ':', '"', '|', '?', '*', '\\', '/', ' ', ',', '(', ')', '[', ']', '{', '}'];
        let nombreBase = preview;
        problematic.forEach(ch => { nombreBase = nombreBase.split(ch).join('_'); });
        while (nombreBase.includes('__')) nombreBase = nombreBase.replaceAll('__', '_');
        nombreBase = nombreBase.replace(/^_+|_+$/g, '');

        preview = nombreBase + '.pdf';

        previewName.textContent = preview || 'archivo.pdf';
        confirmBtn.disabled = false;

        console.log('Vista previa generada:', preview);
    } else {
        previewName.textContent = 'archivo.pdf';
        confirmBtn.disabled = true;
    }
}

// Abrir modal de renombrado
function openRenameModal() {
    const modal = document.getElementById('renameModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// Cerrar modal de renombrado
function closeRenameModal() {
    const modal = document.getElementById('renameModal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentFolderForRename = null;
    selectedFields = [];
    customFieldValue = '';
    customFields = [];
    
    // Limpiar campo personalizado
    const customField = document.getElementById('customField');
    if (customField) {
        customField.value = '';
    }
    
    // Limpiar posición del campo personalizado
    const positionSelect = document.getElementById('customFieldPosition');
    if (positionSelect) {
        positionSelect.value = 'start';
    }
    
    // Ocultar sección de campos seleccionados
    const selectedFieldsSection = document.getElementById('selectedFieldsSection');
    if (selectedFieldsSection) {
        selectedFieldsSection.style.display = 'none';
    }
    
    // Limpiar clases de drag & drop
    clearDragClasses();
}

// Confirmar renombrado
async function confirmRename() {
    if (!currentFolderForRename || selectedFields.length === 0) {
        showMessage('Por favor selecciona al menos un campo', 'error');
        return;
    }
    
    try {
        // Guardar el nombre de la carpeta antes de cerrar el modal
        const folderName = currentFolderForRename;
        // Capturar una copia de los campos antes de cerrar el modal
        const fieldsToSend = selectedFields.map(f => ({ ...f }));
        const customToSend = customFields.map(f => ({ ...f }));
        
        // Mostrar loading
        if (loading) loading.style.display = 'block';
        if (resultsSection) resultsSection.style.display = 'none';
        
        // Construir URL con campos seleccionados
        const params = new URLSearchParams();
        fieldsToSend.forEach(field => {
            if (field.isCustom) {
                // Enviar campos personalizados con prefijo especial
                params.append('campos_personalizados', field.value);
            } else {
                // Enviar campos normales
                params.append('campos', field.id);
            }
        });
        
        const url = `/process_folder_with_rename/${encodeURIComponent(folderName)}?${params.toString()}`;
        console.log('Enviando URL:', url);
        console.log('Carpeta:', folderName);
        console.log('Query params (string):', params.toString());
        console.log('Campos en orden (cliente, snapshot):', fieldsToSend.map(f => ({
            id: f.id,
            name: f.name,
            isCustom: !!f.isCustom,
            value: f.isCustom ? f.value : undefined
        })));
        console.log('Campos personalizados (cliente, snapshot):', customToSend.map(f => f.value));
        
        const response = await fetch(url);
        const result = await response.json();
        
        console.log('Respuesta del servidor:', result);
        
        if (result.success) {
            // Logs de diagnóstico: qué recibió el backend
            if (result.data) {
                console.log('Backend orden_recibido (raw args):', result.data.orden_recibido);
                console.log('Backend todos_los_campos (normalizados):', result.data.todos_los_campos);
            }
            displayResults(result.data);
            showMessage(`Carpeta "${folderName}" procesada y archivos renombrados exitosamente`, 'success');
        } else {
            showMessage('Error al procesar carpeta: ' + result.error, 'error');
        }
        
    } catch (error) {
        console.error('Error al procesar carpeta con renombrado:', error);
        showMessage('Error de conexión: ' + error.message, 'error');
    } finally {
        if (loading) loading.style.display = 'none';
        // Cerrar modal al terminar el proceso
        closeRenameModal();
    }
}

// Inicializar estilos cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    initializeElements(); // Inicializar elementos del DOM
    setupEventListeners(); // Configurar event listeners
    addEditableStyles();
    updateFileCount(); // Inicializar contador
    loadFolders(); // Cargar carpetas existentes
    console.log('Página cargada, contador inicializado');
});

// Función para cerrar la aplicación
function closeApplication() {
    if (confirm('¿Estás seguro de que quieres cerrar la aplicación?')) {
        console.log('Cerrando aplicación...');
        
        // Mostrar mensaje de cierre
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'block';
            loading.querySelector('p').textContent = 'Cerrando aplicación...';
        }
        
        // Enviar petición para cerrar la aplicación
        fetch('/close_application', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {
            console.log('Respuesta del servidor:', data);
            if (data.success) {
                // Cerrar la ventana del navegador
                window.close();
                
                // Si no se puede cerrar la ventana (algunos navegadores lo bloquean),
                // mostrar mensaje al usuario
                setTimeout(() => {
                    alert('La aplicación se ha cerrado. Puedes cerrar esta pestaña del navegador.');
                }, 1000);
            } else {
                alert('Error al cerrar la aplicación: ' + data.error);
                if (loading) {
                    loading.style.display = 'none';
                }
            }
        })
        .catch(error => {
            console.error('Error al cerrar la aplicación:', error);
            alert('Error al cerrar la aplicación. Por favor, cierra la pestaña del navegador manualmente.');
            if (loading) {
                loading.style.display = 'none';
            }
        });
    }
}
