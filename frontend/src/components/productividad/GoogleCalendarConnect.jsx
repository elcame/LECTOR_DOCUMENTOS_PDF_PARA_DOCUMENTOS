export default function GoogleCalendarConnect({
  connected,
  oauthConfigured = true,
  loading,
  onConnect,
  onDisconnect,
}) {
  return (
    <div className="card">
      <div className="card-body flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Google Calendar</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {connected
              ? 'Conectado — las tareas programadas se sincronizan con tu calendario.'
              : 'Conecta tu cuenta para programar bloques de tiempo en Calendar.'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
              connected ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-slate-400'}`} />
            {connected ? 'Conectado' : 'Sin conectar'}
          </span>
          {connected ? (
            <button
              type="button"
              onClick={onDisconnect}
              disabled={loading}
              className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
            >
              Desconectar
            </button>
          ) : (
            <button
              type="button"
              onClick={onConnect}
              disabled={loading || !oauthConfigured}
              title={
                oauthConfigured
                  ? 'Abrir la página de Google para autorizar Calendar'
                  : 'Primero configura las credenciales OAuth en el servidor'
              }
              className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Abriendo Google...' : 'Conectar con Google'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
