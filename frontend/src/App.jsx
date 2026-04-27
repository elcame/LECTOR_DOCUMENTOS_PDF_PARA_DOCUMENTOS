import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ErrorBoundary from './components/common/ErrorBoundary/ErrorBoundary'
import ProtectedRoute from './components/common/ProtectedRoute'
import { ROUTES } from './config/constants'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Manifiestos from './pages/Manifiestos'
import Operaciones from './pages/Operaciones'
import Carros from './pages/Carros'
import Administrador from './pages/Administrador'
import GPSTracking from './pages/GPSTracking'
import Proveedores from './pages/Proveedores'
import AppShell from './components/layout/AppShell'

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/landing" replace />} />

            <Route path="/landing" element={<Landing />} />
            <Route path={ROUTES.LOGIN} element={<Login />} />
            <Route path={ROUTES.REGISTER} element={<Register />} />

            <Route
              path={ROUTES.DASHBOARD}
              element={<ProtectedRoute><AppShell><Dashboard /></AppShell></ProtectedRoute>}
            />
            <Route
              path={ROUTES.MANIFIESTOS}
              element={<ProtectedRoute><AppShell><Manifiestos /></AppShell></ProtectedRoute>}
            />
            <Route
              path={ROUTES.OPERACIONES}
              element={<ProtectedRoute requireAdmin><AppShell><Operaciones /></AppShell></ProtectedRoute>}
            />
            <Route
              path={ROUTES.CARROS}
              element={<ProtectedRoute requireAdmin><AppShell><Carros /></AppShell></ProtectedRoute>}
            />
            <Route
              path={ROUTES.PROVEEDORES}
              element={<ProtectedRoute requireAdmin><AppShell><Proveedores /></AppShell></ProtectedRoute>}
            />
            <Route
              path={ROUTES.GPS_TRACKING}
              element={<ProtectedRoute requireAdmin><AppShell><GPSTracking /></AppShell></ProtectedRoute>}
            />

            <Route
              path={ROUTES.ADMINISTRADOR}
              element={<ProtectedRoute requireAdmin><AppShell><Administrador /></AppShell></ProtectedRoute>}
            />

            <Route path="*" element={<Navigate to="/landing" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
