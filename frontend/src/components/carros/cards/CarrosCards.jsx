import FlotaBayGrid from '../flota/FlotaBayGrid'

/** @deprecated Prefer FlotaBayGrid — se mantiene por compatibilidad. */
export default function CarrosCards({ carros = [] }) {
  return <FlotaBayGrid carros={carros} />
}
