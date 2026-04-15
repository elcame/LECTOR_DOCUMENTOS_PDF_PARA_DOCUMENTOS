export default function SubirCarpetaSection({
  folderName,
  onChangeFolderName,
  files = [],
  error,
  successMessage,
  showResults,
  processingResults,
  uploading = false,
  canUpload,
  folderNameTrimmed,
  onSelectFolder,
  onSelectFiles,
  onUpload,
  onCloseResults,
  getUploadButtonHelp,
  ProcessingResultsComponent,
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        Subir nueva carpeta
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre de la carpeta {!folderName && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={folderName}
            onChange={(e) => onChangeFolderName?.(e.target.value)}
            placeholder="Se auto-completará al seleccionar carpeta"
            className="input w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            {folderName
              ? '✓ Nombre detectado automáticamente (puedes editarlo)'
              : 'Selecciona una carpeta para auto-completar o escribe un nombre'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <label className="btn btn-outline btn-md cursor-pointer">
            <input
              type="file"
              accept=".pdf"
              webkitdirectory=""
              multiple
              className="hidden"
              onChange={onSelectFolder}
            />
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
              Seleccionar carpeta
            </span>
          </label>

          <label className="btn btn-outline btn-md cursor-pointer">
            <input
              type="file"
              accept=".pdf"
              multiple
              className="hidden"
              onChange={onSelectFiles}
            />
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Seleccionar archivos PDF
            </span>
          </label>
        </div>

        {files.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 max-h-40 overflow-y-auto">
            <p className="text-sm font-medium text-gray-700 mb-2">
              {files.length} archivo(s) seleccionado(s)
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              {files.slice(0, 10).map((f, i) => (
                <li key={i} className="truncate" title={f.name}>
                  {f.name}
                </li>
              ))}
              {files.length > 10 && (
                <li className="text-gray-500">... y {files.length - 10} más</li>
              )}
            </ul>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="rounded-lg bg-green-50 border border-green-200 text-green-800 px-4 py-3 text-sm">
            {successMessage}
          </div>
        )}

        {showResults && processingResults && ProcessingResultsComponent && (
          <div className="mt-6">
            <ProcessingResultsComponent
              data={processingResults}
              folderName={
                processingResults.folderName ||
                folderNameTrimmed ||
                folderName ||
                ''
              }
              onClose={onCloseResults}
            />
          </div>
        )}

        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={onUpload}
            disabled={!canUpload}
            className="btn btn-primary w-full sm:w-auto"
          >
            {uploading ? 'Subiendo...' : 'Subir carpeta'}
          </button>

          {!canUpload && !uploading && (
            <p className="text-xs text-amber-600 font-medium">
              {getUploadButtonHelp?.()}
            </p>
          )}

          {canUpload && !uploading && (
            <p className="text-xs text-green-600 font-medium">
              ✅ Listo para subir {files.length} archivo(s) a "{folderNameTrimmed}"
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

