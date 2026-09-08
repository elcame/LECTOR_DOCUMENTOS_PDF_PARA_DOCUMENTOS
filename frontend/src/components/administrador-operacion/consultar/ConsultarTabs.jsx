import { useState } from 'react'
import PDFList from '../../operaciones/PDFList/PDFList'
import ManifiestosTable from '../../operaciones/ManifiestosTable/ManifiestosTable'

export default function ConsultarTabs({ pdfs = [], folders = [], loading, onRefresh }) {
  const [tab, setTab] = useState('tabla')

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 border-b border-slate-200">
        <div className="flex gap-2">
          {[
            { id: 'tabla', label: 'Tabla' },
            { id: 'pdfs', label: 'PDFs' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`px-3 py-3 text-sm font-medium border-b-2 -mb-px ${
                tab === item.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="text-xs text-slate-500 py-2">
          {pdfs.length} PDF(s) · {folders.length} carpeta(s)
        </div>
      </div>
      <div className="p-4">
        {tab === 'tabla' ? (
          <ManifiestosTable folderName={null} />
        ) : (
          <PDFList pdfs={pdfs} folderName={null} loading={loading} onRefresh={onRefresh} />
        )}
      </div>
    </div>
  )
}
