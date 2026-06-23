import uuid
from app import db
from .base import BaseModel

class PaySchedule(BaseModel):
    __tablename__ = "pay_schedules"
    id            = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    label         = db.Column(db.String(80), nullable=False, default="Primary Income")
    amount        = db.Column(db.Numeric(12, 2), nullable=False)
    currency      = db.Column(db.String(10), nullable=False, default="CAD")
    frequency     = db.Column(db.String(20), nullable=False, default="biweekly")
    next_pay_date = db.Column(db.Date, nullable=False)
    is_active     = db.Column(db.Boolean, nullable=False, default=True)
