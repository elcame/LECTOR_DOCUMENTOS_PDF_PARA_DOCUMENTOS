const TestimonialsSection = () => {
  const testimonials = [
    {
      name: 'Carlos Mendoza',
      role: 'Gerente de Flota',
      company: 'Transportes del Norte S.A.',
      content: 'Desde que implementamos esta plataforma, redujimos los costos de mantenimiento en un 30% y mejoramos significativamente la organización de nuestros documentos.',
      rating: 5,
    },
    {
      name: 'María González',
      role: 'Directora de Logística',
      company: 'Mensajería Express',
      content: 'La facilidad para gestionar conductores y vehículos nos ha ahorrado horas de trabajo semanal. La interfaz es intuitiva y los reportes son muy útiles.',
      rating: 5,
    },
    {
      name: 'Roberto Silva',
      role: 'Propietario',
      company: 'Taller Automotriz Silva',
      content: 'Excelente herramienta para empresas pequeñas y medianas. El control de mantenimientos preventivos ha sido clave para mantener nuestros vehículos en óptimas condiciones.',
      rating: 5,
    },
  ]

  return (
    <section id="testimonios" className="py-20 bg-white">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Lo que dicen nuestros clientes
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Empresas que confían en nuestra plataforma para gestionar sus flotas
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="card hover:shadow-xl transition-all duration-300">
              {/* Rating */}
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-5 h-5 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Content */}
              <p className="text-gray-700 mb-6 leading-relaxed italic">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="border-t border-gray-200 pt-4">
                <p className="font-semibold text-gray-900">{testimonial.name}</p>
                <p className="text-sm text-gray-600">{testimonial.role}</p>
                <p className="text-sm text-primary-600">{testimonial.company}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default TestimonialsSection
