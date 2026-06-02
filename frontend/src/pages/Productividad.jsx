import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { productividadService } from '../services/productividadService'
import CaptureInbox from '../components/productividad/CaptureInbox'
import TaskBoard from '../components/productividad/TaskBoard'
import DailyProgress from '../components/productividad/DailyProgress'
import GoogleCalendarConnect from '../components/productividad/GoogleCalendarConnect'
import GoogleOAuthSetupGuide from '../components/productividad/GoogleOAuthSetupGuide'
import ScheduleTaskModal from '../components/productividad/ScheduleTaskModal'

export default function Productividad() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [tasks, setTasks] = useState([])
  const [stats, setStats] = useState(null)
  const [calendarEvents, setCalendarEvents] = useState([])
  const [googleConnected, setGoogleConnected] = useState(false)
  const [oauthConfigured, setOauthConfigured] = useState(false)
  const [oauthRedirectUri, setOauthRedirectUri] = useState('')
  const [loading, setLoading] = useState(true)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [scheduleTask, setScheduleTask] = useState(null)

  const today = new Date().toISOString().slice(0, 10)

  const loadAll = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const [tasksRes, statsRes, statusRes, eventsRes] = await Promise.all([
        productividadService.getTasks(),
        productividadService.getDailyStats(today),
        productividadService.getGoogleStatus(),
        productividadService.getCalendarEvents(today),
      ])
      if (tasksRes?.success) setTasks(tasksRes.tasks || [])
      if (statsRes?.success) setStats(statsRes.stats)
      if (statusRes?.success) {
        setGoogleConnected(!!statusRes.connected)
        setOauthConfigured(!!statusRes.oauth_configured)
        setOauthRedirectUri(statusRes.redirect_uri || '')
      }
      if (eventsRes?.success) setCalendarEvents(eventsRes.events || [])
    } catch (err) {
      setError(err?.message || 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }, [today])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  useEffect(() => {
    const google = searchParams.get('google')
    const googleError = searchParams.get('google_error')
    if (google === 'connected') {
      setGoogleConnected(true)
      setSearchParams({}, { replace: true })
      loadAll()
    }
    if (googleError) {
      setError(decodeURIComponent(googleError))
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams, loadAll])

  const handleCapture = async (title) => {
    try {
      setSaving(true)
      const res = await productividadService.createTask({ title })
      if (res?.success) await loadAll()
    } catch (err) {
      setError(err?.message || 'No se pudo crear la tarea')
    } finally {
      setSaving(false)
    }
  }

  const handleMove = async (taskId, list) => {
    try {
      await productividadService.updateTask(taskId, { list })
      await loadAll()
    } catch (err) {
      setError(err?.message || 'Error al mover tarea')
    }
  }

  const handleComplete = async (taskId) => {
    try {
      await productividadService.completeTask(taskId)
      await loadAll()
    } catch (err) {
      setError(err?.message || 'Error al completar')
    }
  }

  const handleDelete = async (taskId) => {
    if (!window.confirm('¿Eliminar esta tarea?')) return
    try {
      await productividadService.deleteTask(taskId)
      await loadAll()
    } catch (err) {
      setError(err?.message || 'Error al eliminar')
    }
  }

  const handleScheduleSave = async (updates) => {
    if (!scheduleTask) return
    try {
      setSaving(true)
      await productividadService.updateTask(scheduleTask.id, updates)
      setScheduleTask(null)
      await loadAll()
    } catch (err) {
      setError(err?.message || 'Error al programar')
    } finally {
      setSaving(false)
    }
  }

  const handleConnectGoogle = async () => {
    if (!oauthConfigured) {
      setError(
        'Configura las credenciales OAuth en el servidor (ver guía abajo) y reinicia el backend.'
      )
      return
    }
    try {
      setGoogleLoading(true)
      setError('')
      const res = await productividadService.getGoogleAuthUrl()
      if (res?.auth_url) {
        // Redirige a accounts.google.com (pantalla de autorización)
        window.location.assign(res.auth_url)
        return
      }
      setError(res?.error || 'No se pudo obtener la URL de Google')
    } catch (err) {
      const msg =
        err?.data?.error || err?.message || 'Error al conectar con Google'
      setError(msg)
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleDisconnectGoogle = async () => {
    try {
      setGoogleLoading(true)
      await productividadService.disconnectGoogle()
      setGoogleConnected(false)
      await loadAll()
    } catch (err) {
      setError(err?.message || 'Error al desconectar')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Productividad</h1>
        <p className="text-sm text-slate-500 mt-1">
          Captura, organiza y mide tu progreso diario con el método GTD + Google Calendar
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          {error}
          <button
            type="button"
            onClick={() => setError('')}
            className="ml-2 underline"
          >
            Cerrar
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <GoogleCalendarConnect
            connected={googleConnected}
            oauthConfigured={oauthConfigured}
            loading={googleLoading}
            onConnect={handleConnectGoogle}
            onDisconnect={handleDisconnectGoogle}
          />
          {!googleConnected && !oauthConfigured && (
            <GoogleOAuthSetupGuide
              redirectUri={oauthRedirectUri}
              onRetry={loadAll}
            />
          )}
        </div>
        <DailyProgress stats={stats} loading={loading} />
      </div>

      <CaptureInbox onCapture={handleCapture} disabled={saving} />

      {googleConnected && calendarEvents.length > 0 && (
        <div className="card">
          <div className="card-body">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">
              Eventos de hoy en Google Calendar
            </h3>
            <ul className="space-y-2">
              {calendarEvents.map((ev) => (
                <li
                  key={ev.id}
                  className="flex justify-between text-sm border-b border-slate-100 pb-2 last:border-0"
                >
                  <span className="font-medium text-slate-800">{ev.title}</span>
                  <span className="text-slate-500 text-xs">
                    {formatEventTime(ev.start, ev.end)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-center text-slate-500 py-12">Cargando tablero...</p>
      ) : (
        <TaskBoard
          tasks={tasks}
          onMove={handleMove}
          onComplete={handleComplete}
          onDelete={handleDelete}
          onSchedule={setScheduleTask}
        />
      )}

      <ScheduleTaskModal
        task={scheduleTask}
        isOpen={!!scheduleTask}
        onClose={() => setScheduleTask(null)}
        onSave={handleScheduleSave}
        googleConnected={googleConnected}
        onRequestConnect={handleConnectGoogle}
        saving={saving}
      />
    </div>
  )
}

function formatEventTime(start, end) {
  try {
    const s = new Date(start)
    const e = new Date(end)
    return `${s.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} – ${e.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`
  } catch {
    return ''
  }
}
