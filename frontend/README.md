# Frontend - Lector de Manifiestos

Frontend desarrollado con React, Vite y Tailwind CSS siguiendo una estructura de producción.

## 🚀 Inicio Rápido

### Instalación

```bash
npm install
```

### Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

### Build de Producción

```bash
npm run build
```

### Preview del Build

```bash
npm run preview
```

## 📁 Estructura del Proyecto

```
frontend/
├── src/
│   ├── api/              # Configuración de API y endpoints
│   ├── assets/           # Recursos estáticos (imágenes, iconos)
│   ├── components/        # Componentes reutilizables
│   │   ├── common/       # Componentes comunes (Button, Input, Modal, etc.)
│   │   ├── layout/       # Componentes de layout
│   │   └── forms/        # Componentes de formularios
│   ├── config/           # Configuración y constantes
│   ├── context/          # Context API (Auth, Theme, etc.)
│   ├── hooks/            # Custom hooks
│   ├── pages/            # Páginas/Vistas
│   ├── services/         # Servicios de API
│   ├── styles/           # Estilos CSS modulares
│   │   ├── variables.css # Variables CSS
│   │   ├── components.css # Componentes Tailwind
│   │   ├── utilities.css  # Utilidades personalizadas
│   │   └── index.css     # Estilos principales
│   └── utils/            # Utilidades (validation, format, etc.)
├── public/               # Archivos públicos
└── package.json
```

## 🎨 Sistema de Estilos

El proyecto utiliza un sistema de CSS modular con:

- **Variables CSS**: Colores, espaciado, tipografía, etc.
- **Componentes Tailwind**: Clases reutilizables para componentes comunes
- **Utilidades**: Animaciones, scrollbar personalizado, etc.

### Uso de Estilos

```jsx
// Usar clases de componentes
<button className="btn btn-primary btn-md">Click me</button>

// Usar clases de utilidades
<div className="card">Contenido</div>

// Usar clases de Tailwind directamente
<div className="flex items-center justify-center">Centrado</div>
```

## 🔧 Configuración

### Variables de Entorno

Copia `.env.example` a `.env.development` y configura:

```env
VITE_API_URL=http://localhost:5000/api
VITE_API_TIMEOUT=30000
VITE_APP_NAME=Lector de Manifiestos
```

### Aliases de Importación

El proyecto está configurado con aliases para imports más limpios:

```jsx
import Button from '@components/common/Button/Button'
import { useForm } from '@hooks/useForm'
import { formatCurrency } from '@utils/format'
import { ROUTES } from '@config/constants'
```

## 📦 Componentes Principales

### Button

```jsx
<Button 
  variant="primary" 
  size="md" 
  loading={isLoading}
  onClick={handleClick}
>
  Enviar
</Button>
```

### Input

```jsx
<Input
  label="Email"
  name="email"
  type="email"
  value={values.email}
  onChange={handleChange}
  onBlur={handleBlur}
  error={errors.email}
  required
/>
```

### Modal

```jsx
<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Título del Modal"
  size="md"
>
  Contenido del modal
</Modal>
```

## 🪝 Hooks Personalizados

### useForm

Hook para manejo de formularios con validación:

```jsx
const { values, errors, handleChange, handleSubmit } = useForm(
  { email: '', password: '' },
  {
    email: [validators.required, validators.email],
    password: [validators.required, validators.minLength(6)],
  }
)
```

### useApi

Hook para manejar llamadas a la API:

```jsx
const { data, loading, error, execute } = useApi(apiService.getData)

// Ejecutar
await execute(params)
```

### useLocalStorage

Hook para manejar localStorage de forma reactiva:

```jsx
const [value, setValue, removeValue] = useLocalStorage('key', 'default')
```

## 🔌 Servicios de API

Todos los servicios utilizan el cliente API centralizado:

```jsx
import { authService } from '@services/authService'

await authService.login(username, password)
```

## 🛠️ Scripts Disponibles

- `npm run dev` - Inicia servidor de desarrollo
- `npm run build` - Build de producción
- `npm run build:prod` - Build optimizado para producción
- `npm run preview` - Preview del build
- `npm run lint` - Ejecutar ESLint
- `npm run lint:fix` - Corregir errores de ESLint
- `npm run format` - Formatear código con Prettier
- `npm run format:check` - Verificar formato

## 📝 Convenciones

- **Componentes**: PascalCase (ej: `Button.jsx`)
- **Hooks**: camelCase con prefijo `use` (ej: `useForm.js`)
- **Utilidades**: camelCase (ej: `errorHandler.js`)
- **Constantes**: UPPER_SNAKE_CASE (ej: `API_CONFIG`)

## 🚀 Próximos Pasos

- [ ] Agregar tests unitarios
- [ ] Implementar lazy loading de rutas
- [ ] Agregar Storybook para componentes
- [ ] Configurar CI/CD
- [ ] Optimizar bundle size
