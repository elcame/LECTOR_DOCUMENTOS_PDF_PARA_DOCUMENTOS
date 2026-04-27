import { Link } from 'react-router-dom'
import ProveedoresSection from '../components/proveedores/ProveedoresSection'

export default function Proveedores() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Proveedores</h1>
            <p className="text-sm text-gray-600 mt-1">
              Gestiona proveedores, productos (repuestos) y servicios (mantenimientos).
            </p>
          </div>
          <Link to="/dashboard" className="btn btn-outline">
            Volver al Dashboard
          </Link>
        </div>

        <ProveedoresSection />
      </div>
    </div>
  )
}

