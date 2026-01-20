import { Link } from 'react-router-dom'
import Button from '../../common/Button/Button'
import { ROUTES } from '../../../config/constants'

const CTASection = () => {
  return (
    <section className="py-20 relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 text-white">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-700/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-primary-600/30 rounded-full blur-3xl"></div>
      </div>
      
      {/* Grid Pattern */}
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
      
      <div className="relative z-10 container-custom">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            ¿Listo para optimizar tu flota?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Únete a cientos de empresas que ya están gestionando sus flotas de manera más eficiente. 
            Comienza gratis hoy mismo.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to={ROUTES.REGISTER}>
              <Button 
                variant="success" 
                size="lg"
                className="w-full sm:w-auto shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
              >
                Crear cuenta gratis
              </Button>
            </Link>
            <Link to={ROUTES.LOGIN}>
              <Button 
                variant="outline" 
                size="lg"
                className="w-full sm:w-auto bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
              >
                Ver demo
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-sm text-primary-200">
            Sin tarjeta de crédito • Configuración en 5 minutos • Soporte incluido
          </p>
        </div>
      </div>
      </div>
    </section>
  )
}

export default CTASection
