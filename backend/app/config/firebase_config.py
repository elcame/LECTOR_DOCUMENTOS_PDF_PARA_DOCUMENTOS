"""
Configuración de Firebase
"""
import os
from typing import Optional, Any
import firebase_admin
from firebase_admin import credentials, firestore, auth, storage

class FirebaseConfig:
    """Configuración y conexión a Firebase"""
    
    _db: Optional[firestore.Client] = None
    _bucket: Optional[Any] = None  # storage.Bucket no está disponible como tipo
    _storage_bucket_name: Optional[str] = None  # Nombre del bucket guardado durante inicialización
    _initialized: bool = False
    
    @classmethod
    def initialize(cls, credentials_path: Optional[str] = None, project_id: Optional[str] = None, storage_bucket: Optional[str] = None):
        """
        Inicializa Firebase Admin SDK
        
        Args:
            credentials_path: Ruta al archivo JSON de credenciales de Firebase
            project_id: ID del proyecto de Firebase (opcional si está en las credenciales)
            storage_bucket: Nombre del bucket de Storage (opcional, por defecto {project_id}.appspot.com)
        """
        if cls._initialized:
            return
        
        try:
            # Leer project_id de las credenciales si está disponible
            if credentials_path and os.path.exists(credentials_path):
                import json
                with open(credentials_path, 'r') as f:
                    cred_data = json.load(f)
                    project_id = project_id or cred_data.get('project_id')
                    # Si no se proporciona storage_bucket, usar el por defecto
                    if not storage_bucket and project_id:
                        storage_bucket = f"{project_id}.appspot.com"
            
            if credentials_path and os.path.exists(credentials_path):
                # Usar archivo de credenciales
                cred = credentials.Certificate(credentials_path)
                app_options = {'projectId': project_id} if project_id else {}
                if storage_bucket:
                    app_options['storageBucket'] = storage_bucket
                firebase_admin.initialize_app(cred, app_options if app_options else None)
            else:
                # Usar credenciales por defecto (variables de entorno o Application Default Credentials)
                app_options = {}
                if project_id:
                    app_options['projectId'] = project_id
                if storage_bucket:
                    app_options['storageBucket'] = storage_bucket
                firebase_admin.initialize_app(app_options if app_options else None)
            
            cls._db = firestore.client()
            # Guardar el nombre del bucket para usarlo después
            cls._storage_bucket_name = storage_bucket
            cls._initialized = True
            print("[OK] Firebase inicializado correctamente")
            if storage_bucket:
                print(f"[OK] Firebase Storage bucket: {storage_bucket}")
        except Exception as e:
            print(f"[ERROR] Error al inicializar Firebase: {e}")
            raise
    
    @classmethod
    def get_db(cls) -> firestore.Client:
        """
        Obtiene la instancia de Firestore
        
        Returns:
            firestore.Client: Cliente de Firestore
        """
        if not cls._initialized:
            raise RuntimeError("Firebase no ha sido inicializado. Llama a FirebaseConfig.initialize() primero.")
        
        if cls._db is None:
            cls._db = firestore.client()
        
        return cls._db
    
    @classmethod
    def get_auth(cls):
        """
        Obtiene la instancia de Firebase Auth
        
        Returns:
            auth: Cliente de Firebase Auth
        """
        if not cls._initialized:
            raise RuntimeError("Firebase no ha sido inicializado. Llama a FirebaseConfig.initialize() primero.")
        
        return auth
    
    @classmethod
    def get_storage_bucket(cls) -> Any:
        """
        Obtiene el bucket de Firebase Storage
        
        Returns:
            Bucket de Firebase Storage
        """
        if not cls._initialized:
            raise RuntimeError("Firebase no ha sido inicializado. Llama a FirebaseConfig.initialize() primero.")
        
        if cls._bucket is None:
            try:
                bucket_name = None
                
                # Usar el nombre del bucket guardado durante la inicialización
                if cls._storage_bucket_name:
                    bucket_name = cls._storage_bucket_name
                else:
                    # Fallback: intentar obtener del proyecto
                    app = firebase_admin.get_app()
                    if app.project_id:
                        bucket_name = f"{app.project_id}.appspot.com"
                
                if bucket_name:
                    cls._bucket = storage.bucket(bucket_name)
                    print(f"[OK] Usando bucket de Storage: {bucket_name}")
                else:
                    # Último recurso: intentar obtener el bucket por defecto
                    cls._bucket = storage.bucket()
                    print("[OK] Usando bucket de Storage por defecto")
            except Exception as e:
                raise RuntimeError(f"No se pudo obtener el bucket de Storage: {e}")
        
        return cls._bucket