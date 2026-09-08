import { Link } from 'react-router-dom'
import { ROUTES } from '../../../config/constants'

const SHORTCUTS = [
  { to: ROUTES.ADMIN_OPERACION_CARGAR, title: 'Cargar y procesar', desc: 'Sube PDFs y extrae manifiestos.' },
  { to: ROUTES.ADMIN_OPERACION_CARPETAS, title: 'Carpetas procesadas', desc: 'Abre el contenido de cada carpeta.' },
  { to: ROUTES.ADMIN_OPERACION_CONSULTAR, title: 'Consultar', desc: 'Tabla y PDFs de todas las carpetas.' },
  { to: ROUTES.ADMIN_OPERACION_ESTADISTICAS, title: 'Estadísticas', desc: 'Volúmenes y actividad reciente.' },
  { to: ROUTES.ADMIN_OPERACION_TIPOS, title: 'Tipos de manifiesto', desc: 'Nombres para clasificar carpetas y PDFs.' },
]

export default function HubShortcuts() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {SHORTCUTS.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-blue-300 hover:shadow-sm transition"
        >
          <div className="font-semibold text-slate-900">{item.title}</div>
          <div className="text-sm text-slate-500 mt-1">{item.desc}</div>
        </Link>
      ))}
    </div>
  )
}
