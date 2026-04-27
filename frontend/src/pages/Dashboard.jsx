import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const isConductor = user?.role === 'conductor'

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-2xl font-bold mb-2 text-slate-900">Bienvenido, {user?.username}</h2>
        <p className="text-slate-500">
          Sistema de gestión de manifiestos y operaciones.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/manifiestos?section=gastos" className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-sm transition">
          <div className="text-lg font-semibold text-slate-900">📄 Manifiestos</div>
          <div className="text-sm text-slate-500 mt-1">Gastos, anticipo, tipos y hojas.</div>
        </Link>

        {!isConductor && (
          <>
            <Link to="/operaciones?section=pdfs" className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-sm transition">
              <div className="text-lg font-semibold text-slate-900">📊 Operaciones</div>
              <div className="text-sm text-slate-500 mt-1">Subir, procesar, PDFs y tabla.</div>
            </Link>

            <Link to="/carros" className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-sm transition">
              <div className="text-lg font-semibold text-slate-900">🚚 Carros</div>
              <div className="text-sm text-slate-500 mt-1">Vehículos y propietarios.</div>
            </Link>

            <Link to="/gps" className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-sm transition">
              <div className="text-lg font-semibold text-slate-900">📍 GPS</div>
              <div className="text-sm text-slate-500 mt-1">Rastreo en tiempo real.</div>
            </Link>

            <Link to="/administrador?tab=proveedores" className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-sm transition">
              <div className="text-lg font-semibold text-slate-900">🏪 Proveedores</div>
              <div className="text-sm text-slate-500 mt-1">Productos y servicios.</div>
            </Link>

            {isAdmin && (
              <Link to="/administrador" className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-sm transition">
                <div className="text-lg font-semibold text-slate-900">⚙️ Administración</div>
                <div className="text-sm text-slate-500 mt-1">Usuarios, roles y módulos.</div>
              </Link>
            )}
          </>
        )}
      </div>

      <div className="flex">
        <button onClick={handleLogout} className="btn btn-outline">
          Salir
        </button>
      </div>
    </div>
  )
}
