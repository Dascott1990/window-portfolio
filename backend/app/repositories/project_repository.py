from app.models import Project
from .base_repository import BaseRepository


class ProjectRepository(BaseRepository):
    model = Project

    def get_featured(self):
        return (
            Project.query
            .filter_by(is_featured=True, is_deleted=False)
            .order_by(Project.sort_order)
            .all()
        )
