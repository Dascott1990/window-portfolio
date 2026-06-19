import uuid
from app import db
from .base import BaseModel


class Card(BaseModel):
    __tablename__ = "cards"

    id            = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    wallet_id     = db.Column(db.String(36), db.ForeignKey("wallets.id"), nullable=False)
    label         = db.Column(db.String(60), nullable=False, default="NovaPay Card")
    last4         = db.Column(db.String(4), nullable=False)
    network       = db.Column(db.String(20), nullable=False, default="nova")
    expiry_month  = db.Column(db.Integer, nullable=False)
    expiry_year   = db.Column(db.Integer, nullable=False)
    credit_limit  = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    spent         = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    is_primary    = db.Column(db.Boolean, nullable=False, default=False)
    is_active     = db.Column(db.Boolean, nullable=False, default=True)

    def __repr__(self):
        return f"<Card {self.id} {self.last4}>"
