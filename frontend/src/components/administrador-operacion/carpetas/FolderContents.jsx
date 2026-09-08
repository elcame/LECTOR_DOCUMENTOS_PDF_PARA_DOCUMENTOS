import { useState } from 'react'
import PDFList from '../../operaciones/PDFList/PDFList'
import ManifiestosTable from '../../operaciones/ManifiestosTable/ManifiestosTable'

export default function FolderContents({ folderName, pdfs = [], loading, onRefresh, tableRefresh = 0 }) {
  const [tab, setTab] = useState('pdfs')
  if (!folderName) return null

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex gap-2 border-b border-slate-200 px-4">
        {['pdfs', 'manifiestos'].map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-3 py-3 text-sm font-medium border-b-2 -mb-px ${
              tab === id ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500'
            }`}
          >
            {id === 'pdfs' ? 'PDFs' : 'Manifiestos'}
          </button>
        ))}
      </div>
      <div className="p-4">
        {tab === 'pdfs' ? (
          <PDFList pdfs={pdfs} folderName={folderName} loading={loading} onRefresh={onRefresh} />
        ) : (
          <ManifiestosTable folderName={folderName} refreshTrigger={tableRefresh} />
        )}
      </div>
    </div>
  )
}
