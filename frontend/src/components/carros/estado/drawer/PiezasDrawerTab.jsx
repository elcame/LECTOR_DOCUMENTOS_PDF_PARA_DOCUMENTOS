export default function PiezasDrawerTab({ open, onClick }) {
  if (open) return null

  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={false}
      aria-controls="piezas-drawer"
      className="absolute right-0 top-1/2 z-20 -translate-y-1/2 rounded-l-xl border border-r-0 border-white/15 bg-slate-950/85 px-2 py-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-100 shadow-lg backdrop-blur-md transition hover:bg-slate-800"
    >
      <span className="block [writing-mode:vertical-rl] rotate-180">Piezas</span>
    </button>
  )
}
