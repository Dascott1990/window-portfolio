from sqlalchemy import or_
from app.models import Contact
from .base_repository import BaseRepository


class ContactRepository(BaseRepository):
    model = Contact

    def search(self, query, page=1, per_page=20):
        like = f"%{query}%"
        return (
            Contact.query
            .filter(
                Contact.is_deleted == False,
                or_(
                    Contact.name.ilike(like),
                    Contact.email.ilike(like),
                    Contact.phone.ilike(like),
                ),
            )
            .order_by(Contact.name)
            .paginate(page=page, per_page=per_page, error_out=False)
        )

    def get_favorites(self):
        return Contact.query.filter_by(is_favorite=True, is_deleted=False).order_by(Contact.name).all()
