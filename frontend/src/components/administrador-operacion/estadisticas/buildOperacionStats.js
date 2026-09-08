export function buildOperacionStats(overview) {
  const pdfs = overview?.pdfs || []
  const folders = overview?.folders || []
  const byFolder = [...folders].sort((a, b) => b.pdf_count - a.pdf_count)
  const recent = [...pdfs]
    .sort((a, b) => String(b.uploaded_at || '').localeCompare(String(a.uploaded_at || '')))
    .slice(0, 8)
  return {
    totalPdfs: pdfs.length,
    totalCarpetas: folders.length,
    topCarpetas: byFolder.slice(0, 10),
    recientes: recent,
  }
}
