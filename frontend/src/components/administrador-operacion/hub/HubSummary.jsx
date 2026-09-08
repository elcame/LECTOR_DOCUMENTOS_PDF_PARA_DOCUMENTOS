export default function HubSummary({ totalPdfs = 0, totalCarpetas = 0, usedMb = 0 }) {
  const items = [
    { label: 'PDFs', value: totalPdfs },
    { label: 'Carpetas', value: totalCarpetas },
    { label: 'Almacenamiento', value: `${Number(usedMb).toFixed(1)} MB` },
  ]
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-sm text-slate-500">{item.label}</div>
          <div className="text-2xl font-semibold text-slate-900 mt-1">{item.value}</div>
        </div>
      ))}
    </div>
  )
}
