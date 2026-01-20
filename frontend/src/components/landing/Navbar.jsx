import { Link } from 'react-router-dom'
import { ROUTES } from '../../config/constants'
import Button from '../common/Button/Button'

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm shadow-sm">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/landing" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-900 leading-tight">Administración de Operaciones</span>
              <span className="text-xs text-gray-500">Gestión de Flotas</span>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#caracteristicas" className="text-gray-700 hover:text-primary-600 transition-colors">
              Características
            </a>
            <a href="#como-funciona" className="text-gray-700 hover:text-primary-600 transition-colors">
              Cómo funciona
            </a>
            <a href="#testimonios" className="text-gray-700 hover:text-primary-600 transition-colors">
              Testimonios
            </a>
            <Link to={ROUTES.LOGIN} className="text-gray-700 hover:text-primary-600 transition-colors">
              Iniciar sesión
            </Link>
            <Link to={ROUTES.REGISTER}>
              <Button variant="primary" size="sm">
                Comenzar gratis
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden text-gray-700 hover:text-primary-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
