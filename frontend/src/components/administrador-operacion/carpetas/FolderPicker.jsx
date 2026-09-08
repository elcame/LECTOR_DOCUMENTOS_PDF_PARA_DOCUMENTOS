import TipoSelect from '../tipos/TipoSelect'
import ProcessProgress from '../../common/ProcessProgress/ProcessProgress'
import FolderPurgeActions from './FolderPurgeActions'

export default function FolderPicker({
  folders = [],
  selected,
  onSelect,
  loading,
  downloadingExcel = false,
  downloadingZip = false,
  onDownloadExcel,
  onDownloadZip,
  onRenamePdfs,
  onRefresh,
  tipos = [],
  loadingTipos = false,
  selectedTipoId = '',
  savingTipo = false,
  onChangeTipo,
  progress = null,
  deleting = false,
  purgingAll = false,
  confirmOneOpen = false,
  confirmAllOpen = false,
  onAskDeleteOne,
  onAskPurgeAll,
  onCloseConfirm,
  onConfirmDeleteOne,
  onConfirmPurgeAll,
}) {
  const hasSelection = Boolean(selected)
  const selectedFolder = folders.find((folder) => folder.name === selected)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <label className="block text-sm font-medium text-slate-700 mb-2">Carpeta</label>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <select
          className="input flex-1 min-w-0"
          value={selected}
          disabled={loading}
          onChange={(e) => onSelect(e.target.value)}
        >
          <option value="">Selecciona una carpeta...</option>
          {folders.map((folder) => (
            <option key={folder.name} value={folder.name}>
              {folder.name} ({folder.pdf_count} PDF{folder.pdf_count === 1 ? '' : 's'})
              {folder.tipo_nombre ? ` — ${folder.tipo_nombre}` : ''}
            </option>
          ))}
        </select>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={loading}
            onClick={onRefresh}
            title="Actualizar lista"
          >
            Actualizar
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={!hasSelection || downloadingExcel}
            onClick={onDownloadExcel}
            title="Descargar Excel de manifiestos"
          >
            {downloadingExcel ? 'Descargando Excel...' : 'Descargar Excel'}
          </button>
          {onRenamePdfs && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={!hasSelection}
              onClick={onRenamePdfs}
              title="Renombrar los PDFs de la carpeta"
            >
              Renombrar PDFs
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={!hasSelection || downloadingZip}
            onClick={onDownloadZip}
            title="Descargar la carpeta en ZIP"
          >
            {downloadingZip ? 'Descargando carpeta...' : 'Descargar carpeta'}
          </button>
          {onAskDeleteOne && (
            <FolderPurgeActions
              selected={selected}
              foldersCount={folders.length}
              deleting={deleting}
              purgingAll={purgingAll}
              confirmOneOpen={confirmOneOpen}
              confirmAllOpen={confirmAllOpen}
              onAskDeleteOne={onAskDeleteOne}
              onAskPurgeAll={onAskPurgeAll}
              onCloseConfirm={onCloseConfirm}
              onConfirmDeleteOne={onConfirmDeleteOne}
              onConfirmPurgeAll={onConfirmPurgeAll}
            />
          )}
        </div>
      </div>
      {hasSelection && (
        <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Tipo de la carpeta</label>
            <TipoSelect
              value={selectedTipoId}
              onChange={onChangeTipo}
              tipos={tipos}
              loading={loadingTipos}
              disabled={savingTipo}
              currentLabel={selectedFolder?.tipo_nombre}
            />
          </div>
          <p className="text-xs text-slate-500 sm:pt-5">
            Carpeta activa: <span className="font-medium text-slate-700">{selected}</span>
            {savingTipo ? ' · Guardando tipo...' : ''}
          </p>
        </div>
      )}
      <ProcessProgress active={progress?.active} percent={progress?.percent} label={progress?.label} />
    </div>
  )
}
