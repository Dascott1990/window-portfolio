import uuid
from app import db
from .base import BaseModel


class Track(BaseModel):
    __tablename__ = "tracks"

    id         = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title      = db.Column(db.String(200), nullable=False)
    artist     = db.Column(db.String(150), nullable=True)
    album      = db.Column(db.String(150), nullable=True)
    filepath   = db.Column(db.String(512), nullable=True)
    cover_url  = db.Column(db.String(512), nullable=True)
    duration   = db.Column(db.Float, nullable=True)
    genre      = db.Column(db.String(80), nullable=True)
    is_deleted = db.Column(db.Boolean, nullable=False, default=False)

    def __repr__(self):
        return f"<Track {self.id} '{self.title}'>"
