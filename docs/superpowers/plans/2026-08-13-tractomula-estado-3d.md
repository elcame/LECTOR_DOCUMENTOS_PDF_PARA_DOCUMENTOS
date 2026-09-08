# Tractomula estado 3D Implementation Plan

> **For agentic workers:** Execute inline in this session. Do not commit unless the user asks. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tarjetas en Carros y ficha 3D orbitable por vehículo, con piezas clicables, tiempo, km opcional e historial de cambios.

**Architecture:** Catálogo fijo de `position_id`. Firestore `carro_piezas` (activa + historial). API bajo `/api/carros/<id>/piezas`. Frontend: R3F/Three.js con mallas nombradas, panel de pieza, tarjetas.

**Tech Stack:** Flask, Firestore, React 18, Vite, three, @react-three/fiber, @react-three/drei.

## Global Constraints

- Fecha de instalación obligatoria; km opcional.
- Color: verde &lt; 6 meses, ámbar 6–18, rojo &gt; 18, gris sin pieza.
- Duales en ejes de tracción (externa + interna por lado).
- Sin commits salvo que el usuario lo pida.
- Separar por carpetas (`cards`, `tractomula-3d`, `piezas`).

## Files

- Create: `backend/app/database/carro_piezas_catalog.py`
- Create: `backend/app/database/carro_piezas_repository.py`
- Create: `backend/app/api/carro_piezas.py`
- Modify: `backend/app/api/carros.py` (GET por id)
- Modify: `backend/app/__init__.py`
- Create: `frontend/src/components/carros/piezas/piezasCatalog.js`
- Create: `frontend/src/components/carros/piezas/piezaAge.js`
- Create: `frontend/src/components/carros/piezas/PiezaPanel.jsx`
- Create: `frontend/src/components/carros/piezas/RegistrarCambioForm.jsx`
- Create: `frontend/src/components/carros/cards/CarrosCards.jsx`
- Create: `frontend/src/components/carros/tractomula-3d/TractomulaModel.jsx`
- Create: `frontend/src/components/carros/tractomula-3d/TractomulaViewport.jsx`
- Create: `frontend/src/services/carrosPiezasService.js`
- Create: `frontend/src/pages/carros/CarrosPage.jsx`
- Create: `frontend/src/pages/carros/CarroEstadoPage.jsx`
- Modify: `frontend/src/pages/Carros.jsx`, `App.jsx`, `constants.js`, `endpoints.js`, `AppShell.jsx`, `carrosService.js`, `package.json`

### Task 1: Catálogo + API piezas + GET carro
### Task 2: Servicio frontend + panel + tarjetas + páginas
### Task 3: Modelo 3D clicable con órbita
### Task 4: Rutas, dependencias y verificación local
