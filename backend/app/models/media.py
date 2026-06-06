"""
app/models/media.py — UPDATED

Adds a `file_data` column (LargeBinary / PostgreSQL bytea) to store the
actual file content in the database.  The old `filepath` and `thumbnail`
columns are kept (nullable) for backward-compat with existing rows and the
Alembic migration, but new uploads always populate `file_data` instead.

Run the companion Alembic migration after deploying this file.
"""
import uuid
from app import db
from .base import BaseModel


class Media(BaseModel):
    __tablename__ = "media"

    id            = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    filename      = db.Column(db.String(255), nullable=False)
    # filepath / thumbnail kept nullable — legacy rows only; new rows leave these NULL
    filepath      = db.Column(db.String(512), nullable=True)
    thumbnail     = db.Column(db.String(512), nullable=True)
    # Binary content stored directly in the database
    file_data     = db.Column(db.LargeBinary, nullable=True)
    thumb_data    = db.Column(db.LargeBinary, nullable=True)
    media_type    = db.Column(db.String(20), nullable=False)
    mime_type     = db.Column(db.String(100), nullable=True)
    file_size     = db.Column(db.BigInteger, nullable=True)
    width         = db.Column(db.Integer, nullable=True)
    height        = db.Column(db.Integer, nullable=True)
    duration      = db.Column(db.Float, nullable=True)
    caption       = db.Column(db.Text, nullable=True)
    filter_name   = db.Column(db.String(50), nullable=True)
    overlay_data  = db.Column(db.JSON, nullable=True)
    metadata_json = db.Column(db.JSON, nullable=True)
    is_deleted    = db.Column(db.Boolean, nullable=False, default=False)

    def __repr__(self):
        return f"<Media {self.id} {self.media_type} {self.filename}>"