import { Link } from 'react-router-dom'
import { ROUTES } from '../../config/constants'

export default function DashboardShortcuts({ isAdmin, isConductor }) {
  const items = [
    { to: `${ROUTES.MANIFIESTOS}?section=gastos`, title: 'Manifiestos', desc: 'Gastos, anticipo, tipos y hojas.', show: true },
    { to: ROUTES.ADMIN_OPERACION, title: 'Administrador de operación', desc: 'Cargar, consultar y estadísticas.', show: !isConductor },
    { to: ROUTES.CARROS, title: 'Carros', desc: 'Vehículos y propietarios.', show: !isConductor },
    { to: ROUTES.GPS_TRACKING, title: 'GPS', desc: 'Rastreo en tiempo real.', show: !isConductor },
    { to: `${ROUTES.ADMINISTRADOR}?tab=proveedores`, title: 'Proveedores', desc: 'Productos y servicios.', show: !isConductor },
    { to: ROUTES.ADMINISTRADOR, title: 'Administración', desc: 'Usuarios, roles y módulos.', show: isAdmin },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.filter((item) => item.show).map((item) => (
        <Link key={item.to} to={item.to} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-sm transition">
          <div className="text-lg font-semibold text-slate-900">{item.title}</div>
          <div className="text-sm text-slate-500 mt-1">{item.desc}</div>
        </Link>
      ))}
    </div>
  )
}
