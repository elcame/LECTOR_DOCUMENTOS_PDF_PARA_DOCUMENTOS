import { TASK_PRIORITIES } from '../../config/constants'

const priorityMap = Object.fromEntries(TASK_PRIORITIES.map((p) => [p.id, p]))

export default function TaskCard({
  task,
  onMove,
  onComplete,
  onDelete,
  onSchedule,
  lists,
}) {
  const priority = priorityMap[task.priority] || priorityMap.medium
  const hasSchedule = task.scheduled_start && task.scheduled_end

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-900 flex-1">{task.title}</p>
        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${priority.color}`}>
          {priority.label}
        </span>
      </div>
      {task.notes && (
        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.notes}</p>
      )}
      {hasSchedule && (
        <p className="text-xs text-blue-600 mt-2">
          {formatSchedule(task.scheduled_start, task.scheduled_end)}
        </p>
      )}
      <div className="flex flex-wrap gap-1 mt-3">
        {lists
          .filter((l) => l.id !== task.list && l.id !== 'done')
          .map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => onMove(task.id, l.id)}
              className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
              title={`Mover a ${l.label}`}
            >
              {l.icon}
            </button>
          ))}
        {task.list !== 'done' && (
          <>
            <button
              type="button"
              onClick={() => onSchedule(task)}
              className="text-xs px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700"
            >
              Programar
            </button>
            <button
              type="button"
              onClick={() => onComplete(task.id)}
              className="text-xs px-2 py-1 rounded bg-green-50 hover:bg-green-100 text-green-700"
            >
              Hecho
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          className="text-xs px-2 py-1 rounded bg-red-50 hover:bg-red-100 text-red-600 ml-auto"
        >
          Eliminar
        </button>
      </div>
    </div>
  )
}

function formatSchedule(start, end) {
  try {
    const s = new Date(start)
    const e = new Date(end)
    return `${s.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })} – ${e.toLocaleTimeString('es-CO', { timeStyle: 'short' })}`
  } catch {
    return `${start} – ${end}`
  }
}
