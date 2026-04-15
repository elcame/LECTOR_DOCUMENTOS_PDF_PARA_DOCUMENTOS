import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ErrorBoundary from './components/common/ErrorBoundary/ErrorBoundary'
import ProtectedRoute from './components/common/ProtectedRoute'
import { ROUTES } from './config/constants'

// Páginas
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Manifiestos from './pages/Manifiestos'
import Operaciones from './pages/Operaciones'
import Carros from './pages/Carros'
import Administrador from './pages/Administrador'
import Roles from './pages/Roles'
import UsuariosFirebase from './pages/UsuariosFirebase'
import GPSTracking from './pages/GPSTracking'

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Ruta raíz - redirigir a landing */}
            <Route path="/" element={<Navigate to="/landing" replace />} />
            
            {/* Rutas públicas */}
            <Route path="/landing" element={<Landing />} />
            <Route path={ROUTES.LOGIN} element={<Login />} />
            <Route path={ROUTES.REGISTER} element={<Register />} />
            
            {/* Rutas protegidas */}
            <Route
              path={ROUTES.DASHBOARD}
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.MANIFIESTOS}
              element={
                <ProtectedRoute>
                  <Manifiestos />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.OPERACIONES}
              element={
                <ProtectedRoute>
                  <Operaciones />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.CARROS}
              element={
                <ProtectedRoute>
                  <Carros />
                </ProtectedRoute>
              }
            />
            
            {/* Rutas de administración */}
            <Route
              path={ROUTES.ADMINISTRADOR}
              element={
                <ProtectedRoute requireAdmin>
                  <Administrador />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.ROLES}
              element={
                <ProtectedRoute requireAdmin>
                  <Roles />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.USUARIOS_FIREBASE}
              element={
                <ProtectedRoute requireAdmin>
                  <UsuariosFirebase />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.GPS_TRACKING}
              element={
                <ProtectedRoute>
                  <GPSTracking />
                </ProtectedRoute>
              }
            />
            
            {/* Ruta por defecto para rutas no encontradas */}
            <Route path="*" element={<Navigate to="/landing" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
