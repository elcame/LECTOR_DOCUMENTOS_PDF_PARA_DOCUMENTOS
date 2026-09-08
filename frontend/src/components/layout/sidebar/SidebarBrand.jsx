import { NavIcon } from './NavIcon'

export default function SidebarBrand({ collapsed, onToggle }) {
  return (
    <div className="flex h-16 shrink-0 items-center gap-2 border-b border-white/10 px-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500 text-sm font-bold text-white">
        ACR
      </div>
      {!collapsed && (
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white">ACR Operaciones</div>
          <div className="truncate text-[11px] text-slate-400">Gestión de flotas</div>
        </div>
      )}
      <button
        type="button"
        onClick={onToggle}
        className="hidden rounded-md p-1.5 text-slate-400 hover:bg-white/5 hover:text-white md:inline-flex"
        title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
      >
        <NavIcon name={collapsed ? 'chevronRight' : 'chevronLeft'} className="h-4 w-4" />
      </button>
    </div>
  )
}
