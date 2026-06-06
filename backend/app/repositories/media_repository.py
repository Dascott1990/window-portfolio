from app.models import Media
from .base_repository import BaseRepository


class MediaRepository(BaseRepository):
    model = Media

    def get_by_type(self, media_type, page=1, per_page=20):
        return (
            Media.query
            .filter_by(media_type=media_type, is_deleted=False)
            .order_by(Media.created_at.desc())
            .paginate(page=page, per_page=per_page, error_out=False)
        )

    def get_recent(self, limit=10):
        return (
            Media.query
            .filter_by(is_deleted=False)
            .order_by(Media.created_at.desc())
            .limit(limit)
            .all()
        )
