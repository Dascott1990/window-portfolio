import uuid
from app import db
from .base import BaseModel

class Envelope(BaseModel):
    __tablename__ = "envelopes"
    id           = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name         = db.Column(db.String(100), nullable=False)
    emoji        = db.Column(db.String(10), nullable=False, default="save")
    color        = db.Column(db.String(20), nullable=False, default="#a78bfa")
    target_total = db.Column(db.Numeric(12, 2), nullable=False)
    saved        = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    per_cycle    = db.Column(db.Numeric(12, 2), nullable=False)
    currency     = db.Column(db.String(10), nullable=False, default="CAD")
    is_active    = db.Column(db.Boolean, nullable=False, default=True)
