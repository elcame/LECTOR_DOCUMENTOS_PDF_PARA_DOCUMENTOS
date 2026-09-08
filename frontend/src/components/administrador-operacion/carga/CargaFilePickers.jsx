function PickerButton({ children, icon, onFiles }) {
  return (
    <label className="group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-6 text-center transition hover:border-slate-400 hover:bg-white">
      <input
        type="file"
        accept=".pdf"
        multiple
        {...(icon === 'folder' ? { webkitdirectory: '', directory: '' } : {})}
        className="hidden"
        onChange={(e) => onFiles(Array.from(e.target.files || []))}
      />
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 transition group-hover:ring-slate-300">
        {icon === 'folder' ? (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6M7 4h7l5 5v11a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z" />
          </svg>
        )}
      </span>
      <span className="text-sm font-semibold text-slate-800">{children}</span>
      <span className="text-[11px] text-slate-500">
        {icon === 'folder' ? 'Elige una carpeta del equipo' : 'Uno o varios archivos PDF'}
      </span>
    </label>
  )
}

export default function CargaFilePickers({ onFiles }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <PickerButton icon="folder" onFiles={onFiles}>
        Seleccionar carpeta
      </PickerButton>
      <PickerButton icon="files" onFiles={onFiles}>
        Seleccionar PDFs
      </PickerButton>
    </div>
  )
}
