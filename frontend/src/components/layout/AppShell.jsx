import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ROUTES } from '../../config/constants'
import { NavIcon } from './sidebar/NavIcon'
import SideNavItem from './sidebar/SideNavItem'
import SideNavGroup from './sidebar/SideNavGroup'
import SidebarBrand from './sidebar/SidebarBrand'
import SidebarUser from './sidebar/SidebarUser'

const LS_KEY = 'app_sidebar_collapsed'
const LS_GROUPS = 'app_sidebar_groups'

function classNames(...parts) {
  return parts.filter(Boolean).join(' ')
}

function pageTitle(pathname) {
  const map = {
    '/dashboard': 'Dashboard',
    '/productividad': 'Productividad',
    '/carros': 'Carros',
    '/gps': 'GPS',
    '/manifiestos': 'Manifiestos',
    '/administrador-operacion': 'Administrador de operación',
    '/administrador-operacion/cargar': 'Cargar y procesar',
    '/administrador-operacion/carpetas': 'Carpetas procesadas',
    '/administrador-operacion/consultar': 'Consultar',
    '/administrador-operacion/estadisticas': 'Estadísticas',
    '/administrador-operacion/tipos': 'Tipos de manifiesto',
    '/administrador': 'Administración',
  }
  if (pathname.endsWith('/estado') && pathname.startsWith('/carros/')) return 'Estado del vehículo'
  return map[pathname] || 'ACR Operaciones'
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
  const sidebarWidth = collapsed ? 'w-[76px]' : 'w-[280px]'
  const mainPadding = collapsed ? 'md:pl-[76px]' : 'md:pl-[280px]'
  const isEstadoCarro = location.pathname.endsWith('/estado') && location.pathname.startsWith('/carros/')
  const isFlotaPage = location.pathname === '/carros'

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname, location.search])

  useEffect(() => {
    try {
      localStorage.setItem(LS_GROUPS, JSON.stringify(groups))
    } catch {
      // ignore
    }
  }, [groups])

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

  const adminOperacionLinks = useMemo(
    () => [
      { to: ROUTES.ADMIN_OPERACION_CARGAR, label: 'Cargar y procesar', icon: 'upload' },
      { to: ROUTES.ADMIN_OPERACION_CARPETAS, label: 'Carpetas procesadas', icon: 'folder' },
      { to: ROUTES.ADMIN_OPERACION_CONSULTAR, label: 'Consultar', icon: 'search' },
      { to: ROUTES.ADMIN_OPERACION_ESTADISTICAS, label: 'Estadísticas', icon: 'chart' },
      { to: ROUTES.ADMIN_OPERACION_TIPOS, label: 'Tipos de manifiesto', icon: 'tag' },
    ],
    []
  )

  const manifiestosLinks = useMemo(
    () => [
      { to: '/manifiestos?section=gastos', label: 'Gastos de viaje', icon: 'wallet' },
      { to: '/manifiestos?section=anticipo', label: 'Anticipo', icon: 'banknote' },
      { to: '/manifiestos?section=tipos', label: 'Tipos de gasto', icon: 'tag' },
      { to: '/manifiestos?section=hojas', label: 'Hojas de gasto', icon: 'receipt' },
      ...(!isConductor
        ? [
            { to: '/manifiestos?section=graficas', label: 'Gráficas', icon: 'chart' },
            { to: '/manifiestos?section=carros_producido', label: 'Carros producido', icon: 'truck' },
          ]
        : []),
    ],
    [isConductor]
  )

  const adminLinks = useMemo(
    () => [
      { to: '/administrador', label: 'Usuarios y roles', icon: 'cog', show: isAdmin },
      { to: '/administrador?tab=trailer', label: 'Trailer', icon: 'truck', show: isAdmin },
      { to: '/administrador?tab=proveedores', label: 'Proveedores', icon: 'store', show: isAdmin },
    ],
    [isAdmin]
  )

  const sidebar = (
    <div className="flex h-full min-h-0 w-full flex-col bg-slate-950 text-slate-200 [color-scheme:dark]">
      <SidebarBrand collapsed={collapsed} onToggle={toggleCollapsed} />

      <nav className="sidebar-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
        {!collapsed && (
          <div className="px-2.5 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            General
          </div>
        )}
        <div className="space-y-0.5">
          <SideNavItem to="/dashboard" label="Dashboard" icon="home" collapsed={collapsed} end />
          <SideNavItem to="/productividad" label="Productividad" icon="check" collapsed={collapsed} />
          {!isConductor && <SideNavItem to="/carros" label="Carros" icon="truck" collapsed={collapsed} />}
          {!isConductor && <SideNavItem to="/gps" label="GPS" icon="pin" collapsed={collapsed} />}
        </div>

        <SideNavGroup
          id="manifiestos"
          title="Manifiestos"
          icon="document"
          collapsed={collapsed}
          open={!!groups.manifiestos}
          onToggle={() => setGroups((g) => ({ ...g, manifiestos: !g.manifiestos }))}
        >
          {manifiestosLinks.map((it) => (
            <SideNavItem key={it.to} to={it.to} label={it.label} icon={it.icon} collapsed={collapsed} />
          ))}
        </SideNavGroup>

        {!isConductor && (
          <SideNavGroup
            id="operaciones"
            title="Administrador de operación"
            icon="layers"
            collapsed={collapsed}
            open={!!groups.operaciones}
            onToggle={() => setGroups((g) => ({ ...g, operaciones: !g.operaciones }))}
            to={ROUTES.ADMIN_OPERACION}
          >
            {adminOperacionLinks.map((it) => (
              <SideNavItem key={it.to} to={it.to} label={it.label} icon={it.icon} collapsed={collapsed} />
            ))}
          </SideNavGroup>
        )}

        {adminLinks.some((l) => l.show) && (
          <SideNavGroup
            id="admin"
            title="Administración"
            icon="cog"
            collapsed={collapsed}
            open={!!groups.admin}
            onToggle={() => setGroups((g) => ({ ...g, admin: !g.admin }))}
          >
            {adminLinks.filter((l) => l.show).map((it) => (
              <SideNavItem key={it.to} to={it.to} label={it.label} icon={it.icon} collapsed={collapsed} />
            ))}
          </SideNavGroup>
        )}
      </nav>

      <SidebarUser
        username={user?.username}
        role={user?.role}
        collapsed={collapsed}
        onLogout={handleLogout}
      />
    </div>
  )

  return (
    <div className={classNames('min-h-screen', isFlotaPage || isEstadoCarro ? 'bg-[#0b1220]' : 'bg-slate-50')}>
      <div className="md:hidden sticky top-0 z-40 border-b border-slate-200 bg-slate-950 text-white">
        <div className="flex h-14 items-center justify-between px-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-slate-200 hover:bg-white/10"
            title="Abrir menú"
          >
            <NavIcon name="menu" className="h-5 w-5" />
          </button>
          <div className="truncate px-2 text-sm font-semibold">{pageTitle(location.pathname)}</div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg p-2 text-slate-200 hover:bg-white/10"
            title="Salir"
          >
            <NavIcon name="logout" className="h-5 w-5" />
          </button>
        </div>
      </div>

      <aside
        className={classNames(
          'fixed inset-y-0 left-0 z-30 hidden overflow-hidden transition-[width] duration-200 md:flex',
          sidebarWidth
        )}
      >
        {sidebar}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
          />
          <aside className="absolute inset-y-0 left-0 flex w-[280px] overflow-hidden shadow-2xl">
            <div className="relative h-full w-full">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="absolute right-2 top-3 z-10 rounded-md p-1.5 text-slate-300 hover:bg-white/10"
                title="Cerrar menú"
              >
                <NavIcon name="close" className="h-4 w-4" />
              </button>
              {sidebar}
            </div>
          </aside>
        </div>
      )}

      <main
        className={classNames(
          mainPadding,
          isEstadoCarro
            ? 'mx-auto max-w-none px-0 py-0'
            : isFlotaPage
              ? 'mx-auto max-w-none px-0 py-0'
              : 'mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8',
        )}
      >
        {children}
      </main>
    </div>
  )
}
