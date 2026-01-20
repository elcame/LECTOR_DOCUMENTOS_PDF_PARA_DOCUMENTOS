const FeaturesSection = () => {
  const features = [
    {
      title: 'Gestión de Vehículos',
      description: 'Registra y organiza toda la información de tus vehículos: placa, modelo, año, kilometraje y más.',
      icon: '🚗',
    },
    {
      title: 'Control de Conductores',
      description: 'Administra información de conductores, asigna vehículos y realiza seguimiento de actividades.',
      icon: '👤',
    },
    {
      title: 'Mantenimiento Preventivo',
      description: 'Programa servicios, recibe alertas automáticas y mantén un historial completo de mantenimientos.',
      icon: '🔧',
    },
    {
      title: 'Gestión Documental',
      description: 'Almacena y organiza documentos importantes: seguros, licencias, permisos, manifiestos y más.',
      icon: '📄',
    },
    {
      title: 'Alertas y Notificaciones',
      description: 'Recibe notificaciones automáticas sobre vencimientos, mantenimientos y eventos importantes.',
      icon: '🔔',
    },
    {
      title: 'Reportes y Análisis',
      description: 'Genera reportes detallados, analiza costos y tendencias para optimizar tu operación.',
      icon: '📊',
    },
  ]

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Funcionalidades clave
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Todo lo que necesitas para una gestión profesional de tu flota
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="card hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-l-primary-600"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturesSection
