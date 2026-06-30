from datetime import datetime, timedelta, timezone
from app.models import HealthRecord
from .base_repository import BaseRepository


class HealthRepository(BaseRepository):
    model = HealthRecord

    def get_today_records(self, record_type):
        start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        return (
            HealthRecord.query
            .filter(
                HealthRecord.record_type == record_type,
                HealthRecord.is_deleted == False,
                HealthRecord.recorded_at >= start,
            )
            .order_by(HealthRecord.recorded_at.desc())
            .all()
        )

    def get_recent_by_type(self, record_type, days=7):
        since = datetime.now(timezone.utc) - timedelta(days=days)
        return (
            HealthRecord.query
            .filter(
                HealthRecord.record_type == record_type,
                HealthRecord.is_deleted == False,
                HealthRecord.recorded_at >= since,
            )
            .all()
        )

    def get_active_by_type(self, record_type):
        return (
            HealthRecord.query
            .filter_by(record_type=record_type, is_deleted=False)
            .order_by(HealthRecord.created_at.asc())
            .all()
        )