"""
Repositorio base para operaciones con Firebase
"""
from typing import Dict, List, Optional, Any
from datetime import datetime
from google.cloud.firestore import Client, Query, FieldFilter
import sys
from pathlib import Path

# Agregar ruta raíz al path
ROOT_DIR = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))

try:
    from app.config.firebase_config import FirebaseConfig
except ImportError:
    # Fallback para cuando se ejecuta desde scripts
    from config.firebase_config import FirebaseConfig

class FirebaseRepository:
    """Clase base para repositorios de Firebase"""
    
    def __init__(self, collection_name: str):
        """
        Inicializa el repositorio
        
        Args:
            collection_name: Nombre de la colección en Firestore
        """
        self.collection_name = collection_name
        self._db: Optional[Client] = None
    
    @property
    def db(self) -> Client:
        """Obtiene la instancia de Firestore"""
        if self._db is None:
            self._db = FirebaseConfig.get_db()
        return self._db
    
    @property
    def collection(self):
        """Obtiene la referencia a la colección"""
        return self.db.collection(self.collection_name)
    
    def create(self, data: Dict[str, Any], doc_id: Optional[str] = None) -> str:
        """
        Crea un nuevo documento
        
        Args:
            data: Datos del documento
            doc_id: ID del documento (opcional, se genera automáticamente si no se proporciona)
        
        Returns:
            str: ID del documento creado
        """
        if 'created_at' not in data:
            data['created_at'] = datetime.now().isoformat()
        if 'updated_at' not in data:
            data['updated_at'] = datetime.now().isoformat()
        
        if doc_id:
            self.collection.document(doc_id).set(data)
            return doc_id
        else:
            doc_ref = self.collection.add(data)
            return doc_ref[1].id
    
    def get_by_id(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """
        Obtiene un documento por su ID
        
        Args:
            doc_id: ID del documento
        
        Returns:
            Dict con los datos del documento o None si no existe
        """
        doc = self.collection.document(doc_id).get()
        if doc.exists:
            data = doc.to_dict()
            data['id'] = doc.id
            return data
        return None
    
    def update(self, doc_id: str, data: Dict[str, Any]) -> bool:
        """
        Actualiza un documento
        
        Args:
            doc_id: ID del documento
            data: Datos a actualizar
        
        Returns:
            bool: True si se actualizó correctamente
        """
        try:
            data['updated_at'] = datetime.now().isoformat()
            self.collection.document(doc_id).update(data)
            return True
        except Exception as e:
            print(f"Error al actualizar documento {doc_id}: {e}")
            return False
    
    def delete(self, doc_id: str) -> bool:
        """
        Elimina un documento
        
        Args:
            doc_id: ID del documento
        
        Returns:
            bool: True si se eliminó correctamente
        """
        try:
            self.collection.document(doc_id).delete()
            return True
        except Exception as e:
            print(f"Error al eliminar documento {doc_id}: {e}")
            return False
    
    def get_all(self, filters: Optional[List[tuple]] = None, 
                order_by: Optional[str] = None, 
                limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Obtiene todos los documentos con filtros opcionales
        
        Args:
            filters: Lista de tuplas (campo, operador, valor) para filtrar
            order_by: Campo por el que ordenar
            limit: Límite de documentos a retornar
        
        Returns:
            Lista de documentos
        """
        query = self.collection
        
        # Aplicar filtros
        if filters:
            for field, operator, value in filters:
                query = query.where(filter=FieldFilter(field, operator, value))
        
        # Ordenar
        if order_by:
            query = query.order_by(order_by)
        
        # Limitar
        if limit:
            query = query.limit(limit)
        
        docs = query.stream()
        results = []
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            results.append(data)
        
        return results
    
    def find_one(self, filters: List[tuple]) -> Optional[Dict[str, Any]]:
        """
        Encuentra un documento que cumpla con los filtros
        
        Args:
            filters: Lista de tuplas (campo, operador, valor)
        
        Returns:
            Dict con los datos del documento o None si no existe
        """
        query = self.collection
        
        for field, operator, value in filters:
            query = query.where(filter=FieldFilter(field, operator, value))
        
        docs = list(query.limit(1).stream())
        if docs:
            data = docs[0].to_dict()
            data['id'] = docs[0].id
            return data
        return None
