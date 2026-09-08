/** Clases compartidas para tablas en tono garage (oscuro). */
export function garageTableTone(dark, { compact = false } = {}) {
  const tableMin = compact ? 'min-w-[700px]' : 'min-w-[900px]'
  if (!dark) {
    return {
      title: 'text-sm font-semibold text-slate-900',
      subtitle: 'text-xs text-slate-500',
      error: 'rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-xs',
      table: `${tableMin} w-full text-sm divide-y divide-slate-200`,
      thead: 'bg-slate-50 sticky top-0 z-10',
      th: 'px-3 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide',
      thCenter: 'px-3 py-2 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wide',
      tbody: 'bg-white divide-y divide-slate-100',
      row: (odd) => `${odd ? 'bg-slate-50/40' : 'bg-white'} hover:bg-blue-50/40`,
      rowEdit: (odd) => `${odd ? 'bg-slate-50/40' : 'bg-white'} border-l-2 border-blue-500`,
      rowNew: 'bg-blue-50/40',
      cellStrong: 'px-3 py-2 whitespace-nowrap text-sm font-medium text-slate-900',
      cell: 'px-3 py-2 whitespace-nowrap text-xs text-slate-700',
      cellPad: 'px-3 py-2 whitespace-nowrap',
      input: 'input input-sm w-full',
      btnPrimary:
        'inline-flex items-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-500/15 px-3 py-1.5 text-xs font-medium text-sky-800 hover:bg-sky-500/25',
      btnSecondary:
        'inline-flex items-center gap-1.5 rounded-lg border border-emerald-600/30 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100',
      badgeOn: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      badgeOff: 'bg-slate-50 text-slate-600 border border-slate-200',
      iconEdit: 'p-1.5 rounded-full hover:bg-slate-100 text-slate-500 mr-1',
      iconDelete: 'p-1.5 rounded-full hover:bg-rose-50 text-rose-500',
      linkSave: 'text-emerald-600 hover:text-emerald-800 mr-2',
      linkCancel: 'text-slate-500 hover:text-slate-700',
      tableWrap: 'overflow-x-auto rounded-xl border border-slate-200',
    }
  }

  return {
    title: 'text-sm font-semibold text-slate-100',
    subtitle: 'text-xs text-slate-400',
    error: 'rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-2 text-xs text-red-200',
    table: `${tableMin} w-full text-sm divide-y divide-white/[0.08]`,
    thead: 'sticky top-0 z-10 bg-[#121a2b]',
    th: 'px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500',
    thCenter: 'px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500',
    tbody: 'divide-y divide-white/[0.06] bg-transparent',
    row: (odd) => `${odd ? 'bg-white/[0.03]' : 'bg-transparent'} hover:bg-white/[0.06]`,
    rowEdit: (odd) => `${odd ? 'bg-white/[0.04]' : 'bg-sky-500/10'} border-l-2 border-sky-400`,
    rowNew: 'bg-sky-500/10',
    cellStrong: 'px-3 py-2 whitespace-nowrap text-sm font-medium tracking-wide text-slate-100',
    cell: 'px-3 py-2 whitespace-nowrap text-xs text-slate-400',
    cellPad: 'px-3 py-2 whitespace-nowrap',
    input:
      'w-full rounded-md border border-white/10 bg-black/30 px-2 py-1.5 text-xs text-slate-100 outline-none [color-scheme:dark] placeholder:text-slate-500 focus:border-sky-400/50',
    btnPrimary:
      'inline-flex items-center gap-1.5 rounded-lg border border-sky-400/35 bg-sky-500/15 px-3 py-1.5 text-xs font-medium text-sky-200 transition hover:bg-sky-500/25 hover:text-sky-100',
    btnSecondary:
      'inline-flex items-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/[0.08]',
    badgeOn: 'border border-emerald-400/25 bg-emerald-500/15 text-emerald-300',
    badgeOff: 'border border-white/10 bg-white/5 text-slate-400',
    iconEdit: 'mr-1 rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-slate-100',
    iconDelete: 'rounded-lg p-1.5 text-rose-400/80 hover:bg-rose-500/15 hover:text-rose-300',
    linkSave: 'mr-2 text-emerald-400 hover:text-emerald-300',
    linkCancel: 'text-slate-400 hover:text-slate-200',
    tableWrap: 'overflow-x-auto rounded-xl border border-white/[0.08]',
  }
}
