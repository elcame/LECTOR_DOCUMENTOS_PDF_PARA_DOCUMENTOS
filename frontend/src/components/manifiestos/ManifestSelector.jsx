import { useState, useEffect } from 'react'

export default function ManifestSelector({ manifests, selectedManifest, onSelect, loading }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredManifests, setFilteredManifests] = useState([])

  useEffect(() => {
    if (!manifests) return
    
    const filtered = manifests.filter(manifest => {
      const searchLower = searchTerm.toLowerCase()
      return (
        manifest.load_id?.toLowerCase().includes(searchLower) ||
        manifest.remesa?.toLowerCase().includes(searchLower) ||
        manifest.placa?.toLowerCase().includes(searchLower) ||
        manifest.conductor?.toLowerCase().includes(searchLower) ||
        manifest.archivo?.toLowerCase().includes(searchLower)
      )
    })
    
    setFilteredManifests(filtered)
  }, [manifests, searchTerm])

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          <p className="text-gray-500">Cargando manifiestos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Seleccionar Manifiesto</h2>
      </div>
      <div className="card-body">
        {/* Buscador */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar por Load ID, Remesa, Placa, Conductor o Archivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input w-full"
          />
        </div>

        {/* Manifiesto seleccionado */}
        {selectedManifest && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">Manifiesto Seleccionado:</p>
                <p className="text-lg font-bold text-blue-700">
                  {selectedManifest.load_id || 'Sin Load ID'} - {selectedManifest.remesa || 'Sin Remesa'}
                </p>
                <p className="text-sm text-blue-600">
                  Placa: {selectedManifest.placa || 'N/A'} | Conductor: {selectedManifest.conductor || 'N/A'}
                </p>
              </div>
              <button
                onClick={() => onSelect(null)}
                className="btn btn-outline btn-sm"
              >
                Cambiar
              </button>
            </div>
          </div>
        )}

        {/* Lista de manifiestos */}
        {!selectedManifest && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredManifests.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                {searchTerm ? 'No se encontraron manifiestos' : 'No hay manifiestos disponibles'}
              </p>
            ) : (
              filteredManifests.map((manifest) => (
                <button
                  key={manifest.id}
                  onClick={() => onSelect(manifest)}
                  className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {manifest.load_id || 'Sin Load ID'} - {manifest.remesa || 'Sin Remesa'}
                      </p>
                      <p className="text-sm text-gray-600">
                        📄 {manifest.archivo}
                      </p>
                      <p className="text-sm text-gray-500">
                        🚛 Placa: {manifest.placa || 'N/A'} | 👤 Conductor: {manifest.conductor || 'N/A'}
                      </p>
                      {manifest.anticipo && (
                        <p className="text-sm text-green-600 font-medium">
                          💵 Anticipo: ${parseFloat(manifest.anticipo).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
