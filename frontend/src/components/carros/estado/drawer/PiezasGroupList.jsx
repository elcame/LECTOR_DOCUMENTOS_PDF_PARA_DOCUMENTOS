import { AGE_COLORS } from '../../piezas/piezaAge'
import { useEffect } from 'react'

export default function PiezasGroupList({ groups, selectedId, colors, onSelect }) {
  useEffect(() => {
    if (!selectedId) return
    document.getElementById(`pieza-${selectedId}`)?.scrollIntoView({ block: 'nearest' })
  }, [selectedId])
  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <section key={group.id}>
          <h3 className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {group.label}
            <span className="ml-1 font-normal text-slate-500"> ({group.items.length})</span>
          </h3>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = selectedId === item.position_id
              const color = colors?.[item.position_id] || AGE_COLORS.empty
              return (
                <li key={item.position_id}>
                    <button
                      type="button"
                      id={`pieza-${item.position_id}`}
                      onClick={() => onSelect(item.position_id)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-slate-200 transition ${
                      active
                        ? 'bg-white/15 text-slate-50 shadow-[inset_2px_0_0_#38bdf8]'
                        : 'hover:bg-white/10'
                    }`}
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: color }}
                      aria-hidden
                    />
                    <span className="leading-snug">{item.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
