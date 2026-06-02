import { useState } from 'react'

export default function CaptureInbox({ onCapture, disabled }) {
  const [title, setTitle] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    onCapture(trimmed)
    setTitle('')
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <div className="card-body">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Captura rápida — vacía tu mente
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="¿Qué tienes en mente? Presiona Enter..."
            disabled={disabled}
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={disabled || !title.trim()}
            className="px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            Añadir
          </button>
        </div>
      </div>
    </form>
  )
}
