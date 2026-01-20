/**
 * Endpoints centralizados de la API
 */
export const ENDPOINTS = {
  // Autenticación
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },
  
  // Manifiestos
  MANIFIESTOS: {
    FOLDERS: '/manifiestos/folders',
    OVERVIEW: '/manifiestos/overview',
    FOLDER_DELETE: (folderName) => `/manifiestos/folders/${folderName}`,
    UPLOAD_FOLDER: '/manifiestos/upload_folder',
    PROCESS_FOLDER: '/manifiestos/process_folder',
    PDFS: '/manifiestos/pdfs',
    PDF_PAGES: (filename) => `/manifiestos/pdf/${filename}/pages`,
    PDF_THUMBNAIL: (filename) => `/manifiestos/pdf/${filename}/thumbnail`,
    PDF_MERGE: '/manifiestos/pdf/merge',
    PDF_DELETE: '/manifiestos/pdf/delete',
    STORAGE_STATS: '/manifiestos/storage-stats',
    UPDATE_FIELD: '/manifiestos/update_field',
    ARCHIVOS_QR: '/manifiestos/archivos_qr',
    UPDATE_QR_FIELD: '/manifiestos/update_qr_field',
    PROCESS_FOLDER_QR: '/manifiestos/process_folder_qr',
  },
  
  // Operaciones
  OPERACIONES: {
    BASE: '/operaciones',
    BY_MONTH: (mes) => `/operaciones/${mes}`,
    MANIFIESTOS_DISPONIBLES: '/operaciones/manifiestos_disponibles',
  },
  
  // Gastos
  GASTOS: {
    VIAJES: '/gastos/viajes',
    VIAJE_BY_ID: (id) => `/gastos/viajes/${id}`,
    ADICIONALES: '/gastos/adicionales',
    DESTINOS_TARIFAS: '/gastos/destinos-tarifas',
    RESUMEN_PAGOS: '/gastos/resumen-pagos',
    PAGOS_CONDUCTOR: (conductor) => `/gastos/pagos-conductor/${conductor}`,
    PAGOS_ACTUALIZAR: '/gastos/pagos-actualizar',
  },
  
  // Usuarios
  USUARIOS: {
    BASE: '/usuarios',
    BY_USERNAME: (username) => `/usuarios/${username}`,
    ROL: (username) => `/usuarios/${username}/rol`,
    CONDUCTORES: '/usuarios/conductores',
    ASIGNAR_PLACA: '/usuarios/asignar_placa',
    PLACAS_DISPONIBLES: '/usuarios/placas_disponibles',
  },
  
  // Roles
  ROLES: {
    BASE: '/roles',
    BY_NAME: (name) => `/roles/${name}`,
    PERMISSIONS: (name) => `/roles/${name}/permissions`,
  },
  
  // Usuarios Firebase
  USUARIOS_FIREBASE: {
    BASE: '/usuarios-firebase',
    BY_USERNAME: (username) => `/usuarios-firebase/${username}`,
    ROLE: (username) => `/usuarios-firebase/${username}/role`,
    BY_ROLE: (roleId) => `/usuarios-firebase/by-role/${roleId}`,
  },
}
