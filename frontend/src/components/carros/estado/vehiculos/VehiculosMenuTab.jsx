export default function VehiculosMenuTab({ open, onClick }) {
  if (open) return null

  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={false}
      aria-controls="vehiculos-drawer"
      className="absolute left-0 top-1/2 z-40 -translate-y-1/2 rounded-r-xl border border-l-0 border-white/15 bg-slate-950/85 px-2 py-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-100 shadow-lg backdrop-blur-md transition hover:bg-slate-800"
    >
      <span className="block [writing-mode:vertical-rl]">Vehículos</span>
    </button>
  )
}
