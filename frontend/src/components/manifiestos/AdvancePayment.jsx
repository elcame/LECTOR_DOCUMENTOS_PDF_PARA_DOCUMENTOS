import { useState, useEffect } from 'react'
import { manifiestosService } from '../../services/manifiestosService'
import Button from '../common/Button/Button'

export default function AdvancePayment({ manifest, onUpdate }) {
  const [anticipo, setAnticipo] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (manifest?.anticipo) {
      setAnticipo(manifest.anticipo)
    } else {
      setAnticipo('')
    }
  }, [manifest])

  const handleSave = async () => {
    if (!manifest?.id) {
      setMessage({ type: 'error', text: 'No hay manifiesto seleccionado' })
      return
    }

    if (!anticipo || anticipo === '') {
      setMessage({ type: 'error', text: 'Ingrese un monto de anticipo' })
      return
    }

    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      await manifiestosService.updateField(manifest.id, 'anticipo', anticipo)
      
      setMessage({ type: 'success', text: 'Anticipo guardado correctamente' })
      
      if (onUpdate) {
        onUpdate()
      }

      setTimeout(() => {
        setMessage({ type: '', text: '' })
      }, 3000)
    } catch (error) {
      console.error('Error al guardar anticipo:', error)
      setMessage({ 
        type: 'error', 
        text: 'Error al guardar: ' + (error.response?.data?.error || error.message) 
      })
    } finally {
      setSaving(false)
    }
  }

  if (!manifest) {
    return (
      <div className="card">
        <div className="card-body">
          <p className="text-gray-500 text-center py-8">
            Selecciona un manifiesto para gestionar su anticipo
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">💵 Anticipo del Manifiesto</h2>
      </div>
      <div className="card-body">
        {/* Información del manifiesto */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Información del Manifiesto</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Load ID:</span>
              <span className="ml-2 font-medium">{manifest.load_id || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-600">Remesa:</span>
              <span className="ml-2 font-medium">{manifest.remesa || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-600">Placa:</span>
              <span className="ml-2 font-medium">{manifest.placa || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-600">Conductor:</span>
              <span className="ml-2 font-medium">{manifest.conductor || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Formulario de anticipo */}
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monto del Anticipo
          </label>
          <div className="flex gap-3">
            <div className="flex-1">
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  value={anticipo}
                  onChange={(e) => setAnticipo(e.target.value)}
                  placeholder="0.00"
                  className="input pl-8 w-full"
                  step="0.01"
                  min="0"
                  disabled={saving}
                />
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              variant="primary"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>

          {/* Mensaje de estado */}
          {message.text && (
            <div
              className={`mt-4 p-3 rounded-lg text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Anticipo actual */}
          {manifest.anticipo && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Anticipo Actual:</strong>
              </p>
              <p className="text-2xl font-bold text-blue-900">
                ${parseFloat(manifest.anticipo).toLocaleString('es-CO', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
            </div>
          )}
        </div>

        {/* Información adicional */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex">
            <svg
              className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Nota:</p>
              <p>El anticipo se registra como un pago adelantado al conductor antes del viaje.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
