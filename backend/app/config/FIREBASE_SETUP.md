# 🔥 Configuración de Firebase

## Pasos para configurar Firebase

### 1. Crear un proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Agregar proyecto"
3. Ingresa un nombre para tu proyecto
4. Sigue los pasos para crear el proyecto

### 2. Obtener las credenciales de servicio

1. En Firebase Console, ve a **Configuración del proyecto** (ícono de engranaje)
2. Ve a la pestaña **Cuentas de servicio**
3. Haz clic en **Generar nueva clave privada**
4. Se descargará un archivo JSON con las credenciales
5. **Guarda este archivo** como `firebase-credentials.json` en la carpeta `config/`

### 3. Habilitar Firestore Database

1. En Firebase Console, ve a **Firestore Database**
2. Haz clic en **Crear base de datos**
3. Selecciona **Modo de producción** (o modo de prueba para desarrollo)
4. Elige una ubicación para tu base de datos
5. Haz clic en **Habilitar**

### 4. Configurar reglas de seguridad (opcional para desarrollo)

Para desarrollo, puedes usar estas reglas temporales:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**⚠️ IMPORTANTE:** Estas reglas permiten acceso completo a usuarios autenticados. Para producción, configura reglas más restrictivas.

### 5. Configurar variables de entorno (opcional)

Puedes configurar las siguientes variables de entorno:

```bash
export FIREBASE_CREDENTIALS_PATH="config/firebase-credentials.json"
export FIREBASE_PROJECT_ID="tu-proyecto-id"
```

### 6. Estructura de colecciones en Firestore

El sistema creará automáticamente las siguientes colecciones:

- **users**: Usuarios del sistema
- **qr_data**: Datos extraídos de códigos QR
- **gastos_viajes**: Gastos de viajes
- **pagos_conductores**: Pagos a conductores

### 7. Verificar la configuración

Una vez configurado, al iniciar la aplicación deberías ver:

```
✓ Firebase inicializado correctamente
```

Si ves un error, verifica:
- Que el archivo `firebase-credentials.json` existe en `config/`
- Que las credenciales son válidas
- Que Firestore está habilitado en tu proyecto
