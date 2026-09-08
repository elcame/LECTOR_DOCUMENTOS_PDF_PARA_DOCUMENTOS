import { useEffect, useRef, useState } from 'react'
import { AGE_COLORS } from '../piezas/piezaAge'
import { getPiezaLabel } from '../piezas/piezasCatalog'
import { TRACTOMULA_FRAMES, TRACTOMULA_HOTSPOTS, frameIndexForPieza } from './tractomulaFrames'

export default function TractomulaPhotoViewer({ colors = {}, selectedId, onSelect }) {
  const [frame, setFrame] = useState(0)
  const drag = useRef({ active: false, startX: 0, startFrame: 0 })
  const spots = TRACTOMULA_HOTSPOTS[frame] || []

  useEffect(() => {
    if (!selectedId) return
    setFrame((current) => {
      const visible = (TRACTOMULA_HOTSPOTS[current] || []).some((spot) => spot.id === selectedId)
      return visible ? current : frameIndexForPieza(selectedId)
    })
  }, [selectedId])

  const moveFrame = (delta) => {
    const total = TRACTOMULA_FRAMES.length
    setFrame((current) => (current + delta + total * 10) % total)
  }

  const onPointerDown = (e) => {
    if (e.target.closest('[data-hotspot]')) return
    drag.current = { active: true, startX: e.clientX, startFrame: frame }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }

  const onPointerMove = (e) => {
    if (!drag.current.active) return
    const steps = Math.round((e.clientX - drag.current.startX) / 70)
    const total = TRACTOMULA_FRAMES.length
    const next = (drag.current.startFrame - steps + total * 10) % total
    if (next !== frame) setFrame(next)
  }

  const onPointerUp = () => {
    drag.current.active = false
  }

  return (
    <div className="relative h-[560px] w-full overflow-hidden rounded-2xl border border-slate-800 bg-[#0b1220]">
      <div
        className="absolute inset-0 cursor-grab select-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <img
          src={TRACTOMULA_FRAMES[frame].src}
          alt={TRACTOMULA_FRAMES[frame].label}
          className="pointer-events-none h-full w-full bg-[#0b1220] object-contain"
          draggable={false}
        />
        {spots.map((spot) => {
          const color = colors[spot.id] || AGE_COLORS.empty
          const selected = selectedId === spot.id
          return (
            <button
              key={spot.id}
              type="button"
              data-hotspot="1"
              title={getPiezaLabel(spot.id)}
              onClick={(e) => {
                e.stopPropagation()
                onSelect?.(spot.id)
              }}
              className="absolute rounded-full border-2 transition"
              style={{
                left: `${spot.left}%`,
                top: `${spot.top}%`,
                width: `${spot.w}%`,
                height: `${spot.h}%`,
                borderColor: selected ? '#38bdf8' : color,
                background: selected ? 'rgba(56,189,248,0.22)' : `${color}26`,
                boxShadow: selected ? '0 0 0 3px rgba(56,189,248,0.35)' : 'none',
              }}
            />
          )
        })}
      </div>
      <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2">
        <span className="rounded-full bg-slate-900/80 px-3 py-1 text-xs text-slate-100">
          Arrastra para girar · {TRACTOMULA_FRAMES[frame].label}
        </span>
      </div>
      <div className="absolute bottom-3 right-3 flex gap-1">
        <button type="button" className="btn btn-outline btn-sm bg-white/90" onClick={() => moveFrame(-1)}>‹</button>
        <button type="button" className="btn btn-outline btn-sm bg-white/90" onClick={() => moveFrame(1)}>›</button>
      </div>
    </div>
  )
}
