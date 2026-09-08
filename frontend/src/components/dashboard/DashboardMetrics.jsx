export default function DashboardMetrics({ totalPdfs = 0, totalCarpetas = 0 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="text-sm text-slate-500">PDFs en operación</div>
        <div className="text-3xl font-semibold text-slate-900 mt-1">{totalPdfs}</div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="text-sm text-slate-500">Carpetas</div>
        <div className="text-3xl font-semibold text-slate-900 mt-1">{totalCarpetas}</div>
      </div>
    </div>
  )
}
