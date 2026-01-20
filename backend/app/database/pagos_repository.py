"""
Repositorio para operaciones con pagos a conductores en Firebase
"""
from typing import Optional, Dict, List
from .firebase_repository import FirebaseRepository

class PagosRepository(FirebaseRepository):
    """Repositorio para gestión de pagos a conductores"""
    
    def __init__(self):
        super().__init__('pagos_conductores')
    
    def save_pago(self, carpeta_original: str, numero_manifiesto: str,
                 placa: str = '', conductor: str = '', valor_total: float = 0,
                 anticipo: float = 0, saldo: float = 0, fecha_pago: str = '',
                 estado: str = 'pendiente', observaciones: str = '') -> bool:
        """
        Guarda o actualiza un pago a conductor
        
        Args:
            carpeta_original: Carpeta original
            numero_manifiesto: Número del manifiesto
            placa: Placa del vehículo
            conductor: Nombre del conductor
            valor_total: Valor total
            anticipo: Anticipo
            saldo: Saldo
            fecha_pago: Fecha de pago
            estado: Estado del pago (pendiente/pagado)
            observaciones: Observaciones
        
        Returns:
            bool: True si se guardó correctamente
        """
        try:
            # Crear ID único
            doc_id = f"{carpeta_original}_{numero_manifiesto}".replace('/', '_').replace('\\', '_')
            
            data = {
                'carpeta_original': carpeta_original,
                'numero_manifiesto': numero_manifiesto,
                'placa': placa,
                'conductor': conductor,
                'valor_total': valor_total,
                'anticipo': anticipo,
                'saldo': saldo,
                'fecha_pago': fecha_pago,
                'estado': estado,
                'observaciones': observaciones
            }
            
            existing = self.get_by_id(doc_id)
            if existing:
                self.update(doc_id, data)
            else:
                self.create(data, doc_id=doc_id)
            
            return True
        except Exception as e:
            print(f"Error al guardar pago: {e}")
            return False
    
    def get_pagos(self, carpeta_original: Optional[str] = None,
                 numero_manifiesto: Optional[str] = None,
                 estado: Optional[str] = None) -> List[Dict]:
        """
        Obtiene pagos con filtros opcionales
        
        Args:
            carpeta_original: Carpeta original (opcional)
            numero_manifiesto: Número de manifiesto (opcional)
            estado: Estado del pago (opcional)
        
        Returns:
            Lista de pagos
        """
        try:
            filters = []
            
            if carpeta_original:
                filters.append(('carpeta_original', '==', carpeta_original))
            if numero_manifiesto:
                filters.append(('numero_manifiesto', '==', numero_manifiesto))
            if estado:
                filters.append(('estado', '==', estado))
            
            results = self.get_all(filters=filters if filters else None, order_by='numero_manifiesto')
            return results
        except Exception as e:
            print(f"Error al obtener pagos: {e}")
            return []
    
    def update_pago_estado(self, carpeta_original: str, numero_manifiesto: str,
                          estado: str, fecha_pago: str = '') -> bool:
        """
        Actualiza el estado de un pago
        
        Args:
            carpeta_original: Carpeta original
            numero_manifiesto: Número del manifiesto
            estado: Nuevo estado
            fecha_pago: Fecha de pago (opcional)
        
        Returns:
            bool: True si se actualizó correctamente
        """
        try:
            doc_id = f"{carpeta_original}_{numero_manifiesto}".replace('/', '_').replace('\\', '_')
            data = {'estado': estado}
            if fecha_pago:
                data['fecha_pago'] = fecha_pago
            
            return self.update(doc_id, data)
        except Exception as e:
            print(f"Error al actualizar estado de pago: {e}")
            return False
