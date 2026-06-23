import uuid
from app import db
from .base import BaseModel

class Bill(BaseModel):
    __tablename__ = "bills"
    id        = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name      = db.Column(db.String(100), nullable=False)
    amount    = db.Column(db.Numeric(12, 2), nullable=False)
    currency  = db.Column(db.String(10), nullable=False, default="CAD")
    due_day   = db.Column(db.Integer, nullable=False)
    category  = db.Column(db.String(40), nullable=False, default="other")
    color     = db.Column(db.String(20), nullable=False, default="#ef4444")
    emoji     = db.Column(db.String(10), nullable=False, default="bill")
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    autopay   = db.Column(db.Boolean, nullable=False, default=False)
