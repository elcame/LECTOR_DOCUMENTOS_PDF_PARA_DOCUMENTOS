# 🚀 Cómo Ejecutar el Proyecto desde Terminal

## 📋 Requisitos Previos

1. **Python 3.8+** instalado
2. **Node.js y npm** instalados
3. **Entorno virtual** activado (si usas uno)

## 🔧 Backend (Flask API)

### ⚠️ IMPORTANTE: Siempre ejecutar desde la RAÍZ del proyecto

**NO ejecutes desde dentro de `backend/`** - esto causa el error `backend\backend\run.py`

### Opción 1: Usando script .bat (Windows) - RECOMENDADO 🎯

```powershell
# Doble clic o ejecutar desde terminal:
start_backend.bat
```

### Opción 2: Desde la raíz del proyecto (Manual) ⭐

```powershell
# 1. Asegúrate de estar en la RAÍZ del proyecto
cd "C:\Users\pc\LECTOR DE MANIFIESTOS"

# 2. Activar entorno virtual
venv\Scripts\activate

# 3. Ejecutar backend (desde la raíz)
python backend\run.py
```

### Opción 3: Usando script auxiliar (desde cualquier lugar)

```powershell
# Desde la raíz del proyecto:
python run_backend.py
```

### ❌ NO HACER: Ejecutar desde dentro de backend/

```powershell
# ❌ ESTO CAUSA ERROR:
cd backend
python backend\run.py  # Busca backend\backend\run.py ❌

# ✅ CORRECTO si estás en backend/:
cd backend
python run.py  # Sin "backend/" delante ✅
```

**El backend estará disponible en:** `http://localhost:5000`

---

## 🎨 Frontend (React)

### Desde la carpeta frontend

```powershell
# 1. Ir a frontend
cd frontend

# 2. Instalar dependencias (solo la primera vez)
npm install

# 3. Ejecutar servidor de desarrollo
npm run dev
```

**El frontend estará disponible en:** `http://localhost:5173`

---

## 🚀 Ejecutar Ambos Simultáneamente

Necesitas **2 terminales** abiertas:

### Terminal 1 - Backend:
```powershell
# Activar entorno virtual
venv\Scripts\activate

# Ejecutar backend
python backend/run.py
```

### Terminal 2 - Frontend:
```powershell
# Ir a frontend
cd frontend

# Ejecutar frontend
npm run dev
```

---

## ✅ Verificar que Funciona

### Backend:
```powershell
# Probar endpoint de autenticación
curl http://localhost:5000/api/auth/me

# O en PowerShell:
Invoke-WebRequest -Uri http://localhost:5000/api/auth/me
```

**Respuesta esperada:** Error 401 (requiere autenticación) - esto significa que el servidor funciona ✅

### Frontend:
Abre en el navegador: **http://localhost:5173**

---

## 📝 Comandos Rápidos

### Iniciar Backend:
```powershell
venv\Scripts\activate
python backend/run.py
```

### Iniciar Frontend:
```powershell
cd frontend
npm run dev
```

### Detener Servidores:
- Presiona `Ctrl+C` en cada terminal

---

## 🔍 Solución de Problemas

### ❌ Error: "can't open file 'backend\\backend\\run.py'"

**Causa:** Estás ejecutando `python backend\run.py` desde dentro de la carpeta `backend/`

**Solución:**
```powershell
# ❌ INCORRECTO (desde dentro de backend/):
cd backend
python backend\run.py  # Busca backend\backend\run.py ❌

# ✅ CORRECTO (desde la raíz):
cd "C:\Users\pc\LECTOR DE MANIFIESTOS"
python backend\run.py  # ✅

# O si ya estás en backend/:
cd backend
python run.py  # Sin "backend/" delante ✅
```

**Mejor solución:** Usa el script `.bat`:
```powershell
start_backend.bat
```

### Error: "No module named 'app'"
- Asegúrate de ejecutar desde la raíz del proyecto: `python backend\run.py`
- Verifica que el entorno virtual esté activado: `venv\Scripts\activate`

### Error: "ModuleNotFoundError"
- Instala dependencias: `pip install -r backend\requirements.txt`
- Asegúrate de tener el entorno virtual activado

### Error: "Cannot find module"
- En frontend, ejecuta: `npm install`

### Puerto 5000 ocupado
- Cambia el puerto en `backend/run.py` o `backend/app/main.py`

### Puerto 5173 ocupado
- Vite usará automáticamente el siguiente puerto disponible (5174, 5175, etc.)

---

## 🎯 Credenciales Iniciales

- **Usuario**: `admin`
- **Contraseña**: `admin123`
- **Email**: `admin@example.com`

⚠️ **Importante**: Cambia la contraseña en producción.

---

## 📚 Estructura de URLs

### Backend APIs:
- `http://localhost:5000/api/auth/*` - Autenticación
- `http://localhost:5000/api/roles` - Roles
- `http://localhost:5000/api/usuarios-firebase` - Usuarios Firebase
- `http://localhost:5000/api/manifiestos/*` - Manifiestos
- `http://localhost:5000/api/operaciones/*` - Operaciones
- `http://localhost:5000/api/gastos/*` - Gastos

### Frontend:
- `http://localhost:5173` - Aplicación React

---

¡Listo para desarrollar! 🎉
