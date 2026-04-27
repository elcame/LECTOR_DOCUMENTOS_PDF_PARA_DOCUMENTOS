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
}

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
