"""Lógica de negocio GTD: tareas y métricas diarias."""
from datetime import datetime, date
from typing import Dict, List, Optional

from app.database.productivity_tasks_repository import ProductivityTasksRepository
from app.modules.productivity.google_calendar_service import GoogleCalendarService


class GTDService:
    def __init__(self):
        self.tasks_repo = ProductivityTasksRepository()
        self.calendar = GoogleCalendarService()

    def list_tasks(self, username: str, task_list: Optional[str] = None) -> List[Dict]:
        return self.tasks_repo.get_tasks_by_user(username, task_list)

    def capture_task(
        self,
        username: str,
        title: str,
        notes: str = '',
        priority: str = 'medium',
    ) -> Optional[Dict]:
        if not title or not title.strip():
            return None
        return self.tasks_repo.create_task(
            username, title.strip(), notes, 'inbox', priority
        )

    def update_task(self, username: str, task_id: str, updates: Dict) -> Optional[Dict]:
        task = self.tasks_repo.get_task_for_user(task_id, username)
        if not task:
            return None

        if updates.get('list') == 'done' and not updates.get('completed_at'):
            updates['completed_at'] = datetime.now().isoformat()

        updated = self.tasks_repo.update_task(task_id, username, updates)
        if not updated:
            return None

        self._sync_calendar_for_task(username, updated, task)
        return self.tasks_repo.get_by_id(task_id)

    def complete_task(self, username: str, task_id: str) -> Optional[Dict]:
        return self.update_task(
            username,
            task_id,
            {'list': 'done', 'completed_at': datetime.now().isoformat()},
        )

    def delete_task(self, username: str, task_id: str) -> bool:
        task = self.tasks_repo.get_task_for_user(task_id, username)
        if not task:
            return False
        if task.get('google_event_id'):
            self.calendar.delete_event(
                username,
                task.get('google_calendar_id', 'primary'),
                task['google_event_id'],
            )
        self.tasks_repo.delete_task(task_id, username)
        return True

    def daily_stats(self, username: str, date_str: Optional[str] = None) -> Dict:
        if not date_str:
            date_str = date.today().isoformat()
        scheduled = self.tasks_repo.get_tasks_for_date(username, date_str)
        planned = len([t for t in scheduled if t.get('list') != 'done'])
        completed = self.tasks_repo.count_completed_on_date(username, date_str)
        today_list = [
            t for t in self.tasks_repo.get_tasks_by_user(username, 'today')
            if not t.get('completed_at') or str(t.get('completed_at', ''))[:10] == date_str
        ]
        planned += len(today_list)
        total = planned + completed
        rate = round((completed / total) * 100, 1) if total > 0 else 0.0
        return {
            'date': date_str,
            'planned': planned,
            'completed': completed,
            'completion_rate': rate,
            'scheduled_count': len(scheduled),
        }

    def _sync_calendar_for_task(self, username: str, updated: Dict, previous: Dict) -> None:
        if not self.calendar.is_connected(username):
            return

        start = updated.get('scheduled_start')
        end = updated.get('scheduled_end')
        event_id = updated.get('google_event_id')
        cal_id = updated.get('google_calendar_id') or 'primary'

        if updated.get('list') == 'done':
            if event_id:
                self.calendar.delete_event(username, cal_id, event_id)
                self.tasks_repo.update_task(
                    task_id=updated['id'],
                    username=username,
                    updates={'google_event_id': None},
                )
            return

        if start and end:
            new_id = self.calendar.upsert_event(
                username=username,
                calendar_id=cal_id,
                event_id=event_id,
                title=updated.get('title', 'Tarea'),
                description=updated.get('notes', ''),
                start_iso=start,
                end_iso=end,
            )
            if new_id and new_id != event_id:
                self.tasks_repo.update_task(
                    task_id=updated['id'],
                    username=username,
                    updates={'google_event_id': new_id, 'google_calendar_id': cal_id},
                )
        elif event_id and (not start or not end):
            self.calendar.delete_event(username, cal_id, event_id)
            self.tasks_repo.update_task(
                task_id=updated['id'],
                username=username,
                updates={'google_event_id': None},
            )
