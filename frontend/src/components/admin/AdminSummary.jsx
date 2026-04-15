export default function AdminSummary({ usuarios = [], roles = [], carros = [] }) {
  const byRole = {}
  usuarios.forEach((u) => {
    const r = u.role_id || 'sin_rol'
    byRole[r] = (byRole[r] || 0) + 1
  })

  const activeUsers = usuarios.filter((u) => u.active !== false).length
  const carrosAsignados = usuarios.filter((u) => u.carro_id).length
  const carrosLibres = carros.length - carrosAsignados

  const cards = [
    { label: 'Total Usuarios', value: usuarios.length, color: 'bg-blue-500' },
    { label: 'Usuarios Activos', value: activeUsers, color: 'bg-green-500' },
    { label: 'Super Admins', value: byRole['super_admin'] || 0, color: 'bg-purple-500' },
    { label: 'Empresariales', value: byRole['empresarial'] || 0, color: 'bg-indigo-500' },
    { label: 'Conductores', value: byRole['conductor'] || 0, color: 'bg-yellow-500' },
    { label: 'Carros Registrados', value: carros.length, color: 'bg-gray-500' },
    { label: 'Carros Asignados', value: carrosAsignados, color: 'bg-teal-500' },
    { label: 'Carros Libres', value: carrosLibres >= 0 ? carrosLibres : 0, color: 'bg-orange-500' },
  ]

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Resumen del Sistema</h2>
      </div>
      <div className="card-body">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cards.map((c) => (
            <div key={c.label} className="rounded-lg border border-gray-200 p-4 text-center">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-white ${c.color} mb-2`}>
                <span className="text-lg font-bold">{c.value}</span>
              </div>
              <p className="text-sm text-gray-600">{c.label}</p>
            </div>
          ))}
        </div>

        {roles.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Distribución por Rol</h3>
            <div className="space-y-2">
              {roles.map((r) => {
                const key = r.role_name || r.id
                const count = byRole[key] || 0
                const pct = usuarios.length > 0 ? Math.round((count / usuarios.length) * 100) : 0
                return (
                  <div key={r.id} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-28 capitalize">{key.replace('_', ' ')}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 w-16 text-right">{count} ({pct}%)</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
