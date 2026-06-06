from datetime import datetime, date, time, timezone
from decimal import Decimal
from app import db


class BaseModel(db.Model):
    __abstract__ = True

    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self):
        result = {}
        for col in self.__table__.columns:
            val = getattr(self, col.name)
            # Order matters: datetime is a subclass of date, so check datetime first
            if isinstance(val, datetime):
                result[col.name] = val.isoformat()
            elif isinstance(val, date):
                result[col.name] = val.isoformat()          # "2026-06-25"
            elif isinstance(val, time):
                result[col.name] = val.strftime("%H:%M:%S") # "10:00:00"
            elif isinstance(val, Decimal):
                result[col.name] = float(val)
            else:
                result[col.name] = val
        return result

    def save(self):
        db.session.add(self)
        db.session.commit()
        return self

    def delete(self):
        db.session.delete(self)
        db.session.commit()