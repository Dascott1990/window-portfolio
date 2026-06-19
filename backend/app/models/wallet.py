import uuid
from app import db
from .base import BaseModel


class Wallet(BaseModel):
    __tablename__ = "wallets"

    id       = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    currency = db.Column(db.String(10), nullable=False, default="CAD")
    balance  = db.Column(db.Numeric(12, 2), nullable=False, default=0)

    def __repr__(self):
        return f"<Wallet {self.id} {self.balance} {self.currency}>"
