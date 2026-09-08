import { useEffect, useState } from 'react'
import Modal from '../../common/Modal/Modal'
import { manifiestosService } from '../../../services/manifiestosService'

function withPdfExtension(name) {
  const trimmed = (name || '').trim()
  if (!trimmed) return ''
  return trimmed.toLowerCase().endsWith('.pdf') ? trimmed : `${trimmed}.pdf`
}

export default function RenamePdfDialog({ pdf, folderName, isOpen, onClose, onSuccess }) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen || !pdf) return
    setName(String(pdf.filename || '').replace(/\.pdf$/i, ''))
    setError('')
    setSaving(false)
  }, [isOpen, pdf])

  const handleSave = async () => {
    const folder = pdf?.folder_name || folderName
    const oldName = pdf?.filename
    const newName = withPdfExtension(name)
    if (!folder || !oldName) {
      setError('No se pudo identificar el archivo.')
      return
    }
    if (!newName) {
      setError('Escribe el nuevo nombre.')
      return
    }
    if (newName === oldName) {
      onClose?.()
      return
    }

    setSaving(true)
    setError('')
    try {
      const res = await manifiestosService.renamePDF(folder, oldName, newName)
      if (res?.success === false) {
        setError(res?.error || res?.message || 'No se pudo renombrar el PDF.')
        return
      }
      onSuccess?.()
      onClose?.()
    } catch (err) {
      setError(err?.message || 'No se pudo renombrar el PDF.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Renombrar PDF" size="sm">
      <div className="p-6 space-y-4">
        <p className="text-sm text-slate-600 break-all">
          Actual: <span className="font-medium text-slate-800">{pdf?.filename}</span>
        </p>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nuevo nombre</label>
          <input
            className="input w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
            }}
            disabled={saving}
            autoFocus
          />
          <p className="text-xs text-slate-500 mt-1">Se añadirá .pdf si no lo escribes.</p>
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
