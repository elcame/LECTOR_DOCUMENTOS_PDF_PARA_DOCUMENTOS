import { buildOperacionStats } from './buildOperacionStats'

export default function OperacionStats({ overview }) {
  const stats = buildOperacionStats(overview)
  const maxCount = stats.topCarpetas[0]?.pdf_count || 1

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-sm text-slate-500">Total PDFs</div>
          <div className="text-3xl font-semibold text-slate-900 mt-1">{stats.totalPdfs}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-sm text-slate-500">Carpetas</div>
          <div className="text-3xl font-semibold text-slate-900 mt-1">{stats.totalCarpetas}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">PDFs por carpeta</h3>
        <div className="space-y-3">
          {stats.topCarpetas.map((folder) => (
            <div key={folder.name}>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span className="truncate pr-2">{folder.name}</span>
                <span className="font-medium">{folder.pdf_count}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-blue-600"
                  style={{ width: `${Math.max(4, (folder.pdf_count / maxCount) * 100)}%` }}
                />
              </div>
            </div>
          ))}
          {stats.topCarpetas.length === 0 && <p className="text-sm text-slate-500">Sin carpetas</p>}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Actividad reciente</h3>
        <ul className="divide-y divide-slate-100">
          {stats.recientes.map((pdf, idx) => (
            <li key={`${pdf.filename}-${idx}`} className="py-2 flex justify-between gap-3 text-sm">
              <span className="truncate text-slate-800">{pdf.filename}</span>
              <span className="text-xs text-slate-500 whitespace-nowrap">{pdf.folder_name}</span>
            </li>
          ))}
          {stats.recientes.length === 0 && <li className="text-sm text-slate-500">Sin archivos recientes</li>}
        </ul>
      </div>
    </div>
  )
}
