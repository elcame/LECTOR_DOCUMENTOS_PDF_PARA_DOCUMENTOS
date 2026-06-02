import { GTD_LISTS } from '../../config/constants'
import TaskCard from './TaskCard'

export default function TaskBoard({
  tasks,
  onMove,
  onComplete,
  onDelete,
  onSchedule,
}) {
  const byList = GTD_LISTS.reduce((acc, list) => {
    acc[list.id] = tasks.filter((t) => t.list === list.id)
    return acc
  }, {})

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
      {GTD_LISTS.map((list) => (
        <div key={list.id} className="flex flex-col min-h-[200px]">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-sm font-semibold text-slate-800">
              {list.icon} {list.label}
            </h3>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {byList[list.id]?.length || 0}
            </span>
          </div>
          <div className="flex-1 space-y-2 rounded-xl bg-slate-50/80 border border-slate-100 p-2 min-h-[120px]">
            {(byList[list.id] || []).length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Sin tareas</p>
            ) : (
              byList[list.id].map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  lists={GTD_LISTS}
                  onMove={onMove}
                  onComplete={onComplete}
                  onDelete={onDelete}
                  onSchedule={onSchedule}
                />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

