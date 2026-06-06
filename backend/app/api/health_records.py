from datetime import datetime, timezone
from flask import Blueprint, request
from app.repositories.base_repository import BaseRepository
from app.models import HealthRecord
from app.utils.response import success, created, paginated
from app.middleware.error_handlers import APIError

health_bp = Blueprint("health", __name__)


class HealthRepository(BaseRepository):
    model = HealthRecord

repo = HealthRepository()


@health_bp.get("")
def list_records():
    result = repo.get_all(page=int(request.args.get("page", 1)), per_page=int(request.args.get("per_page", 30)))
    return paginated([r.to_dict() for r in result.items], result)


@health_bp.post("")
def create_record():
    data = request.get_json(force=True)
    if not data.get("record_type") or data.get("value") is None:
        raise APIError("record_type and value are required", 400)
    record = repo.create(
        record_type=data["record_type"], value=float(data["value"]),
        unit=data.get("unit"), recorded_at=datetime.now(timezone.utc),
        notes=data.get("notes"), metadata_json=data.get("metadata_json"),
    )
    return created(record.to_dict(), "Record created")
