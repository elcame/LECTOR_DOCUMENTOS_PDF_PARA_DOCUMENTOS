import { useState } from 'react'
import CarrosTable from '../../operaciones/CarrosTable/CarrosTable'
import PropietariosTable from '../../operaciones/PropietariosTable/PropietariosTable'

const TABS = [
  { id: 'carros', label: 'Carros' },
  { id: 'propietarios', label: 'Propietarios' },
]

export default function AdministrarPanel({ onRefreshFleet }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('carros')

  const toggle = () => {
    setOpen((wasOpen) => {
      const next = !wasOpen
      if (wasOpen && onRefreshFleet) onRefreshFleet()
      return next
    })
  }

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03]">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left sm:px-5"
        aria-expanded={open}
      >
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Taller</p>
          <h2 className="text-sm font-semibold text-slate-100">Administrar</h2>
        </div>
        <span className="text-xs text-slate-400">{open ? 'Ocultar' : 'Mostrar tablas'}</span>
      </button>

      {open ? (
        <div className="border-t border-white/[0.08] px-3 pb-4 pt-3 sm:px-4">
          <div className="mb-3 flex gap-1 rounded-xl bg-black/25 p-1">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  tab === item.id
                    ? 'bg-white/10 text-slate-50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#0f1729] p-3 sm:p-4">
            {tab === 'carros' ? <CarrosTable tone="dark" /> : <PropietariosTable tone="dark" />}
          </div>
        </div>
      ) : null}
    </section>
  )
}
