import uuid
from app import db
from .base import BaseModel


class Contact(BaseModel):
    __tablename__ = "contacts"

    id          = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name        = db.Column(db.String(150), nullable=False)
    phone       = db.Column(db.String(30), nullable=True)
    email       = db.Column(db.String(255), nullable=True)
    notes       = db.Column(db.Text, nullable=True)
    avatar_url  = db.Column(db.String(512), nullable=True)
    is_favorite = db.Column(db.Boolean, nullable=False, default=False)
    is_deleted  = db.Column(db.Boolean, nullable=False, default=False)

    def __repr__(self):
        return f"<Contact {self.id} {self.name}>"
