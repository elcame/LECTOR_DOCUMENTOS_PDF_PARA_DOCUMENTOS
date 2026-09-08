import { NavIcon } from './NavIcon'

function initials(name = '') {
  return String(name).slice(0, 2).toUpperCase() || 'U'
}

export default function SidebarUser({ username, role, collapsed, onLogout }) {
  if (collapsed) {
    return (
      <div className="border-t border-white/10 p-2">
        <button
          type="button"
          onClick={onLogout}
          title="Salir"
          className="flex w-full items-center justify-center rounded-lg p-2 text-slate-300 hover:bg-white/5 hover:text-white"
        >
          <NavIcon name="logout" className="h-5 w-5" />
        </button>
      </div>
    )
  }

  return (
    <div className="border-t border-white/10 p-3">
      <div className="flex items-center gap-2 rounded-lg bg-white/5 px-2 py-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-xs font-semibold text-blue-200">
          {initials(username)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-white">{username}</div>
          <div className="truncate text-[11px] capitalize text-slate-400">{role}</div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          title="Salir"
          className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
        >
          <NavIcon name="logout" className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
