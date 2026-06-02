"""Repositorio de tareas GTD en Firestore."""
from datetime import datetime
from typing import Dict, List, Optional
from google.cloud.firestore import FieldFilter

from .firebase_repository import FirebaseRepository

VALID_LISTS = ('inbox', 'today', 'next', 'someday', 'done')
VALID_PRIORITIES = ('low', 'medium', 'high', 'urgent')


class ProductivityTasksRepository(FirebaseRepository):
    def __init__(self):
        super().__init__('productivity_tasks')

    def create_task(
        self,
        username: str,
        title: str,
        notes: str = '',
        task_list: str = 'inbox',
        priority: str = 'medium',
    ) -> Optional[Dict]:
        username = username.lower()
        task_list = task_list if task_list in VALID_LISTS else 'inbox'
        priority = priority if priority in VALID_PRIORITIES else 'medium'
        now = datetime.now().isoformat()
        data = {
            'username': username,
            'title': title.strip(),
            'notes': notes or '',
            'list': task_list,
            'priority': priority,
            'scheduled_start': None,
            'scheduled_end': None,
            'google_event_id': None,
            'google_calendar_id': 'primary',
            'completed_at': None,
            'created_at': now,
            'updated_at': now,
        }
        doc_id = self.create(data)
        return self.get_by_id(doc_id)

    def get_tasks_by_user(
        self,
        username: str,
        task_list: Optional[str] = None,
    ) -> List[Dict]:
        """Solo filtra por username en Firestore; list y orden en memoria (sin índice compuesto)."""
        username = username.lower()
        tasks = self.get_all(filters=[('username', '==', username)])
        if task_list and task_list in VALID_LISTS:
            tasks = [t for t in tasks if t.get('list') == task_list]
        tasks.sort(key=lambda t: t.get('updated_at', ''), reverse=True)
        return tasks

    def get_task_for_user(self, task_id: str, username: str) -> Optional[Dict]:
        task = self.get_by_id(task_id)
        if not task or task.get('username', '').lower() != username.lower():
            return None
        return task

    def update_task(self, task_id: str, username: str, updates: Dict) -> Optional[Dict]:
        task = self.get_task_for_user(task_id, username)
        if not task:
            return None
        allowed = {
            'title', 'notes', 'list', 'priority',
            'scheduled_start', 'scheduled_end',
            'google_event_id', 'google_calendar_id', 'completed_at',
        }
        data = {k: v for k, v in updates.items() if k in allowed}
        if 'list' in data and data['list'] not in VALID_LISTS:
            del data['list']
        if 'priority' in data and data['priority'] not in VALID_PRIORITIES:
            del data['priority']
        if not data:
            return task
        data['updated_at'] = datetime.now().isoformat()
        self.update(task_id, data)
        return self.get_by_id(task_id)

    def delete_task(self, task_id: str, username: str) -> Optional[Dict]:
        task = self.get_task_for_user(task_id, username)
        if not task:
            return None
        self.delete(task_id)
        return task

    def get_tasks_for_date(self, username: str, date_str: str) -> List[Dict]:
        """Tareas con scheduled_start en el día date_str (YYYY-MM-DD)."""
        username = username.lower()
        start = f'{date_str}T00:00:00'
        end = f'{date_str}T23:59:59'
        try:
            query = (
                self.collection
                .where(filter=FieldFilter('username', '==', username))
                .where(filter=FieldFilter('scheduled_start', '>=', start))
                .where(filter=FieldFilter('scheduled_start', '<=', end))
            )
            results = []
            for doc in query.stream():
                data = doc.to_dict()
                data['id'] = doc.id
                results.append(data)
            return results
        except Exception:
            all_tasks = self.get_tasks_by_user(username)
            return [
                t for t in all_tasks
                if t.get('scheduled_start') and str(t['scheduled_start'])[:10] == date_str
            ]

    def count_completed_on_date(self, username: str, date_str: str) -> int:
        username = username.lower()
        all_tasks = self.get_all(filters=[('username', '==', username)])
        return sum(
            1 for t in all_tasks
            if t.get('list') == 'done'
            and t.get('completed_at')
            and str(t['completed_at'])[:10] == date_str
        )
