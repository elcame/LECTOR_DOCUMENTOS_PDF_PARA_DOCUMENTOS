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
import OperacionesRedirect from './pages/administrador-operacion/OperacionesRedirect'
import HubPage from './pages/administrador-operacion/HubPage'
import CargarYProcesarPage from './pages/administrador-operacion/CargarYProcesarPage'
import CarpetasProcesadasPage from './pages/administrador-operacion/CarpetasProcesadasPage'
import ConsultarPage from './pages/administrador-operacion/ConsultarPage'
import EstadisticasPage from './pages/administrador-operacion/EstadisticasPage'
import TiposManifiestoPage from './pages/administrador-operacion/TiposManifiestoPage'
import Carros from './pages/Carros'
import CarroEstadoPage from './pages/carros/CarroEstadoPage'
import Administrador from './pages/Administrador'
import GPSTracking from './pages/GPSTracking'
import Proveedores from './pages/Proveedores'
import Productividad from './pages/Productividad'
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
              path={ROUTES.PRODUCTIVIDAD}
              element={<ProtectedRoute><AppShell><Productividad /></AppShell></ProtectedRoute>}
            />
            <Route
              path={ROUTES.MANIFIESTOS}
              element={<ProtectedRoute><AppShell><Manifiestos /></AppShell></ProtectedRoute>}
            />
            <Route
              path={ROUTES.OPERACIONES}
              element={<ProtectedRoute requireAdmin><OperacionesRedirect /></ProtectedRoute>}
            />
            <Route
              path={ROUTES.ADMIN_OPERACION}
              element={<ProtectedRoute requireAdmin><AppShell><HubPage /></AppShell></ProtectedRoute>}
            />
            <Route
              path={ROUTES.ADMIN_OPERACION_CARGAR}
              element={<ProtectedRoute requireAdmin><AppShell><CargarYProcesarPage /></AppShell></ProtectedRoute>}
            />
            <Route
              path={ROUTES.ADMIN_OPERACION_CARPETAS}
              element={<ProtectedRoute requireAdmin><AppShell><CarpetasProcesadasPage /></AppShell></ProtectedRoute>}
            />
            <Route
              path={ROUTES.ADMIN_OPERACION_CONSULTAR}
              element={<ProtectedRoute requireAdmin><AppShell><ConsultarPage /></AppShell></ProtectedRoute>}
            />
            <Route
              path={ROUTES.ADMIN_OPERACION_ESTADISTICAS}
              element={<ProtectedRoute requireAdmin><AppShell><EstadisticasPage /></AppShell></ProtectedRoute>}
            />
            <Route
              path={ROUTES.ADMIN_OPERACION_TIPOS}
              element={<ProtectedRoute requireAdmin><AppShell><TiposManifiestoPage /></AppShell></ProtectedRoute>}
            />
            <Route
              path={ROUTES.CARROS}
              element={<ProtectedRoute requireAdmin><AppShell><Carros /></AppShell></ProtectedRoute>}
            />
            <Route
              path="/carros/:id/estado"
              element={<ProtectedRoute requireAdmin><AppShell><CarroEstadoPage /></AppShell></ProtectedRoute>}
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
