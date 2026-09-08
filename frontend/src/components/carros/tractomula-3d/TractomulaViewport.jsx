import { useState } from 'react'
import { CAMERA_BUTTONS } from './cameraPresets'
import { MULE_MODELS } from './muleModels'
import { PaintColorProvider } from './paint/PaintColorContext'
import PaintColorPicker from './paint/PaintColorPicker'
import { DEFAULT_PAINT_COLOR } from './paint/paintColor'
import TractomulaScene from './TractomulaScene'

export default function TractomulaViewport({
  colors,
  selectedId,
  onSelect,
  children,
  controlsOffsetRight = 12,
  controlsOffsetLeft = 12,
  paintColor = DEFAULT_PAINT_COLOR,
  onPaintColorChange,
  showPaintPicker = true,
}) {
  const [view, setView] = useState('threeQuarter')
  const [viewTick, setViewTick] = useState(0)
  const model = MULE_MODELS[0]
  const hintShift = controlsOffsetRight > 40 || controlsOffsetLeft > 40

  const goTo = (nextView) => {
    setView(nextView)
    setViewTick((tick) => tick + 1)
  }

  return (
    <div className="relative h-full min-h-[560px] w-full overflow-hidden rounded-xl border border-slate-800 bg-[#0b1220]">
      {showPaintPicker && onPaintColorChange ? (
        <div className="absolute top-3 z-10" style={{ left: controlsOffsetLeft }}>
          <PaintColorPicker value={paintColor} onChange={onPaintColorChange} />
        </div>
      ) : null}
      <PaintColorProvider color={paintColor}>
        <TractomulaScene
          modelSrc={model.src}
          colors={colors}
          selectedId={selectedId}
          onSelect={onSelect}
          view={view}
          viewTick={viewTick}
        />
      </PaintColorProvider>
      <div
        className={`pointer-events-none absolute bottom-3 ${hintShift ? 'left-4' : 'left-1/2 -translate-x-1/2'}`}
      >
        <span className="rounded-full bg-slate-900/80 px-3 py-1 text-xs text-slate-100">
          Arrastra para girar · clic en una llanta o abre Piezas
        </span>
      </div>
      <div
        className="absolute bottom-3 z-10 flex flex-wrap justify-end gap-1"
        style={{ right: controlsOffsetRight }}
      >
        {CAMERA_BUTTONS.map((button) => (
          <button
            key={button.id}
            type="button"
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
              view === button.id
                ? 'border-sky-400/50 bg-sky-500/20 text-sky-100'
                : 'border-white/15 bg-slate-950/80 text-slate-200 hover:border-white/25 hover:bg-white/10'
            }`}
            onClick={() => goTo(button.id)}
          >
            {button.label}
          </button>
        ))}
      </div>
      {children}
    </div>
  )
}
