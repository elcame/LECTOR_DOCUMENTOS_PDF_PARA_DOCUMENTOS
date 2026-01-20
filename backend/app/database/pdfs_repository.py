"""
Repositorio para operaciones con PDFs en Firebase
"""
from typing import Optional, Dict, List
from .firebase_repository import FirebaseRepository

class PDFsRepository(FirebaseRepository):
    """Repositorio para gestión de PDFs subidos"""
    
    def __init__(self):
        super().__init__('pdfs')
    
    def create_pdf_record(self, username: str, folder_name: str, filename: str, 
                         file_path: str, file_size: int = 0, 
                         metadata: Dict = None, total_pages: int = None) -> bool:
        """
        Crea un registro de PDF subido.
        
        Args:
            username: Nombre de usuario
            folder_name: Nombre de la carpeta
            filename: Nombre del archivo
            file_path: Ruta del archivo en el servidor
            file_size: Tamaño del archivo en bytes
            metadata: Metadatos adicionales
            total_pages: Número de páginas del PDF (evita get_pdf_pages en el frontend)
        
        Returns:
            bool: True si se creó correctamente
        """
        try:
            # ID único: username_folder_filename
            doc_id = f"{username}_{folder_name}_{filename}".replace('/', '_').replace('\\', '_')
            
            meta = metadata or {}
            pages = total_pages if total_pages is not None else meta.get('total_pages')
            
            data = {
                'username': username.lower(),
                'folder_name': folder_name,
                'filename': filename,
                'file_path': file_path,
                'file_size': file_size,
                'metadata': meta,
                'uploaded_at': self._get_timestamp(),
                'processed': False,
                'active': True
            }
            if pages is not None:
                data['total_pages'] = int(pages)
            
            self.create(data, doc_id=doc_id)
            return True
        except Exception as e:
            print(f"Error al crear registro de PDF: {e}")
            return False
    
    def get_pdfs_by_folder(self, username: str, folder_name: str) -> List[Dict]:
        """
        Obtiene todos los PDFs de una carpeta
        
        Args:
            username: Nombre de usuario
            folder_name: Nombre de la carpeta
        
        Returns:
            Lista de PDFs
        """
        try:
            # Intentar usar FieldFilter (nuevo formato) para evitar warnings
            try:
                from google.cloud.firestore import FieldFilter
                query = self.collection.where(filter=FieldFilter('username', '==', username.lower()))\
                                       .where(filter=FieldFilter('folder_name', '==', folder_name))\
                                       .where(filter=FieldFilter('active', '==', True))
            except (ImportError, AttributeError):
                # Fallback: usar método tradicional (puede generar warnings pero funciona)
                query = self.collection.where('username', '==', username.lower())\
                                       .where('folder_name', '==', folder_name)\
                                       .where('active', '==', True)
            
            # No usar order_by para evitar necesidad de índices compuestos
            # Ordenar en memoria después
            docs = query.stream()
            pdfs = [{'id': doc.id, **doc.to_dict()} for doc in docs]
            # Ordenar por uploaded_at en memoria
            pdfs.sort(key=lambda x: x.get('uploaded_at', ''))
            return pdfs
        except Exception as e:
            print(f"Error al obtener PDFs por carpeta: {e}")
            return []
    
    def get_pdfs_by_username(self, username: str) -> List[Dict]:
        """
        Obtiene todos los PDFs de un usuario (1 lectura Firestore).
        
        Args:
            username: Nombre de usuario
        
        Returns:
            Lista de PDFs
        """
        try:
            try:
                from google.cloud.firestore import FieldFilter
                query = self.collection.where(filter=FieldFilter('username', '==', username.lower()))\
                                       .where(filter=FieldFilter('active', '==', True))
            except (ImportError, AttributeError):
                query = self.collection.where('username', '==', username.lower())\
                                       .where('active', '==', True)
            
            docs = query.stream()
            pdfs = [{'id': doc.id, **doc.to_dict()} for doc in docs]
            pdfs = [p for p in pdfs if p.get('active', False)]
            pdfs.sort(key=lambda x: x.get('uploaded_at', ''), reverse=True)
            return pdfs
        except Exception as e:
            print(f"Error al obtener PDFs por usuario: {e}")
            return []

    def get_folders_summary(self, username: str) -> List[Dict]:
        """
        Obtiene resumen de carpetas (nombre y conteo) con 1 sola lectura Firestore.
        Agrupa los PDFs del usuario por folder_name.
        
        Args:
            username: Nombre de usuario
        
        Returns:
            Lista de {name, pdf_count}
        """
        try:
            pdfs = self.get_pdfs_by_username(username)
            by_folder = {}
            for p in pdfs:
                fn = p.get('folder_name') or 'Sin carpeta'
                by_folder[fn] = by_folder.get(fn, 0) + 1
            return [{'name': k, 'pdf_count': v} for k, v in sorted(by_folder.items(), key=lambda x: -x[1])]
        except Exception as e:
            print(f"Error en get_folders_summary: {e}")
            return []
    
    def mark_as_processed(self, username: str, folder_name: str, filename: str) -> bool:
        """
        Marca un PDF como procesado
        
        Args:
            username: Nombre de usuario
            folder_name: Nombre de la carpeta
            filename: Nombre del archivo
        
        Returns:
            bool: True si se actualizó correctamente
        """
        try:
            doc_id = f"{username}_{folder_name}_{filename}".replace('/', '_').replace('\\', '_')
            return self.update(doc_id, {
                'processed': True,
                'processed_at': self._get_timestamp()
            })
        except Exception as e:
            print(f"Error al marcar PDF como procesado: {e}")
            return False
    
    def delete_pdf_record(self, username: str, folder_name: str, filename: str) -> bool:
        """
        Elimina un registro de PDF (soft delete)
        
        Args:
            username: Nombre de usuario
            folder_name: Nombre de la carpeta
            filename: Nombre del archivo
        
        Returns:
            bool: True si se eliminó correctamente
        """
        try:
            doc_id = f"{username}_{folder_name}_{filename}".replace('/', '_').replace('\\', '_')
            return self.update(doc_id, {'active': False})
        except Exception as e:
            print(f"Error al eliminar registro de PDF: {e}")
            return False
    
    def soft_delete_pdf(self, username: str, folder_name: str, filename: str) -> bool:
        """
        Alias de delete_pdf_record para mayor claridad
        """
        return self.delete_pdf_record(username, folder_name, filename)
    
    def _get_timestamp(self) -> str:
        """Obtiene timestamp actual en formato ISO"""
        from datetime import datetime
        return datetime.now().isoformat()
