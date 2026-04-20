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
    UPLOAD_FILE: '/manifiestos/upload_file',
    PROCESS_FOLDER: '/manifiestos/process_folder',
    PDFS: '/manifiestos/pdfs',
    PDF_PAGES: (filename) => `/manifiestos/pdf/${filename}/pages`,
    PDF_THUMBNAIL: (filename) => `/manifiestos/pdf/${filename}/thumbnail`,
    PDF_DOWNLOAD: (filename) => `/manifiestos/pdf/${filename}/download`,
    PDF_MERGE: '/manifiestos/pdf/merge',
    PDF_DELETE: '/manifiestos/pdf/delete',
    PDF_DELETE_PAGES: '/manifiestos/pdf/delete-pages',
    PDF_SPLIT: '/manifiestos/pdf/split',
    PDF_RENAME: '/manifiestos/pdf/rename',
    PDF_BULK_RENAME: '/manifiestos/pdf/bulk-rename',
    DOWNLOAD_FOLDER_ZIP: '/manifiestos/download_folder_zip',
    DOWNLOAD_EXCEL: '/manifiestos/download_excel',
    STORAGE_STATS: '/manifiestos/storage-stats',
    UPDATE_FIELD: '/manifiestos/update_field',
    ARCHIVOS_QR: '/manifiestos/archivos_qr',
    UPDATE_QR_FIELD: '/manifiestos/update_qr_field',
    PROCESS_FOLDER_QR: '/manifiestos/process_folder_qr',
    MANIFIESTOS_DATA: '/manifiestos/manifiestos_data',
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
    CARRO: (username) => `/usuarios-firebase/${username}/carro`,
    BY_ROLE: (roleId) => `/usuarios-firebase/by-role/${roleId}`,
    CONDUCTORES_WITH_CARROS: '/usuarios-firebase/conductores-with-carros',
  },
  
  // Gastos de viaje y tipos de gastos
  EXPENSES: {
    TYPES: '/expenses/expense-types',
    TYPE_BY_ID: (typeId) => `/expenses/expense-types/${typeId}`,
    INITIALIZE_TYPES: '/expenses/expense-types/initialize',
    TRIP_EXPENSES: '/expenses/trip-expenses',
    TRIP_EXPENSE_BY_ID: (expenseId) => `/expenses/trip-expenses/${expenseId}`,
    TOTAL_EXPENSES: (manifestId) => `/expenses/trip-expenses/total/${manifestId}`,
  },

  // Hojas de gasto (plantillas)
  EXPENSE_SHEETS: {
    BASE: '/expense-sheets',
    BY_ID: (sheetId) => `/expense-sheets/${sheetId}`,
    APPLY: '/expense-sheets/apply',
  },

  // Carros y propietarios
  CARROS: {
    BASE: '/carros',
    BY_ID: (id) => `/carros/${id}`,
  },
  PROPIETARIOS: {
    BASE: '/propietarios',
    BY_ID: (id) => `/propietarios/${id}`,
  },

  // GPS Tracking
  GPS: {
    DEVICES: '/gps/devices',
    DEVICE_BY_IMEI: (imei) => `/gps/devices/${imei}`,
    LOCATION: (imei) => `/gps/location/${imei}`,
    LOCATION_ALL: '/gps/location/all',
    HISTORY: (imei) => `/gps/history/${imei}`,
    SERVER_STATUS: '/gps/server/status',
    SERVER_START: '/gps/server/start',
    SERVER_STOP: '/gps/server/stop',
    CLEANUP: '/gps/cleanup',
  },
}
