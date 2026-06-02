import { useState, useEffect } from 'react'
import Modal from '../common/Modal/Modal'

function toLocalInputValue(iso) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return ''
  }
}

function localToIso(localStr) {
  if (!localStr) return null
  return new Date(localStr).toISOString()
}

export default function ScheduleTaskModal({
  task,
  isOpen,
  onClose,
  onSave,
  googleConnected,
  onRequestConnect,
  saving,
}) {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')

  useEffect(() => {
    if (task && isOpen) {
      setStart(toLocalInputValue(task.scheduled_start))
      setEnd(toLocalInputValue(task.scheduled_end))
    }
  }, [task, isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!googleConnected) {
      onRequestConnect?.()
      return
    }
    if (!start || !end) return
    const startIso = localToIso(start)
    const endIso = localToIso(end)
    if (new Date(endIso) <= new Date(startIso)) {
      alert('La hora de fin debe ser posterior al inicio.')
      return
    }
    onSave({
      scheduled_start: startIso,
      scheduled_end: endIso,
      list: task.list === 'inbox' ? 'today' : task.list,
    })
  }

  if (!task) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Programar tarea">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-700 font-medium">{task.title}</p>

        {!googleConnected && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
            Conecta Google Calendar para sincronizar este bloque de tiempo.
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Inicio</label>
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Fin</label>
          <input
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : googleConnected ? 'Guardar y sincronizar' : 'Conectar Google'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

