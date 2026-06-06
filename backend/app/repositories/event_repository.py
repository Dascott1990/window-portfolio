from datetime import datetime, timezone
from app import db
from app.models import Event
from .base_repository import BaseRepository


class EventRepository(BaseRepository):
    model = Event

    def get_by_date(self, date_str):
        return (
            Event.query
            .filter_by(event_date=date_str, is_deleted=False)
            .order_by(Event.event_time)
            .all()
        )

    def get_by_month(self, year, month):
        from sqlalchemy import extract
        return (
            Event.query
            .filter(
                extract("year",  Event.event_date) == year,
                extract("month", Event.event_date) == month,
                Event.is_deleted == False,
            )
            .order_by(Event.event_date, Event.event_time)
            .all()
        )

    def get_pending_reminders(self):
        now = datetime.now(timezone.utc)
        return (
            Event.query
            .filter(
                Event.reminder_time <= now,
                Event.reminder_sent == False,
                Event.is_deleted == False,
                Event.reminder_time.isnot(None),
            )
            .all()
        )

    def mark_reminder_sent(self, event_id):
        event = self.get_by_id(event_id)
        if event:
            event.reminder_sent = True
            db.session.commit()
        return event
