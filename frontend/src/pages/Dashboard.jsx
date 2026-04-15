import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-bold text-gray-900 leading-tight">
                  Administración de Operaciones
                </h1>
                <span className="text-xs text-gray-500">Gestión de Flotas</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/operaciones"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                📊 Operaciones
              </Link>
              <Link
                to="/carros"
                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900"
              >
                🚚 Carros
              </Link>
              <Link
                to="/gps"
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                📍 GPS
              </Link>
              {isAdmin && (
                <Link
                  to="/administrador"
                  className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800"
                >
                  ⚙️ Administrador
                </Link>
              )}
              <span className="text-sm text-gray-600">
                {user?.username} <span className="text-xs text-gray-400">({user?.role})</span>
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="card">
            <h2 className="text-2xl font-bold mb-4">Bienvenido, {user?.username}</h2>
            <p className="text-gray-600 mb-6">
              Sistema de gestión de manifiestos y operaciones
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link
                to="/manifiestos"
                className="card hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-semibold mb-2">📄 Manifiestos</h3>
                <p className="text-gray-600">
                  Procesa y gestiona tus manifiestos PDF
                </p>
              </Link>

              <Link
                to="/operaciones"
                className="card hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-semibold mb-2">📊 Operaciones</h3>
                <p className="text-gray-600">
                  Visualiza y analiza tus operaciones
                </p>
              </Link>

              <Link
                to="/carros"
                className="card hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-semibold mb-2">🚚 Carros</h3>
                <p className="text-gray-600">
                  Gestiona vehículos y propietarios vinculados a manifiestos
                </p>
              </Link>

              <Link
                to="/gps"
                className="card hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-semibold mb-2">📍 GPS Tracking</h3>
                <p className="text-gray-600">
                  Rastreo en tiempo real de vehículos
                </p>
              </Link>

              {isAdmin && (
                <Link
                  to="/administrador"
                  className="card hover:shadow-lg transition-shadow"
                >
                  <h3 className="text-xl font-semibold mb-2">⚙️ Administrador</h3>
                  <p className="text-gray-600">
                    Gestiona usuarios y configuración
                  </p>
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
