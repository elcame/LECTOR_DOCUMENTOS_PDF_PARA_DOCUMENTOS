# Google Calendar OAuth (módulo Productividad)

## 1. Google Cloud Console (proyecto `almacenamiento-acr`)

1. Habilitar **Google Calendar API**: APIs y servicios → Biblioteca → Google Calendar API → Habilitar.
2. Pantalla de consentimiento OAuth: APIs y servicios → Pantalla de consentimiento OAuth.
3. Credenciales → Crear credenciales → **ID de cliente de OAuth 2.0** → Aplicación web.

**URIs de redirección autorizados:**

- `http://localhost:5000/api/productividad/google/callback`
- `https://lector-manifiestos-backend-321363176600.us-central1.run.app/api/productividad/google/callback`

**Orígenes JavaScript autorizados (opcional para flujo solo backend):**

- `http://localhost:5173`
- `https://almacenamiento-acr.web.app`

## 2. Configuración local (elige una opción)

### Opción A — archivo `.env`

Edita `backend/.env`:

```env
GOOGLE_OAUTH_CLIENT_ID=123456789-xxxx.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-xxxxxxxx
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:5000/api/productividad/google/callback
FRONTEND_URL=http://localhost:5173
```

### Opción B — archivo JSON (recomendado)

1. En Google Console → Credenciales → tu cliente OAuth → **Descargar JSON**.
2. Guárdalo como: `backend/app/config/google-oauth-client.json`
3. En ese JSON, en `redirect_uris`, debe estar:
   `http://localhost:5000/api/productividad/google/callback`
4. Reinicia el backend. Deberías ver: `[OK] Google Calendar OAuth configurado`

Plantilla: `backend/app/config/google-oauth-client.example.json`

## 3. Variables en Cloud Run

Ver `backend/.env.example`. En Cloud Run:

```bash
gcloud run services update lector-manifiestos-backend \
  --region us-central1 \
  --set-env-vars "GOOGLE_OAUTH_CLIENT_ID=xxx,GOOGLE_OAUTH_CLIENT_SECRET=xxx,GOOGLE_OAUTH_REDIRECT_URI=https://lector-manifiestos-backend-321363176600.us-central1.run.app/api/productividad/google/callback,FRONTEND_URL=https://almacenamiento-acr.web.app"
```

## 3. Scope

`https://www.googleapis.com/auth/calendar.events`
