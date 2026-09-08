import ConfirmModal from '../../common/ConfirmModal/ConfirmModal'

/**
 * Confirmaciones para borrar una carpeta o todas las carpetas (data completa).
 */
export default function FolderPurgeActions({
  selected,
  foldersCount = 0,
  deleting = false,
  purgingAll = false,
  confirmOneOpen,
  confirmAllOpen,
  onAskDeleteOne,
  onAskPurgeAll,
  onCloseConfirm,
  onConfirmDeleteOne,
  onConfirmPurgeAll,
}) {
  return (
    <>
      <button
        type="button"
        className="btn btn-sm border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"
        disabled={!selected || deleting || purgingAll}
        onClick={onAskDeleteOne}
        title="Borrar PDFs, manifiestos, Storage y metadatos de esta carpeta"
      >
        {deleting ? 'Eliminando...' : 'Eliminar carpeta'}
      </button>
      <button
        type="button"
        className="btn btn-sm border border-rose-500/40 bg-rose-600 text-white hover:bg-rose-700"
        disabled={foldersCount === 0 || deleting || purgingAll}
        onClick={onAskPurgeAll}
        title="Borrar todas las carpetas y su data en Firestore/Storage"
      >
        {purgingAll ? 'Eliminando todo...' : 'Eliminar todas'}
      </button>

      <ConfirmModal
        isOpen={confirmOneOpen}
        onClose={onCloseConfirm}
        onConfirm={onConfirmDeleteOne}
        loading={deleting}
        type="danger"
        title="¿Eliminar esta carpeta?"
        confirmText="Sí, eliminar carpeta"
        message={`Se borrará toda la data de “${selected}”: PDFs, manifiestos, archivos en Storage y metadatos. No se puede deshacer.`}
      />
      <ConfirmModal
        isOpen={confirmAllOpen}
        onClose={onCloseConfirm}
        onConfirm={onConfirmPurgeAll}
        loading={purgingAll}
        type="danger"
        title="¿Eliminar TODAS las carpetas?"
        confirmText="Sí, eliminar todo"
        message={`Se eliminarán ${foldersCount} carpeta(s) y toda su data (Firestore + Storage). Esta acción es irreversible.`}
      />
    </>
  )
}
