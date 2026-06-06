import uuid
from app import db
from .base import BaseModel


class HealthRecord(BaseModel):
    __tablename__ = "health_records"

    id            = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    record_type   = db.Column(db.String(50), nullable=False)
    value         = db.Column(db.Float, nullable=False)
    unit          = db.Column(db.String(20), nullable=True)
    recorded_at   = db.Column(db.DateTime(timezone=True), nullable=False)
    notes         = db.Column(db.Text, nullable=True)
    metadata_json = db.Column(db.JSON, nullable=True)

    def __repr__(self):
        return f"<HealthRecord {self.id} {self.record_type}={self.value}>"
