# 🔥 Script de Inicialización de Firebase

## Descripción

Este script crea automáticamente las colecciones `roles` y `usuarios` en Firebase Firestore con datos iniciales.

## Requisitos

1. **Firebase configurado**: Debes tener un proyecto Firebase creado
2. **Credenciales**: Archivo `firebase-credentials.json` descargado desde Firebase Console
3. **Dependencias instaladas**: `firebase-admin` debe estar instalado

## Instalación de dependencias

```bash
# Activar entorno virtual (si usas uno)
venv\Scripts\activate  # Windows
# o
source venv/bin/activate  # Linux/Mac

# Instalar dependencias
pip install -r backend/requirements.txt
```

## Ubicación de credenciales

Coloca el archivo `firebase-credentials.json` en una de estas ubicaciones:
- `backend/app/config/firebase-credentials.json` (recomendado)
- `config/firebase-credentials.json`

## Ejecución

```bash
# Desde la raíz del proyecto
python scripts/init_firebase_collections.py
```

## Qué hace el script

1. ✅ Verifica que existan las credenciales de Firebase
2. ✅ Inicializa la conexión a Firebase
3. ✅ Crea la colección `roles` con 3 roles iniciales:
   - **admin**: Administrador con acceso completo
   - **conductor**: Conductor con acceso a manifiestos
   - **supervisor**: Supervisor con acceso a reportes
4. ✅ Crea la colección `usuarios` con un usuario administrador:
   - Usuario: `admin`
   - Email: `admin@example.com`
   - Contraseña: `admin123` ⚠️ **Cambiar en producción**

## Resultado

Después de ejecutar el script, tendrás:

- ✅ Colección `roles` con 3 roles predefinidos
- ✅ Colección `usuarios` con un usuario administrador
- ✅ Todo listo para usar desde el frontend o las APIs

## Verificar en Firebase Console

1. Ve a https://console.firebase.google.com/
2. Selecciona tu proyecto
3. Ve a **Firestore Database**
4. Verás las colecciones `roles` y `usuarios` creadas

## Solución de problemas

### Error: "ModuleNotFoundError: No module named 'firebase_admin'"
```bash
pip install firebase-admin
```

### Error: "Archivo de credenciales no encontrado"
- Descarga las credenciales desde Firebase Console
- Proyecto → Configuración → Cuentas de servicio
- Generar nueva clave privada
- Guarda el JSON como `firebase-credentials.json`

### Error: "Firebase no ha sido inicializado"
- Verifica que el archivo de credenciales sea válido
- Verifica que el proyecto de Firebase esté activo

## Notas importantes

⚠️ **Seguridad**: El usuario `admin` creado tiene contraseña por defecto. 
**Cámbiala inmediatamente en producción.**

🔒 **Permisos**: Asegúrate de configurar las reglas de seguridad en Firestore
para proteger tus datos.
