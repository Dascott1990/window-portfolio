import uuid, random
from app import db
from .base import BaseModel

def _gen_number():
    return "4242" + "".join([str(random.randint(0,9)) for _ in range(12)])

def _gen_cvv():
    return "".join([str(random.randint(0,9)) for _ in range(3)])

class NovaCard(BaseModel):
    __tablename__ = "nova_cards"
    id           = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    wallet_id    = db.Column(db.String(36), db.ForeignKey("wallets.id"), nullable=True)
    number       = db.Column(db.String(16), nullable=False, default=_gen_number)
    cvv          = db.Column(db.String(3),  nullable=False, default=_gen_cvv)
    expiry_month = db.Column(db.Integer,    nullable=False, default=12)
    expiry_year  = db.Column(db.Integer,    nullable=False, default=2029)
    label        = db.Column(db.String(60), nullable=False, default="NovaPay Card")
    is_frozen    = db.Column(db.Boolean,    nullable=False, default=False)
    spent_today  = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    currency     = db.Column(db.String(10), nullable=False, default="CAD")

    def to_dict(self):
        d = super().to_dict()
        d["last4"]  = self.number[-4:] if self.number else "0000"
        d["masked"] = "**** **** **** " + (self.number[-4:] if self.number else "0000")
        return d
