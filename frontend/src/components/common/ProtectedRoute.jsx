import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading, isAdmin } = useAuth()

  console.log('DEBUG PROTECTED - user:', user ? 'SÍ' : 'NO', 'loading:', loading, 'isAdmin:', isAdmin)

  if (loading) {
    console.log('DEBUG PROTECTED - Mostrando spinner...')
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!user) {
    console.log('DEBUG PROTECTED - No hay usuario, redirigiendo a login...')
    return <Navigate to="/login" replace />
  }

  if (requireAdmin && !isAdmin) {
    console.log('DEBUG PROTECTED - No es admin, redirigiendo a dashboard...')
    return <Navigate to="/dashboard" replace />
  }

  console.log('DEBUG PROTECTED - Acceso permitido')
  return children
}
