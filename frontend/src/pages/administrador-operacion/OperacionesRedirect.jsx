import { Navigate, useSearchParams } from 'react-router-dom'
import { ROUTES } from '../../config/constants'

const SECTION_MAP = {
  subir: ROUTES.ADMIN_OPERACION_CARGAR,
  procesar: ROUTES.ADMIN_OPERACION_CARPETAS,
  pdfs: ROUTES.ADMIN_OPERACION_CONSULTAR,
  tabla: ROUTES.ADMIN_OPERACION_CONSULTAR,
  stats: ROUTES.ADMIN_OPERACION_ESTADISTICAS,
  tipos: ROUTES.ADMIN_OPERACION_TIPOS,
}

export default function OperacionesRedirect() {
  const [searchParams] = useSearchParams()
  const section = (searchParams.get('section') || '').trim().toLowerCase()
  const to = SECTION_MAP[section] || ROUTES.ADMIN_OPERACION
  return <Navigate to={to} replace />
}
