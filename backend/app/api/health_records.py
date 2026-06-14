from datetime import datetime, timezone
from flask import Blueprint, request
from app import db
from app.models import HealthRecord
from app.utils.response import success, created, paginated
from app.middleware.error_handlers import APIError

health_bp = Blueprint("health", __name__)


class HealthRepository:
    """Standalone repo for HealthRecord — model has no is_deleted column."""

    def get_all(self, page=1, per_page=30):
        return (
            HealthRecord.query
            .order_by(HealthRecord.recorded_at.desc())
            .paginate(page=page, per_page=per_page, error_out=False)
        )

    def create(self, **kwargs):
        record = HealthRecord(**kwargs)
        db.session.add(record)
        db.session.commit()
        return record


repo = HealthRepository()


@health_bp.get("")
def list_records():
    page     = int(request.args.get("page", 1))
    per_page = min(int(request.args.get("per_page", 30)), 200)
    result   = repo.get_all(page=page, per_page=per_page)
    return paginated([r.to_dict() for r in result.items], result)


@health_bp.post("")
def create_record():
    data = request.get_json(force=True)
    if not data.get("record_type") or data.get("value") is None:
        raise APIError("record_type and value are required", 400)
    record = repo.create(
        record_type=data["record_type"],
        value=float(data["value"]),
        unit=data.get("unit"),
        recorded_at=datetime.now(timezone.utc),
        notes=data.get("notes"),
        metadata_json=data.get("metadata_json"),
    )
    return created(record.to_dict(), "Record created")