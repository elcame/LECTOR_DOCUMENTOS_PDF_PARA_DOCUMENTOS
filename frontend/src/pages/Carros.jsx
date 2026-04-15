import CarrosTable from '../components/operaciones/CarrosTable/CarrosTable'
import PropietariosTable from '../components/operaciones/PropietariosTable/PropietariosTable'

export default function Carros() {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <CarrosTable />
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <PropietariosTable />
        </div>
      </main>
    </div>
  )
}

