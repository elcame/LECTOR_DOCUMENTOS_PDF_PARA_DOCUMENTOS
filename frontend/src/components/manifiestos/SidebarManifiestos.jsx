export default function SidebarManifiestos({
  isConductor = false,
  activeSection,
  onChangeSection,
  collapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
}) {
  const baseWidth = collapsed ? 'w-[72px]' : 'w-[248px]'
  const showLabel = !collapsed

  const desktopClasses = `
    fixed inset-y-0 left-0 z-30
    ${baseWidth}
    bg-white border-r border-slate-200 shadow-sm
    transition-all duration-300
    hidden md:flex flex-col
  `

  const mobileClasses = `
    fixed inset-y-0 left-0 z-40
    ${baseWidth}
    bg-white border-r border-slate-200 shadow-lg
    transition-transform duration-300
    flex md:hidden flex-col
    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
  `

  const NavButton = ({ id, label, icon }) => (
    <button
      type="button"
      onClick={() => onChangeSection?.(id)}
      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${
        activeSection === id
          ? 'bg-blue-50 text-blue-700'
          : 'text-slate-600 hover:bg-slate-50'
      }`}
      title={label}
    >
      <span className="text-base">{icon}</span>
      {showLabel && <span>{label}</span>}
    </button>
  )

  const content = (
    <>
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        {showLabel && (
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Manifiestos
          </p>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={collapsed ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'}
            />
          </svg>
        </button>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-2 overflow-y-auto">
        <NavButton id="gastos" icon="💰" label="Gastos de viaje" />
        <NavButton id="anticipo" icon="💵" label="Anticipo" />
        <NavButton id="tipos" icon="🏷️" label="Tipos de gasto" />
        {!isConductor && <NavButton id="graficas" icon="📈" label="Gráficas" />}
        {!isConductor && <NavButton id="carros_producido" icon="🚚" label="Carros producido" />}
        <div className="pt-3 mt-2 border-t border-slate-200">
          <NavButton id="hojas" icon="🧾" label="Hojas de gasto" />
        </div>
      </nav>

      {isMobileOpen && (
        <button
          type="button"
          onClick={onCloseMobile}
          className="md:hidden absolute top-3 right-3 p-1.5 rounded-full bg-slate-100 text-slate-600"
          title="Cerrar menú"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </>
  )

  return (
    <>
      <aside className={desktopClasses}>{content}</aside>
      <aside className={mobileClasses}>{content}</aside>
    </>
  )
}

