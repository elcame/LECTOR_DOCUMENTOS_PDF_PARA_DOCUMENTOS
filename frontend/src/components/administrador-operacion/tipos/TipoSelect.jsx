export default function TipoSelect({
  value = '',
  onChange,
  tipos = [],
  loading = false,
  disabled = false,
  allowEmpty = true,
  emptyLabel = 'Sin tipo',
  className = 'input w-full',
  currentLabel = '',
}) {
  const activeTipos = tipos.filter((t) => t.active !== false)
  const hasCurrent = Boolean(value) && !activeTipos.some((t) => t.id === value)

  return (
    <select
      className={className}
      value={value}
      disabled={disabled || loading}
      onChange={(e) => onChange?.(e.target.value)}
    >
      {allowEmpty && <option value="">{loading ? 'Cargando tipos...' : emptyLabel}</option>}
      {activeTipos.map((tipo) => (
        <option key={tipo.id} value={tipo.id}>
          {tipo.nombre}
        </option>
      ))}
      {hasCurrent && (
        <option value={value}>{currentLabel || 'Tipo actual (inactivo)'}</option>
      )}
    </select>
  )
}
