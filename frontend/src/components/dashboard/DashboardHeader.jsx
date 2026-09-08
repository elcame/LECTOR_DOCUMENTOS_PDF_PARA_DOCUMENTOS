export default function DashboardHeader({ username, role }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <h1 className="text-2xl font-semibold text-slate-900">Bienvenido, {username}</h1>
      <p className="text-sm text-slate-500 mt-1">
        {role ? `Rol: ${role}` : 'Sistema de gestión de manifiestos y operaciones.'}
      </p>
    </div>
  )
}
