import { NavLink, useLocation } from 'react-router-dom'
import { NavIcon } from './NavIcon'

export default function SideNavGroup({
  id,
  title,
  icon,
  collapsed,
  open,
  onToggle,
  to,
  children,
  onNavigate,
}) {
  const location = useLocation()
  const titleActive = to
    ? location.pathname === to || location.pathname.startsWith(`${to}/`)
    : false

  const titleContent = (
    <>
      <span
        className={[
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
          titleActive ? 'bg-blue-500 text-white' : 'bg-white/5 text-slate-300',
        ].join(' ')}
      >
        <NavIcon name={icon} className="h-4 w-4" />
      </span>
      {!collapsed && (
        <span className="min-w-0 flex-1 text-left text-[13px] font-semibold leading-snug line-clamp-2">
          {title}
        </span>
      )}
    </>
  )

  return (
    <div className="mt-3">
      <div className="flex items-start gap-0.5">
        {to ? (
          <NavLink
            to={to}
            end
            title={title}
            onClick={onNavigate}
            className={[
              'flex min-w-0 flex-1 items-start gap-3 rounded-lg px-2.5 py-2 transition-colors',
              collapsed ? 'justify-center' : '',
              titleActive ? 'bg-blue-500/15 text-white' : 'text-slate-200 hover:bg-white/5 hover:text-white',
            ].join(' ')}
          >
            {titleContent}
          </NavLink>
        ) : (
          <button
            type="button"
            onClick={onToggle}
            title={title}
            className={[
              'flex min-w-0 flex-1 items-start gap-3 rounded-lg px-2.5 py-2 text-slate-200 hover:bg-white/5 hover:text-white',
              collapsed ? 'justify-center' : '',
            ].join(' ')}
          >
            {titleContent}
          </button>
        )}
        {!collapsed && (
          <button
            type="button"
            onClick={onToggle}
            className="mt-1.5 shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
            title={open ? 'Ocultar sección' : 'Mostrar sección'}
            aria-expanded={open}
            aria-controls={`group-${id}`}
          >
            <NavIcon
              name="chevronDown"
              className={`h-4 w-4 transition-transform ${open ? 'rotate-0' : '-rotate-90'}`}
            />
          </button>
        )}
      </div>
      {open && !collapsed && (
        <div id={`group-${id}`} className="mt-1 space-y-0.5 border-l border-white/10 ml-6 pl-2">
          {children}
        </div>
      )}
    </div>
  )
}
