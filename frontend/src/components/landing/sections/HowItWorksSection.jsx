const HowItWorksSection = () => {
  const steps = [
    {
      number: '01',
      title: 'Registro',
      description: 'Crea tu cuenta en minutos. Sin complicaciones, sin tarjeta de crédito. Empieza a usar la plataforma inmediatamente.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
    },
    {
      number: '02',
      title: 'Configuración',
      description: 'Agrega tus vehículos, conductores y documentos. Nuestra interfaz intuitiva te guía paso a paso.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      number: '03',
      title: 'Uso Diario',
      description: 'Gestiona tu flota día a día. Registra viajes, actualiza documentos, programa mantenimientos y genera reportes.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
  ]

  return (
    <section id="como-funciona" className="py-20 bg-white">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Cómo funciona
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            En tres simples pasos estarás gestionando tu flota de manera profesional
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connection Line (Desktop only) */}
          <div className="hidden md:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-200 via-primary-400 to-primary-200"></div>

          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Step Card */}
              <div className="text-center">
                {/* Number Badge */}
                <div className="relative inline-flex items-center justify-center mb-6">
                  <div className="absolute w-24 h-24 bg-primary-100 rounded-full opacity-50"></div>
                  <div className="relative w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {step.number}
                  </div>
                </div>

                {/* Icon */}
                <div className="flex justify-center mb-4 text-primary-600">
                  {step.icon}
                </div>

                {/* Content */}
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed max-w-sm mx-auto">
                  {step.description}
                </p>
              </div>

              {/* Arrow (Desktop only, except last) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 -right-4 text-primary-400">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HowItWorksSection
