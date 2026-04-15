import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ children, requireAdmin = false, requireSuperAdmin = false }) {
  const { user, loading, isAdmin, isSuperAdmin } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (requireSuperAdmin && !isSuperAdmin) return <Navigate to="/dashboard" replace />
  if (requireAdmin && !isAdmin) return <Navigate to="/dashboard" replace />

  return children
}
