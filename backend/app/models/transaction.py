import uuid
from app import db
from .base import BaseModel


class Transaction(BaseModel):
    __tablename__ = "transactions"

    id        = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    merchant  = db.Column(db.String(200), nullable=False)
    amount    = db.Column(db.Numeric(12, 2), nullable=False)
    currency  = db.Column(db.String(10), nullable=False, default="CAD")
    status    = db.Column(db.String(20), nullable=False, default="success")
    method    = db.Column(db.String(30), nullable=True, default="nfc")
    reference = db.Column(db.String(100), nullable=True)
    notes     = db.Column(db.Text, nullable=True)

    def __repr__(self):
        return f"<Transaction {self.id} {self.merchant} {self.amount}>"
