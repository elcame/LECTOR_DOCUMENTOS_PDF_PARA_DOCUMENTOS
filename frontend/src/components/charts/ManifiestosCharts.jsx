import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import manifiestosService from '../../services/manifiestosService'
import Loading from '../common/Loading/Loading'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-slate-200 rounded shadow-lg">
        <p className="text-sm font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' 
              ? entry.name.includes('tiempo') || entry.name.includes('Tiempo')
                ? `${entry.value}h`
                : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(entry.value)
              : entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const formatTiempo = (value) => {
  return `${value}h`
}

export default function ManifiestosCharts() {
  const [period, setPeriod] = useState('daily')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)
  const [ingresosCarro, setIngresosCarro] = useState(null)
  const [ingresosCarroError, setIngresosCarroError] = useState(null)
  // Nota: "Carros producido" (tarjetas) ahora vive en su propia sección/componente.

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Cargar estadísticas principales
      const response = await manifiestosService.getManifiestosStats(period, 30)
      if (response.success) {
        setData(response.data)
      } else {
        setError(response.error || 'Error al cargar estadísticas')
        return
      }
      
      // Cargar datos por carro
      try {
        setIngresosCarroError(null)
        const responseCarro = await manifiestosService.getIngresosByCarro(period, 30)
        if (responseCarro.success) {
          setIngresosCarro(responseCarro.data)
          console.log('Datos por carro cargados:', responseCarro.data)
        } else {
          setIngresosCarroError(responseCarro.error || 'Error al cargar datos de carros')
          console.warn('Error en respuesta de ingresos por carro:', responseCarro.error)
        }
      } catch (e) {
        setIngresosCarroError(e?.message || 'Error de conexión')
        console.warn('No se pudieron cargar datos por carro:', e)
      }
      
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Error al cargar estadísticas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [period])

  // (se removió la carga de gastos por placa)

  if (loading) {
    return (
      <div className="p-6">
        <Loading message="Cargando estadísticas..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="bg-slate-50 border border-slate-200 text-slate-600 px-4 py-3 rounded-lg">
          No hay datos disponibles para mostrar
        </div>
      </div>
    )
  }

  const { summary } = data
  
  // Verificar si hay datos procesados
  const tieneDatos = data.ingresos_por_fecha && data.ingresos_por_fecha.length > 0
  
  if (!tieneDatos) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
          <div className="font-medium">No se pudieron procesar los datos de manifiestos</div>
          <div className="text-sm mt-1">
            Los manifiestos existen pero no se pudieron analizar. Verifique que los campos de fecha y valor estén correctamente formateados.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Selector de período */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          Estadísticas de Manifiestos
        </h2>
        <div className="flex bg-slate-100 rounded-lg p-1">
          {['daily', 'weekly', 'monthly'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {p === 'daily' ? 'Diario' : p === 'weekly' ? 'Semanal' : 'Mensual'}
            </button>
          ))}
        </div>
      </div>

      {/* Cards de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="text-sm text-slate-600">Ingresos Totales</div>
          <div className="text-2xl font-bold text-slate-900">
            {formatCurrency(summary.total_ingresos)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="text-sm text-slate-600">Manifiestos</div>
          <div className="text-2xl font-bold text-slate-900">
            {summary.total_manifiestos}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="text-sm text-slate-600">Valor Promedio</div>
          <div className="text-2xl font-bold text-slate-900">
            {formatCurrency(summary.valor_promedio)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="text-sm text-slate-600">Tiempo Promedio</div>
          <div className="text-2xl font-bold text-slate-900">
            {formatTiempo(summary.tiempo_promedio_entre_viajes)}
          </div>
        </div>
      </div>

      {/* Cards de análisis comparativo */}
      {data.analisis_comparativo && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="text-sm text-slate-600">Mejor Día</div>
            <div className="text-xl font-bold text-green-600">
              {data.analisis_comparativo.mejor_dia_semana}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="text-sm text-slate-600">Peor Día</div>
            <div className="text-xl font-bold text-red-600">
              {data.analisis_comparativo.peor_dia_semana}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="text-sm text-slate-600">Promedio Diario</div>
            <div className="text-xl font-bold text-slate-900">
              {formatCurrency(data.analisis_comparativo.promedio_diario_general)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="text-sm text-slate-600">Variación Semanal</div>
            <div className="text-xl font-bold text-blue-600">
              {data.analisis_comparativo.variacion_semanal}
            </div>
          </div>
        </div>
      )}

      {/* Grid de gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico principal: Ingresos por día de la semana */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 lg:col-span-2">
          <h3 className="text-lg font-medium text-slate-900 mb-4">
            Ingresos por Día de la Semana
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data.ingresos_por_dia_semana}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dia_semana" />
              <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="total" fill="#10b981" name="Ingresos Totales" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de ingresos por fecha con días específicos */}
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <h3 className="text-lg font-medium text-slate-900 mb-4">
            Evolución de Ingresos por Día
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.ingresos_por_fecha}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => {
                  // Formatear para mostrar fecha y día de la semana
                  const date = new Date(value)
                  const options = { day: '2-digit', month: '2-digit' }
                  return date.toLocaleDateString('es-CO', options)
                }}
              />
              <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const date = new Date(label)
                    const diaSemana = date.toLocaleDateString('es-CO', { weekday: 'long' })
                    const fechaFormateada = date.toLocaleDateString('es-CO', { 
                      day: '2-digit', 
                      month: '2-digit',
                      year: 'numeric'
                    })
                    return (
                      <div className="bg-white p-3 border border-slate-200 rounded shadow-lg">
                        <p className="font-medium">{fechaFormateada}</p>
                        <p className="text-sm text-slate-600">{diaSemana}</p>
                        {payload.map((entry, index) => (
                          <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: {formatCurrency(entry.value)}
                          </p>
                        ))}
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Ingresos"
                dot={{ fill: '#3b82f6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
          
          {/* 🔥 NUEVO: Tabla de resumen por fecha */}
          {data.ingresos_por_fecha && data.ingresos_por_fecha.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-slate-700 mb-2">Resumen por Fecha</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-2 py-1 text-left">Fecha</th>
                      <th className="px-2 py-1 text-left">Día</th>
                      <th className="px-2 py-1 text-left">Ingresos</th>
                      <th className="px-2 py-1 text-left">Manifiestos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.ingresos_por_fecha.slice(-5).reverse().map((item, index) => {
                      const date = new Date(item.date)
                      const diaSemana = date.toLocaleDateString('es-CO', { weekday: 'long' })
                      const fechaFormateada = date.toLocaleDateString('es-CO', { 
                        day: '2-digit', 
                        month: '2-digit' 
                      })
                      return (
                        <tr key={index} className="border-b border-slate-100">
                          <td className="px-2 py-1">{fechaFormateada}</td>
                          <td className="px-2 py-1 capitalize">{diaSemana}</td>
                          <td className="px-2 py-1">{formatCurrency(item.total)}</td>
                          <td className="px-2 py-1">{item.count || 1}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Gráfico de ingresos por destino */}
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <h3 className="text-lg font-medium text-slate-900 mb-4">
            Ingresos por Destino
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.ingresos_por_destino}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="destino" />
              <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="total" fill="#10b981" name="Ingresos" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 🔥 NUEVO: Gráfico de Viajes por Placa y Día de la Semana */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 lg:col-span-2">
          <h3 className="text-lg font-medium text-slate-900 mb-4">
            Viajes por Placa y Día de la Semana
          </h3>
          {ingresosCarroError && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              <strong>Error al cargar datos:</strong> {ingresosCarroError}
            </div>
          )}
          {ingresosCarro && ingresosCarro.length > 0 ? (() => {
            // Preparar datos: agrupar viajes por placa y día de la semana
            const diasOrden = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
            const coloresDias = {
              'Lunes': '#3b82f6',
              'Martes': '#10b981',
              'Miércoles': '#f59e0b',
              'Jueves': '#ef4444',
              'Viernes': '#8b5cf6',
              'Sábado': '#ec4899',
              'Domingo': '#06b6d4'
            }
            
            // Transformar datos para la gráfica
            const chartData = ingresosCarro.map(carro => {
              const viajesPorDia = {}
              const fechasPorDia = {}
              diasOrden.forEach(dia => {
                viajesPorDia[dia] = 0
                fechasPorDia[dia] = []
              })
              
              carro.viajes?.forEach(viaje => {
                const dia = viaje.dia_semana
                if (viajesPorDia.hasOwnProperty(dia)) {
                  viajesPorDia[dia] += 1
                  fechasPorDia[dia].push(viaje.fecha)
                }
              })
              
              return {
                placa: carro.placa,
                total_viajes: carro.viajes_count,
                ...viajesPorDia,
                fechas: fechasPorDia
              }
            })
            
            // Calcular promedio general de viajes
            const totalViajes = ingresosCarro.reduce((sum, c) => sum + c.viajes_count, 0)
            const promedioViajes = totalViajes / ingresosCarro.length
            
            return (
              <div>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="placa" />
                    <YAxis label={{ value: 'Número de Viajes', angle: -90, position: 'insideLeft' }} />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const carroData = chartData.find(c => c.placa === label)
                          return (
                            <div className="bg-white p-3 border border-slate-200 rounded shadow-lg">
                              <p className="font-medium mb-2">{label}</p>
                              <p className="text-sm text-slate-600 mb-2">
                                Total viajes: <strong>{carroData?.total_viajes}</strong>
                              </p>
                              <div className="space-y-1">
                                {diasOrden.map(dia => {
                                  const count = carroData?.[dia] || 0
                                  if (count > 0) {
                                    return (
                                      <div key={dia} className="text-xs">
                                        <span style={{ color: coloresDias[dia] }}>● {dia}:</span>
                                        <strong> {count} viajes</strong>
                                        <div className="text-slate-500 ml-4">
                                          {carroData?.fechas[dia]?.join(', ')}
                                        </div>
                                      </div>
                                    )
                                  }
                                  return null
                                })}
                              </div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Legend />
                    {diasOrden.map(dia => (
                      <Bar 
                        key={dia}
                        dataKey={dia} 
                        stackId="a"
                        fill={coloresDias[dia]} 
                        name={dia}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
                
                {/* Promedio de viajes */}
                <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-slate-600">Promedio de viajes por carro:</span>
                      <span className="ml-2 text-lg font-bold text-slate-900">
                        {promedioViajes.toFixed(1)} viajes
                      </span>
                    </div>
                    <div className="text-sm text-slate-500">
                      Total: {totalViajes} viajes en {ingresosCarro.length} vehículos
                    </div>
                  </div>
                </div>
                
                {/* Tabla resumen por placa y día */}
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Resumen de Viajes por Día</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-2 py-1 text-left">Placa</th>
                          <th className="px-2 py-1 text-center">Total</th>
                          {diasOrden.map(dia => (
                            <th key={dia} className="px-2 py-1 text-center text-xs" style={{ color: coloresDias[dia] }}>
                              {dia.slice(0, 3)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {chartData.map((carro, index) => (
                          <tr key={index} className="border-b border-slate-100">
                            <td className="px-2 py-1 font-medium">{carro.placa}</td>
                            <td className="px-2 py-1 text-center font-bold">{carro.total_viajes}</td>
                            {diasOrden.map(dia => (
                              <td key={dia} className="px-2 py-1 text-center text-xs">
                                {carro[dia] > 0 ? carro[dia] : '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
          })() : (
            <div className="text-center py-8 text-slate-500">
              <div className="text-sm">No hay datos disponibles</div>
            </div>
          )}
        </div>

        {/* 🔥 NUEVO: Gráfico de manifiestos por carro con fechas específicas */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 lg:col-span-2">
          <h3 className="text-lg font-medium text-slate-900 mb-4">
            Manifiestos por Carro (Placa) con Fechas Específicas
          </h3>
          {ingresosCarroError && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              <strong>Error al cargar datos:</strong> {ingresosCarroError}
            </div>
          )}
          {ingresosCarro && ingresosCarro.length > 0 ? (
            <div>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={ingresosCarro}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="placa" />
                  <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                  <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const carroData = ingresosCarro.find(c => c.placa === label)
                        return (
                          <div className="bg-white p-3 border border-slate-200 rounded shadow-lg">
                            <p className="font-medium mb-2">{label}</p>
                            {payload.map((entry, index) => (
                              <p key={index} className="text-sm" style={{ color: entry.color }}>
                                {entry.name}: {entry.name.includes('Manifiestos') 
                                  ? entry.value 
                                  : formatCurrency(entry.value)}
                              </p>
                            ))}
                            {carroData && (
                              <div className="mt-2 pt-2 border-t border-slate-200">
                                <p className="text-xs text-slate-600">
                                  <strong>Conductores:</strong> {carroData.conductores?.join(', ') || 'N/A'}
                                </p>
                                <p className="text-xs text-slate-600">
                                  <strong>Destinos:</strong> {carroData.destinos?.slice(0, 3).join(', ') || 'N/A'}
                                  {carroData.destinos?.length > 3 && '...'}
                                </p>
                                <div className="mt-1">
                                  <strong className="text-xs">Viajes recientes:</strong>
                                  <div className="text-xs text-slate-500">
                                    {carroData.viajes?.slice(-3).map((viaje, i) => (
                                      <div key={i}>
                                        {viaje.fecha} ({viaje.dia_semana}) - {formatCurrency(viaje.valor)}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="viajes_count" fill="#3b82f6" name="Cantidad de Manifiestos" />
                  <Bar yAxisId="right" dataKey="total_ingresos" fill="#10b981" name="Ingresos Totales" />
                </BarChart>
              </ResponsiveContainer>
              
              {/* 🔥 NUEVO: Tabla detallada con fechas */}
              <div className="mt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Detalle de Viajes por Carro</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-2 py-1 text-left">Placa</th>
                        <th className="px-2 py-1 text-left">Manifiestos</th>
                        <th className="px-2 py-1 text-left">Ingresos</th>
                        <th className="px-2 py-1 text-left">Últimos Viajes (Fecha - Día)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ingresosCarro.map((carro, index) => (
                        <tr key={index} className="border-b border-slate-100">
                          <td className="px-2 py-1 font-medium">{carro.placa}</td>
                          <td className="px-2 py-1">{carro.viajes_count}</td>
                          <td className="px-2 py-1">{formatCurrency(carro.total_ingresos)}</td>
                          <td className="px-2 py-1">
                            <div className="text-xs text-slate-600">
                              {carro.viajes?.slice(-3).map((viaje, i) => (
                                <div key={i}>
                                  {viaje.fecha} ({viaje.dia_semana})
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="text-sm font-medium">No hay datos disponibles de manifiestos por carro</div>
              <div className="text-xs text-slate-400 mt-1">
                Verifique que los manifiestos tengan información de placas registradas
              </div>
            </div>
          )}
        </div>

        {/* Gráfico de distribución de valores */}
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <h3 className="text-lg font-medium text-slate-900 mb-4">
            Distribución de Valores
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.distribucion_valores}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="rango" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="count" fill="#f59e0b" name="Cantidad" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de tiempos entre viajes */}
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <h3 className="text-lg font-medium text-slate-900 mb-4">
            Tiempos Entre Viajes
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.tiempos_entre_viajes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="horas" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="count" fill="#ef4444" name="Cantidad" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de tiempos por conductor */}
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <h3 className="text-lg font-medium text-slate-900 mb-4">
            Tiempo Promedio por Conductor
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.tiempos_por_conductor}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="conductor" />
              <YAxis tickFormatter={(value) => `${value}h`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="tiempo_promedio_hs" fill="#8b5cf6" name="Tiempo Promedio" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Patrones temporales */}
      {data.patrones_temporales && (
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <h3 className="text-lg font-medium text-slate-900 mb-4">
            Patrones Temporales
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {data.patrones_temporales.manana?.count || 0}
              </div>
              <div className="text-sm text-slate-600">Mañana (6h-12h)</div>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {data.patrones_temporales.tarde?.count || 0}
              </div>
              <div className="text-sm text-slate-600">Tarde (12h-18h)</div>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {data.patrones_temporales.noche?.count || 0}
              </div>
              <div className="text-sm text-slate-600">Noche (18h-6h)</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
