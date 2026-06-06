import uuid
from app import db
from .base import BaseModel


class Event(BaseModel):
    __tablename__ = "events"

    id                      = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title                   = db.Column(db.String(200), nullable=False)
    description             = db.Column(db.Text, nullable=True)
    location                = db.Column(db.String(300), nullable=True)
    event_date              = db.Column(db.Date, nullable=False)
    event_time              = db.Column(db.Time, nullable=False)
    reminder_offset_minutes = db.Column(db.Integer, nullable=True)
    reminder_time           = db.Column(db.DateTime(timezone=True), nullable=True)
    reminder_sent           = db.Column(db.Boolean, nullable=False, default=False)
    reminder_email          = db.Column(db.String(255), nullable=True)
    color                   = db.Column(db.String(20), nullable=True, default="#3b82f6")
    is_deleted              = db.Column(db.Boolean, nullable=False, default=False)

    def __repr__(self):
        return f"<Event {self.id} '{self.title}' {self.event_date}>"
