# Guía de Despliegue - Lector de Manifiestos

Esta guía te ayudará a desplegar tu aplicación en internet de forma **GRATUITA** con almacenamiento persistente.

## 🎯 Opciones Recomendadas (Gratuitas)

### 1. **Railway** ⭐ (RECOMENDADO)
**Ventajas:**
- ✅ Almacenamiento persistente GRATIS
- ✅ Fácil de configurar
- ✅ Despliegue automático desde GitHub
- ✅ $5 de crédito gratis al mes (suficiente para uso moderado)

**Pasos:**
1. Crear cuenta en [railway.app](https://railway.app)
2. Conectar tu repositorio de GitHub
3. Railway detectará automáticamente el `railway.json`
4. La aplicación se desplegará automáticamente
5. Los archivos se guardarán en `/data` (almacenamiento persistente)

**Configuración:**
- No requiere configuración adicional
- El archivo `railway.json` ya está configurado
- Los archivos se guardan automáticamente en almacenamiento persistente

---

### 2. **Fly.io** ⭐ (ALTERNATIVA EXCELENTE)
**Ventajas:**
- ✅ Volúmenes persistentes GRATIS (3GB)
- ✅ Muy rápido
- ✅ Escalable

**Pasos:**
1. Instalar Fly CLI:
   ```bash
   # Windows (PowerShell)
   iwr https://fly.io/install.ps1 -useb | iex
   ```
2. Crear cuenta: `fly auth signup`
3. Inicializar proyecto:
   ```bash
   fly launch
   ```
4. Crear volumen persistente:
   ```bash
   fly volumes create data_volume --size 3 --region iad
   ```
5. Desplegar:
   ```bash
   fly deploy
   ```

**Nota:** El archivo `fly.toml` ya está configurado con el volumen persistente.

---

### 3. **PythonAnywhere** (Opción Simple)
**Ventajas:**
- ✅ Gratis para aplicaciones web básicas
- ✅ Almacenamiento persistente incluido
- ✅ Muy fácil de usar

**Pasos:**
1. Crear cuenta en [pythonanywhere.com](https://www.pythonanywhere.com)
2. Subir tu código (vía Git o interfaz web)
3. Configurar aplicación web
4. Los archivos se guardan en tu directorio de usuario

**Limitaciones:**
- Solo 1 aplicación web en el plan gratuito
- Debe renovarse manualmente cada 3 meses

---

## 📋 Preparación del Proyecto

### 1. Subir a GitHub (si no lo has hecho)

```bash
# Inicializar repositorio
git init
git add .
git commit -m "Preparado para despliegue"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git push -u origin main
```

### 2. Verificar archivos necesarios

Asegúrate de tener estos archivos en tu proyecto:
- ✅ `Procfile` - Para Railway/Heroku
- ✅ `Dockerfile` - Para despliegue con Docker
- ✅ `requirements.txt` - Con todas las dependencias
- ✅ `railway.json` - Configuración de Railway
- ✅ `fly.toml` - Configuración de Fly.io
- ✅ `.gitignore` - Para excluir archivos innecesarios

---

## 🔧 Variables de Entorno

Las siguientes variables de entorno están configuradas automáticamente, pero puedes personalizarlas:

- `STORAGE_TYPE`: Tipo de almacenamiento (`local` por defecto)
- `BASE_FOLDER`: Carpeta para manifiestos (`MANIFIESTOS`)
- `EXCEL_FOLDER`: Carpeta para Excel (`EXCEL`)
- `DATA_FOLDER`: Carpeta para datos JSON (`data`)
- `PORT`: Puerto de la aplicación (se configura automáticamente)
- `HOST`: Host de la aplicación (`0.0.0.0` en producción)

---

## 🚀 Despliegue Rápido en Railway

### Opción A: Desde GitHub (Recomendado)

1. **Sube tu código a GitHub**
   ```bash
   git add .
   git commit -m "Listo para producción"
   git push origin main
   ```

2. **En Railway:**
   - Ve a [railway.app](https://railway.app)
   - Click en "New Project"
   - Selecciona "Deploy from GitHub repo"
   - Elige tu repositorio
   - Railway detectará automáticamente que es una app Python
   - La aplicación se desplegará automáticamente

3. **Configurar dominio (opcional):**
   - En el dashboard de Railway, ve a "Settings"
   - Click en "Generate Domain"
   - Tu app estará disponible en `tu-app.railway.app`

### Opción B: Desde CLI

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Inicializar proyecto
railway init

# Desplegar
railway up
```

---

## 📁 Almacenamiento Persistente

### Cómo Funciona

El módulo `modules/storage.py` maneja automáticamente el almacenamiento:

- **En Railway/Fly.io**: Usa `/data` (almacenamiento persistente)
- **En desarrollo local**: Usa el directorio actual
- **Los archivos se guardan automáticamente** en la ubicación correcta

### Estructura de Carpetas

```
/data (o directorio actual)
├── MANIFIESTOS/
│   └── [nombre_carpeta]/
│       └── *.pdf
├── EXCEL/
│   └── manifiestos_*.xlsx
└── data/
    └── *.json
```

---

## 🔍 Verificar que Funciona

Después del despliegue:

1. **Accede a tu aplicación** en la URL proporcionada
2. **Sube algunos PDFs** de prueba
3. **Verifica que se procesen correctamente**
4. **Descarga el Excel generado**
5. **Recarga la página** - los archivos deben seguir ahí (almacenamiento persistente)

---

## 🐛 Solución de Problemas

### Error: "No se puede crear carpeta"
- Verifica que el almacenamiento persistente esté configurado
- En Railway, asegúrate de que el servicio tenga permisos de escritura

### Error: "Puerto no disponible"
- Railway y Fly.io configuran el puerto automáticamente
- Verifica que `app.py` use `os.environ.get('PORT', 5000)`

### Los archivos se pierden al reiniciar
- Esto significa que no estás usando almacenamiento persistente
- En Railway: Verifica que estés usando el servicio correcto
- En Fly.io: Asegúrate de que el volumen esté montado correctamente

---

## 💰 Costos

### Railway
- **Gratis**: $5 de crédito al mes
- **Suficiente para**: ~500 horas de uso al mes
- **Si necesitas más**: $5/mes por servicio adicional

### Fly.io
- **Gratis**: 3GB de almacenamiento, 3 máquinas compartidas
- **Suficiente para**: Uso moderado
- **Si necesitas más**: Planes desde $1.94/mes

### PythonAnywhere
- **Gratis**: 1 aplicación web, renovación manual cada 3 meses
- **Suficiente para**: Uso básico
- **Si necesitas más**: Planes desde $5/mes

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en el dashboard de tu plataforma
2. Verifica que todos los archivos estén en el repositorio
3. Asegúrate de que `requirements.txt` tenga todas las dependencias

---

## ✅ Checklist de Despliegue

- [ ] Código subido a GitHub
- [ ] `requirements.txt` actualizado con `gunicorn`
- [ ] `Procfile` creado
- [ ] `railway.json` o `fly.toml` configurado
- [ ] Variables de entorno configuradas (si es necesario)
- [ ] Aplicación desplegada
- [ ] Prueba de subida de archivos
- [ ] Verificación de almacenamiento persistente
- [ ] Dominio personalizado configurado (opcional)

---

¡Listo! Tu aplicación debería estar funcionando en internet con almacenamiento persistente. 🎉

