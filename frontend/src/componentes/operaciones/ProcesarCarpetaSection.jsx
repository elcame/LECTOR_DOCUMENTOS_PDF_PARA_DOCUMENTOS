export default function ProcesarCarpetaSection({
  folders = [],
  selectedFolderToProcess,
  loadingFolders = false,
  canProcess,
  processing = false,
  onChangeSelectedFolder,
  onClickProcess,
  onClickRefresh,
  onClickRename,
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
        Procesar carpeta existente
      </h3>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selecciona una carpeta para procesar
          </label>
          <div className="flex gap-2">
            <select
              value={selectedFolderToProcess}
              onChange={(e) => onChangeSelectedFolder?.(e.target.value)}
              className="input flex-1"
              disabled={loadingFolders}
            >
              <option value="">Selecciona una carpeta...</option>
              {folders.map((folder) => (
                <option key={folder.name} value={folder.name}>
                  {folder.name} ({folder.pdf_count} PDFs)
                </option>
              ))}
            </select>
            <button
              onClick={onClickRefresh}
              className="btn btn-outline btn-sm"
              disabled={loadingFolders}
              title="Actualizar lista de carpetas"
            >
              {loadingFolders ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              )}
            </button>
          </div>
          {selectedFolderToProcess && (
            <p className="text-xs text-gray-500 mt-1">
              Carpeta seleccionada: <span className="font-medium">{selectedFolderToProcess}</span>
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onClickProcess}
            disabled={!canProcess}
            className="btn btn-secondary flex-1 sm:flex-initial"
          >
            {processing
              ? 'Procesando...'
              : `Procesar carpeta${selectedFolderToProcess ? ` "${selectedFolderToProcess}"` : ''}`}
          </button>

          {selectedFolderToProcess && (
            <button
              type="button"
              onClick={onClickRename}
              className="btn btn-outline btn-sm flex items-center gap-2"
              title="Renombrar PDFs de esta carpeta"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Renombrar PDFs
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

