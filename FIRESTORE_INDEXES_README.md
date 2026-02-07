# Índices Compuestos de Firestore

## ⚠️ Problema
Si recibes un error como este:
```
Error: The query requires an index. You can create it here: https://console.firebase.google.com/...
```

Significa que necesitas crear índices compuestos en Firestore para que las consultas funcionen correctamente.

## 🚀 Solución Rápida (Recomendada)

### Opción 1: Usar el enlace del error
1. **Copia el enlace completo** que aparece en el error
2. **Pégalo en tu navegador** y presiona Enter
3. **Haz click en "Crear índice"** en la consola de Firebase
4. **Espera 2-5 minutos** a que el índice se construya
5. **Recarga la página** de tu aplicación

### Opción 2: Usar Firebase CLI (Automático)

```bash
# 1. Instala Firebase CLI (si no lo tienes)
npm install -g firebase-tools

# 2. Inicia sesión
firebase login

# 3. Inicializa el proyecto (solo la primera vez)
firebase init firestore

# 4. Despliega los índices
firebase deploy --only firestore:indexes
```

## 📋 Índices Requeridos

### Índice 1: Manifiestos por usuario
**Colección:** `manifiestos`
- `active` (Ascending)
- `username` (Ascending)
- `fecha_procesamiento` (Ascending)

### Índice 2: Manifiestos por usuario y carpeta
**Colección:** `manifiestos`
- `active` (Ascending)
- `username` (Ascending)
- `folder_name` (Ascending)
- `fecha_procesamiento` (Ascending)

### Índice 3: PDFs por usuario y carpeta
**Colección:** `pdfs`
- `username` (Ascending)
- `folder_name` (Ascending)

## 🛠️ Crear Índices Manualmente

Si prefieres crear los índices manualmente en la consola de Firebase:

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: **almacenamiento-acr**
3. Ve a **Firestore Database** > **Indexes** (Índices)
4. Haz click en **"Create Index"** (Crear índice)
5. Configura cada índice según la tabla de arriba
6. Haz click en **"Create"** (Crear)
7. Espera a que el estado cambie de "Building" a "Enabled"

## 📝 Script de Ayuda

Ejecuta este script para ver instrucciones detalladas:

```bash
python scripts/create_firestore_indexes.py
```

## ⏱️ Tiempo de Construcción

- Los índices simples tardan **1-2 minutos**
- Los índices compuestos pueden tardar **2-5 minutos**
- Si tienes muchos datos, puede tardar más

## ✅ Verificar que Funcionan

Después de crear los índices:

1. Espera 2-5 minutos
2. Recarga tu aplicación
3. Intenta acceder a la tabla de manifiestos
4. Si aún ves el error, espera un poco más

## 🔗 Enlaces Útiles

- [Documentación de Índices de Firestore](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Firebase Console](https://console.firebase.google.com/project/almacenamiento-acr/firestore/indexes)

## 💡 Nota Importante

Los índices **solo necesitan crearse una vez**. Una vez que están activos, funcionarán para todas las consultas futuras.
