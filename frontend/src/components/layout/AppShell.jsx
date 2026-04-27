import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const LS_KEY = 'app_sidebar_collapsed'
const LS_GROUPS = 'app_sidebar_groups'

function classNames(...parts) {
  return parts.filter(Boolean).join(' ')
}

function SectionTitle({ children, collapsed }) {
  if (collapsed) return <div className="h-3" />
  return (
    <div className="px-3 pt-3 pb-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
      {children}
    </div>
  )
}

function SideItem({ to, label, icon, collapsed, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        classNames(
          'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition',
          isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
        )
      }
      title={label}
    >
      <span className="text-base">{icon}</span>
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  )
}

function Group({ id, title, icon, collapsed, open, onToggle, children }) {
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={onToggle}
        className={classNames(
          'w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-semibold',
          'text-slate-700 hover:bg-slate-50'
        )}
        title={title}
      >
        <span className="flex items-center gap-2 min-w-0">
          <span className="text-base">{icon}</span>
          {!collapsed && <span className="truncate">{title}</span>}
        </span>
        {!collapsed && (
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={open ? 'M19 15l-7-7-7 7' : 'M5 9l7 7 7-7'} />
          </svg>
        )}
      </button>
      {open && (
        <div className={classNames('mt-1 space-y-1', collapsed ? 'px-0' : 'pl-6 pr-1')}>
          {children}
        </div>
      )}
    </div>
  )
}

export default function AppShell({ children }) {
  const { user, isAdmin, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(LS_KEY) === '1'
    } catch {
      return false
    }
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const [groups, setGroups] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_GROUPS)
      if (raw) return JSON.parse(raw)
    } catch {
      // ignore
    }
    return { manifiestos: true, operaciones: true, admin: true }
  })

  const isConductor = user?.role === 'conductor'

  const baseWidth = collapsed ? 'w-[72px]' : 'w-[248px]'
  const mainPadding = collapsed ? 'md:pl-[92px]' : 'md:pl-[268px]'

  const toggleCollapsed = () => {
    setCollapsed((v) => {
      const next = !v
      try {
        localStorage.setItem(LS_KEY, next ? '1' : '0')
      } catch {
        // ignore
      }
      return next
    })
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const operacionesLinks = useMemo(
    () => [
      { to: '/operaciones?section=tabla', label: 'Ver tabla', icon: '📋' },
      { to: '/operaciones?section=pdfs', label: 'Ver PDFs', icon: '📄' },
      { to: '/operaciones?section=stats', label: 'Estadísticas', icon: '📊' },
      { to: '/operaciones?section=procesar', label: 'Procesar carpeta', icon: '📂' },
      { to: '/operaciones?section=subir', label: 'Subir carpeta', icon: '⬆️' },
    ],
    []
  )

  const manifiestosLinks = useMemo(
    () => [
      { to: '/manifiestos?section=gastos', label: 'Gastos de viaje', icon: '💰' },
      { to: '/manifiestos?section=anticipo', label: 'Anticipo', icon: '💵' },
      { to: '/manifiestos?section=tipos', label: 'Tipos de gasto', icon: '🏷️' },
      { to: '/manifiestos?section=hojas', label: 'Hojas de gasto', icon: '🧾' },
      ...(!isConductor ? [
        { to: '/manifiestos?section=graficas', label: 'Gráficas', icon: '📈' },
        { to: '/manifiestos?section=carros_producido', label: 'Carros producido', icon: '🚚' },
      ] : []),
    ],
    [isConductor]
  )

  const adminLinks = useMemo(
    () => [
      { to: '/administrador', label: 'Administración', icon: '⚙️', show: isAdmin },
      { to: '/administrador?tab=trailer', label: 'Trailer', icon: '🚛', show: isAdmin },
      { to: '/administrador?tab=proveedores', label: 'Proveedores', icon: '🏪', show: isAdmin },
    ],
    [isAdmin]
  )

  useEffect(() => {
    try {
      localStorage.setItem(LS_GROUPS, JSON.stringify(groups))
    } catch {
      // ignore
    }
  }, [groups])

  const sidebar = (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        {!collapsed && (
          <div className="flex flex-col">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Menú
            </div>
            <div className="text-sm font-semibold text-slate-900">Lector de Manifiestos</div>
          </div>
        )}
        <button
          type="button"
          onClick={toggleCollapsed}
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

      <div className="flex-1 overflow-y-auto px-2 py-3">
        <SectionTitle collapsed={collapsed}>General</SectionTitle>
        <div className="space-y-1">
          <SideItem to="/dashboard" label="Dashboard" icon="🏠" collapsed={collapsed} end />
          {!isConductor && <SideItem to="/carros" label="Carros" icon="🚚" collapsed={collapsed} />}
          {!isConductor && <SideItem to="/gps" label="GPS" icon="📍" collapsed={collapsed} />}
        </div>

        <Group
          id="manifiestos"
          title="Manifiestos"
          icon="📄"
          collapsed={collapsed}
          open={!!groups.manifiestos}
          onToggle={() => setGroups((g) => ({ ...g, manifiestos: !g.manifiestos }))}
        >
          {manifiestosLinks.map((it) => (
            <SideItem key={it.to} to={it.to} label={it.label} icon={it.icon} collapsed={collapsed} />
          ))}
        </Group>

        {!isConductor && (
          <Group
            id="operaciones"
            title="Operaciones"
            icon="📊"
            collapsed={collapsed}
            open={!!groups.operaciones}
            onToggle={() => setGroups((g) => ({ ...g, operaciones: !g.operaciones }))}
          >
            {operacionesLinks.map((it) => (
              <SideItem key={it.to} to={it.to} label={it.label} icon={it.icon} collapsed={collapsed} />
            ))}
          </Group>
        )}

        {adminLinks.some((l) => l.show) && (
          <Group
            id="admin"
            title="Administración"
            icon="⚙️"
            collapsed={collapsed}
            open={!!groups.admin}
            onToggle={() => setGroups((g) => ({ ...g, admin: !g.admin }))}
          >
            {adminLinks.filter((l) => l.show).map((it) => (
              <SideItem key={it.to} to={it.to} label={it.label} icon={it.icon} collapsed={collapsed} />
            ))}
          </Group>
        )}
      </div>

      <div className="border-t border-slate-200 p-3">
        {!collapsed ? (
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900 truncate">{user?.username}</div>
              <div className="text-xs text-slate-500 truncate">{user?.role}</div>
            </div>
            <button type="button" className="btn btn-outline btn-sm" onClick={handleLogout}>
              Salir
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn-outline btn-sm w-full" onClick={handleLogout} title="Salir">
            ⎋
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="h-14 px-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-700"
            title="Abrir menú"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="text-sm font-semibold text-slate-900">
            {location.pathname.replace('/', '').toUpperCase() || 'DASHBOARD'}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-700"
            title="Salir"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside
        className={classNames(
          'fixed inset-y-0 left-0 z-30 bg-white border-r border-slate-200 shadow-sm transition-all duration-300 hidden md:flex',
          baseWidth
        )}
      >
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
          />
          <aside className={classNames('absolute inset-y-0 left-0 bg-white border-r border-slate-200 shadow-lg', baseWidth)}>
            <div className="relative h-full">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-100 text-slate-600"
                title="Cerrar menú"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              {sidebar}
            </div>
          </aside>
        </div>
      )}

      <main className={classNames('max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 px-4', mainPadding)}>
        {children}
      </main>
    </div>
  )
}

