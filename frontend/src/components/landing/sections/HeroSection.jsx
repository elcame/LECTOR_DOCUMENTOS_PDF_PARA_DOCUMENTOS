import { Link } from 'react-router-dom'
import Button from '../../common/Button/Button'
import { ROUTES } from '../../../config/constants'

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950">
      {/* Background Decorations - Círculos abstractos */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Círculo grande superior derecho */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-700/20 rounded-full blur-3xl"></div>
        {/* Círculo medio inferior izquierdo */}
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-primary-600/30 rounded-full blur-3xl"></div>
        {/* Círculo pequeño centro */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        ></div>
      </div>

      {/* Diagonal Lines Pattern */}
      <div className="absolute inset-0 opacity-[0.05]">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(255, 255, 255, 0.1) 10px,
              rgba(255, 255, 255, 0.1) 20px
            )`,
          }}
        ></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container-custom text-center text-white px-4">
        <div className="max-w-4xl mx-auto animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-sm font-medium mb-6 animate-slide-down shadow-lg">
            <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
            Plataforma todo-en-uno para gestión de flotas
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight animate-slide-up">
            Administra tu flota vehicular
            <span className="block text-blue-200 mt-2 drop-shadow-lg">con total control y eficiencia</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-2xl mx-auto leading-relaxed animate-slide-up drop-shadow-md" style={{ animationDelay: '0.1s' }}>
            Gestiona vehículos, conductores, mantenimientos y documentos desde una sola plataforma. 
            Optimiza costos y mejora la productividad de tu empresa.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link to={ROUTES.REGISTER}>
              <Button 
                variant="success" 
                size="lg"
                className="w-full sm:w-auto shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
              >
                Comenzar gratis
              </Button>
            </Link>
            <Link to={ROUTES.LOGIN}>
              <Button 
                variant="outline" 
                size="lg"
                className="w-full sm:w-auto bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20 shadow-lg"
              >
                Iniciar sesión
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-blue-200 animate-fade-in drop-shadow-sm" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Sin tarjeta de crédito
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Configuración en minutos
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Soporte 24/7
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
