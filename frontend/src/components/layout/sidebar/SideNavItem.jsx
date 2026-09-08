import { NavLink, useLocation } from 'react-router-dom'
import { NavIcon, isNavActive } from './NavIcon'

export default function SideNavItem({ to, label, icon, collapsed, end = false, onNavigate }) {
  const location = useLocation()
  const active = isNavActive(to, location, { end })

  return (
    <NavLink
      to={to}
      end={end}
      title={label}
      onClick={onNavigate}
      className={[
        'group flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors',
        collapsed ? 'justify-center' : '',
        active
          ? 'bg-blue-500/15 text-white'
          : 'text-slate-300 hover:bg-white/5 hover:text-white',
      ].join(' ')}
    >
      <span
        className={[
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
          active ? 'bg-blue-500 text-white' : 'bg-white/5 text-slate-300 group-hover:text-white',
        ].join(' ')}
      >
        <NavIcon name={icon} className="h-4 w-4" />
      </span>
      {!collapsed && <span className="min-w-0 flex-1 leading-snug">{label}</span>}
    </NavLink>
  )
}
