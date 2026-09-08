export const BUILTIN_RENAME_PATTERNS = [
  { value: '{load_id}_{remesa}', label: 'Load ID + Remesa', example: 'L123456_KBQ789' },
  { value: '{load_id}', label: 'Solo Load ID', example: 'L123456' },
  { value: '{remesa}', label: 'Solo Remesa', example: 'KBQ789' },
  { value: '{placa}_{load_id}', label: 'Placa + Load ID', example: 'ABC123_L123456' },
  { value: '{origen}_{destino}_{load_id}', label: 'Origen + Destino + Load ID', example: 'Bogota_Cali_L123456' },
  { value: '{fecha_liquidacion}_{load_id}', label: 'Fecha + Load ID', example: '2026-01-20_L123456' },
  { value: '{empresa}_{load_id}', label: 'Empresa + Load ID', example: 'EMPRESA_L123456' },
]

export const RENAME_VARIABLES = [
  '{load_id}',
  '{remesa}',
  '{placa}',
  '{origen}',
  '{destino}',
  '{empresa}',
  '{fecha_liquidacion}',
]
