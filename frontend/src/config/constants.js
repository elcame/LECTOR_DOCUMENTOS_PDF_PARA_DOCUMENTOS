export const API_CONFIG = {
 BASE_URL: (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000') + '/api',
  TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
}

export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || 'Administración de Operaciones',
  VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
}

export const ROUTES = {
  LANDING: '/landing',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  MANIFIESTOS: '/manifiestos',
  OPERACIONES: '/operaciones',
  CARROS: '/carros',
  ADMINISTRADOR: '/administrador',
  PROVEEDORES: '/proveedores',
  ROLES: '/roles',
  USUARIOS_FIREBASE: '/usuarios-firebase',
  GPS_TRACKING: '/gps',
  PRODUCTIVIDAD: '/productividad',
}

export const GTD_LISTS = [
  { id: 'inbox', label: 'Inbox', icon: '📥' },
  { id: 'today', label: 'Hoy', icon: '☀️' },
  { id: 'next', label: 'Próximo', icon: '⏭️' },
  { id: 'someday', label: 'Algún día', icon: '🌤️' },
  { id: 'done', label: 'Hecho', icon: '✅' },
]

export const TASK_PRIORITIES = [
  { id: 'low', label: 'Baja', color: 'bg-slate-100 text-slate-700' },
  { id: 'medium', label: 'Media', color: 'bg-blue-100 text-blue-800' },
  { id: 'high', label: 'Alta', color: 'bg-amber-100 text-amber-800' },
  { id: 'urgent', label: 'Urgente', color: 'bg-red-100 text-red-800' },
]

export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  EMPRESARIAL: 'empresarial',
  CONDUCTOR: 'conductor',
}

export const ADMIN_ROLE_IDS = [USER_ROLES.SUPER_ADMIN, USER_ROLES.EMPRESARIAL]

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  THEME: 'theme',
}
