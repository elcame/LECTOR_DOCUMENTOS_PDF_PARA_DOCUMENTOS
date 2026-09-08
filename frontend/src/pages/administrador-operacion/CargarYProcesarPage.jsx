import CargaWizard from '../../components/administrador-operacion/carga/CargaWizard'

export default function CargarYProcesarPage() {
  return (
    <div className="space-y-5">
      <header className="max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          Operación
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Cargar y procesar
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Elige o crea una carpeta, sube los PDFs y procesa. Al terminar verás el resumen de manifiestos.
        </p>
      </header>
      <CargaWizard />
    </div>
  )
}
