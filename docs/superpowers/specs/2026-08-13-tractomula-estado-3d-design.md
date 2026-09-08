# Estado digital de tractomula (Carros 3D)

Fecha: 2026-08-13

## Objetivo

En **Carros**, cada vehículo tiene una tarjeta. Al abrirla, un modelo 3D de tractomula (tipo Kenworth de capó largo) muestra el estado de llantas y piezas: **tiempo desde el último cambio**, km opcionales, e **historial** al registrar un recambio.

## Decisiones

- Tarjetas por vehículo (placa + modelo). La tabla y propietarios actuales se mantienen debajo.
- Vista 3D real con órbita (Three.js): el usuario arrastra para girar y ver ambos lados, frente y duales.
- Estado = tiempo calendario desde `installed_at`. El kilometraje al instalar es opcional.
- Un recambio no borra el pasado: se cierra la pieza activa y se crea una nueva.
- Catálogo fijo de posiciones. Lo que no tenga malla 3D en un momento dado sigue en el panel y se engancha después al mismo `position_id`.
- Color en el 3D es guía, no bloquea: verde menos de 6 meses, ámbar de 6 a 18 meses, rojo más de 18 meses. Sin pieza activa: gris.

## Navegación

| Control | Destino |
| --- | --- |
| Página Carros | `/carros` |
| Ficha 3D del vehículo | `/carros/:id/estado` |

Visible con el mismo permiso que Carros hoy (`requireAdmin` / no conductor).

## Uso

1. En `/carros`, grid de tarjetas (placa destacada, modelo y propietario si existe).
2. Clic en tarjeta → `/carros/:id/estado`.
3. Izquierda: viewport 3D (órbita, zoom). Clic en una malla selecciona la posición.
4. Derecha: panel con nombre de la pieza, tiempo transcurrido, km si hay, historial corto y formulario **Registrar cambio** (fecha obligatoria, km opcional).
5. Posiciones sin malla aparecen como filas en el mismo panel.

## Posiciones (`position_id`)

Lado `L` = izquierdo del vehículo, `R` = derecho. Duales: `O` = externa, `I` = interna.

| position_id | Pieza |
| --- | --- |
| TIRE_L_STEER / TIRE_R_STEER | Llantas de dirección |
| RIM_L_STEER / RIM_R_STEER | Rines de dirección |
| TIRE_L_D1_O, TIRE_L_D1_I, TIRE_R_D1_O, TIRE_R_D1_I | Llantas eje tracción 1 |
| RIM_L_D1_O, RIM_L_D1_I, RIM_R_D1_O, RIM_R_D1_I | Rines eje tracción 1 |
| TIRE_L_D2_O, TIRE_L_D2_I, TIRE_R_D2_O, TIRE_R_D2_I | Llantas eje tracción 2 |
| RIM_L_D2_O, RIM_L_D2_I, RIM_R_D2_O, RIM_R_D2_I | Rines eje tracción 2 |
| TANK | Tanque de combustible |
| LIGHT_L / LIGHT_R | Luces delanteras |
| EXHAUST | Escape |
| MIRROR_L / MIRROR_R | Espejos |
| BATTERY_1 / BATTERY_2 | Baterías |
| OIL_FILTER | Filtro de aceite |
| BANDA_{eje}_{lado}_{UP\|DOWN} | Bandas: solo tracción 1 y 2 × 2 lados × arriba/abajo (el de dirección no lleva) |
| BANDA_SPRING_{eje}_{lado}_{UP\|DOWN} | Resorte de cada banda |
| RODAJA_1 / RODAJA_2 | Rodajas en el tren/chasis |
| TIRE_SPARE | Repuesto (panel; malla si entra en el modelo) |

Si “bandas” o “rodajas” no coinciden con la pieza real, se mueve el punto 3D; el `position_id` no cambia.

## Datos

Colección Firestore `carro_piezas`:

| Campo | Uso |
| --- | --- |
| username | Dueño de los datos |
| carro_id | Vehículo |
| position_id | Del catálogo |
| part_kind | `llanta`, `rin`, `tanque`, `luz`, `escape`, `espejo`, `bateria`, `filtro_aceite`, `banda`, `resorte_banda`, `rodaja` |
| installed_at | Fecha de instalación (ISO fecha) |
| km_installed | Número o vacío |
| active | `true` si está puesta ahora |
| removed_at | Fecha de retiro (solo inactivas) |
| km_removed | Opcional al retirar |

Al cambiar: `active=false`, `removed_at` (y `km_removed` si viene), luego un documento nuevo `active=true` en la misma posición.

## API

Prefijo `/api/carros/<carro_id>/piezas`.

| Método | Ruta | Uso |
| --- | --- | --- |
| GET | `/piezas` | Activas + catálogo; query `history=true` para historial de una posición |
| POST | `/piezas` | Primera colocación (`position_id`, `installed_at`, `km_installed`) |
| POST | `/piezas/cambio` | Cierra la activa y crea la nueva |

Solo el usuario dueño del carro. Validar que `carro_id` exista y `position_id` esté en el catálogo.

## Frontend (carpetas)

- `frontend/src/pages/carros/CarrosPage.jsx` — tarjetas + tablas
- `frontend/src/pages/carros/CarroEstadoPage.jsx` — ficha 3D
- `frontend/src/components/carros/cards/` — tarjetas
- `frontend/src/components/carros/tractomula-3d/` — escena Three.js, órbita, mapeo malla → `position_id`
- `frontend/src/components/carros/piezas/` — panel, formulario, catálogo JS
- `frontend/src/services/carrosPiezasService.js`

`pages/Carros.jsx` reexporta o redirige a `CarrosPage`.

## 3D

- Three.js + OrbitControls (rotar horizontal, zoom; polar limitado para no meterse bajo el piso).
- Modelo GLB de tractomula convencional (capó largo, tanque, tandem dual). Mallas con los `position_id` del catálogo.
- Clic en malla = selección. El color de la malla sigue la guía de tiempo de la pieza activa.
- Sin modelo descargable de Kenworth de marca: se usa un GLB genérico de tractomula convencional texturizado en blanco/cromo, no la foto como escena.

## Fuera de alcance

- No se sustituye el módulo Trailer (llantas de trailer siguen aparte).
- No hay alertas automáticas ni umbrales configurables en esta versión (solo el color guía).
- No hay compra de repuestos ni inventario de almacén: solo lo puesto en el vehículo.
