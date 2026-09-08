"""Catálogo fijo de posiciones de la tractomula."""

_AXLES = [
    ('D1', 'tracción 1'),
    ('D2', 'tracción 2'),
]
_SIDES = [('L', 'izquierda'), ('R', 'derecha')]
_HEIGHTS = [('UP', 'arriba'), ('DOWN', 'abajo')]


def _banda_positions():
    items = {}
    for axle_id, axle_label in _AXLES:
        for side_id, side_label in _SIDES:
            for height_id, height_label in _HEIGHTS:
                banda_id = f'BANDA_{axle_id}_{side_id}_{height_id}'
                spring_id = f'BANDA_SPRING_{axle_id}_{side_id}_{height_id}'
                items[banda_id] = {
                    'label': f'Banda {axle_label} {side_label} {height_label}',
                    'part_kind': 'banda',
                    'in_model': True,
                }
                items[spring_id] = {
                    'label': f'Resorte banda {axle_label} {side_label} {height_label}',
                    'part_kind': 'resorte_banda',
                    'in_model': True,
                }
    return items


POSITIONS = {
    'TIRE_L_STEER': {'label': 'Llanta dirección izquierda', 'part_kind': 'llanta', 'in_model': True},
    'TIRE_R_STEER': {'label': 'Llanta dirección derecha', 'part_kind': 'llanta', 'in_model': True},
    'RIM_L_STEER': {'label': 'Rin dirección izquierda', 'part_kind': 'rin', 'in_model': True},
    'RIM_R_STEER': {'label': 'Rin dirección derecha', 'part_kind': 'rin', 'in_model': True},
    'TIRE_L_D1_O': {'label': 'Llanta tracción 1 izquierda externa', 'part_kind': 'llanta', 'in_model': True},
    'TIRE_L_D1_I': {'label': 'Llanta tracción 1 izquierda interna', 'part_kind': 'llanta', 'in_model': True},
    'TIRE_R_D1_O': {'label': 'Llanta tracción 1 derecha externa', 'part_kind': 'llanta', 'in_model': True},
    'TIRE_R_D1_I': {'label': 'Llanta tracción 1 derecha interna', 'part_kind': 'llanta', 'in_model': True},
    'RIM_L_D1_O': {'label': 'Rin tracción 1 izquierda externa', 'part_kind': 'rin', 'in_model': True},
    'RIM_L_D1_I': {'label': 'Rin tracción 1 izquierda interna', 'part_kind': 'rin', 'in_model': True},
    'RIM_R_D1_O': {'label': 'Rin tracción 1 derecha externa', 'part_kind': 'rin', 'in_model': True},
    'RIM_R_D1_I': {'label': 'Rin tracción 1 derecha interna', 'part_kind': 'rin', 'in_model': True},
    'TIRE_L_D2_O': {'label': 'Llanta tracción 2 izquierda externa', 'part_kind': 'llanta', 'in_model': True},
    'TIRE_L_D2_I': {'label': 'Llanta tracción 2 izquierda interna', 'part_kind': 'llanta', 'in_model': True},
    'TIRE_R_D2_O': {'label': 'Llanta tracción 2 derecha externa', 'part_kind': 'llanta', 'in_model': True},
    'TIRE_R_D2_I': {'label': 'Llanta tracción 2 derecha interna', 'part_kind': 'llanta', 'in_model': True},
    'RIM_L_D2_O': {'label': 'Rin tracción 2 izquierda externa', 'part_kind': 'rin', 'in_model': True},
    'RIM_L_D2_I': {'label': 'Rin tracción 2 izquierda interna', 'part_kind': 'rin', 'in_model': True},
    'RIM_R_D2_O': {'label': 'Rin tracción 2 derecha externa', 'part_kind': 'rin', 'in_model': True},
    'RIM_R_D2_I': {'label': 'Rin tracción 2 derecha interna', 'part_kind': 'rin', 'in_model': True},
    'TANK': {'label': 'Tanque de combustible', 'part_kind': 'tanque', 'in_model': True},
    'LIGHT_L': {'label': 'Luz delantera izquierda', 'part_kind': 'luz', 'in_model': True},
    'LIGHT_R': {'label': 'Luz delantera derecha', 'part_kind': 'luz', 'in_model': True},
    'EXHAUST': {'label': 'Escape', 'part_kind': 'escape', 'in_model': True},
    'MIRROR_L': {'label': 'Espejo izquierdo', 'part_kind': 'espejo', 'in_model': True},
    'MIRROR_R': {'label': 'Espejo derecho', 'part_kind': 'espejo', 'in_model': True},
    'BATTERY_1': {'label': 'Batería 1', 'part_kind': 'bateria', 'in_model': True},
    'BATTERY_2': {'label': 'Batería 2', 'part_kind': 'bateria', 'in_model': True},
    'OIL_FILTER': {'label': 'Filtro de aceite', 'part_kind': 'filtro_aceite', 'in_model': True},
    **_banda_positions(),
    'RODAJA_1': {'label': 'Rodaja 1', 'part_kind': 'rodaja', 'in_model': True},
    'RODAJA_2': {'label': 'Rodaja 2', 'part_kind': 'rodaja', 'in_model': True},
    'TIRE_SPARE': {'label': 'Llanta de repuesto', 'part_kind': 'llanta', 'in_model': True},
}


def catalog_list():
    return [
        {'position_id': key, **meta}
        for key, meta in POSITIONS.items()
    ]
