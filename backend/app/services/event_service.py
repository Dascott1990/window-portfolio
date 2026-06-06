from datetime import datetime, timezone, timedelta
from app.repositories import EventRepository
from app.scheduler import scheduler_service
from app.email import email_service
from app.middleware.error_handlers import APIError
from app.utils.validators import require_fields, validate_date, validate_time

REMINDER_OFFSETS = {
    "at_time": 0, "5min": 5, "15min": 15,
    "30min": 30, "1hour": 60, "1day": 1440,
}


class EventService:
    def __init__(self):
        self.repo = EventRepository()

    def _compute_reminder_time(self, event_date, event_time, offset_minutes):
        dt = datetime.combine(event_date, event_time)
        return dt.replace(tzinfo=timezone.utc) - timedelta(minutes=offset_minutes)

    def create(self, data: dict):
        require_fields(data, "title", "event_date", "event_time")
        if not validate_date(data["event_date"]):
            raise APIError("Invalid event_date format. Use YYYY-MM-DD", 400)
        if not validate_time(data["event_time"]):
            raise APIError("Invalid event_time format. Use HH:MM", 400)

        ev_date = datetime.strptime(data["event_date"], "%Y-%m-%d").date()
        ev_time = datetime.strptime(data["event_time"][:5], "%H:%M").time()
        reminder_offset = None
        reminder_time   = None
        reminder_key    = data.get("reminder")

        if reminder_key:
            if reminder_key == "custom":
                reminder_offset = int(data.get("reminder_offset_minutes", 0))
            else:
                reminder_offset = REMINDER_OFFSETS.get(reminder_key)
                if reminder_offset is None:
                    raise APIError(f"Invalid reminder value: {reminder_key}", 400)
            reminder_time = self._compute_reminder_time(ev_date, ev_time, reminder_offset)

        event = self.repo.create(
            title=data["title"], description=data.get("description"),
            location=data.get("location"), event_date=ev_date, event_time=ev_time,
            reminder_offset_minutes=reminder_offset, reminder_time=reminder_time,
            reminder_email=data.get("reminder_email"), color=data.get("color", "#3b82f6"),
        )

        if data.get("reminder_email"):
            email_service.send_event_confirmation(data["reminder_email"], event)
        if reminder_time and data.get("reminder_email"):
            scheduler_service.schedule_reminder(event)

        return event

    def get_by_date(self, date_str):
        if not validate_date(date_str):
            raise APIError("Invalid date format. Use YYYY-MM-DD", 400)
        return self.repo.get_by_date(date_str)

    def get_by_month(self, year, month):
        return self.repo.get_by_month(year, month)

    def get_one(self, event_id):
        event = self.repo.get_by_id(event_id)
        if not event:
            raise APIError("Event not found", 404)
        return event

    def update(self, event_id, data):
        self.get_one(event_id)
        if "event_date" in data and not validate_date(data["event_date"]):
            raise APIError("Invalid event_date format", 400)
        if "event_time" in data and not validate_time(data["event_time"]):
            raise APIError("Invalid event_time format", 400)
        updates = {k: v for k, v in data.items()
                   if k in ("title", "description", "location", "color", "reminder_email")}
        if "event_date" in data:
            updates["event_date"] = datetime.strptime(data["event_date"], "%Y-%m-%d").date()
        if "event_time" in data:
            updates["event_time"] = datetime.strptime(data["event_time"][:5], "%H:%M").time()
        updated = self.repo.update(event_id, **updates)
        if updated.reminder_email and updated.reminder_time:
            scheduler_service.cancel_job(f"reminder_{event_id}")
            scheduler_service.schedule_reminder(updated)
        return updated

    def delete(self, event_id):
        self.get_one(event_id)
        scheduler_service.cancel_job(f"reminder_{event_id}")
        return self.repo.soft_delete(event_id)
