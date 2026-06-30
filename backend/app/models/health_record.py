import uuid
from app import db
from .base import BaseModel


class HealthRecord(BaseModel):
    """
    Crew Safety records. record_type distinguishes the kind of entry:
      - "lift_log"        → metadata_json: weight_band, lift_type, repetitions,
                             used_team_lift, crew_member_id, crew_member_name, risk_level
      - "fatigue_checkin"  → metadata_json: fatigue_level, shift_type, hours_slept,
                             crew_member_id, crew_member_name, flagged_supervisor
      - "crew_member"     → metadata_json: name, role_title, crew_name, is_supervisor
    `value` holds a small numeric encoding per type (see HealthService); it's not
    a meaningful standalone figure, the metadata_json is the source of truth.
    """
    __tablename__ = "health_records"

    id            = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    record_type   = db.Column(db.String(50), nullable=False, index=True)
    value         = db.Column(db.Float, nullable=False)
    unit          = db.Column(db.String(20), nullable=True)
    recorded_at   = db.Column(db.DateTime(timezone=True), nullable=False, index=True)
    notes         = db.Column(db.Text, nullable=True)
    metadata_json = db.Column(db.JSON, nullable=True)
    is_deleted    = db.Column(db.Boolean, nullable=False, default=False)

    def __repr__(self):
        return f"<HealthRecord {self.id} {self.record_type}={self.value}>"