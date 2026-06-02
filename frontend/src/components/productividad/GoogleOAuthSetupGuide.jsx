const CONSOLE_URL =
  'https://console.cloud.google.com/apis/credentials?project=almacenamiento-acr'

export default function GoogleOAuthSetupGuide({ redirectUri, onRetry }) {
  const copyRedirect = () => {
    if (redirectUri) {
      navigator.clipboard?.writeText(redirectUri)
    }
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-amber-900">
          Configura Google para abrir la pantalla de inicio de sesión
        </h4>
        <p className="text-xs text-amber-800 mt-1">
          El servidor aún no tiene credenciales OAuth. Sigue estos pasos una vez; después el botón
          &quot;Conectar con Google&quot; te llevará a la página de Google para autorizar.
        </p>
      </div>

      <ol className="text-xs text-amber-900 space-y-2 list-decimal list-inside">
        <li>
          Abre{' '}
          <a
            href={CONSOLE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue-700 underline"
          >
            Google Cloud → Credenciales
          </a>
        </li>
        <li>
          Crea credenciales → <strong>ID de cliente de OAuth</strong> → tipo{' '}
          <strong>Aplicación web</strong>
        </li>
        <li>
          En <strong>URIs de redirección</strong>, agrega exactamente:
          <code className="block mt-1 p-2 bg-white rounded border border-amber-200 text-[11px] break-all">
            {redirectUri || 'http://localhost:5000/api/productividad/google/callback'}
          </code>
          <button
            type="button"
            onClick={copyRedirect}
            className="mt-1 text-blue-700 underline text-[11px]"
          >
            Copiar URI
          </button>
        </li>
        <li>
          Descarga el JSON y guárdalo como:
          <code className="block mt-1 p-2 bg-white rounded border border-amber-200 text-[11px]">
            backend/app/config/google-oauth-client.json
          </code>
          <span className="block mt-1 text-amber-700">
            (o pega Client ID y Secret en <code>backend/.env</code>)
          </span>
        </li>
        <li>
          <strong>Reinicia el backend</strong> (<code>start_backend.bat</code>) y pulsa
          &quot;Conectar con Google&quot;.
        </li>
      </ol>

      <div className="flex flex-wrap gap-2">
        <a
          href={CONSOLE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
        >
          Abrir Google Cloud Console
        </a>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-3 py-2 rounded-lg border border-amber-300 bg-white text-sm text-amber-900 hover:bg-amber-100"
          >
            Ya configuré — verificar
          </button>
        )}
      </div>
    </div>
  )
}
