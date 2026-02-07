"""
Repositorio para gestionar gastos de viaje en Firestore
"""
from typing import List, Dict, Optional
from datetime import datetime
from .firebase_repository import FirebaseRepository

class TripExpensesRepository(FirebaseRepository):
    """Repositorio para gastos de viaje"""
    
    def __init__(self):
        super().__init__('trip_expenses')
    
    def get_expenses_by_manifest(self, manifest_id: str) -> List[Dict]:
        """
        Obtiene todos los gastos de un manifiesto
        
        Args:
            manifest_id: ID del manifiesto
        
        Returns:
            Lista de gastos
        """
        try:
            filters = [
                ('manifest_id', '==', manifest_id),
                ('active', '==', True)
            ]
            return self.get_all(filters=filters, order_by='created_at')
        except Exception as e:
            print(f"Error al obtener gastos del manifiesto: {e}")
            return []
    
    def get_expenses_by_user(self, username: str, start_date: str = None, end_date: str = None) -> List[Dict]:
        """
        Obtiene gastos por usuario y rango de fechas
        
        Args:
            username: Usuario
            start_date: Fecha inicio (opcional)
            end_date: Fecha fin (opcional)
        
        Returns:
            Lista de gastos
        """
        try:
            filters = [
                ('username', '==', username),
                ('active', '==', True)
            ]
            
            expenses = self.get_all(filters=filters, order_by='created_at')
            
            # Filtrar por fechas si se proporcionan
            if start_date or end_date:
                filtered = []
                for expense in expenses:
                    expense_date = expense.get('created_at', '')
                    if start_date and expense_date < start_date:
                        continue
                    if end_date and expense_date > end_date:
                        continue
                    filtered.append(expense)
                return filtered
            
            return expenses
        except Exception as e:
            print(f"Error al obtener gastos del usuario: {e}")
            return []
    
    def create_expense(self, manifest_id: str, username: str, expense_type: str, 
                      amount: float, description: str = None, date: str = None) -> Optional[str]:
        """
        Crea un nuevo gasto de viaje
        
        Args:
            manifest_id: ID del manifiesto
            username: Usuario
            expense_type: Tipo de gasto
            amount: Monto
            description: Descripción (opcional)
            date: Fecha del gasto (opcional)
        
        Returns:
            ID del gasto creado o None si hay error
        """
        try:
            data = {
                'manifest_id': manifest_id,
                'username': username,
                'expense_type': expense_type,
                'amount': float(amount),
                'created_at': datetime.now().isoformat(),
                'active': True
            }
            
            # Solo agregar descripción y fecha si se proporcionan
            if description:
                data['description'] = description
            if date:
                data['date'] = date
            
            doc_id = self.create(data)
            print(f"[OK] Gasto creado: {doc_id}")
            return doc_id
        except Exception as e:
            print(f"Error al crear gasto: {e}")
            return None
    
    def update_expense(self, expense_id: str, expense_type: str = None, 
                      amount: float = None, description: str = None, date: str = None) -> bool:
        """
        Actualiza un gasto
        
        Args:
            expense_id: ID del gasto
            expense_type: Nuevo tipo (opcional)
            amount: Nuevo monto (opcional)
            description: Nueva descripción (opcional)
            date: Nueva fecha (opcional)
        
        Returns:
            True si se actualizó correctamente
        """
        try:
            updates = {}
            
            if expense_type is not None:
                updates['expense_type'] = expense_type
            if amount is not None:
                updates['amount'] = float(amount)
            if description is not None:
                updates['description'] = description
            if date is not None:
                updates['date'] = date
            
            if updates:
                updates['updated_at'] = datetime.now().isoformat()
                return self.update(expense_id, updates)
            
            return True
        except Exception as e:
            print(f"Error al actualizar gasto: {e}")
            return False
    
    def delete_expense(self, expense_id: str) -> bool:
        """
        Elimina un gasto (soft delete)
        
        Args:
            expense_id: ID del gasto
        
        Returns:
            True si se eliminó correctamente
        """
        try:
            return self.update(expense_id, {'active': False})
        except Exception as e:
            print(f"Error al eliminar gasto: {e}")
            return False
    
    def get_total_expenses(self, manifest_id: str) -> float:
        """
        Calcula el total de gastos de un manifiesto
        
        Args:
            manifest_id: ID del manifiesto
        
        Returns:
            Total de gastos
        """
        try:
            expenses = self.get_expenses_by_manifest(manifest_id)
            total = sum(expense.get('amount', 0) for expense in expenses)
            return total
        except Exception as e:
            print(f"Error al calcular total de gastos: {e}")
            return 0.0
    
    def get_expenses_by_type(self, manifest_id: str) -> Dict[str, float]:
        """
        Obtiene gastos agrupados por tipo
        
        Args:
            manifest_id: ID del manifiesto
        
        Returns:
            Diccionario con tipo de gasto y total
        """
        try:
            expenses = self.get_expenses_by_manifest(manifest_id)
            by_type = {}
            
            for expense in expenses:
                expense_type = expense.get('expense_type', 'Otros')
                amount = expense.get('amount', 0)
                by_type[expense_type] = by_type.get(expense_type, 0) + amount
            
            return by_type
        except Exception as e:
            print(f"Error al agrupar gastos por tipo: {e}")
            return {}
