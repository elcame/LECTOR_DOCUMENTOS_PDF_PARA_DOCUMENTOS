import { useState } from 'react'
import { manifiestosService } from '../../../services/manifiestosService'
import Modal from '../../common/Modal/Modal'

export default function BulkRenamePDFs({ folderName, isOpen, onClose, onSuccess }) {
  const [pattern, setPattern] = useState('{load_id}_{remesa}')
  const [renaming, setRenaming] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const patterns = [
    { value: '{load_id}_{remesa}', label: 'Load ID + Remesa', example: 'L123456_KBQ789' },
    { value: '{load_id}', label: 'Solo Load ID', example: 'L123456' },
    { value: '{remesa}', label: 'Solo Remesa', example: 'KBQ789' },
    { value: '{placa}_{load_id}', label: 'Placa + Load ID', example: 'ABC123_L123456' },
    { value: '{origen}_{destino}_{load_id}', label: 'Origen + Destino + Load ID', example: 'Bogota_Cali_L123456' },
    { value: '{fecha_liquidacion}_{load_id}', label: 'Fecha + Load ID', example: '2026-01-20_L123456' },
    { value: '{empresa}_{load_id}', label: 'Empresa + Load ID', example: 'EMPRESA_L123456' },
  ]

  const handleRename = async () => {
    if (!pattern.trim()) {
      setError('Por favor, ingresa un patrón de renombrado')
      return
    }

    const confirmMessage = `¿Estás seguro de que deseas renombrar todos los PDFs de la carpeta "${folderName}"?\n\nPatrón: ${pattern}\n\nEsta acción renombrará todos los archivos que tengan manifiestos procesados.`
    
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      setRenaming(true)
      setError('')
      setResult(null)

      const response = await manifiestosService.bulkRenamePDFs(folderName, pattern)

      if (response.success) {
        setResult(response.data)
        
        // Llamar a onSuccess para que el padre actualice los datos
        if (onSuccess) {
          // Esperar un momento para que el usuario vea el resultado
          setTimeout(() => {
            onSuccess()
          }, 500)
        }
      } else {
        setError(response.error || 'Error al renombrar archivos')
      }
    } catch (err) {
      console.error('Error al renombrar archivos:', err)
      setError(err?.message || 'Error al renombrar archivos')
    } finally {
      setRenaming(false)
    }
  }

  const handleClose = () => {
    // Si hay resultados, significa que se renombró exitosamente
    const hadResults = result !== null
    
    setPattern('{load_id}_{remesa}')
    setError('')
    setResult(null)
    onClose()
    
    // Si hubo renombrados exitosos, forzar actualización una vez más al cerrar
    if (hadResults && onSuccess) {
      setTimeout(() => {
        onSuccess()
      }, 100)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Renombrar PDFs - ${folderName}`}
      size="lg"
    >
      <div className="p-6 space-y-6">
        {/* Información */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="flex-1 text-sm">
              <p className="font-medium text-blue-900 mb-2">Renombrado Masivo de PDFs</p>
              <ul className="text-blue-800 space-y-1 list-disc list-inside">
                <li>Solo se renombrarán los PDFs que tengan manifiestos procesados</li>
                <li>Los archivos se renombrarán usando los campos extraídos del procesamiento</li>
                <li>Si un archivo ya tiene ese nombre, se omitirá</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Selector de patrón */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Patrón de Renombrado
          </label>
          <select
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            disabled={renaming}
            className="input w-full"
          >
            {patterns.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label} - Ejemplo: {p.example}
              </option>
            ))}
          </select>
        </div>

        {/* Patrón personalizado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Patrón Personalizado (opcional)
          </label>
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            disabled={renaming}
            placeholder="{load_id}_{remesa}"
            className="input w-full font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-2">
            Variables disponibles: {'{load_id}'}, {'{remesa}'}, {'{placa}'}, {'{origen}'}, {'{destino}'}, {'{empresa}'}, {'{fecha_liquidacion}'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3">
            {error}
          </div>
        )}

        {/* Resultado */}
        {result && (
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 border border-green-200 p-4">
              <p className="text-green-900 font-medium mb-2">
                ✓ {result.message}
              </p>
              <div className="text-sm text-green-800 space-y-1">
                <p>Archivos renombrados: {result.renamed_count} de {result.total_count}</p>
                <p className="text-xs text-green-700 mt-2">
                  💡 Los datos se actualizarán automáticamente al cerrar este modal
                </p>
              </div>
            </div>

            {/* Archivos renombrados */}
            {result.renamed_files && result.renamed_files.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Archivos renombrados:</h4>
                <div className="bg-gray-50 rounded-lg border border-gray-200 max-h-60 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Nombre anterior</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Nombre nuevo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {result.renamed_files.map((file, index) => (
                        <tr key={index} className="hover:bg-gray-100">
                          <td className="px-4 py-2 text-xs text-gray-600">{file.old_name}</td>
                          <td className="px-4 py-2 text-xs text-gray-900 font-medium">{file.new_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Errores */}
            {result.errors && result.errors.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-red-700 mb-2">Errores ({result.errors.length}):</h4>
                <div className="bg-red-50 rounded-lg border border-red-200 max-h-40 overflow-y-auto p-3">
                  <ul className="text-xs text-red-700 space-y-1">
                    {result.errors.map((err, index) => (
                      <li key={index}>• {err}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={handleClose}
            disabled={renaming}
            className="btn btn-outline"
          >
            {result ? 'Cerrar' : 'Cancelar'}
          </button>
          {!result && (
            <button
              onClick={handleRename}
              disabled={renaming || !pattern.trim()}
              className="btn btn-primary"
            >
              {renaming ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Renombrando...
                </>
              ) : (
                'Renombrar Archivos'
              )}
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}
