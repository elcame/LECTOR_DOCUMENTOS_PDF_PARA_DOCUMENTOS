export default function SidebarOperaciones({
  viewMode,
  showStats,
  onChangeViewMode,
  onToggleStats,
  onGoToDashboard,
  onGoToStats,
  onGoToPDFs,
  onGoToTabla,
  onGoToProcesarCarpeta,
  onGoToSubirCarpeta,
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

  const content = (
    <>
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        {showLabel && (
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Operaciones
          </p>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
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
        <button
          onClick={onGoToDashboard}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          title="Ir al Dashboard"
          type="button"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 11l9-8 9 8v10a2 2 0 01-2 2h-4a2 2 0 01-2-2V12H11v9a2 2 0 01-2 2H5a2 2 0 01-2-2V11z" />
          </svg>
          {showLabel && <span>Dashboard</span>}
        </button>

        <button
          onClick={onGoToTabla || (() => onChangeViewMode?.('table'))}
          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${
            viewMode === 'table'
              ? 'bg-blue-50 text-blue-700'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
          title="Ver tabla de manifiestos"
          type="button"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          {showLabel && <span>Ver tabla</span>}
        </button>

        <button
          onClick={onGoToPDFs || (() => onChangeViewMode?.('grid'))}
          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${
            viewMode === 'grid'
              ? 'bg-blue-50 text-blue-700'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
          title="Ver lista de PDFs"
          type="button"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            />
          </svg>
          {showLabel && <span>Ver PDFs</span>}
        </button>

        <button
          onClick={onGoToStats || onToggleStats}
          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${
            showStats
              ? 'bg-blue-50 text-blue-700'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
          type="button"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          {showLabel && (
            <span>{showStats ? 'Ocultar estadísticas' : 'Ver estadísticas'}</span>
          )}
        </button>

        <div className="pt-3 mt-2 border-t border-slate-200 space-y-2">
          <button
            onClick={onGoToProcesarCarpeta}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
            type="button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            {showLabel && <span>Procesar carpeta</span>}
          </button>

          <button
            onClick={onGoToSubirCarpeta}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
            type="button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            {showLabel && <span>Subir carpeta</span>}
          </button>
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
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

