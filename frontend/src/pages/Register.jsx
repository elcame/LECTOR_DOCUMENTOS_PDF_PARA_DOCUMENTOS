import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useForm } from '../hooks/useForm'
import { validators } from '../utils/validation'
import { getErrorMessage } from '../utils/errorHandler'
import Input from '../components/common/Input/Input'
import Button from '../components/common/Button/Button'
import { ROUTES } from '../config/constants'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useForm(
    {
      username: '',
      password: '',
      email: '',
      full_name: '',
    },
    {
      username: [validators.required, validators.minLength(3)],
      password: [validators.required, validators.minLength(6)],
      email: [validators.email],
      full_name: [validators.required],
    }
  )

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (formValues) => {
    setError('')
    setLoading(true)

    try {
      await register(formValues)
      navigate(ROUTES.DASHBOARD)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 py-12">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Círculos abstractos */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-700/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-primary-600/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl"></div>
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

      {/* Diagonal Lines */}
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

      {/* Back to Landing Link */}
      <Link 
        to="/landing" 
        className="absolute top-4 left-4 text-white/80 hover:text-white transition-colors flex items-center space-x-2 z-10 backdrop-blur-sm bg-white/10 px-3 py-2 rounded-lg border border-white/20"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>Volver</span>
      </Link>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="card bg-white/95 backdrop-blur-md shadow-2xl border border-white/20">
          {/* Logo/Icon */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl mb-4 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Administración de Operaciones
            </h1>
            <p className="text-sm text-gray-500 mb-2">Gestión de Flotas</p>
            <h2 className="text-lg font-semibold text-gray-600">
              Crear Cuenta
            </h2>
          </div>

          {error && (
            <div className="alert-error mb-6 animate-slide-down">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Nombre Completo"
              name="full_name"
              value={values.full_name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.full_name && errors.full_name}
              required
              placeholder="Ingresa tu nombre completo"
            />

            <Input
              label="Usuario"
              name="username"
              value={values.username}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.username && errors.username}
              required
              placeholder="Elige un nombre de usuario"
            />

            <Input
              label="Email"
              name="email"
              type="email"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.email && errors.email}
              placeholder="tu@email.com"
            />

            <Input
              label="Contraseña"
              name="password"
              type="password"
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.password && errors.password}
              required
              placeholder="Mínimo 6 caracteres"
            />

            <Button
              type="submit"
              loading={loading}
              disabled={loading}
              fullWidth
              size="lg"
              className="mt-6 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              Crear Cuenta
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <Link to={ROUTES.LOGIN} className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                Inicia sesión aquí
              </Link>
            </p>
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex flex-wrap justify-center items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Gratis para empezar
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Sin tarjeta
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Configuración rápida
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
